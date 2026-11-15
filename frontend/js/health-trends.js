"use strict";

/* =========================================
   HEALTH TRENDS PAGE
   GET /api/trends/:astronautId?period=7|30  (daily averages)
   Each key in HEALTH_DATA matches a card's data-metric attribute.
   Backend docs/FRONTEND_CONTRACT.md section 5.
========================================= */

/* Filled from the backend. null = not measured by this system. */
const HEALTH_DATA = {};

const DEFAULT_PERIOD = "7";
const REFRESH_MS = 10000; // today's average moves as new readings arrive
const PERIOD_TEXT = { 7: "Last 7 days", 30: "Last 30 days" };
const MIN_BAR_PERCENT = 5;
const LABEL_EVERY_N_DAYS = 5; // in the 30-day view

let trendsData = null;   // last response, used for captions
let currentPeriod = DEFAULT_PERIOD;
let requestCounter = 0;  // ignores out-of-date responses when the toggle is pressed quickly


/* ---------- Backend -> chart data ---------- */

function toMetric(trend, pick = day => day.value, tip = (day, unit) => `${day.value} ${unit}`) {
    if (!trend || trend.status !== "available") return null;

    return {
        min: trend.min,
        max: trend.max,
        values: trend.days.map(pick),
        labels: trend.days.map(day => (day.missionDay ? `D${day.missionDay}` : day.date.slice(5))),
        tips: trend.days.map(day => `${day.date}: ${tip(day, trend.unit)}`),
        statuses: trend.days.map(day => day.status || "")
    };
}

async function loadTrends(period) {
    const id = encodeURIComponent(getAstronautId());
    const data = await apiGet(`/api/trends/${id}?period=${period}`);
    const m = data.metrics;

    HEALTH_DATA.respiratoryRate = toMetric(m.respiratoryRate);
    HEALTH_DATA.oxygenSaturation = toMetric(m.oxygenSaturation);
    HEALTH_DATA.bloodGlucose = toMetric(m.bloodGlucose);
    HEALTH_DATA.bloodPressure = toMetric(
        m.bloodPressure,
        day => day.systolic,
        (day, unit) => `${day.systolic}/${day.diastolic} ${unit} · ${day.status}`
    );
    HEALTH_DATA.heartRate = toMetric(m.heartRate);
    HEALTH_DATA.skinTemperature = toMetric(m.skinTemperature);

    return data;
}


/* ---------- Chart building ---------- */

function createElement(className, tag = "div") {
    const element = document.createElement(tag);
    element.className = className;
    return element;
}

function barHeightPercent(value, { min, max }) {
    const percent = ((value - min) / (max - min)) * 100;
    return Math.max(MIN_BAR_PERCENT, Math.min(100, percent));
}

function dayLabel(label, index, period) {
    const showLabel = period === "7" || index % LABEL_EVERY_N_DAYS === 0;
    return showLabel ? label : "";
}

function createChartColumn(index, period, metric) {
    const bar = createElement("chart-bar");
    bar.style.setProperty("--bar-height", `${barHeightPercent(metric.values[index], metric)}%`);
    bar.title = metric.tips[index];
    if (metric.statuses[index]) bar.dataset.status = metric.statuses[index];

    const track = createElement("chart-bar-track");
    track.append(bar);

    const label = createElement("chart-label", "span");
    label.textContent = dayLabel(metric.labels[index], index, period);

    const column = createElement("chart-column");
    column.append(track, label);

    return column;
}

function showChartMessage(card, message) {
    const chart = card.querySelector(".chart-container");
    if (!chart) return;

    const note = createElement("chart-empty");
    note.textContent = message;
    chart.style.setProperty("--chart-count", 1);
    chart.replaceChildren(note);
}

function setCaption(card, text) {
    const caption = card.querySelector('[data-role="caption"]');
    if (caption) caption.textContent = text;
}

function renderMetric(card, period) {
    const chart = card.querySelector(".chart-container");
    if (!chart) return;

    const metric = HEALTH_DATA[card.dataset.metric];

    if (metric === null) {
        showChartMessage(card, "Not measured by this system");
        setCaption(card, "Not measured");
        return;
    }

    if (!metric || metric.values.length === 0) {
        showChartMessage(card, "No data for this period");
        setCaption(card, "No data");
        return;
    }

    const columns = metric.values.map((_, index) => createChartColumn(index, period, metric));
    chart.style.setProperty("--chart-count", metric.values.length);
    chart.replaceChildren(...columns);

    const asOf = trendsData?.asOf ? ` · last reading ${trendsData.asOf}` : "";
    setCaption(card, `Daily averages${asOf}`);
}


