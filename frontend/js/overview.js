"use strict";

/* =========================================
   OVERVIEW PAGE
   GET /api/overview/:astronautId, polled every 5 s.
   Field-to-element mapping: backend docs/FRONTEND_CONTRACT.md section 4.
========================================= */

const POLL_MS = 5000;  // matches the Bio-Monitor: one reading every 5 s

const ACTIVITY_TEXT = {
    low: "Resting / low",
    moderate: "Moderate",
    high: "High (exercise)"
};

const INTERPRETATION_TITLE = {
    NORMAL: "Physiological parameters are stable",
    WATCH: "Monitoring a deviation",
    ATTENTION: "Needs attention"
};

const el = {
    headline: document.getElementById("status-headline"),
    pill: document.getElementById("status-pill"),
    pillText: document.getElementById("status-pill-text"),
    description: document.getElementById("status-description"),
    missionDay: document.getElementById("ctx-mission-day"),
    activity: document.getElementById("ctx-activity"),
    monitoring: document.getElementById("ctx-monitoring"),
    live: document.getElementById("live-indicator"),
    liveText: document.getElementById("live-indicator-text"),
    footerDay: document.getElementById("footer-mission-day"),
    grid: document.getElementById("metrics-grid"),
    noReadings: document.getElementById("no-readings"),
    interpretation: document.getElementById("interpretation"),
    interpretationTitle: document.getElementById("interpretation-title")
};

let hasData = false;
let notFound = false;


/* ---------- One metric card ---------- */

function part(card, role) {
    return card.querySelector(`[data-role="${role}"]`);
}

function formatNumber(value) {
    return Number.isFinite(value) ? String(Math.round(value * 10) / 10) : "—";
}

function formatBaseline(baseline, unit) {
    if (baseline === null || baseline === undefined) return "—";
    return unit === "%" ? `${formatNumber(baseline)}%` : `${formatNumber(baseline)} ${unit}`;
}

