import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import {
  // generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  GenerateRegistrationOptionsOpts,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  // VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import type { User } from "../types/webauthn.ts";
import { config } from "@scope/config";
import { RedisService } from "./redis.ts";

function toBase64URLFromUInt8Array(buffer: Uint8Array): string {
  return encodeBase64(buffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Example lengths and resulting padding:
// Length 5 % 4 = 1, needs 3 padding chars
// Length 6 % 4 = 2, needs 2 padding chars
// Length 7 % 4 = 3, needs 1 padding char
// Length 8 % 4 = 0, needs 0 padding chars //the final % 4 is used for this case
function fromBase64URLStringToUInt8Array(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), "=");
  return decodeBase64(base64);
}

function uuidToUint8Array(uuid: string): Uint8Array {
  // Remove hyphens and convert to buffer
  return new Uint8Array(
    uuid.replace(/-/g, "")
      .match(/.{1,2}/g)!
      .map((byte) => parseInt(byte, 16)),
  );
}

export class WebAuthnService {
  private static redis: RedisService;
  static origin = config.origin;
  static rpID = config.rpId;
  static rpName = config.rpName;

  private static async getRedis(): Promise<RedisService> {
    if (!this.redis) {
      this.redis = await RedisService.getInstance();
    }
    return this.redis;
  }

  static async generateRegistrationOptions(
    userName: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const redis = await this.getRedis();
    const existingUser = await redis.getUserByName(userName);
    let userID: Uint8Array, userUUID:string;
    if (!existingUser) {
      userUUID = crypto.randomUUID();
      userID = uuidToUint8Array(userUUID);
    } else {
      userUUID = existingUser.id;
      userID = uuidToUint8Array(existingUser.id);
    }

    const optionsParameters = {
      rpName: this.rpName,
      rpID: this.rpID,
      userID,
      userName,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        requireResidentKey: false,
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
      extensions: {
        credProps: true,
        uvm: true,
      },
    };

    const options = await generateRegistrationOptions(
      optionsParameters as GenerateRegistrationOptionsOpts,
    );

    // Store both challenge and initial user data
    await redis.setChallengeSignUp(options.challenge, userName);

    
    if (!existingUser) {
      // Store initial user data with temporary ID
      const initialUser: User = {
        id: userUUID,
        userName,
        userPasskeys: [],
      };
      await redis.setUserByName(userName, initialUser);
    }

    return options;
  }

  static async verifyRegistration(
    challenge: string,
    userName: string,
    response: RegistrationResponseJSON,
  ): Promise<{ verified: boolean; userName: string }> {
    try {
      const redis = await this.getRedis();
      const storedUserName = await redis.getChallengeSignUp(challenge);
      if (!storedUserName) {
        throw new Error("Challenge expired or invalid");
      }

      if (storedUserName !== userName) {
        throw new Error("Username mismatch");
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential, credentialDeviceType, credentialBackedUp } =
          verification.registrationInfo;
        const { id, publicKey, counter } = credential;

        // Get the initial user data
        const initialUser = await redis.getUserByName(storedUserName);
        if (!initialUser) {
          throw new Error("User data not found");
        }

        const passkey = {
          id,
          publicKey: toBase64URLFromUInt8Array(publicKey),
          counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: response.response.transports || ["internal"],
          createdAt: new Date(),
          lastUsed: new Date(),
        }
        // Update user with passkey data
        const user: User = {
          ...initialUser,
          userPasskeys: [...initialUser.userPasskeys, passkey],
        };

        // Store updated user with passkey ID
        await redis.setUserByName(userName, user);
      }

      return { verified: verification.verified, userName };
    } catch (error) {
      console.error(error);
      return { verified: false, userName: "" };
    }
  }

  static async generateAuthChallenge(): Promise<
    { challenge: string; challengeId: string }
  > {
    const redis = await this.getRedis();
    // Generate random challenge
    const challengeBuffer = new Uint8Array(32);
    crypto.getRandomValues(challengeBuffer);

    // Convert to base64url format
    const challenge = toBase64URLFromUInt8Array(challengeBuffer);

    // Generate UUID for this challenge
    const challengeId = crypto.randomUUID();

    // Store in Redis
    await redis.setChallengeAuth(challengeId, challenge);

    return { challenge, challengeId };
  }

  static async verifyAuthentication(
    response: AuthenticationResponseJSON,
    challengeId: string,
  ): Promise<{ verified: boolean; userName: string }> {
    const redis = await this.getRedis();
    const result = await redis.getUserByPasskeyId(response.id);
    if (!result) {
      throw new Error("Passkey not registered");
    }
    const { user, passKey } = result;

    // Get challenge from Redis using challengeId
    const expectedChallenge = await redis.getChallengeAuth(challengeId);
    if (!expectedChallenge) {
      throw new Error("Challenge expired or invalid");
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: passKey.id,
          publicKey: fromBase64URLStringToUInt8Array(passKey.publicKey),
          counter: passKey.counter,
          transports: passKey.transports,
        },
      });

      if (verification.verified) {
        passKey.counter = verification.authenticationInfo.newCounter;
        passKey.lastUsed = new Date();
        await redis.setUserByName(user.userName, user);
      }

      return { verified: verification.verified, userName: user.userName };
    } catch (error) {
      console.error(error);
      return { verified: false, userName: "" };
    }
  }

  static async getUsernameFromCredentialId(
    credentialId: string,
  ): Promise<string> {
    const redis = await this.getRedis();
    const users = await redis.getAllUsers();

    for (const user of users) {
      const matchingPasskey = user.userPasskeys.find(
        (passkey) => passkey.id === credentialId,
      );
      if (matchingPasskey) {
        return user.userName;
      }
    }
    throw new Error("No user found for this credential");
  }

  // static async generateAuthenticationOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  //   const redis = await this.getRedis();
  //   // const user = await redis.getUser(userName);
  //   // if (!user) {
  //   //   throw new Error('User not found');
  //   // }

  //   const options = await generateAuthenticationOptions({
  //       rpID: this.rpID,
  //       allowCredentials: user.userPasskeys.map(passKey => ({
  //         id: passKey.id,
  //         type: 'public-key',
  //         transports: passKey.transports,
  //       })),
  //       userVerification: 'preferred',
  //   });

  //   user.currentChallenge = options.challenge;
  //   await redis.setUser(userName, user);

  //   // Return only necessary options, omitting allowCredentials
  //   return {
  //       challenge: options.challenge,
  //       timeout: options.timeout,
  //       rpId: options.rpId,
  //       userVerification: options.userVerification
  //   };
  // }
}
