"use strict";

/* =========================================
   SHARED NAVBAR
========================================= */

const NAV_LINKS = [
    { label: "Overview", href: "index.html" },
    { label: "Health Trends", href: "health-trends.html" },
    { label: "Astronaut Profile", href: "profile.html" },
    { label: "Connection", href: "connection.html" }
];

const STATUS_LABEL = "System Monitoring";
const MOBILE_QUERY = "(max-width: 48rem)";


/* "/folder/profile.html" -> "profile", "/" -> "index" */
function pageSlug(path) {
    return path.split("/").pop().replace(/\.html$/, "") || "index";
}

function buildLinks() {
    const current = pageSlug(location.pathname);

    return NAV_LINKS.map(({ label, href }) => {
        const isCurrent = pageSlug(href) === current;
        const ariaCurrent = isCurrent ? ' aria-current="page"' : "";

        return `<a class="site-navbar__link" href="${href}"${ariaCurrent}>${label}</a>`;
    }).join("");
}

function renderNavbar(host) {
    host.innerHTML = `
        <a class="site-navbar__brand" href="index.html" aria-label="BioCosmosX overview">
            <span class="site-navbar__mark" aria-hidden="true"></span>
            <span class="site-navbar__name">BioCosmosX</span>
        </a>

        <nav class="site-navbar__links" id="site-navbar-links" aria-label="Main navigation">
            ${buildLinks()}
        </nav>

        <span class="pill site-navbar__status">
            <span class="status-indicator"></span>${STATUS_LABEL}
        </span>

        <button class="site-navbar__toggle" type="button"
                aria-label="Open navigation menu"
                aria-expanded="false"
                aria-controls="site-navbar-links">
            <span class="site-navbar__icon"></span>
        </button>
    `;
}


/* Mobile menu: open/close with the button, Escape, or a click outside. */
function initMenu(host) {
    const toggle = host.querySelector(".site-navbar__toggle");
    const links = host.querySelector(".site-navbar__links");

    function setOpen(isOpen) {
        links.dataset.open = String(isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    }

    toggle.addEventListener("click", () => {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("click", event => {
        if (!host.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setOpen(false);
    });

    window.matchMedia(MOBILE_QUERY).addEventListener("change", () => setOpen(false));
}


const navbarHost = document.getElementById("site-navbar");

if (navbarHost) {
    renderNavbar(navbarHost);
    initMenu(navbarHost);
}
