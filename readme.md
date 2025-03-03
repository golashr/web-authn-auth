# WebAuthn Demo with Passkeys

A demonstration of passwordless authentication using WebAuthn FIDO2 implementation with SimpleWebAuthn and passkeys. 
* FIDO2/WebAuthn is designed for the web

## Features

- Passwordless authentication using platform authenticators (TouchID, FaceID, Windows Hello)
- Cross-device passkey support
- Redis-based user and passkey storage
- Built with Deno and TypeScript

## Implementation Overview

This proof of concept implements both client and server components:

### Client Implementation
- Uses `@simplewebauthn/browser` for WebAuthn operations
- Handles registration and authentication flows
- Manages platform authenticator interactions
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

### Authentication Flow
1. User enters username
2. Server provides authentication options
3. Browser retrieves passkey from platform authenticator
4. User verifies with biometric
5. Server validates the authentication

### Security Features
- Challenge-response authentication
- Anti-replay protection using counters
- Resident keys for cross-device support
- Platform authenticator enforcement

## Project Structure

```
├── packages/
│   ├── client/ 
├── packages/
│ ├── client/ # Frontend implementation
│ │ ├── public/
│ │ │ ├── js/
│ │ │ │ └── webauthn.js # Client-side WebAuthn operations
│ │ │ └── index.html # Simple demo UI
│ │ └── deno.json # Client config
│ ├── server/ # Backend implementation
│ │ ├── src/
│ │ │ ├── services/
│ │ │ │ ├── webauthn.ts # WebAuthn service
│ │ │ │ └── redis.ts # Redis storage service
│ │ │ ├── types/
│ │ │ │ └── webauthn.ts # Type definitions for WebAuthn
│ │ │ ├── routes/ # API endpoints
│ │ │ │ ├── auth/
│ │ │ │ │ ├── register-options.ts
│ │ │ │ │ ├── register-verify.ts
│ │ │ │ │ ├── login-options.ts
│ │ │ │ │ └── login-verify.ts
│ │ │ │ └── index.ts
│ │ │ └── server.ts # Server entry point
│ │ └── deno.json # Server config
│ └── config/ # Shared configuration
└── deno.json # Root config
```                   

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
✅ FIDO2/WebAuthn support – Implement passwordless logins using biometrics, security keys, or device-bound credentials.
✅ Multi-device authentication – Use FIDO2 security keys (YubiKey), mobile biometrics (Face ID, Windows Hello), or built-in authenticators.
✅ Phishing-resistant MFA – No OTPs, no password reuse issues.