import { startRegistration } from "https://cdn.skypack.dev/@simplewebauthn/browser";

const serverOrigin = "http://localhost:3126";

async function register() {
  try {
    const username = document.getElementById("username").value.trim();
    if (!username) {
      alert("Please enter a username");
      return;
    }

    // 1. Get registration options from server
    const optionsRes = await fetch(`${serverOrigin}/auth/register-options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username }),
    });
    const options = await optionsRes.json();

    // 2. Create credentials using simplewebauthn/browser
    const registrationResponse = await startRegistration({
      optionsJSON: options.data,
    });

    // 3. Verify registration
    const verifyRes = await fetch(`${serverOrigin}/auth/register-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username,
        challenge: options.data.challenge,
        response: registrationResponse,
      }),
    });

    const verifyResult = await verifyRes.json();
    if (verifyResult.success && verifyResult.data?.verified) {
      alert(
        `Registration successful! Welcome onboard ${verifyResult.data.userName}`,
      );
    } else {
      alert("Registration failed!");
    }
  } catch (error) {
    console.error("Registration failed:", error);
  }
}

async function login() {
  try {
    const mediation = await PublicKeyCredential
      .isConditionalMediationAvailable();
    if (mediation) {
      // First get challenge from server
      const challengeRes = await fetch(`${serverOrigin}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const challengeData = await challengeRes.json();

      // Get passKey using server's challenge
      const passKey = await navigator.credentials.get({
        mediation: "optional",
        publicKey: {
          // Convert base64url to Uint8Array
          challenge: base64URLToUint8Array(challengeData.data.challenge),
          rpId: window.location.hostname,
          allowCredentials: [], // Empty for discoverable passKey
          userVerification: "preferred",
        },
      });

      if (passKey) {
        // Verify with server using challengeId
        const verifyRes = await fetch(`${serverOrigin}/auth/login-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            response: passKey,
            challengeId: challengeData.data.challengeId,
          }),
        });

        const verifyResult = await verifyRes.json();
        if (verifyResult.success && verifyResult.data?.verified) {
          alert(`Login successful! Welcome back ${verifyResult.data.userName}`);
          return true;
        } else {
          alert("Login failed");
        }
      }
    }
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed: " + error.message);
  }
}

// Add event listeners for buttons
document.getElementById("registerBtn").addEventListener("click", register);
document.getElementById("loginBtn").addEventListener("click", login);

// Add this helper function at the top of the file
function base64URLToUint8Array(base64url) {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '=' if needed
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  // Convert to Uint8Array
  const binary = atob(padded);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}
