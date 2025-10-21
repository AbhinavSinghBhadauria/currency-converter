# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Static, client-side web app to convert between currencies and render a 30‑day trend chart.
- No build system, package manager, linter, or test framework configured.
- Key files: index.html, app.js, styles.css.

Commands
- Run locally (open file directly)
  ```bash path=null start=null
  # Opens in default browser
  start index.html
  ```
- Serve locally (recommended for consistent browser behavior)
  ```bash path=null start=null
  # Requires Python 3
  python -m http.server 5173
  # then open http://localhost:5173/index.html
  ```

Architecture and code structure
- index.html
  - Minimal UI: amount input, from/to currency selects, submit button, result area, and a canvas for the chart.
  - Loads Chart.js from CDN and app.js (deferred). No module system.
- app.js
  - API_BASE: https://api.exchangerate.host
  - DOM cache (els) and a single Chart.js instance managed via trendChart.
  - fetchJSON(url): small wrapper around fetch with basic error handling.
  - loadSymbols(): fetches /symbols; on failure falls back to a small common set (USD, EUR, GBP, JPY, INR, AUD, CAD, CHF, CNY).
  - populateSelect(selectEl, symbols): fills selects with "CODE — Name" options.
  - convertAndRender():
    - Reads amount/from/to; fetches latest rate via /latest?base=...&symbols=...
    - Fallback: a tiny hardcoded map if network/API fails.
    - Updates result text; then calls renderTrend(from, to).
  - renderTrend(from, to):
    - Builds a 30‑day window; fetches /timeseries for labels and series.
    - Fallback: generates a flat line if network/API fails.
    - Creates a responsive line chart with subtle grid and no legend using Chart.js.
  - init IIFE:
    - Loads symbols, populates selects, sets defaults (USD→EUR), wires event listeners, triggers initial conversion.
- styles.css
  - Dark UI with a simple grid layout for form rows; responsive adjustment on narrow viewports.

External dependencies
- Charting: Chart.js via CDN (no local bundling). Requires network access.
- Data: exchangerate.host endpoints used: /symbols, /latest, /timeseries. Code includes graceful fallbacks for offline/failed requests.

Notes for future automation
- There is no node/npm toolchain; any linting/testing would need to be introduced explicitly if desired.
