# SF Pride 2026 · Civic Center Road Closures 🏳️‍🌈

An interactive, time-aware map of the San Francisco Pride weekend (June 26–29, 2026)
street closures around Civic Center.

**Live site:** _(GitHub Pages — see repo settings → Pages)_

## Features
- **Interactive map** (Leaflet + CARTO basemap, no API key required) tracing the real
  street grid — segment geometry computed from OpenStreetMap intersection data.
- **Timeline slider** scrubs from Friday 12:00 AM through Monday 8:00 AM; each street
  segment shows as *upcoming → closed → reopened* in real time.
- **Quick-jump chips** for key moments: **Now**, Fri 12:01 AM, Fri 8 PM, Saturday,
  Parade (Sun), and Reopen (Mon 6 AM).
- **Play** button animates the closures across the whole weekend.
- **Pride design system** — the 6-stripe flag palette drives a token-based theme;
  responsive and accessible on mobile and desktop, with light/dark support.

## Data & accuracy
Closure list summarized from a KQED report on SFMTA closures. All listed streets reopen
**Monday, June 29 at 6:00 AM**. Two segments (Fulton & Grove) were listed under Friday
without a specific start time and are flagged in the UI. **Always confirm with
[SFMTA](https://www.sfmta.com/) before traveling.**

## Develop locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files
- `index.html` — page shell
- `styles.css` — design tokens + components
- `data.js` — closure data + computed coordinates
- `app.js` — map, timeline, and interaction logic
