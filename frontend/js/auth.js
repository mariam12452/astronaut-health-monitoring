"use strict";

/* =========================================
   AUTH GATE (every page except login.html)
   - asks the backend who is signed in (blocking, so nothing renders for a stranger)
   - sends the user to login.html when there is no valid session
   - makes every /api call carry the session cookie and the anti-forgery header
   - pins an astronaut account to its own record (?astronautId= is ignored for them)
   Load right after config.js.
========================================= */

(function () {
    const BASE = (window.BioCosmosX_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
    const LOGIN = "login.html";

    /* Every fetch to the API sends cookies + header; any 401 returns the user to the login page. */
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init = {}) {
        const url = typeof input === "string" ? input : input.url;
        if (!url.startsWith(`${BASE}/api/`) && !url.startsWith("/api/")) return nativeFetch(input, init);
        const headers = new Headers(init.headers || {});
        headers.set("X-Requested-With", "hackbio");
        return nativeFetch(input, { ...init, headers, credentials: "include" }).then(response => {
            const onLogin = location.pathname.endsWith(LOGIN);
            if (response.status === 401 && !onLogin && !url.includes("/api/auth/login")) goToLogin();
            return response;
        });
    };

    function goToLogin() {
        const here = location.pathname.split("/").pop() + location.search;
        location.replace(`${LOGIN}?next=${encodeURIComponent(here)}`);
    }

    window.hbSignOut = async function () {
        try { await fetch(`${BASE}/api/auth/logout`, { method: "POST" }); } catch { /* already gone */ }
        location.replace(LOGIN);
    };

    if (location.pathname.endsWith(LOGIN)) return;

    let me = null;
    try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `${BASE}/api/auth/me`, false); // synchronous on purpose: the page must not render before this answers
        xhr.withCredentials = true;
        xhr.setRequestHeader("X-Requested-With", "hackbio");
        xhr.send();
        if (xhr.status === 200) me = JSON.parse(xhr.responseText);
    } catch { /* backend not reachable */ }

    if (!me) {
        const hint = document.createElement("style");
        hint.textContent = "body{visibility:hidden}";
        document.head.appendChild(hint);
        goToLogin();
        return;
    }

    window.HB_USER = me.user;
    window.HB_ME = me;

    const own = me.user.role === "astronaut" ? me.user.astronautId : null;
    if (own) {
        const params = new URLSearchParams(location.search);
        if (params.get("astronautId") !== own) {
            params.set("astronautId", own);
            history.replaceState(null, "", `${location.pathname}?${params}`);
        }
    }
})();
