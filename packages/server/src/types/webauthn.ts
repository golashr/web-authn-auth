import type {
  AuthenticatorTransportFuture,
  Base64URLString,
  CredentialDeviceType,
} from "@simplewebauthn/server";

// Basic user model
export interface UserModel {
  id: string;
  userName: string;
}

// Passkey (authenticator device) model
export interface Passkey {
  // Unique identifier for this credential
  id: Base64URLString;

  // The public key in CBOR format, encoded as Base64URLString
  publicKey: Base64URLString;

  // Anti-replay counter
  counter: number;

  // Whether this is a single-device or multi-device credential
  deviceType: CredentialDeviceType;

  // Whether the credential is backed up
  backedUp: boolean;

  // How the authenticator can communicate with the browser
  transports?: AuthenticatorTransportFuture[];

  // Additional metadata
  createdAt: Date;
  lastUsed: Date;
  // nickname?: string;
}

// User model with their passkeys
export interface User extends UserModel {
  userPasskeys: Passkey[];
  currentChallenge?: string;
}

// Re-export types we need from SimpleWebAuthn
export type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