function changeText(reading) {
    let percent = reading.deviationPct;

    if (percent === null || percent === undefined) {
        if (reading.baseline === null || reading.baseline === undefined || !reading.baseline) return null;
        percent = ((reading.value - reading.baseline) / reading.baseline) * 100;
    }

    const rounded = Math.round(percent * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function setCardStatus(card, status) {
    const pill = part(card, "status");
    if (!pill) return;

    if (!status || status === "unavailable") {
        pill.hidden = true;
        return;
    }

    pill.hidden = false;
    pill.textContent = status;
    applyTone(pill, toneForStatus(status));
}

function renderUnavailable(card) {
    card.dataset.unavailable = "true";
    setText(part(card, "value"), "—");
    setText(part(card, "unit"), "");
    part(card, "tag").hidden = true;
    setText(part(card, "comparison-label"), "");
    setText(part(card, "comparison-value"), "Not measured by this system");
    part(card, "comparison-change").hidden = true;
    setCardStatus(card, null);
}

function resetCardMarkers(card) {
    delete card.dataset.unavailable;
    setText(part(card, "comparison-label"), "Baseline:");
}

function renderSingle(card, reading) {
    setText(part(card, "value"), formatNumber(reading.value));
    setText(part(card, "unit"), reading.unit || "");
    part(card, "tag").hidden = true;
    setText(part(card, "comparison-value"), formatBaseline(reading.baseline, reading.unit || ""));

    const change = part(card, "comparison-change");
    const text = changeText(reading);
    change.hidden = text === null;
    if (text !== null) change.textContent = text;

    setCardStatus(card, reading.status);
}

function renderBloodPressure(card, reading) {
    setText(part(card, "value"), `${reading.systolic}/${reading.diastolic}`);
    setText(part(card, "unit"), reading.unit || "mmHg");
    part(card, "tag").hidden = true;

    const base = reading.baseline;
    setText(
        part(card, "comparison-value"),
        base ? `${Math.round(base.systolic)}/${Math.round(base.diastolic)} mmHg` : "—"
    );
    part(card, "comparison-change").hidden = true;
    setCardStatus(card, reading.status);
}

function renderGlucose(card, reading) {
    setText(part(card, "value"), formatNumber(reading.value));
    setText(part(card, "unit"), reading.unit || "mg/dL");

    const tag = part(card, "tag");
    tag.hidden = reading.fasting !== true;
    tag.textContent = "Fasting";

    /* Glucose has no personal baseline: hide the baseline row. */
    part(card, "comparison").hidden = true;
    setCardStatus(card, reading.status);
}

function renderCard(card, reading) {
    resetCardMarkers(card);
    part(card, "comparison").hidden = false;

    if (!reading || reading.status === "unavailable") return renderUnavailable(card);

    const key = card.dataset.metric;
    if (key === "bloodPressure") renderBloodPressure(card, reading);
    else if (key === "bloodGlucose") renderGlucose(card, reading);
    else renderSingle(card, reading);
}


/* ---------- Whole page ---------- */

function renderStatus(data) {
    const status = data.status;
    const level = status.level;

    setText(el.headline, status.headline);
    setText(el.pillText, level);
    applyTone(el.pill, toneForStatus(level));
    setText(el.description, (status.reasons || []).join(" "));

    setText(el.activity, ACTIVITY_TEXT[status.activityLevel] || "—");

    setText(el.interpretationTitle, INTERPRETATION_TITLE[level] || "Status");
    const paragraphs = (status.reasons || []).map(reason => {
        const p = document.createElement("p");
        p.textContent = reason;
        return p;
    });
    const advice = document.createElement("p");
    advice.className = "interpretation-advice";
    advice.textContent = status.advice ? `What to do: ${status.advice}` : "";
    el.interpretation.replaceChildren(el.interpretationTitle, ...paragraphs, ...(status.advice ? [advice] : []));
    // Green / yellow / red follows the status level.
    el.interpretation.dataset.level = level;
    const icon = document.querySelector(".interpretation-icon");
    if (icon) icon.dataset.level = level;
    const summaryCard = el.pill ? el.pill.closest(".card") : null;
    if (summaryCard) summaryCard.dataset.level = level;
}

function renderConnection(data) {
    const connected = data.bioMonitorConnected === true;

    setText(el.monitoring, connected ? "Continuous · 5 s readings" : "Bio-Monitor not connected");
    setText(el.liveText, connected ? `Live · last reading ${new Date(data.asOf).toLocaleTimeString()}` : `Bio-Monitor not connected · last reading ${formatLocalTime(data.asOf)}`);
    el.live.classList.toggle("is-live", connected);
    applyTone(el.live, connected ? null : "neutral");
}

function renderNoReadings(data) {
    el.grid.hidden = true;
    el.noReadings.hidden = false;
    setText(el.headline, "No readings yet");
    setText(el.pillText, "No data");
    applyTone(el.pill, "neutral");
    setText(el.description, "No readings have been received for this astronaut yet.");
    setText(el.activity, "—");
    setText(el.monitoring, "Bio-Monitor not connected");
    setText(el.liveText, "No readings yet");
    setText(el.missionDay, formatMissionDay(data.missionDay));
    setText(el.footerDay, formatMissionDay(data.missionDay));
}

function render(data) {
    setText(el.missionDay, formatMissionDay(data.missionDay));
    setText(el.footerDay, formatMissionDay(data.missionDay));

    if (data.readings === null || data.status === null) {
        renderNoReadings(data);
        return;
    }

    el.grid.hidden = false;
    el.noReadings.hidden = true;

    renderStatus(data);
    renderConnection(data);

    document.querySelectorAll(".metric-card[data-metric]").forEach(card => {
        renderCard(card, data.readings[card.dataset.metric]);
    });
}


/* ---------- Live stream: sparklines under each card and the table of recent readings ---------- */

const SPARK_SERIES = {
    respiratoryRate: r => r.respiratoryRate,
    oxygenSaturation: r => r.oxygenSaturation,
    bloodPressure: r => r.systolic,
    bloodGlucose: r => r.bloodGlucose,
    heartRate: r => r.heartRate,
    skinTemperature: r => r.skinTemperature
};

/* Smallest vertical range per metric, so whole-number readings do not look like wild swings. */
const SPARK_MIN_SPAN = { respiratoryRate: 8, oxygenSaturation: 8, bloodPressure: 24, bloodGlucose: 30, heartRate: 20, skinTemperature: 1 };

function sparkline(values, minSpan) {
    const mid = (Math.min(...values) + Math.max(...values)) / 2;
    const half = Math.max((Math.max(...values) - Math.min(...values)) / 2, minSpan / 2);
    const min = mid - half;
    const span = half * 2;
    const points = values
        .map((value, index) => `${((index / (values.length - 1)) * 120).toFixed(1)},${(36 - ((value - min) / span) * 32).toFixed(1)}`)
        .join(" ");

    return `<svg viewBox="0 0 120 40" preserveAspectRatio="none" role="img" aria-label="Last 5 minutes">` +
        `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
}

function renderSparklines(readings) {
    if (readings.length < 2) return;

    document.querySelectorAll(".metric-card[data-metric]").forEach(card => {
        const pick = SPARK_SERIES[card.dataset.metric];
        const box = card.querySelector(".metric-visualization");
        if (!box) return;

        if (!pick) { box.replaceChildren(); return; }
        box.innerHTML = sparkline(readings.map(pick), SPARK_MIN_SPAN[card.dataset.metric]);
        box.classList.add("sparkline");
    });
}

function cellOf(text, className) {
    const td = document.createElement("td");
    td.textContent = text;
    if (className) td.className = className;
    return td;
}

function renderStreamTable(readings) {
    const body = document.getElementById("stream-body");
    if (!body) return;

    const rows = readings.slice(-8).reverse().map(r => {
        const row = document.createElement("tr");
        const statusCell = document.createElement("td");
        const pill = document.createElement("span");
        pill.className = "pill metric-status";
        pill.style.marginLeft = "0";
        pill.textContent = r.status;
        applyTone(pill, toneForStatus(r.status));
        statusCell.append(pill);

        row.append(
            cellOf(new Date(r.timestamp).toLocaleTimeString()),
            cellOf(`${r.heartRate} bpm`),
            cellOf(`${r.respiratoryRate} /min`),
            cellOf(`${r.oxygenSaturation}%`),
            cellOf(`${r.systolic}/${r.diastolic} mmHg`),
            cellOf(`${r.bloodGlucose} mg/dL`),
            cellOf(`${r.skinTemperature} °C`),
            cellOf(r.activityLevel),
            statusCell
        );
        return row;
    });

    body.replaceChildren(...rows);
}

async function loadStream(astronautId) {
    const data = await apiGet(`/api/stream/${encodeURIComponent(astronautId)}?limit=60`);
    renderSparklines(data.readings);
    renderStreamTable(data.readings);
}

document.getElementById("export-csv")?.addEventListener("click", () => {
    window.HackbioLive?.downloadCsv(getAstronautId());
});


/* ---------- Loading ---------- */

async function load() {
    if (notFound) return;
    const astronautId = getAstronautId();

    try {
        const data = await apiGet(`/api/overview/${encodeURIComponent(astronautId)}`);
        hasData = true;
        hideBanner("connection-banner");
        render(data);
        await loadStream(astronautId);
    } catch (error) {
        if (error instanceof ApiError && error.code === "astronaut_not_found") {
            notFound = true;
            renderNotFound(astronautId);
            return;
        }

        console.error("AstroVital overview load failed", error);

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

        if (!hasData) setText(el.headline, "Waiting for the monitoring service…");
    }
}

if (!getAstronautId()) {
    renderNotFound("(none)");
} else {
    startPolling(load, POLL_MS);
}
