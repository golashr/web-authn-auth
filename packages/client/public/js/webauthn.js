import { startRegistration, startAuthentication } from 'https://cdn.skypack.dev/@simplewebauthn/browser';

// Check for existing passkeys on page load
// async function checkExistingPasskeys() {
//     try {
//         const mediation = await PublicKeyCredential.isConditionalMediationAvailable();
//         if (mediation) {
//             // Start listening for auto-fill
//             const credential = await navigator.credentials.get({
//                 mediation: 'conditional',
//                 publicKey: {
//                     challenge: new Uint8Array(32),
//                     rpId: window.location.hostname,
//                     userVerification: 'preferred',
//                 }
//             });
            
//             if (credential) {
//                 // Auto-fill username and trigger login
//                 document.getElementById('username').value = credential.response.userHandle;
//                 login();
//             }
//         }
//     } catch (error) {
//         console.log('No passkeys available for auto-fill');
//     }
// }

async function register() {
    try {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        // Check for existing passkeys first
        // try {
        //     const credential = await navigator.credentials.get({
        //         publicKey: {
        //             challenge: new Uint8Array(32),
        //             rpId: window.location.hostname,
        //             userVerification: 'preferred',
        //         }
        //     });
            
        //     if (credential) {
        //         alert('You already have a passkey for this site. Please use login.');
        //         return;
        //     }
        // } catch (e) {
        //     // No existing passkeys, continue with registration
        // }

        const serverOrigin = 'http://localhost:3126';
        
        // 1. Get registration options from server
        const optionsRes = await fetch(`${serverOrigin}/auth/register-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        const serverOrigin = 'http://localhost:3126';
        
        // 1. Get authentication options
        const optionsRes = await fetch(`${serverOrigin}/auth/login-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const options = await optionsRes.json();

        console.log('Login options:', options);

        // 2. Get credentials using simplewebauthn/browser
        const authenticationResponse = await startAuthentication({ optionsJSON: options.data });

        // 3. Verify authentication
        const verifyRes = await fetch(`${serverOrigin}/auth/login-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

// Start listening for passkeys when page loads
// document.addEventListener('DOMContentLoaded', checkExistingPasskeys);

// Add event listeners for buttons
document.getElementById('registerBtn').addEventListener('click', register);
document.getElementById('loginBtn').addEventListener('click', login);