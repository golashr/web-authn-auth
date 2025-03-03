import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  GenerateRegistrationOptionsOpts,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import type { 
  User, 
} from "../types/webauthn.ts";
import { config } from "@scope/config";
import { RedisService } from "./redis.ts";

function toBase64URLFromUInt8Array(buffer: Uint8Array): string {
  return encodeBase64(buffer)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Example lengths and resulting padding:
// Length 5 % 4 = 1, needs 3 padding chars
// Length 6 % 4 = 2, needs 2 padding chars
// Length 7 % 4 = 3, needs 1 padding char
// Length 8 % 4 = 0, needs 0 padding chars //the final % 4 is used for this case
function fromBase64URLStringToUInt8Array(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '='); 
  return decodeBase64(base64);
}

function uuidToUint8Array(uuid: string): Uint8Array {
  // Remove hyphens and convert to buffer
  return new Uint8Array(
    uuid.replace(/-/g, '')
      .match(/.{1,2}/g)!
      .map(byte => parseInt(byte, 16))
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

  static async generateRegistrationOptions(userName: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const redis = await this.getRedis();
    const userUUID = crypto.randomUUID();  // Keep original UUID
    const userID = uuidToUint8Array(userUUID);  // Convert for WebAuthn
    
    // Check if user already exists
    const existingUser = await redis.getUser(userName);

    const optionsParameters = {
      rpName: this.rpName,
      rpID: this.rpID,
      userID,  // Use Uint8Array for WebAuthn
      userName,
      attestationType: 'none',
      excludeCredentials: existingUser?.userPasskeys.map(passKey => ({
        id: passKey.id, 
        type: 'public-key',
        transports: passKey.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    }
    
    const options = await generateRegistrationOptions(optionsParameters as GenerateRegistrationOptionsOpts);
    const user: User = existingUser ?? {
      id: userUUID,  // Store original UUID
      userName,
      userPasskeys: [],
      currentChallenge: options.challenge,
    };
    
    if (existingUser) {
      user.currentChallenge = options.challenge;
    }
    
    await redis.setUser(userName, user);
    return options;
  }

  static async verifyRegistration(
    userName: string,
    response: RegistrationResponseJSON
  ): Promise<boolean> {
    const redis = await this.getRedis();
    const user = await redis.getUser(userName);
    if (!user || !user.currentChallenge) {
      throw new Error('User not found or challenge missing');
    }

    try {
      const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      console.log(JSON.stringify(verification, null, 2));

      if (verification.verified && verification.registrationInfo) {
        const {
          credential,
          credentialDeviceType,
          credentialBackedUp,
        } = verification.registrationInfo;
        const { id, publicKey, counter } = credential;

        const existingpassKey = user.userPasskeys.find(
          passKey => passKey.id === id
        );

        if (!existingpassKey) {
          const newpassKey = {
            id,
            publicKey: toBase64URLFromUInt8Array(publicKey),
            counter,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: response.response.transports || ['internal'],
            createdAt: new Date(),
            lastUsed: new Date(),
          };

          user.userPasskeys.push(newpassKey);
          await redis.setUser(userName, user);
        }
      }

      return verification.verified;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  static async generateAuthenticationOptions(userName: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const redis = await this.getRedis();
    const user = await redis.getUser(userName);
    if (!user) {
      throw new Error('User not found');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: user.userPasskeys.map(passKey => ({
        id: passKey.id,
        type: 'public-key',
        transports: passKey.transports,
      })),
      userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    await redis.setUser(userName, user);
    return options;
  }

  static async verifyAuthentication(
    userName: string,
    response: AuthenticationResponseJSON
  ): Promise<boolean> {
    const redis = await this.getRedis();
    const user = await redis.getUser(userName);
    if (!user || !user.currentChallenge) {
      throw new Error('User not found or challenge missing');
    }
    
    console.log(JSON.stringify(response, null, 2));
    const passKey = user.userPasskeys.find(passKey => passKey.id === response.id);

    if (!passKey) {
      throw new Error('Authenticator is not registered with this site');
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.currentChallenge,
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
        await redis.setUser(userName, user);
      }

      return verification.verified;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
} 