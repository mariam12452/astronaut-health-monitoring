"use strict";

/* =========================================
   ASTRONAUT PROFILE PAGE
   Profile data is fetched from the backend.
   No astronaut or baseline values are hardcoded.
========================================= */

const API_BASE = (window.HACKBIO_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
const NOT_AVAILABLE = "Not available";

const byId = id => document.getElementById(id);

const ui = {
    missionContext: byId("mission-context"),
    connection: byId("profile-connection-status"),
    connectionText: byId("connection-status-text"),
    avatar: byId("astronaut-avatar"),
    crewNumber: byId("crew-number"),
    name: byId("identity-heading"),
    description: byId("identity-description"),
    baselineBadge: byId("baseline-approval-badge"),
    deviceBadge: byId("device-link-badge"),
    missionName: byId("identity-mission"),
    astronautId: byId("identity-id"),
    baselineMeta: byId("baseline-meta"),
    baselineGrid: byId("baseline-grid"),
    baselineEmpty: byId("baseline-empty"),
    methodDescription: byId("baseline-method-description"),
    message: byId("profile-message"),
    lastUpdated: byId("profile-last-updated"),
    refreshButton: byId("refresh-profile")
};


/* ---------- Status pills ---------- */

/* Backend state -> pill look (the data-tone values are styled in css/components.css) */
const CONNECTION_TONES = {
    connected: "success",
    loading: "neutral",
    disconnected: "neutral",
    error: "neutral"
};

const BADGE_TONES = {
    unknown: "neutral",
    pending: "neutral",
    rejected: "warning",
    unapproved: "warning",
    disconnected: "warning"
};

function setConnection(state, label) {
    ui.connection.dataset.tone = CONNECTION_TONES[state] ?? "neutral";
    setText(ui.connectionText, label);
}

function setBadge(badge, label, state, defaultTone) {
    badge.dataset.tone = BADGE_TONES[state] ?? defaultTone;
    setText(badge.querySelector("span:last-child"), label);
}


/* ---------- Formatting ---------- */

const isNumber = value => typeof value === "number" && Number.isFinite(value);

function format(value, digits, unit) {
    return isNumber(value) ? `${value.toFixed(digits)}${unit}` : NOT_AVAILABLE;
}

function formatPair(pair, digits, unit) {
    const systolic = pair?.systolicMmHg;
    const diastolic = pair?.diastolicMmHg;

    if (!isNumber(systolic) || !isNumber(diastolic)) return NOT_AVAILABLE;
    return `${systolic.toFixed(digits)}/${diastolic.toFixed(digits)}${unit}`;
}

/* How each baseline parameter is displayed. */
const METRIC_FORMATS = {
    heartRate: {
        value: b => format(b.mean, 1, " bpm"),
        sd: b => format(b.standardDeviation, 2, " bpm")
    },
    respiratoryRate: {
        value: b => format(b.mean, 1, " breaths/min"),
        sd: b => format(b.standardDeviation, 2, " breaths/min")
    },
    bloodPressure: {
        value: b => formatPair(b.mean, 0, " mmHg"),
        sd: b => formatPair(b.standardDeviation, 2, " mmHg")
    },
    skinTemperature: {
        value: b => format(b.mean, 2, " °C"),
        sd: b => format(b.standardDeviation, 2, " °C")
    },
    oxygenSaturation: {
        value: b => format(b.mean, 1, "%"),
        sd: b => format(b.standardDeviation, 2, "%")
    }
};

function setText(node, text, fallback = "—") {
    if (node) node.textContent = text ?? fallback;
}

function initials(name) {
    const letters = (name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();

    return letters || "—";
}

function updatedLabel(timestamp) {
    const date = new Date(timestamp);
    return timestamp && !Number.isNaN(date.getTime())
        ? `Updated ${date.toLocaleString()}`
        : "Timestamp unavailable";
}


/* ---------- Messages and empty states ---------- */

function showMessage(text, kind = "info") {
    ui.message.hidden = !text;
    ui.message.dataset.kind = kind;
    setText(ui.message, text, "");
}

function showBaselines(hasData) {
    ui.baselineGrid.hidden = !hasData;
    ui.baselineEmpty.hidden = hasData;
}


/* ---------- Rendering ---------- */

function renderIdentity(profile) {
    const name = profile.displayName || profile.fullName || "Astronaut";
    const mission = profile.mission?.name || profile.missionName || "Not assigned";
    const crew = profile.crewNumber
        ? `CREW MEMBER ${profile.crewNumber}`
        : "ASTRONAUT PROFILE";

    setText(ui.avatar, initials(name));
    setText(ui.crewNumber, crew);
    setText(ui.name, name);
    setText(
        ui.description,
        profile.identityStatus?.description || "Astronaut profile retrieved from the AstroVital backend."
    );
    setText(ui.missionName, mission);
    setText(ui.astronautId, profile.astronautId || getAstronautId());
    setText(ui.missionContext, `${mission.toUpperCase()} / ${crew}`);

    setBadge(
        ui.baselineBadge,
        profile.baselineStatus?.label || "Baseline status unavailable",
        profile.baselineStatus?.state,
        "success"
    );
    setBadge(
        ui.deviceBadge,
        profile.deviceStatus?.label || "Device status unavailable",
        profile.deviceStatus?.state,
        "accent"
    );
}

function renderBaselineCard(card, formats, baseline) {
    const isMissing = !baseline || baseline.status === "unavailable";

    if (isMissing) {
        setText(card.querySelector("[data-value]"), NOT_AVAILABLE);
        setText(card.querySelector("[data-sd]"), "Standard deviation: —");
        setText(card.querySelector("[data-note]"), "No approved reference supplied");
        return false;
    }

    const sd = formats.sd(baseline);

    setText(card.querySelector("[data-value]"), formats.value(baseline));
    setText(
        card.querySelector("[data-sd]"),
        sd === NOT_AVAILABLE
            ? "Standard deviation: not available"
            : `Standard deviation: ${sd}`
    );
    setText(card.querySelector("[data-note]"), baseline.referenceLabel || "Pre-flight reference");
    card.dataset.status = baseline.status || "unknown";
    return true;
}

function renderBaselines(data) {
    const parameters = data?.parameters || {};
    let foundAny = false;

    Object.entries(METRIC_FORMATS).forEach(([key, formats]) => {
        const card = ui.baselineGrid.querySelector(`[data-metric="${key}"]`);
        if (renderBaselineCard(card, formats, parameters[key])) foundAny = true;
    });

    showBaselines(foundAny);
    setText(
        ui.baselineMeta,
        data?.approvalStatus?.label ||
            (foundAny ? "Baseline data received" : "Awaiting baseline data")
    );

    if (data?.methodDescription) setText(ui.methodDescription, data.methodDescription);
}


/* ---------- Data loading ---------- */

function getAstronautId() {
    return new URLSearchParams(location.search).get("astronautId")?.trim() || "";
}

async function getJson(path) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
    });

    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return response.json();
}

