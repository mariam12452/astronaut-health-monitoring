"use strict";

/* =========================================
   CONNECTION PAGE
   GET /api/connection/:astronautId, polled every 5 s.
   There are always 4 steps; steps[i] fills the i-th .step-card.
   Backend docs/FRONTEND_CONTRACT.md section 7.
========================================= */

const POLL_MS = 5000;

const STEP_STATUS = {
    verified: { text: "Verified", tone: null },
    connected: { text: "Connected", tone: null },
    ready: { text: "Ready", tone: null },
    pending: { text: "Pending", tone: "neutral" },
    waiting: { text: "Waiting", tone: "neutral" },
    blocked: { text: "Blocked", tone: "warning" }
};

const cards = [...document.querySelectorAll(".step-card[data-step]")];
const pill = document.getElementById("connection-pill");
const pillText = document.getElementById("connection-pill-text");
const eyebrow = document.getElementById("connection-eyebrow");

let hasData = false;
let notFound = false;
let header = { missionDay: null, crewNumber: null };

/* Remember the original description text of each step. */
cards.forEach(card => {
    const description = card.querySelector('[data-role="step-description"]');
    if (description) description.dataset.base = description.textContent.trim();
});


function renderEyebrow() {
    const day = formatMissionDay(header.missionDay);
    const crew = header.crewNumber ?? "—";
    setText(eyebrow, `MISSION DAY ${day}   /   CREW ${crew}`);
}

async function loadHeader(astronautId) {
    const id = encodeURIComponent(astronautId);
    const [overview, crew] = await Promise.all([
        apiGet(`/api/overview/${id}`).catch(() => null),
        loadCrewNumber(astronautId)
    ]);
    header = { missionDay: overview?.missionDay ?? null, crewNumber: crew };
    renderEyebrow();
}

function renderStep(card, step) {
    const info = STEP_STATUS[step.status] || { text: step.status, tone: "neutral" };
    const stepPill = card.querySelector('[data-role="step-status"]');
    setText(card.querySelector(".step-card__title"), step.label);
    setText(stepPill, info.text);
    applyTone(stepPill, info.tone);

    const description = card.querySelector('[data-role="step-description"]');
    if (!description) return;

    let text = description.dataset.base || "";
    if (step.key === "connect_bio_monitor" && step.sessionId) {
        const last = step.lastReadingAt ? ` · last reading ${formatLocalTime(step.lastReadingAt)}` : "";
        text += ` Session ${step.sessionId}${last}.`;
    }
    description.textContent = text;
}

function render(data) {
    data.steps.forEach((step, index) => {
        if (cards[index]) renderStep(cards[index], step);
    });

    const monitor = data.steps.find(step => step.key === "connect_bio_monitor");
    const connected = monitor?.status === "connected";
    setText(pillText, connected ? "Bio-Monitor connected" : "Bio-Monitor not connected");
    applyTone(pill, connected ? null : "neutral");
}

async function load() {
    if (notFound) return;
    const astronautId = getAstronautId();

    try {
        const data = await apiGet(`/api/connection/${encodeURIComponent(astronautId)}`);
        hideBanner("connection-banner");
        if (!hasData) loadHeader(astronautId);
        hasData = true;
        render(data);
    } catch (error) {
        if (error instanceof ApiError && error.code === "astronaut_not_found") {
            notFound = true;
            renderNotFound(astronautId);
            return;
        }

        console.error("AstroVital connection load failed", error);

        if (error instanceof ApiError) {
            showBanner("connection-banner", "Service problem, the page will retry shortly.", "danger");
        } else {
            showBanner(
                "connection-banner",
                hasData
                    ? "Connection lost, retrying…"
                    : "Cannot reach the monitoring service. It may be waking up (this can take up to a minute); retrying…"
            );
        }
        if (!hasData) setText(pillText, "Service unreachable");
    }
}

if (!getAstronautId()) renderNotFound("(none)");
else startPolling(load, POLL_MS);
