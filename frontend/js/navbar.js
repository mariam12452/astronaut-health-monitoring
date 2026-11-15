"use strict";

/* =========================================
   SHARED NAVBAR
   One place to edit the links and status text.
   Every page just contains: <header class="site-navbar" id="site-navbar"></header>
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

/* Keep ?astronautId=... when moving between pages, so the same astronaut stays selected. */
function withAstronaut(href) {
    const id = new URLSearchParams(location.search).get("astronautId")?.trim();
    return id ? `${href}?astronautId=${encodeURIComponent(id)}` : href;
}

function buildLinks() {
    const current = pageSlug(location.pathname);

    return NAV_LINKS.map(({ label, href }) => {
        const isCurrent = pageSlug(href) === current;
        const ariaCurrent = isCurrent ? ' aria-current="page"' : "";

        return `<a class="site-navbar__link" href="${withAstronaut(href)}"${ariaCurrent}>${label}</a>`;
    }).join("");
}

function userChip() {
    const user = window.HB_USER;
    if (!user) return "";
    const name = String(user.displayName).replace(/[<>&"]/g, "");
    const how = user.method === "biometric" ? "fingerprint" : "passcode";
    return `<span class="site-navbar__user" title="Signed in with ${how}">
            <span class="site-navbar__who">${name} <small>${user.loginId}</small></span>
            <button type="button" class="site-navbar__signout" id="signout-button">Sign out</button>
        </span>`;
}

function renderNavbar(host) {
    host.innerHTML = `
        <a class="site-navbar__brand" href="${withAstronaut("index.html")}" aria-label="AstroVital overview">
            <span class="site-navbar__mark" aria-hidden="true"></span>
            <span class="site-navbar__name">AstroVital</span>
        </a>

        <nav class="site-navbar__links" id="site-navbar-links" aria-label="Main navigation">
            ${buildLinks()}
        </nav>

        <span class="pill site-navbar__status">
            <span class="status-indicator"></span>${STATUS_LABEL}
        </span>
        ${userChip()}

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
    document.getElementById("signout-button")?.addEventListener("click", () => window.hbSignOut());
}
