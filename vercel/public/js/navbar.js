"use strict";const NAV_LINKS=[{label:"Overview",href:"index.html"},{label:"Health Trends",href:"health-trends.html"},{label:"Astronaut Profile",href:"profile.html"},{label:"Connection",href:"connection.html"}],STATUS_LABEL="System Monitoring",MOBILE_QUERY="(max-width: 48rem)";function pageSlug(n){return n.split("/").pop().replace(/\.html$/,"")||"index"}function withAstronaut(n){const t=new URLSearchParams(location.search).get("astronautId")?.trim();return t?`${n}?astronautId=${encodeURIComponent(t)}`:n}function buildLinks(){const n=pageSlug(location.pathname);return NAV_LINKS.map(({label:t,href:e})=>{const a=pageSlug(e)===n?' aria-current="page"':"";return`<a class="site-navbar__link" href="${withAstronaut(e)}"${a}>${t}</a>`}).join("")}function userChip(){const n=window.HB_USER;if(!n)return"";const t=String(n.displayName).replace(/[<>&"]/g,"");return`<span class="site-navbar__user" title="Signed in with ${n.method==="biometric"?"fingerprint":"passcode"}">
            <span class="site-navbar__who">${t} <small>${n.loginId}</small></span>
            <button type="button" class="site-navbar__signout" id="signout-button">Sign out</button>
        </span>`}function renderNavbar(n){n.innerHTML=`
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
    `}function initMenu(n){const t=n.querySelector(".site-navbar__toggle"),e=n.querySelector(".site-navbar__links");function i(a){e.dataset.open=String(a),t.setAttribute("aria-expanded",String(a)),t.setAttribute("aria-label",a?"Close navigation menu":"Open navigation menu")}t.addEventListener("click",()=>{i(t.getAttribute("aria-expanded")!=="true")}),document.addEventListener("click",a=>{n.contains(a.target)||i(!1)}),document.addEventListener("keydown",a=>{a.key==="Escape"&&i(!1)}),window.matchMedia(MOBILE_QUERY).addEventListener("change",()=>i(!1))}const navbarHost=document.getElementById("site-navbar");navbarHost&&(renderNavbar(navbarHost),initMenu(navbarHost),document.getElementById("signout-button")?.addEventListener("click",()=>window.hbSignOut()));
