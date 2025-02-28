import { decodeBase64, encodeBase64 } from "jsr:@std/encoding/base64";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type GenerateRegistrationOptionsOpts,
} from "@simplewebauthn/server";
import type { 
  User, 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "../types/webauthn.ts";
import { config } from "@scope/config";
import { RedisService } from "./redis.ts";

function toBase64URLString(buffer: Uint8Array): string {
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
function fromBase64URLString(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '='); 
  return decodeBase64(base64);
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
    const userId = crypto.randomUUID();
    
    // Check if user already exists
    const existingUser = await redis.getUser(userName);

    const optionsParameters = {
      rpName: this.rpName,
      rpID: this.rpID,
      userID: userId,
      userName,
      attestationType: 'none',
      excludeCredentials: existingUser?.devices.map(device => ({
        id: fromBase64URLString(device.credentialID),
        type: 'public-key',
        transports: device.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    }
    
    const options = await generateRegistrationOptions(optionsParameters as GenerateRegistrationOptionsOpts);
    const user: User = existingUser ?? {
      id: userId,
      userName,
      devices: [],
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
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      console.log(JSON.stringify(verification, null, 2));

      if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

        const existingDevice = user.devices.find(
          device => device.credentialID === toBase64URLString(credentialID)
        );

        if (!existingDevice) {
          const newDevice = {
            credentialID: toBase64URLString(credentialID),
            credentialPublicKey: toBase64URLString(credentialPublicKey),
            counter,
            credentialDeviceType: verification.registrationInfo.credentialDeviceType,
            credentialBackedUp: verification.registrationInfo.credentialBackedUp,
            createdAt: new Date(),
            lastUsed: new Date(),
            nickname: userName,
            transports: response.response.transports || ['internal'],
          };

          user.devices.push(newDevice); 
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
      allowCredentials: user.devices.map(device => ({
        id: fromBase64URLString(device.credentialID),
        type: 'public-key',
        transports: device.transports,
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
    const device = user.devices.find(device => device.credentialID === response.id);

    if (!device) {
      throw new Error('Authenticator is not registered with this site');
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: fromBase64URLString(device.credentialID),
          credentialPublicKey: fromBase64URLString(device.credentialPublicKey),
          counter: device.counter,
        },
      });

      if (verification.verified) {
        device.counter = verification.authenticationInfo.newCounter;
        await redis.setUser(userName, user);
      }

      return verification.verified;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
} 