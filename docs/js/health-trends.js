"use strict";

/* Demonstration data. Replace with backend data when available.
   Each key matches a card's data-metric attribute in health-trends.html. */
const HEALTH_DATA = {
    heartRate: {
        min: 50,
        max: 90,
        values: {
            7: [68, 72, 70, 75, 73, 69, 74],
            30: [68, 70, 72, 69, 74, 71, 73, 75, 70, 68,
                 72, 74, 71, 69, 73, 76, 72, 70, 74, 71,
                 69, 73, 75, 72, 70, 74, 71, 73, 69, 72]
        }
    },

    respiratoryRate: {
        min: 8,
        max: 22,
        values: {
            7: [14, 15, 14, 16, 15, 14, 15],
            30: [14, 15, 14, 16, 15, 14, 15, 16, 14, 15,
                 13, 14, 15, 16, 14, 15, 14, 16, 15, 14,
                 15, 13, 14, 16, 15, 14, 15, 16, 14, 15]
        }
    },

    bloodPressure: {
        min: 80,
        max: 150,
        values: {
            7: [112, 115, 114, 118, 116, 113, 117],
            30: [112, 115, 114, 118, 116, 113, 117, 119, 115, 114,
                 116, 118, 113, 115, 117, 120, 116, 114, 118, 115,
                 113, 117, 119, 116, 114, 118, 115, 117, 113, 116]
        }
    },

    temperature: {
        min: 30,
        max: 38,
        values: {
            7: [33.8, 34.1, 33.9, 34.3, 34.2, 34.0, 34.1],
            30: [33.8, 34.1, 33.9, 34.3, 34.2, 34.0, 34.1,
                 34.4, 34.0, 33.9, 34.2, 34.1, 33.8, 34.0,
                 34.3, 34.2, 34.1, 34.4, 34.0, 33.9, 34.2,
                 34.1, 33.8, 34.0, 34.3, 34.2, 34.1, 34.4,
                 34.0, 34.2]
        }
    },

    oxygen: {
        min: 90,
        max: 100,
        values: {
            7: [98, 97, 98, 99, 98, 97, 98],
            30: [98, 97, 98, 99, 98, 97, 98, 99, 98, 97,
                 98, 99, 97, 98, 98, 99, 97, 98, 99, 98,
                 97, 98, 99, 98, 97, 98, 99, 98, 97, 98]
        }
    }
};

const DEFAULT_PERIOD = "7";
const PERIOD_TEXT = { 7: "Last 7 days", 30: "Last 30 days" };
const MIN_BAR_PERCENT = 5;
const LABEL_EVERY_N_DAYS = 5; // in the 30-day view


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

function dayLabel(index, period) {
    const showLabel = period === "7" || index % LABEL_EVERY_N_DAYS === 0;
    return showLabel ? `D${index + 1}` : "";
}

function createChartColumn(value, index, period, metric) {
    const bar = createElement("chart-bar");
    bar.style.setProperty("--bar-height", `${barHeightPercent(value, metric)}%`);
    bar.title = String(value);

    const track = createElement("chart-bar-track");
    track.append(bar);

    const label = createElement("chart-label", "span");
    label.textContent = dayLabel(index, period);

    const column = createElement("chart-column");
    column.append(track, label);

    return column;
}

function renderMetric(card, period) {
    const metric = HEALTH_DATA[card.dataset.metric];
    const chart = card.querySelector(".chart-container");

    if (!metric || !chart) return;

    const values = metric.values[period];
    const columns = values.map((value, index) =>
        createChartColumn(value, index, period, metric)
    );

    chart.style.setProperty("--chart-count", values.length);
    chart.replaceChildren(...columns);
}


/* ---------- Period selector ---------- */

function updateDashboard(period) {
    document.querySelectorAll(".metric-card[data-metric]").forEach(card => {
        renderMetric(card, period);
    });

    const indicator = document.getElementById("period-indicator");
    if (indicator) indicator.textContent = PERIOD_TEXT[period];
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
updateDashboard(DEFAULT_PERIOD);
