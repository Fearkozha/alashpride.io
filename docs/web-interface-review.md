# Web Interface Guidelines review — 2026-10-13

Skill: `web-design-guidelines`. Rules fetched for this review from
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.
Scope: public HTML templates, router, navigation source, copy selectors and CSS.

## Findings addressed

- `app.js:60` — fighter search, weight and country were not reflected in the URL;
  links now restore controls and results, including after reload.
- `app.js:71` — event status was transient; selected buttons and visible cards now
  restore from the URL.
- `app.js:78` — search and filter controls lacked meaningful names; added names
  and explicit autocomplete settings.
- `app.js:96` — search shortcut focused the input on mobile; automatic focus is
  restricted to desktop.
- `index.html:19` — events, tickets and about lacked a page-level h1. Corrected
  heading hierarchy and updated styles and editable-copy selectors together.
- `index.html:8` — primary display fonts lacked preload; the Latin and Cyrillic
  Oswald subsets now preload while retaining font-display swap.
- `presentation.css:3` — native dark theme was unspecified; added color-scheme.
- `presentation.css:5` — dialog scroll could chain to the page; added containment.
- `presentation.css:6` — main focus had no visible replacement; added a focus ring.
- `presentation.css:203` — mobile focus scrolling did not reserve bottom-nav space;
  added scroll padding including the device bottom safe area.

## Verification

- 23 tests pass, including filter-link restoration and all editable fields on the
  three pages whose headings changed.
- Production build succeeds; generated bundles are unchanged.
- Existing original logo, octagon artwork, photos, records and champion framing
  are preserved.

This targeted code review does not certify full WCAG conformance or replace
screen-reader testing on physical devices.
