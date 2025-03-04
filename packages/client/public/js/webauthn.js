import { startRegistration, startAuthentication } from 'https://cdn.skypack.dev/@simplewebauthn/browser';

const serverOrigin = 'http://localhost:3126';

async function checkExistingPasskeys() {
    try {
        const mediation = await PublicKeyCredential.isConditionalMediationAvailable();
        if (mediation) {
            // First get passKey from browser
            const passKey = await navigator.credentials.get({
                mediation: 'optional',
                publicKey: {
                    challenge: new Uint8Array(32),
                    rpId: window.location.hostname,
                    allowCredentials: [], // Empty for discoverable passKey
                    userVerification: 'preferred',
                }
            });

            if (passKey) {
                console.log('PassKey:', JSON.stringify(passKey, null, 2));
                const passkeyId = passKey.id;
                
                const response = await fetch(`${serverOrigin}/auth/get-username`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ passkeyId })
                });
                const options = await response.json();
                document.getElementById("username").value = options.data.username;
            }
            return passKey;
        }
    } catch (error) {
        console.log('No passkeys available or user declined');
    }
}

async function register() {
    try {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        // 1. Get registration options from server
        const optionsRes = await fetch(`${serverOrigin}/auth/register-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username })
        });
        const options = await optionsRes.json();

        console.log('Registration options:', options);

        // 2. Create credentials using simplewebauthn/browser
        const registrationResponse = await startRegistration({ optionsJSON: options.data });

        // 3. Verify registration
        const verifyRes = await fetch(`${serverOrigin}/auth/register-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                username,
                response: registrationResponse
            })
        });

        const verifyResult = await verifyRes.json();
        if (verifyResult.success) {
            alert('Registration successful!');
        } else {
            alert('Registration failed!');
        }
        console.log('Registration result:', verifyResult);
    } catch (error) {
        console.error('Registration failed:', error);
    }
}

async function login() {
    try {
        const passKey = await checkExistingPasskeys()  
        const username = document.getElementById('username').value.trim();
        
        if (!username) {
            alert('Please enter a username');
            return;
        }

        // Always get authentication options to get a fresh challenge
        const optionsRes = await fetch(`${serverOrigin}/auth/login-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
            credentials: 'include'
        });
        const options = await optionsRes.json();

        // If we have passKey from auto-fill, use it directly
        let authenticationResponse;
        if (passKey) {
            // The passKey already has user verification from checkExistingPasskeys
            authenticationResponse = passKey;
        } else {
            // Regular flow with UI prompt
            authenticationResponse = await startAuthentication({ optionsJSON: options.data });
        }

        // Verify with server
        const verifyRes = await fetch(`${serverOrigin}/auth/login-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                username,
                response: authenticationResponse
            })
        });

        const verifyResult = await verifyRes.json();
        console.log('Login result:', verifyResult);
        if (verifyResult.success) {
            alert('Login successful!');
        } else {
            alert('Login failed!');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
    }
}

// Add event listeners for buttons
document.getElementById('registerBtn').addEventListener('click', register);
document.getElementById('loginBtn').addEventListener('click', login);