/* ---------- Ultrasound table ---------- */

function cell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
}

function formatNumber(value, digits = 2) {
    return Number.isFinite(value) ? String(Math.round(value * 10 ** digits) / 10 ** digits) : "—";
}

function renderUltrasound(scans) {
    const section = document.getElementById("ultrasound-section");
    const body = document.getElementById("ultrasound-body");
    if (!section || !body) return;

    if (!Array.isArray(scans) || scans.length === 0) {
        section.hidden = true;
        return;
    }

    const rows = scans.map(scan => {
        const row = document.createElement("tr");

        const when = scan.missionDay ? `Day ${scan.missionDay}` : `Pre-flight ${scan.timestampUtc.slice(0, 10)}`;

        const statusCell = document.createElement("td");
        const pill = createElement("pill metric-status", "span");
        pill.textContent = scan.status;
        applyTone(pill, toneForStatus(scan.status));
        pill.style.marginLeft = "0";
        statusCell.append(pill);

        row.append(
            cell(when),
            statusCell,
            cell(scan.ijvFlowGrade ?? "—"),
            cell(formatNumber(scan.ijvAreaMm2, 1)),
            cell(`${formatNumber(scan.onsdMm)} · ${formatNumber(scan.onsdBaselineMm)}`),
            cell(formatNumber(scan.cimtMm)),
            cell(formatNumber(scan.lvefPct, 1)),
            cell(formatNumber(scan.muscleLossPct, 1))
        );
        return row;
    });

    body.replaceChildren(...rows);
    section.hidden = false;
}


/* ---------- Period selector ---------- */

function showLoading() {
    document.querySelectorAll(".metric-card[data-metric]").forEach(card => {
        showChartMessage(card, "Loading…");
    });
}

async function updateDashboard(period, silent = false) {
    const ticket = ++requestCounter;
    currentPeriod = period;

    const indicator = document.getElementById("period-indicator");
    if (indicator) indicator.textContent = PERIOD_TEXT[period];

    if (!silent) showLoading();

    try {
        const data = await loadTrends(period);
        if (ticket !== requestCounter) return; // a newer request took over

        trendsData = data;
        hideBanner("connection-banner");

        document.querySelectorAll(".metric-card[data-metric]").forEach(card => {
            renderMetric(card, period);
        });
        renderUltrasound(data.ultrasound);

        const stamp = document.getElementById("trends-updated");
        if (stamp) stamp.textContent = `Live \u00b7 updated ${new Date().toLocaleTimeString()} \u00b7 refreshes every ${REFRESH_MS / 1000} s`;
    } catch (error) {
        if (ticket !== requestCounter) return;

        if (error instanceof ApiError && error.code === "astronaut_not_found") {
            renderNotFound(getAstronautId());
            return;
        }

        console.error("AstroVital trends load failed", error);

        const message = error instanceof ApiError
            ? "Service problem, please try again."
            : "Cannot reach the monitoring service. It may be waking up (this can take up to a minute). Press the period button to retry.";
        showBanner("connection-banner", message, error instanceof ApiError ? "danger" : "warning");

        document.querySelectorAll(".metric-card[data-metric]").forEach(card => {
            showChartMessage(card, "Data unavailable");
            setCaption(card, "Unavailable");
        });
    }
}

function initPeriodSelector() {
    const buttons = document.querySelectorAll(".period-button");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(other => {
                const isSelected = other === button;
                other.classList.toggle("active", isSelected);
                other.setAttribute("aria-pressed", String(isSelected));
            });

            updateDashboard(button.dataset.period);
        });
    });
}


initPeriodSelector();

if (getAstronautId()) {
    updateDashboard(DEFAULT_PERIOD);

    setInterval(() => {
        if (document.visibilityState === "visible") updateDashboard(currentPeriod, true);
    }, REFRESH_MS);
} else {
    renderNotFound("(none)");
}
