"use strict";

/* =========================================
   SHARED API HELPERS (Overview, Health Trends, Connection)
   Load after config.js. profile.js has its own copy and does NOT load this file.
   Contract: docs/FRONTEND_CONTRACT.md in the backend repo.
========================================= */

const API_BASE = (window.BioCosmosX_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");

function getAstronautId() {
    return (
        new URLSearchParams(location.search).get("astronautId")?.trim() ||
        window.BioCosmosX_CONFIG?.defaultAstronautId ||
        ""
    );
}

class ApiError extends Error {
    constructor(status, body) {
        super(body?.message || `API request failed (${status})`);
        this.status = status;          // HTTP status, e.g. 404
        this.code = body?.error;       // e.g. "astronaut_not_found"
        this.details = body?.details;  // validation errors only
    }
}

async function apiGet(path) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, body);
    return body;
}

async function apiPost(path, payload, contentType = "application/json") {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": contentType, Accept: "application/json" },
        body: contentType === "application/json" ? JSON.stringify(payload) : payload
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, body);
    return { status: response.status, body };
}


/* ---------- Status -> pill tone (contract section 3.4) ---------- */

/* NORMAL uses the default (success) look, so it returns no tone. */
function toneForStatus(status) {
    if (status === "WATCH") return "warning";
    if (status === "ATTENTION") return "danger";
    if (status === "unavailable" || status == null) return "neutral";
    return null;
}

function applyTone(element, tone) {
    if (!element) return;
    if (tone) element.dataset.tone = tone;
    else delete element.dataset.tone;
}


/* ---------- Small formatters ---------- */

function formatMissionDay(day) {
    return Number.isInteger(day) ? String(day).padStart(3, "0") : "—";
}

function formatLocalTime(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function setText(element, text) {
    if (element) element.textContent = text;
}


/* ---------- Polling that pauses when the tab is hidden ---------- */

function startPolling(task, intervalMs) {
    let timer = null;

    const run = () => { task(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { if (!timer) timer = setInterval(run, intervalMs); };

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") stop();
        else { run(); start(); }
    });

    run();
    start();
}


/* ---------- Header / footer context: "MISSION DAY 030 / CREW 01" ---------- */

async function loadCrewNumber(astronautId) {
    /* Astronaut accounts may not list the crew, so fall back to the number inside their own id (A01 -> 01). */
    try {
        const astronauts = await apiGet("/api/astronauts");
        return astronauts.find(a => a.astronautId === astronautId)?.crewNumber ?? null;
    } catch {
        return String(astronautId).replace(/\D/g, "") || null;
    }
}


/* ---------- Page-level messages (not found / offline) ---------- */

function showBanner(id, message, tone = "warning") {
    let banner = document.getElementById(id);
    if (!banner) {
        banner = document.createElement("div");
        banner.id = id;
        banner.className = "status-banner";
        banner.setAttribute("role", "status");
        const main = document.querySelector("main");
        main?.prepend(banner);
    }
    banner.dataset.tone = tone;
    banner.textContent = message;
    banner.hidden = !message;
}

function hideBanner(id) {
    const banner = document.getElementById(id);
    if (banner) banner.hidden = true;
}

function renderNotFound(astronautId) {
    const main = document.querySelector("main");
    if (!main) return;
    const box = document.createElement("section");
    box.className = "card empty-state";
    const title = document.createElement("h2");
    title.textContent = `No astronaut with id "${astronautId}"`;
    const link = document.createElement("a");
    link.href = `${location.pathname}?astronautId=A01`;
    link.textContent = "Open astronaut A01";
    const text = document.createElement("p");
    text.append("Check the ?astronautId= part of the address, or ", link, ".");
    box.append(title, text);
    main.replaceChildren(box);
}
