"use strict";

/* Profile page: passkey (fingerprint / face) registration, passcode change, recent account activity. */

(function () {
    const base = (window.BioCosmosX_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
    const list = document.getElementById("passkey-list");
    const activity = document.getElementById("activity-list");
    const message = document.getElementById("security-message");
    if (!list) return;

    const call = async (path, options = {}) => {
        const response = await fetch(`${base}${path}`, {
            method: options.method || "GET",
            headers: { "Content-Type": "application/json" },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "Request failed");
        return body;
    };
    const say = (text, tone) => {
        message.textContent = text;
        if (tone) message.dataset.tone = tone; else delete message.dataset.tone;
        message.hidden = !text;
    };
    const b64uToBytes = v => Uint8Array.from(atob(v.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(v.length / 4) * 4, "=")), c => c.charCodeAt(0));
    const bytesToB64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const row = (...parts) => { const li = document.createElement("li"); li.append(...parts); return li; };

    function renderPasskeys(passkeys) {
        list.replaceChildren();
        if (!passkeys.length) return list.append(row("No fingerprint or face passkey registered yet."));
        for (const key of passkeys) {
            const remove = document.createElement("button");
            remove.type = "button"; remove.className = "security-button security-button--small"; remove.textContent = "Remove";
            remove.onclick = async () => { await call(`/api/auth/passkeys/${key.id}`, { method: "DELETE" }); load(); };
            const used = key.lastUsedAt ? `last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : "never used";
            list.append(row(`${key.deviceLabel} · added ${new Date(key.createdAt).toLocaleDateString()} · ${used}`, remove));
        }
    }

    function renderActivity(items) {
        activity.replaceChildren();
        if (!items.length) return activity.append(row("Nothing yet."));
        for (const item of items.slice(0, 8)) {
            const when = new Date(item.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
            activity.append(row(`${item.action.replace(/_/g, " ")}${item.success ? "" : " (failed)"}`, when));
        }
    }

    async function load() {
        try {
            const me = await call("/api/auth/me");
            renderPasskeys(me.passkeys || []);
            const events = await call("/api/auth/activity");
            renderActivity(Array.isArray(events) ? events : events.events || []);
        } catch (e) { say(e.message, "danger"); }
    }

    document.getElementById("passkey-add").addEventListener("click", async () => {
        say("");
        if (!window.PublicKeyCredential) return say("This browser does not support passkeys.", "danger");
        try {
            const options = await call("/api/auth/passkey/register/options", { method: "POST", body: {} });
            const credential = await navigator.credentials.create({
                publicKey: {
                    ...options,
                    challenge: b64uToBytes(options.challenge),
                    user: { ...options.user, id: b64uToBytes(options.user.id) },
                    excludeCredentials: (options.excludeCredentials || []).map(c => ({ ...c, id: b64uToBytes(c.id) }))
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
                    attestationObject: bytesToB64u(credential.response.attestationObject),
                    transports: credential.response.getTransports ? credential.response.getTransports() : []
                }
            };
            await call("/api/auth/passkey/register/verify", { method: "POST", body: { response, deviceLabel: navigator.platform || "This device" } });
            say("Fingerprint / face registered. You can now use it on the sign-in page.");
            load();
        } catch (e) {
            say(e.name === "NotAllowedError" ? "Biometric check was cancelled or timed out." : e.message, "danger");
        }
    });

    document.getElementById("passcode-form").addEventListener("submit", async event => {
        event.preventDefault();
        try {
            await call("/api/auth/passcode", { method: "POST", body: { current: document.getElementById("pc-current").value, next: document.getElementById("pc-new").value } });
            event.target.reset();
            say("Passcode updated. Other sessions were signed out.");
        } catch (e) { say(e.message, "danger"); }
    });

    load();
})();
