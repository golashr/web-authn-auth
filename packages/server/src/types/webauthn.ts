import type {
  AuthenticatorTransport,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "npm:@simplewebauthn/typescript-types@8.3.4";

import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from "@simplewebauthn/server";

export interface AuthenticatorDevice {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  createdAt: Date;
  lastUsed: Date;
  nickname?: string;
  transports?: AuthenticatorTransport[];
}

export interface User {
  id: string;
  userName: string;
  devices: AuthenticatorDevice[];
  currentChallenge?: string;
} 

// Re-export the types we need
export type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  PublicKeyCredentialRequestOptionsJSON,
};