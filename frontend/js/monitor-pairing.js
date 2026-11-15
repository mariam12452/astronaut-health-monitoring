"use strict";

/* Connection page: pair / end the Bio-Monitor session for the signed-in astronaut. */

(function () {
    const user = window.HB_USER;
    const card = document.getElementById("monitor-card");
    if (!card) return;
    if (!user?.astronautId) { card.hidden = true; return; } // staff accounts have no wearer
    const base = (window.BioCosmosX_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
    const state = document.getElementById("monitor-state");
    const form = document.getElementById("monitor-pair-form");
    const endButton = document.getElementById("monitor-end");
    const error = document.getElementById("monitor-pair-error");

    const call = async (path, payload) => {
        const response = await fetch(`${base}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload || {})
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "Request failed");
        return body;
    };

    function render(monitor) {
        if (monitor) {
            const since = new Date(monitor.startedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
            state.textContent = `Verified: ${monitor.deviceLabel} is paired to ${user.displayName}. Session ${monitor.sessionId} (mission day ${monitor.missionDay}) opened ${since}. Readings are stored against this session.`;
        } else {
            state.textContent = "No Bio-Monitor is paired. Readings are only accepted from a device you have verified with its pairing code.";
        }
        form.hidden = Boolean(monitor);
        endButton.hidden = !monitor;
    }

    async function refresh() {
        try {
            const response = await fetch(`${base}/api/auth/me`);
            render((await response.json()).monitor);
        } catch { state.textContent = "Cannot reach the backend."; }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        error.hidden = true;
        try {
            const { monitor } = await call("/api/auth/monitor/verify", { pairingCode: document.getElementById("monitor-pair-code").value.trim() });
            render(monitor);
        } catch (e) { error.textContent = e.message; error.hidden = false; }
    });
    endButton.addEventListener("click", async () => {
        await call("/api/auth/monitor/end");
        render(null);
    });
    refresh();
})();
