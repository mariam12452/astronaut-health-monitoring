"use strict";

/* Login page: passcode or passkey sign-in, then Bio-Monitor pairing. */

const BASE_URL = (window.BioCosmosX_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
const $ = id => document.getElementById(id);
const next = new URLSearchParams(location.search).get("next");

async function post(path, payload) {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload ?? {})
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw Object.assign(new Error(body?.message || "Request failed"), { status: response.status, code: body?.error });
    return body;
}

function show(el, message) {
    el.textContent = message || "";
    el.hidden = !message;
}

function destination(user) {
    if (next && /^[a-z-]+\.html(\?.*)?$/i.test(next)) return next;
    return user.astronautId ? `index.html?astronautId=${encodeURIComponent(user.astronautId)}` : "index.html";
}

async function afterSignIn(user) {
    let monitor = null;
    try {
        const me = await (await fetch(`${BASE_URL}/api/auth/me`)).json();
        monitor = me.monitor;
    } catch { /* ignore */ }
    if (!user.astronautId || monitor) return (location.href = destination(user));
    $("step-identity").hidden = true;
    $("step-monitor").hidden = false;
    $("monitor-lead").textContent = `Signed in as ${user.displayName}. Enter the pairing code printed on your Bio-Monitor so the system can confirm the device is yours before any readings are accepted.`;
    $("monitor-code").focus();
    $("monitor-skip").onclick = () => (location.href = destination(user));
    $("monitor-form").onsubmit = async event => {
        event.preventDefault();
        show($("monitor-error"), "");
        const code = $("monitor-code").value.trim();
        if (!code) return show($("monitor-error"), "Enter the pairing code.");
        try {
            await post("/api/auth/monitor/verify", { pairingCode: code });
            location.href = destination(user);
        } catch (error) {
            show($("monitor-error"), error.message);
        }
    };
}

$("login-form").addEventListener("submit", async event => {
    event.preventDefault();
    show($("login-error"), "");
    const loginId = $("login-id").value.trim();
    const passcode = $("login-pass").value;
    if (!loginId || !passcode) return show($("login-error"), "Enter your Crew ID and passcode.");
    $("login-submit").disabled = true;
    try {
        const { user } = await post("/api/auth/login", { loginId, passcode });
        await afterSignIn(user);
    } catch (error) {
        show($("login-error"), error.message);
    } finally {
        $("login-submit").disabled = false;
    }
});


/* ---------- Passkey (WebAuthn) ---------- */

const b64uToBytes = value => {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
};
const bytesToB64u = buffer =>
    btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

$("login-passkey").addEventListener("click", async () => {
    show($("login-error"), "");
    const loginId = $("login-id").value.trim();
    if (!loginId) return show($("login-error"), "Enter your Crew ID, then choose the fingerprint option.");
    if (!window.PublicKeyCredential) return show($("login-error"), "This browser does not support passkeys.");
    try {
        const options = await post("/api/auth/passkey/login/options", { loginId });
        const credential = await navigator.credentials.get({
            publicKey: {
                ...options,
                challenge: b64uToBytes(options.challenge),
                allowCredentials: (options.allowCredentials || []).map(c => ({ ...c, id: b64uToBytes(c.id) }))
            }
        });
        const response = {
            id: credential.id,
            rawId: bytesToB64u(credential.rawId),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            authenticatorAttachment: credential.authenticatorAttachment || undefined,
            response: {
                clientDataJSON: bytesToB64u(credential.response.clientDataJSON),
                authenticatorData: bytesToB64u(credential.response.authenticatorData),
                signature: bytesToB64u(credential.response.signature),
                userHandle: credential.response.userHandle ? bytesToB64u(credential.response.userHandle) : undefined
            }
        };
        const { user } = await post("/api/auth/passkey/login/verify", { loginId, response });
        await afterSignIn(user);
    } catch (error) {
        const message = error.code === "no_passkey"
            ? "No fingerprint is registered for this account yet. Sign in with your passcode and add one on your profile page."
            : error.name === "NotAllowedError" ? "Biometric check was cancelled or timed out." : error.message;
        show($("login-error"), message);
    }
});

/* Already signed in? Skip straight on. */
fetch(`${BASE_URL}/api/auth/me`).then(r => (r.ok ? r.json() : null)).then(me => {
    if (me?.user) afterSignIn(me.user);
}).catch(() => {});