function showNoAstronaut() {
    setConnection("disconnected", "Astronaut not selected");
    setText(ui.name, "No astronaut selected");
    setText(ui.description, "Select an astronaut session to retrieve its identity and approved baseline.");
    setText(ui.baselineMeta, "No astronaut selected");
    showBaselines(false);
    showMessage("No astronaut ID was provided. For the prototype, open this page with ?astronautId=A01.");
}

function showLoadError(error) {
    console.error("AstroVital profile load failed", error);

    setConnection("error", "Profile service unavailable");
    setText(ui.name, "Profile data unavailable");
    setText(ui.description, "The backend did not return this astronaut's profile. The page will display the record when the API is available.");
    setText(ui.baselineMeta, "Waiting for backend");
    setText(ui.lastUpdated, "No profile data received");
    showBaselines(false);
    showMessage(
        "Could not retrieve the astronaut profile. Confirm that the backend is running and the profile endpoint is available.",
        "error"
    );
}

async function loadProfile() {
    const id = getAstronautId();
    showMessage("");

    if (!id) {
        showNoAstronaut();
        return;
    }

    ui.refreshButton.disabled = true;
    setConnection("loading", "Loading astronaut profile");

    try {
        const encodedId = encodeURIComponent(id);
        const [profile, baseline] = await Promise.all([
            getJson(`/api/profile/${encodedId}`),
            getJson(`/api/baseline/${encodedId}`).catch(error => ({ __error: error }))
        ]);

        renderIdentity(profile);

        if (baseline.__error) {
            showBaselines(false);
            setText(ui.baselineMeta, "Baseline service unavailable");
            showMessage("Astronaut identity loaded, but baseline statistics could not be retrieved. Try refreshing later.");
        } else {
            renderBaselines(baseline);
        }

        setConnection("connected", "Profile service connected");
        setText(ui.lastUpdated, updatedLabel(profile.updatedAt || new Date().toISOString()));
    } catch (error) {
        showLoadError(error);
    } finally {
        ui.refreshButton.disabled = false;
    }
}


ui.refreshButton?.addEventListener("click", loadProfile);
loadProfile();
