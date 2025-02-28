// Base64URL encoding/decoding functions
function bufferToBase64URL(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (const charCode of bytes) {
        str += String.fromCharCode(charCode);
    }
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLToBuffer(base64URL) {
    const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, '=');
    const binary = atob(padded);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
}

async function register() {
    try {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        const serverOrigin = 'http://localhost:3126';
        
        // 1. Get registration options from server
        const optionsRes = await fetch(`${serverOrigin}/auth/register-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const options = await optionsRes.json();

        console.log('Registration options:', options);

        // 2. Create credentials
        const credential = await navigator.credentials.create({
            publicKey: {
                ...options.data,
                challenge: base64URLToBuffer(options.data.challenge),
                user: {
                    ...options.data.user,
                    id: base64URLToBuffer(options.data.user.id)
                },
                excludeCredentials: options.data.excludeCredentials?.map(cred => ({
                    ...cred,
                    id: base64URLToBuffer(cred.id)
                })) || []
            }
        });

        // 3. Verify registration
        const verifyRes = await fetch(`${serverOrigin}/auth/register-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                response: {
                    id: credential.id,
                    rawId: bufferToBase64URL(credential.rawId),
                    response: {
                        attestationObject: bufferToBase64URL(credential.response.attestationObject),
                        clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON)
                    },
                    type: credential.type,
                    clientExtensionResults: credential.getClientExtensionResults()
                }
            })
        });

        const verifyResult = await verifyRes.json();
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

        // 2. Get credentials
        const credential = await navigator.credentials.get({
            publicKey: {
                ...options.data,
                challenge: base64URLToBuffer(options.data.challenge),
                allowCredentials: options.data.allowCredentials?.map(cred => ({
                    ...cred,
                    id: base64URLToBuffer(cred.id)
                })) || []
            }
        });
        console.log('Credential:', JSON.stringify(credential, null, 2));

        // 3. Verify authentication
        const verifyRes = await fetch(`${serverOrigin}/auth/login-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                response: {
                    id: credential.id,
                    rawId: bufferToBase64URL(credential.rawId),
                    response: {
                        authenticatorData: bufferToBase64URL(credential.response.authenticatorData),
                        clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
                        signature: bufferToBase64URL(credential.response.signature),
                        userHandle: credential.response.userHandle ? bufferToBase64URL(credential.response.userHandle) : null
                    },
                    type: credential.type,
                    clientExtensionResults: credential.getClientExtensionResults()
                }
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