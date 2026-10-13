# ALASH PRIDE visual refresh

## Scope

Visual refresh of the existing public site. The hash router, React navigation,
Supabase publication flow, editable copy keys, ranking data and admin are preserved.
Fighter profiles are deliberately excluded following the owner's clarification.

## Design decisions

- Black and red brand, original `logo.jpg`, existing self-hosted Oswald and Manrope.
- One dominant arena illustration, left-aligned display typography, two clear actions.
- Original AI-generated octagon artwork with the supplied league logo on the mat.
  Responsive WebP exports: 768px / 96 KB and 1536px / 325 KB. No runtime 3D library.
- Flat section dividers, restrained 2–4px corners, consistent public spacing.
- Large portrait frames, aligned overall/league records, readable mobile ranking rows.
- Native table semantics remain present on mobile; weight tabs wrap instead of making
  the page horizontally scrollable. Existing keyboard focus and reduced motion remain.
- Existing `presentation.css` is replaced rather than adding another stylesheet layer.

## Skills audit

Read the 11 installed `SKILL.md` files in `~/.agents/skills`: design-taste-frontend,
design-taste-frontend-v1, find-skills, frontend-design, high-end-visual-design,
image-to-code, minimalist-ui, redesign-existing-projects, vercel-react-best-practices,
web-design-guidelines and webapp-testing.

Applied design-taste-frontend (current version), frontend-design and
redesign-existing-projects: audit the existing stack first, preserve identity and
functionality, strong typography, controlled image frames, contextual density,
explicit responsive layouts. Direction: visual variance 6, motion 2, density 5.
No continuous animation is needed for this sports data interface.

Applied imagegen for the octagon asset, web-design-guidelines for semantic markup,
focus, image sizing and reduced motion, and webapp-testing's inspect/action/verify
workflow through the supported CUA browser interface. Applied
verification-before-completion and requesting-code-review for final validation.

The old taste version, minimalist palette and generic light dashboard patterns were
not selected. This is an existing-site redesign, so a whole-site image-to-code
rebuild and new framework are inappropriate. React navigation is not rewritten.

## Reference

The owner supplied https://www.aca-mma.com/ as a reference. Its public page structure
was read: primary sports navigation, prominent upcoming event/date, and event cards.
These principles reinforce the upcoming-event strip, league typography and structured
athlete information here. The upcoming event card uses the new arena artwork with a
dark readability overlay. ACA content, logos and features are not copied.
A saved browser permission prevented visual inspection of ACA.

## Validation

- `npm test`: 20 existing tests pass (publication, fighter management, rankings,
  public routes, both records and editable copy).
- `npm run build`: all three existing bundles build successfully. Unchanged
  generated bundles are kept out of the visual patch.
- Browser DOM checks: home, rankings, fighters, champions, events, tickets and about
  at 320, 375, 390, 430, 768, 1024 and 1440px. All 49 combinations have no document
  horizontal overflow and no overlapping record labels/numbers.
- Visual inspection: desktop hero and all-division rankings, mobile hero and ranking
  portraits, 320px hero, 768px hero. Live published data loaded successfully.
- Browser accessibility tree retains ranking table, rows and cells on mobile.
- Evidence is saved locally in ignored `test-results/`.
- Further browser form interactions were blocked by a saved browser permission
  preference, including after explicit user approval. Search/filter/menu logic was
  not changed; their repeated interactive verification was not completed.

## Asset provenance

The octagon was generated specifically for this site using imagegen. The second
generation used the existing `logo.jpg` as its branding reference and placed the
logo on the mat. Generated originals remain outside the repository; only optimized
WebP delivery assets are checked in. Fighter photos and statistics are the existing
owner-supplied content, not generated replacements.

### Realistic arena revision (2026-10-13)

Replaced the stylized octagon with a new built-in imagegen generation referenced
from the original `logo.jpg`. Direction: documentary sports venue photography,
eight straight fence panels, padded posts, an integrated closed gate, matte grey
canvas, original logo printed at center, empty seating and neutral overhead lights.
No smoke, lasers, red glow, wet floor or CGI gloss. This is generated artwork,
not a photograph of a documented ALASH PRIDE venue.

The 1536×1024 and 768×512 WebP files use new `octagon-realistic-*` filenames;
hero srcset, tournament background and social preview all use the same revision.
Stylesheet and app query versions are updated so cached pages load the new assets.
Existing layout, fighter content and the latest champion-card fixes are preserved.
