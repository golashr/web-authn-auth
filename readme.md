# WebAuthn Demo with Passkeys

A demonstration of passwordless authentication using WebAuthn FIDO2 implementation with SimpleWebAuthn and passkeys. 
* FIDO2/WebAuthn is designed for the web

## Features

- Passwordless authentication using platform authenticators (TouchID, FaceID, Windows Hello)
- Cross-device passkey support
- Frictionless sign-in with conditional UI
- Redis-based user and passkey storage
- Built with Deno and TypeScript

## Implementation Overview

This proof of concept implements both client and server components:

### Client Implementation
- Uses `@simplewebauthn/browser` for WebAuthn operations
- Handles registration and authentication flows
- Manages platform authenticator interactions
- Provides frictionless sign-in experience
- Communicates with server via REST API

### Server Implementation
- Uses `@simplewebauthn/server` for WebAuthn verification
- Manages user registration and authentication
- Stores passkeys and user data in Redis
- Handles challenge generation and verification

## How It Works

### Registration Flow
1. User enters username
2. Server generates registration options
3. Browser prompts for biometric verification
4. Passkey is created and stored in platform's secure storage (Keychain/TPM)
5. Public key is stored in Redis

### Frictionless Sign-In Flow
1. Browser shows passkey selection UI automatically
2. User selects their passkey and verifies with biometric
3. Username is auto-filled from passkey
4. Server verifies the authentication
5. User is logged in without additional prompts

### Security Features
- Challenge-response authentication
- Anti-replay protection using counters
- Resident keys for cross-device support
- Platform authenticator enforcement
- Single biometric verification per session

## Project Structure

```
├── packages/
│ ├── client/ # Frontend implementation
│ │ ├── public/
│ │ │ ├── js/
│ │ │ │ └── webauthn.js # Client-side WebAuthn operations with frictionless sign-in
│ │ │ └── index.html # Demo UI with passkey support
│ │ └── deno.json
│ ├── server/ # Backend implementation
│ │ ├── src/
│ │ │ ├── services/
│ │ │ │ ├── webauthn.ts # WebAuthn service with passkey management
│ │ │ │ └── redis.ts # Redis storage service
│ │ │ ├── routes/
│ │ │ │ ├── auth/
│ │ │ │ │ ├── register-options.ts # Registration options
│ │ │ │ │ ├── register-verify.ts # Registration verification
│ │ │ │ │ ├── login-options.ts # Authentication options
│ │ │ │ │ ├── login-verify.ts # Authentication verification
│ │ │ │ │ └── get-username.ts # Username lookup from passkey
│ │ │ │ └── index.ts # Route configuration
│ │ │ ├── middleware/
│ │ │ │ └── cors.ts # CORS configuration for cross-origin auth
│ │ │ └── server.ts
│ │ └── deno.json
│ └── config/ # Shared configuration
│   └── src/
│     └── index.ts # Environment and WebAuthn settings
└── deno.json
```

Key components:
- `webauthn.js`: Implements conditional UI and frictionless sign-in
- `get-username.ts`: Handles passkey to username resolution
- `cors.ts`: Manages cross-origin authentication
- `index.html`: Provides passkey-enabled login interface

## Setup

1. Prerequisites:
   - Deno 1.37 or higher
   - Redis server
   - Platform with biometric capability (TouchID/FaceID/Windows Hello)

2. Environment Variables:
   ```
   REDIS_URL=redis://localhost:6379
   ORIGIN=http://localhost:3126
   RP_ID=localhost
   RP_NAME="WebAuthn Demo"
   ```

3. Run Development Server:
   ```bash
   deno task dev
   ```

4. Access the demo:
   - Open http://localhost:3126
   - Enter username
   - Follow browser prompts for biometric registration/authentication

## Technologies

- Deno
- SimpleWebAuthn
  - @simplewebauthn/browser
  - @simplewebauthn/server
- Redis
- TypeScript


What Can You Achieve with SimpleWebAuthn?

- ✅ FIDO2/WebAuthn support – Implement passwordless logins using biometrics, security keys, or device-bound credentials.
- ✅ Multi-device authentication – Use FIDO2 security keys (YubiKey), mobile biometrics (Face ID, Windows Hello), or built-in authenticators.
- ✅ Phishing-resistant MFA – No OTPs, no password reuse issues.