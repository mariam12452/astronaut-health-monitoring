"use strict";

/* Settings shared by every page. Load this BEFORE the other scripts.

   apiBaseUrl is empty = same origin. Open the app through the backend (http://localhost:3000) and it just works.
   If you serve the pages from somewhere else (for example VS Code Live Server on :5500), set it to the backend
   address, e.g. "http://localhost:3000", and add the page address to CORS_ORIGINS in the backend .env. */

window.BioCosmosX_CONFIG = {
    apiBaseUrl: "",
    defaultAstronautId: "A01"
};
window.HACKBIO_CONFIG = window.BioCosmosX_CONFIG;
