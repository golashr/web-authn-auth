# WebAuthn Demo with Passkeys

A demonstration of passwordless authentication using WebAuthn FIDO2
implementation with SimpleWebAuthn and passkeys.

- FIDO2/WebAuthn is designed for the web

## Features

- Passwordless authentication using platform authenticators (TouchID, FaceID,
  Windows Hello)
- Cross-device passkey support
- Frictionless sign-in with conditional UI
- Redis-based user and passkey storage
- Built with Deno and TypeScript

## Implementation Overview

This proof of concept implements both client and server components:

### Client Implementations

This demo provides two different client implementations showcasing different
WebAuthn flows:

### Standard Client (`/packages/client`)

- Traditional WebAuthn implementation
- User manually enters username
- Single passkey verification prompt
- Flow:
  1. User enters username
  2. Server generates authentication challenge
  3. Single passkey verification prompt
  4. Server verifies authentication

### Auto-fill Client (`/packages/client-auto-fill`)

- Automatic username discovery from passkey
- More convenient user experience
- Flow:
  1. Initial passkey selection prompt
  2. Username auto-filled from selected passkey
  3. Server verifies authentication

#### Trade-offs

**Standard Client**

- ✅ Single passkey verification
- ✅ Cleaner security flow
- ❌ Manual username entry required

**Auto-fill Client**

- ✅ Automatic username discovery
- ✅ More convenient user experience
- ✅ Single verification flow
- ✅ Streamlined API calls

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
│ ├── client/ # Standard client implementation
│ │ ├── public/
│ │ │ ├── js/
│ │ │ │ └── webauthn.js # Basic WebAuthn operations
│ │ │ └── index.html # Manual username entry UI
│ │ ├── src/
│ │ │ └── server.ts # Static file server
│ │ └── deno.json
│ ├── client-auto-fill/ # Auto-fill client implementation
│ │ ├── public/
│ │ │ ├── js/
│ │ │ │ └── webauthn.js # WebAuthn with username discovery
│ │ │ └── index.html # Auto-fill enabled UI
│ │ ├── src/
│ │ │ └── server.ts # Static file server
│ │ └── deno.json
│ ├── server/ # Backend implementation
│ │ ├── src/
│ │ │ ├── services/
│ │ │ │ ├── webauthn.ts # WebAuthn service
│ │ │ │ └── redis.ts # Redis storage
│ │ │ ├── routes/
│ │ │ │ ├── auth/
│ │ │ │ │ ├── generate-challenge.ts
│ │ │ │ │ ├── index.ts
│ │ │ │ │ ├── login-verify.ts
│ │ │ │ │ └── register-options.ts
│ │ │ │ │ ├── register-verify.ts
│ │ │ ├── middleware/
│ │ │ │ └── cors.ts
│ │ │ └── server.ts
│ │ └── deno.json
│ └── config/ # Shared configuration
│   └── src/
│     └── index.ts # Environment settings
└── deno.json
```

## Environment Configuration

For testing on web domains, you need to configure the appropriate origins in
your `.env` file:

```bash
# Backend server
BACKEND_SERVER_PORT=3126
ORIGIN=http://localhost:3126  # Change to your domain

# Client servers
CLIENT_SERVER_PORT=8000
CLIENT_AUTO_FILL_PORT=8001

# For standard client
ORIGIN=http://localhost:8000  # Change to your client domain

# For auto-fill client
ORIGIN=http://localhost:8001  # Change to your auto-fill client domain

# Common settings
RP_ID=localhost  # Change to your domain without protocol
RP_NAME="WebAuthn Demo"
```

### Testing on Web Domains

1. Update origins per client:
   - Each client needs its own origin in the `.env` file
   - Origins must match the actual domain where the client is hosted
   - RP_ID must match the domain without protocol

2. Example for hosted domains:
   ```bash
   # For standard client at auth.example.com
   ORIGIN=https://auth.example.com
   RP_ID=auth.example.com

   # For auto-fill client at auto.example.com
   ORIGIN=https://auto.example.com
   RP_ID=auto.example.com
   ```

3. CORS considerations:
   - Backend CORS is configured to accept requests from configured origins
   - Ensure all client origins are properly set for CORS to work

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
   - Enter username to register
   - Follow browser prompts for biometric registration/authentication

## Technologies

- Deno
- SimpleWebAuthn
  - @simplewebauthn/browser
  - @simplewebauthn/server
- Redis
- TypeScript

What Can You Achieve with SimpleWebAuthn?

- ✅ FIDO2/WebAuthn support – Implement passwordless logins using biometrics,
  security keys, or device-bound credentials.
- ✅ Multi-device authentication – Use FIDO2 security keys (YubiKey), mobile
  biometrics (Face ID, Windows Hello), or built-in authenticators.
- ✅ Phishing-resistant MFA – No OTPs, no password reuse issues.
