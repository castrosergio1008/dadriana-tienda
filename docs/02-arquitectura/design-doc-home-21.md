# Design Doc: DD-HOME-21 — White header/footer chrome experiment (client-authorized, reversible)

- **ID:** DD-HOME-21
- **Autor:** `forge-architect` (APEX FORGE)
- **Estado:** **Approved by `forge-architect` (design gate)**, 26-nov-2026. Design frozen for construction. This document is an **additive experiment** over DD-HOME-01…20 and C-HOME-02; it does **not** derogate the approved design system without UAT (§4.6).
- **Fecha:** 26-nov-2026
- **Decisor final:** `apex-forge` (Comandante)
- **Relación:** extends `design-doc-home.md` (DD-HOME-01…19), `design-doc-home-20.md` and decision `C-HOME-02`. Touches only `SiteHeader`, `SiteFooter`, `WhatsAppCta` (header variant) and their E2E guards. No change to tokens, `globals.css`, assets, data, auth, CSP, A2/F5 or `noindex`.

## 0. Resumen ejecutivo (cliente)

Prueba autorizada: **header y footer en blanco puro (`#FFFFFF`)**, con el verde `#1B5D4A` reservado a **botones y bordes** y el dorado aprobado (`#C6A050` / `#B38F44`) como acento decorativo, nunca como texto normal sobre claro. El logo nuevo de 96×96 (`C-HOME-02`) se ve sobre blanco sin necesidad de recortarlo, recolorarlo ni crear una variante blanca: su verde principal sube de ≈1,1:1/1,6:1 sobre las superficies oscuras actuales a **7,98:1** sobre blanco. El favicon no cambia. El menú móvil y todos los controles usan el anillo de foco **tinta** (`#123F33`), con contraste real ≥10:1 medido por HOME-E2E-19. Es un experimento **reversible en menos de 2 minutos**: no hay base de datos, ni JS nuevo, ni dependencias, ni despliegue autorizado por este documento.

## 1. Contexto y problema

### 1.1 Pedido del cliente (26-nov-2026)

> «Vamos a probar con el Header y el footer blanco, usa solo el #1B5D4A para los botones y bordes, manten el uso del dorado... así el logo será visible.»

This is explicitly a **trial driven by the client**, not a correction of a defect in the approved identity. The word "probar" (try) governs the design: minimal blast radius, no asset regeneration, easy reversal, measurable acceptance.

### 1.2 Verified current state (not assumed)

- `C-HOME-02` already replaced the logo in `SiteHeader` (48×48 rendered), `SiteFooter` and `app/icon.png`, removing the cream circular plate. `public/brand/logo.png` is 96×96 RGBA (14,987 B) and `app/icon.png` is 64×64 RGBA (7,889 B); `logo_dadriana.png` remains untouched at the repository root.
- Frontend measurement after `C-HOME-02`: logo green has ≈**1,10:1** against the header `#1B5D4A` and ≈**1,55:1** against the footer `#123F33`. Recomputed from the optimized logo's dominant `#075D37`: 1,03:1 vs primary and 1,47:1 vs ink. The client's diagnosis is confirmed.
- `SiteHeader`: `<header data-surface="dark" className="bg-primary text-white">`; desktop nav is `text-white hover:text-accent-soft`; the mobile `<summary>` is `border-white`; the mobile menu list is `data-surface="light" bg-surface text-ink` with `text-primary` links; the search form is `data-surface="light" bg-surface` with a `bg-surface text-ink` submit button.
- `SiteFooter`: `<footer data-surface="dark" className="bg-ink text-white">`; tagline and the "Redes"/"Legales" H3s use `text-accent-soft`; links are `text-white hover:text-accent-soft`.
- `WhatsAppCta` `header` variant: translucent-looking outline — `border-white text-white hover:bg-white hover:text-ink`. `section` variant stays `bg-primary text-white hover:bg-primary-hover` and is **not** in scope.
- `app/globals.css` `@theme` tokens: primary `#1B5D4A`, primary-hover `#22755C`, ink `#123F33`, accent `#C6A050`, accent-soft `#E6CC87`, accent-dark `#B38F44`, surface `#F7F5EE`, surface-alt `#EEF4F1`, white `#FFFFFF`. Global `:focus-visible` is a 2 px ink ring with 2 px offset; `[data-surface='dark'] :focus-visible` overrides it to champagne; `[data-surface='dark'] [data-surface='light'] :focus-visible` restores ink for nested cream controls.
- Existing guards in force: HOME-E2E-01/02/03(axe AA)/04/05/06/07/08/09/10/11/13/17/18/19/20…26 and the dynamic E2E suite.

### 1.3 Problem being solved

The approved identity places the logo on a green header and an ink footer. Once the cream plate was removed in `C-HOME-02`, the logo effectively disappeared into both surfaces. Re-adding the plate would undo `C-HOME-02`; recolouring the asset would violate the "do not edit the client original" rule; keeping the dark chrome and accepting low contrast fails the client's stated goal. We need a surface change that restores logo legibility, keeps the approved gold accent, preserves WCAG 2.2 AA focus/contrast, and can be undone immediately if UAT rejects it.

### 1.4 Goals (measurable)

| ID | Goal | Verification |
|---|---|---|
| G1 | Header and footer paint `rgb(255, 255, 255)` at 375/768/1440 | HOME-E2E-27 |
| G2 | Logo dominant green reaches ≥7:1 on both surfaces; no new logo asset or favicon change | Ratio table §4.1; HOME-E2E-26 unchanged |
| G3 | Primary `#1B5D4A` used only for buttons and borders in these two regions; gold survives as decoration with **zero** `#C6A050` normal text on light | HOME-E2E-13 (extended) + HOME-E2E-27/28 |
| G4 | All focus rings use ink and measure ≥3:1 against the **adjacent** colour at 375/768/1440 | HOME-E2E-19 unchanged |
| G5 | axe 2.2 AA stays at 0 critical/serious; no new text/copy, no `noindex`/CSP/A2/F5 drift | HOME-E2E-03/13/17/18 + header guard |
| G6 | Δ JS = 0; Home ≤150 KB gzip and total ≤300 KB gzip | `npm run check:bundle` |
| G7 | Full revert in <2 min, no DB/env/asset migration | Rollback drill §8.2 |

## 2. No-objetivos

| ID | Explicitly out of scope | Reason |
|---|---|---|
| N-21-01 | Editing `public/brand/logo.png`, `app/icon.png`, `logo_dadriana.png`, `logo.png` or `public/brand/og-image.png` | `C-HOME-02` froze the derivatives; the client's goal is achieved by changing the surface |
| N-21-02 | Creating a white/monochrome logo variant | §4.5: original colour logo already reaches 7,98:1 on white |
| N-21-03 | Changing tokens in `app/globals.css` or introducing new HEX values in components | DD-HOME-08: all colours come from `@theme` |
| N-21-04 | Reintroducing historical tokens `#1E644C`, `#154E3B`, `#B8895A`, `#FDFBF9`, pinks | DD-HOME-01 O2; the "gold" in the request means the approved `#C6A050` family |
| N-21-05 | Making the rest of the Home white (hero, cards, sections, body) | Only header/footer chrome was requested; body stays `bg-surface #F7F5EE` |
| N-21-06 | New copy, new links, new nav items, legal links, prices, claims or percentages | HOME-E2E-17/18; experiment is purely visual |
| N-21-07 | New JS, `useState`, animation library, `transition` beyond the existing `transition-colors`, new dependency, new env var or endpoint | Δ JS = 0; CSP unchanged; reduced motion already global |
| N-21-08 | Changing A2 (`noindex` + Deployment Protection), F5 release gate, C-HOME-01 CSP mode, OG image, routing or data flow | Hard process constraints; no sentinel-blocker introduced |
| N-21-09 | Amending `design-doc-home.md` §6.1/§6.3 or `docs/03-disenos/sistema-diseno.md` now | §4.6: this is a trial; derogation requires UAT and a new DD/ADR |
| N-21-10 | Commit, push, canary or deploy | Not authorised by this document |

## 3. Requerimientos y restricciones

### 3.1 Functional

- F-1: `<header>` and `<footer>` paint `bg-white` and carry `data-surface="light"`.
- F-2: Only `#1B5D4A` (`primary`, hover `primary-hover`) is used for button fills and CSS borders inside these regions. Gold is used only as decoration (lines, text-decoration underlines); `#E6CC87` never appears as text on the new light chrome.
- F-3: Desktop nav, mobile summary, mobile menu links, footer links, tagline and footer headings use `ink`; no normal text uses `accent` on white/cream.
- F-4: `WhatsAppCta` `header` variant becomes a solid primary button with a primary border, white label and `primary-hover` hover; the `section` variant and the `href`/`target`/`rel`/`sr-only` contract are untouched.
- F-5: Logo, alt texts, link destinations, landmarks, heading levels and native `<details>` behaviour remain byte-for-byte in behaviour.

### 3.2 Non-functional

- **A11y:** WCAG 2.2 AA. Focus ring 2 px ink / offset 2 px on every control in the affected regions; contrast of the ring vs the actually painted adjacent surface ≥3:1 (SC 1.4.11). `#B38F44` (3,03:1 on white) is allowed **only** for non-body-text decoration such as underlines/labels of ≥18,66 px bold or ≥24 px; `#C6A050` (2,46:1 on white, 2,25:1 on cream) is decorative-only. Hover must keep a non-colour cue (underline), so SC 1.4.1 is not violated.
- **Focus cascade:** champagne remains reserved for genuinely dark surfaces; no dark surface remains in header/footer after the flip. `globals.css` is not modified.
- **Motion:** no new animation/transition; the existing `transition-colors duration-200` on CTAs stays and is already neutralised by `prefers-reduced-motion: reduce` (HOME-E2E-23 pattern).
- **Performance:** server components only; no props/state change; Δ JS = 0; Home ≤150,000 B gzip and total ≤300,000 B gzip (last baseline 108,466 / 256,654 B).
- **Privacy/security:** no data flow, PII, auth, privilege or secret is introduced; `forge-sentinel` retains veto on C-HOME-01 drift but is not a required gate for this visual-only change.
- **Stack:** Next.js 15 (App Router, RSC) / React 19 / TypeScript strict / Tailwind v4 tokens / Playwright + Vitest, all already pinned. No major-version evaluation is triggered: no technology is added or upgraded.

## 4. Solución propuesta

### 4.1 Decision DD-HOME-21.1 — pure white, not `bg-surface`

| Candidate | Measured ratios (computed from approved HEX) | Decision |
|---|---|---|
| **`bg-white` `#FFFFFF`** | logo green `#075D37` **7,98:1**; ink **11,77:1**; primary **7,75:1**; accent-dark **3,03:1**; accent **2,46:1** | **CHOSEN** |
| `bg-surface` `#F7F5EE` (cream) | logo green 7,32:1; ink 10,79:1; primary 7,10:1; **accent-dark 2,78:1 (fails 3:1)**; accent 2,25:1 | Rejected (§5, Alternative B) |

Why pure white wins:

1. The client said "blanco", literally `white`, not "crema". Honouring the literal request matters for a UAT experiment: the change must be visually obvious against the cream body.
2. It maximises the logo's contrast (7,98:1 vs 7,32:1) and gives the largest margin for the ink focus ring (11,77:1).
3. It is the **only** option where `accent-dark` clears 3:1 (3,03:1). On cream it drops to 2,78:1 and could no longer be used as a decorative underline/label indicator. This is the decisive technical constraint.
4. Coherence with the body is preserved by contrast, not by matching: the page remains `#F7F5EE` (DD-HOME-01 60/30/10), while white chrome reads as a deliberate "frame" separated from content by a 2 px primary border. The cream remains inside the search form and the mobile menu, so the palette transition is not abrupt.

Margins are tight for `accent-dark` (3,03:1). Implementation must use the token, never a hand-tuned darker hex: a future token change needs a fresh contrast check (HOME-E2E-27 asserts the computed colour and HOME-E2E-19/13 assert behaviour).

### 4.2 Decision DD-HOME-21.2 — complete colour map

**Header** (`<header data-surface="light" className="border-b-2 border-primary bg-white text-ink">`):

| Element | Current | New | Ratio / rule |
|---|---|---|---|
| Header surface | `bg-primary text-white` | `bg-white text-ink` + `border-b-2 border-primary` | ink 11,77:1; border is primary-only |
| Brand link / wordmark | transparent + inherited white | transparent + inherited ink | logo PNG unchanged; no `bg-surface`, no `rounded-full` (HOME-E2E-26) |
| Desktop nav link (`<a>`) | `text-white hover:text-accent-soft` | `text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark` | ink 11,77:1; underline is decoration, not a CSS border; accent-dark 3,03:1 |
| Mobile `<summary>` | `border-white text-white` | `border border-primary text-ink` | green border only; focus ring becomes ink (§4.3) |
| Mobile menu list | `data-surface="light" bg-surface text-ink` | **unchanged** | cream is an in-chrome control surface; protected by nested-rule note below |
| Mobile menu link | `text-primary hover:bg-surface-alt` | `text-ink hover:bg-surface-alt hover:underline hover:decoration-2 hover:decoration-accent-dark` | keeps green out of normal text; hover has a non-colour cue |
| Search form / input | `bg-surface`, no visible border | `bg-surface border border-primary` on the form; input unchanged | primary border delineates cream control on white; input ink 10,79:1 on cream |
| Search submit button | `bg-surface text-ink hover:bg-white` | `bg-primary text-white hover:bg-primary-hover` | white on primary 7,75:1; on hover 5,57:1 |
| `data-surface` on form/input/button | `light` | **unchanged** | documents control intent even though the parent is now light too |

**Footer** (`<footer data-surface="light" className="border-t-2 border-primary bg-white text-ink">`):

| Element | Current | New | Ratio / rule |
|---|---|---|---|
| Footer surface | `bg-ink text-white` | `bg-white text-ink` + `border-t-2 border-primary` | ink 11,77:1; green border only |
| Logo | `logo.png` 48×48, alt `D'Adriana Tienda` | **unchanged** | see §4.5 |
| Tagline `Belleza para tu piel y tu cabello` | `text-accent-soft` (fails on white) | `text-ink border-t-2 border-accent pt-4` (border on the `<p>` itself, no new node) | text 11,77:1; gold survives as a 2 px decorative line (2,46:1, non-essential) |
| H2 `Catálogo` / `Tienda y contacto` | inherited white | inherited ink (or explicit `text-ink`) | 11,77:1; headings are not green |
| H3 `Redes` / `Legales` | `text-accent-soft text-sm font-semibold` | `text-ink text-sm font-semibold underline decoration-2 underline-offset-4 decoration-accent-dark` | 14 px bold is **not** large text, so the gold token is a decoration, never the text colour; no new "Legales" link (HOME-E2E-18) |
| Footer links (catalog, stores, Buscar, socials, legales) | `text-white hover:text-accent-soft` | `text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark` | 11,77:1; `target`/`rel`/`sr-only` suffix unchanged |
| Structured data / copy | — | **unchanged** | no invented legal/price/claim text |

**Gold usage ledger (explicit, so review is mechanical):**

- `accent` `#C6A050` (2,46:1 white, 2,25:1 cream): **decorative only** — footer tagline top line. Never `text-*`.
- `accent-dark` `#B38F44` (3,03:1 white; 2,78:1 cream): text-decoration on nav/menu/footer link hover and on the two footer H3s. Never normal 14–18 px body text on white/cream.
- `accent-soft` `#E6CC87` (1,57:1 white): **retired from header/footer text**. It stays the focus token on dark surfaces elsewhere (none in this experiment) and in `::selection` (unchanged).
- `primary` `#1B5D4A`: button fills (`WhatsAppCta` header, search submit) and all CSS borders in the two regions (header bottom, footer top, summary, search form, WhatsApp CTA). `primary-hover` `#22755C` only on those buttons' hover.

### 4.3 Decision DD-HOME-21.3 — `data-surface` flips to `light`; focus cascade

```mermaid
flowchart TD
  A[header data-surface=light] --> B[global :focus-visible = 2px ink / offset 2px]
  C[footer data-surface=light] --> B
  B --> D[no [data-surface=dark] ancestor in chrome]
  D --> E[champagne override does NOT apply]
  E --> F[HOME-E2E-19: ink vs white 11.77:1 / vs cream 10.79:1 >= 3:1]
  G[nested data-surface=light controls stay light] --> B
```

- `data-surface="dark"` → `data-surface="light"` on `<header>` and `<footer>`. This is the single source of truth for the focus token; no `globals.css` edit and no per-element `outline-*` override are needed.
- The nested rule `[data-surface='dark'] [data-surface='light'] :focus-visible` in `globals.css` simply stops matching inside the chrome. It is **kept untouched**: deleting it would weaken the guard for any future dark container. The nested `data-surface="light"` attributes on the form, input, submit button and mobile menu list are also kept — they are harmless under a light parent and preserve intent.
- **HOME-E2E-13 amendment (guard strengthened, not weakened):** the existing test asserts the mobile `<summary>` outline is champagne `rgb(230, 204, 135)` because it sat on a dark surface. It now asserts `rgb(18, 63, 51)` (ink) and, in the same test, asserts that **no** focusable element inside `header`/`footer` paints champagne. The `goldOnLight` scan (no `#C6A050` text on light backgrounds) and the ink assertions for the searchbox and mobile menu link remain byte-for-byte. The test ID, name and `@smoke` tag stay so the CI gate cannot silently disappear.
- **HOME-E2E-19 stays unchanged and still passes:** its samples are (a) `Menú summary` on white → ink 11,77:1; (b) desktop nav link at 768/1440 on white → ink 11,77:1; (c) search input → adjacent cream 10,79:1; (d) `Buscar` button → adjacent cream 10,79:1 even though the button itself is primary (the 2 px offset lands on the form); (e) mobile menu link → adjacent cream 10,79:1. The test measures real adjacent pixels, so no new assertion is required.

### 4.4 Decision DD-HOME-21.4 — `WhatsAppCta` header variant

Only the `variant === 'header'` class string changes:

```
inline-flex items-center rounded-pill border border-primary bg-primary px-4 py-2
text-sm font-semibold text-white transition-colors duration-200
hover:border-primary-hover hover:bg-primary-hover
```

- Solid primary fill with white label (7,75:1) and a primary border; hover to `primary-hover` (5,57:1). No `accent`/`accent-soft` text, no `hover:bg-white hover:text-ink` inversion on light.
- `section` variant class string is **not touched**: it already satisfies the same "green button, white text" rule.
- Render contract unchanged: `if (!href) return null`, same `href`, `target="_blank"`, `rel="noopener noreferrer"`, same `label` default and same `sr-only` suffix. HOME-E2E-09 and HOME-E2E-10 remain green.

### 4.5 Decision DD-HOME-21.5 — logo and favicon stay as they are

- `public/brand/logo.png` (96×96, green `#075D37` + gold `#CDAB4A`/`#E2CF98`) is kept **as-is**; on white its dominant green reaches **7,98:1** and its gold remains decorative at 2,21:1. No white variant is needed because the surface, not the asset, was the problem.
- `app/icon.png` (64×64) and `public/brand/og-image.png` are untouched; HOME-E2E-26 (logo source, alt text, no cream plate, no horizontal overflow at 375) passes unchanged. Note: one test title still says "sits directly on the green surface", but its assertions only check that the parent has no `bg-surface` and no `rounded-full`; the title is legacy wording and is deliberately **not** renamed in this experiment.
- `logo_dadriana.png` at the root remains the untouched client original; unit test `brand-logo.test.ts` continues to verify dimensions and hashes.

### 4.6 Decision DD-HOME-21.6 — identity conflict is acknowledged, not resolved

`docs/03-disenos/sistema-diseno.md` (line 67 and line 403) and `design-doc-home.md` §6.1 define deep green as the approved primary for the header, with champagne focus on green surfaces. `C-HOME-02` only changed the logo. This DD knowingly suspends that pairing **for one client-approved trial**:

- It is **authorised by the client's 26-nov-2026 request**, scoped to header/footer only, and reversible in <2 min.
- It does **not** amend the base DD, the design-system document, or `C-HOME-02`, and it is **not** a release approval.
- If UAT accepts the experiment, a **new DD/ADR** must update `design-doc-home.md` §6.1/§6.3, `sistema-diseno.md` and the focus-pair documentation, with `forge-reviewer`/`forge-sentinel` and the Comandante signing off. If UAT rejects it, §8.2 restores the approved identity exactly.

### 4.7 Why this solution wins

| Criterion | This design | Re-add cream plate / recolour logo |
|---|---|---|
| Correctness | Restores 7,98:1 logo contrast and keeps all AA focus/contrast guards measurable | Undoes `C-HOME-02` or mutates the client original; contrast still mediocre (7,32:1 on cream) |
| Maintainability | Four tiny class-string/attribute changes, no CSS or token edit | New asset variant + doc/hash/unit-test churn |
| Performance | Δ JS = 0, no new node except a border on an existing `<p>` | New image requests and cache busting |
| Delivery speed | One small commit set, <2 min rollback | Asset pipeline + UAT on two variants |
| A11y | Ink focus everywhere, measurable by the existing HOME-E2E-19 | Champagne/ink pairing becomes ambiguous again |

## 5. Alternativas evaluadas

### Alternativa A — Pure white chrome, primary buttons/borders, gold decoration (**GANADORA**)

- **Pros:** literal compliance with "blanco"; best logo contrast (7,98:1); only option where accent-dark clears 3:1; no asset or token change; reversible in <2 min.
- **Contras:** `accent-dark` margin is thin (3,03:1) and must never drift to cream; white chrome differs from the approved design-system header (mitigated by §4.6).
- **Motivo de elección:** satisfies G1–G7 simultaneously with the smallest possible surface.

### Alternativa B — `bg-surface` cream instead of white (RECHAZADA)

- **Pros:** smoother transition to the cream body; keeps the 60 % light palette visually continuous.
- **Contras:** contradicts the client's word "blanco" and makes the experiment less obvious in UAT; logo drops to 7,32:1; **accent-dark falls to 2,78:1**, breaking the 3:1 non-text threshold for underlines/labels; ink focus margin drops to 10,79:1.
- **Motivo de rechazo:** a colour that fails a measurable a11y threshold cannot be the base of this design; see §4.1.

### Alternativa C — Keep green/ink chrome and re-add a cream plate behind the logo (RECHAZADA)

- **Pros:** smallest visual change to the approved identity; was the pre-`C-HOME-02` behaviour.
- **Contras:** explicitly removed by `C-HOME-02` because the client wanted the new logo presented directly; only fixes the logo, not the stated desire for a white header/footer; leaves champagne focus on dark surfaces and the button/border request unresolved.
- **Motivo de rechazo:** undoes an approved client decision and does not implement the request.

### Alternativa D — Generate a white/monochrome logo variant (RECHAZADA)

- **Pros:** could keep the dark chrome while making the mark visible.
- **Contras:** mutates or adds a brand asset, needs hash/unit-test updates, loses the green+gold identity the client just approved, changes the favicon question, and adds cache risk; the client explicitly asked for white backgrounds, not a new logo.
- **Motivo de rechazo:** violates N-21-01/N-21-02 and is not reversible by a class-only revert.

### Alternativa E — White header only, dark ink footer (RECHAZADA)

- **Pros:** half the diff.
- **Contras:** footer logo remains at ≈1,55:1; contradicts "Header **y** footer blanco" and would leave mixed focus-token rules in one page (`dark` footer vs `light` header), complicating HOME-E2E-13/19.
- **Motivo de rechazo:** fails G1/G2.

## 6. Riesgos y mitigaciones

| ID | Riesgo | Mitigación | Owner |
|---|---|---|---|
| R-21-01 | Gold text survives accidentally on white (`text-accent-soft` in footer tagline/H3s, `hover:text-accent-soft` in links) | Explicit replacement map §4.2; HOME-E2E-13 `goldOnLight` scan kept; HOME-E2E-27 checks header/footer computed colours | `forge-frontend` + `forge-qualis` |
| R-21-02 | Focus ring reverts to champagne because `data-surface="dark"` remains somewhere in the chrome | Flip both roots to `light`; HOME-E2E-13 new ink assertion + "no champagne in chrome" scan; HOME-E2E-19 real-adjacent measurement | `forge-frontend` + `forge-qualis` |
| R-21-03 | Removing the nested `[data-surface='dark'] [data-surface='light']` rule to "simplify" CSS weakens future guards | `globals.css` is out of scope; rule and nested attributes stay; reviewer checks the CSS diff is empty | `forge-reviewer` |
| R-21-04 | `accent-dark` (3,03:1) used as 14 px body text or on cream (2,78:1) | Ledger §4.2; tokens only; decoration uses `text-decoration-color`, not `color`; HOME-E2E-27 asserts no `rgb(179,143,68)` *text* colour on chrome | `forge-frontend` + `forge-reviewer` |
| R-21-05 | Green leaks into ordinary nav/menu text, violating "verde solo en botones y bordes" | `text-ink` on all links; mobile menu link changed from `text-primary`; new HOME-E2E-27 checks nav/menu computed colour | `forge-frontend` |
| R-21-06 | Search button ink focus outline lands on primary instead of cream | Keep the 2 px offset and the cream form background; HOME-E2E-19 samples the real adjacent element at 375/768/1440 | `forge-qualis` |
| R-21-07 | Hover state uses colour alone | Add `underline` to every link hover; accent-dark underline is a shape cue, not only a hue change | `forge-frontend` |
| R-21-08 | Accidental copy/link churn while editing footer | No text node or `href` changes; HOME-E2E-17/18 and dynamic HOME-E2E-10 stay green | `forge-reviewer` |
| R-21-09 | Client reads experiment as permanent identity change | §4.6 plus Comandante UAT note; no docs amended, no deploy authorised | `apex-forge` |
| R-21-10 | Bundle/JS regression from an accidental client component | Only class strings/attributes change; `npm run check:bundle` is a required gate; Δ JS target 0 | `forge-infra` + `forge-qualis` |
| R-21-11 | WhatsApp CTA appearance only checked where no number is configured | HOME-E2E-28 runs in the dynamic suite with `BASE_CONFIG.whatsapp_number` | `forge-qualis` |

## 7. Estrategia de testing

### 7.1 Unit / integration

- No new unit test is required: no data, parser, type or asset changes. Existing `tests/unit/brand-logo.test.ts` must stay green and is the guard that no logo/favicon derivative was regenerated.
- Optional (non-blocking) integration assertion: `SiteHeader`/`SiteFooter` render with `data-surface="light"`; not required for the gate because HOME-E2E-27 covers computed DOM.

### 7.2 E2E — tests to change

**HOME-E2E-13 (`tests/e2e/home.spec.ts`, lines 279–333) — amend, do not delete:**

1. Keep the test ID, title, `@smoke` tag, Tab sequence and the searchbox/menu-link ink assertions unchanged.
2. Replace the mobile `<summary>` expectation `rgb(230, 204, 135)` with `rgb(18, 63, 51)`.
3. Add inside the same test: iterate focusable elements in `header, footer` (summary, nav links, search input, search button, WhatsApp CTA when present, menu links, footer links), focus each after a Tab to set keyboard modality, and assert `outlineColor === 'rgb(18, 63, 51)'` and `outlineWidth === '2px'`; assert none has `rgb(230, 204, 135)`.
4. Keep the `goldOnLight` scan exactly as-is (it now also covers the new white surfaces).

**HOME-E2E-19 (`tests/e2e/home.spec.ts`, lines 416–455):** no change. It remains the independent proof that the new ink ring clears 3:1 against the real adjacent pixel at 375/768/1440.

### 7.3 E2E — new IDs (additive)

| ID | File | Assertion |
|---|---|---|
| **HOME-E2E-27** | `tests/e2e/home.spec.ts`, `@smoke`, 375/768/1440 | `header` and `footer` have `data-surface="light"` and computed `backgroundColor === 'rgb(255, 255, 255)'`; computed `borderBottomColor`/`borderTopColor` (2 px) are `rgb(27, 93, 74)`; desktop/mobile nav and footer links compute `color === 'rgb(18, 63, 51)'`; no element owning text in `header, footer` computes `color` equal to `rgb(198, 160, 80)` or `rgb(230, 204, 135)`; at least one decorative line computes `rgb(198, 160, 80)` (footer tagline border) and at least one underline/label uses `rgb(179, 143, 68)`; search submit computes `backgroundColor === 'rgb(27, 93, 74)'` with white text; page has no horizontal overflow at 375. |
| **HOME-E2E-28** | `tests/dynamic-e2e/home-dynamic.spec.ts`, with `BASE_CONFIG` seeded | Header WhatsApp CTA exists once with the approved `href`/`target`/`rel`; computed `backgroundColor` and `borderColor` are `rgb(27, 93, 74)`, `color` is `rgb(255, 255, 255)`; after hover `backgroundColor` becomes `rgb(34, 117, 92)`; no gold text appears in the CTA; `expectNoInjectedPii` stays unchanged. The section CTA (`section` variant) must remain `bg-primary text-white` — assert it is unchanged by this experiment. |

### 7.4 Existing tests expected to stay green **unchanged**

| Existing ID | Expected impact |
|---|---|
| HOME-E2E-01 / 02 / 04 / 05 | None: DOM order, landmarks, one H1, native `<details>` and GET search are untouched |
| HOME-E2E-03 (`axe` 2.2 AA at 375/768/1440) | None expected; re-run is mandatory because background colours changed |
| HOME-E2E-06 / 07 / 08 / 09 / 10 / 11 | None: data flow, links, carousels and contact contracts untouched |
| HOME-E2E-12 / 14 / 15 / 16 | Not present in the current suite; no impact |
| HOME-E2E-17 / 18 | None: no copy or legal links added |
| HOME-E2E-19 | None (see §4.3) |
| HOME-E2E-20…25 | None: sections below the header are untouched; no shared class change |
| HOME-E2E-26 | None: logo source, alt, direct placement and no-overflow assertions still hold (legacy test title is not a colour assertion) |
| Reduced-motion test | None: no new transition; `transition-colors` already neutralised |
| `npm run typecheck`, `lint`, `test`, `test:e2e`, `test:e2e:dynamic`, `check:bundle` | All must pass; `check:bundle` enforces G6 |

Validation ownership: `forge-frontend` writes the change and the new assertions; `forge-qualis` validates coverage, axe and the bundle gate; `forge-reviewer` owns the mandatory LGTM; `forge-sentinel` is not a required gate (no data/auth/privacy flow) but keeps veto on CSP/A2 drift.

## 8. Rollout y rollback

### 8.1 Rollout

- Construction as small commits on trunk **only after the Comandante acknowledges this DD**; CI green at every step, no long-lived branch.
- No canary and no independent release: the change rides the next already-approved app promotion, still behind A2 (`noindex` + Deployment Protection) until the Comandante closes it. F5 unchanged.
- **No commit, push or deploy is authorised by this document.** C-HOME-01 CSP stays Report-Only with no `report-uri`; no new analytics or logging.

### 8.2 Rollback (< 2 min, decided)

Revert exactly four source/test edits:

1. `components/SiteHeader.tsx` — restore `data-surface="dark"`, `bg-primary text-white`, white nav/summary, `text-primary` mobile links, plain cream form and `bg-surface text-ink` submit button.
2. `components/SiteFooter.tsx` — restore `bg-ink text-white`, `text-accent-soft` tagline/H3s and `text-white hover:text-accent-soft` links.
3. `components/WhatsAppCta.tsx` — restore the original `header` class string.
4. `tests/e2e/home.spec.ts` (HOME-E2E-13) and `tests/dynamic-e2e/home-dynamic.spec.ts` (HOME-E2E-28) — restore/amend guards to the approved dark chrome; remove HOME-E2E-27 from the suite (or keep it annotated as expected-to-fail only if the Comandante asks).

No DB row, migration, env var, asset, `globals.css` rule, cache key or favicon is involved; a `git revert` of those files plus the previous Vercel build is an instant rollback. A2, F5, CSP mode and `noindex` are never reopened by the rollback.

**Trigger criteria:** any axe critical/serious regression, focus contrast <3:1, champagne on a light chrome control, gold text on white/cream, bundle-gate failure, visual rejection in UAT, or a discovered copy/link change.

### 8.3 Monitoring

CI: `typecheck`, `lint`, `test`, `test:e2e` (incl. `@smoke` and `@a11y`), `test:e2e:dynamic`, `check:bundle`. Preview: screenshots at 375/768/1440 reviewed by the client for UAT, axe run and the ratio table in §4.1. Production after A2: existing PII-free Vercel monitoring only. No new analytics.

## 9. Métricas de éxito

| Metric | Target |
|---|---|
| Chrome background | `rgb(255, 255, 255)` on header and footer at 375/768/1440 |
| Logo legibility | Dominant logo green ≥7:1 on both surfaces; HOME-E2E-26 green |
| Colour budget | 0 gold text on light chrome; green only in button fills and CSS borders; ≥1 decorative gold line/underline remains |
| Focus | 100 % of chrome controls ink 2 px; HOME-E2E-19 ≥3:1 real adjacent at all three widths |
| axe | 0 critical/serious at 375/768/1440 |
| JS budget | Δ JS = 0; Home ≤150,000 B gzip; total ≤300,000 B gzip |
| Regression | HOME-E2E-01/02/03/04/05/06/07/08/09/10/11/17/18/19/20…26 unchanged and green (only -13 amended by design) |
| UAT | Client explicitly accepts or rejects the experiment; no permanent identity decision implied |
| Reversibility | Full rollback drill in <2 min with A2/F5/C-HOME-01 unchanged |

## 10. Decisiones `DD-HOME-21.x` (trazables)

| ID | Decisión | Justificación | Sección |
|---|---|---|---|
| DD-HOME-21.1 | `bg-white` pure, not `bg-surface` | Literal client request; best logo contrast; only surface where accent-dark ≥3:1 | §4.1 |
| DD-HOME-21.2 | Full colour map: ink text, primary buttons/borders, accent line, accent-dark decoration, no accent-soft text | "Verde solo en botones y bordes" + gold retained without AA violations | §4.2 |
| DD-HOME-21.3 | `data-surface="light"` on header/footer; `globals.css` untouched; HOME-E2E-13 champagne → ink and strengthened | Single source of truth for focus; HOME-E2E-19 continues to measure reality | §4.3 |
| DD-HOME-21.4 | `WhatsAppCta` header = `bg-primary text-white border-primary`, hover `primary-hover` | Same rule as section CTA; no white inversion on light chrome | §4.4 |
| DD-HOME-21.5 | Keep colour PNG, 96×96 logo and 64×64 favicon; no white variant | Surface change solves contrast; preserves `C-HOME-02` | §4.5 |
| DD-HOME-21.6 | Client-authorized reversible trial; base identity docs not derogated | Process rule: UAT first, then a new DD/ADR | §4.6 |
| DD-HOME-21.7 | Amend only HOME-E2E-13; add HOME-E2E-27/28; leave HOME-E2E-19/26 unchanged | Guard continuity without rewriting approved coverage | §7 |
| DD-HOME-21.8 | No commit/push/deploy; rollback <2 min; Δ JS 0 | Hard constraints | §8 |
| DD-HOME-21.9 | Commander-authorized amendment (26-nov-2026): `outline-ink` on the search submit and header WhatsApp CTA | Tailwind v4 includes `outline-color` in `transition-colors`; with `text-white` the ring starts white (~1,06:1) for ~200 ms before turning ink. The token class keeps ≥3:1 from the first frame without new CSS or JS | §4.2/§4.3 |
| DD-HOME-21.10 | Commander-authorized amendment (26-nov-2026): the untitled keyboard-details focus assertion also flips champagne → ink | Same focus pair as HOME-E2E-13; leaving it unchanged would break the suite after the chrome flipped to light | §7.2 |
| DD-HOME-21.11 | Commander-authorized amendment (26-nov-2026): pin SHA-256 of the client original and both derivatives in `brand-logo.test.ts`; correct the documented dominant green to `#075D37` (7,98:1 on white) | Reviewer nits; provenance becomes an exact byte-level guard and the contrast ledger matches the optimized asset | §4.5/§7.1 |

## 11. Preguntas abiertas

**Ninguna bloqueante para Fase 2.** One non-blocking note for the Comandante: the exact degree of gold retained (one footer line + hover/H3 underlines) is an architectural choice to honour "manten el uso del dorado" without AA violations; if the client wants more gold presence on white, it must come through a new DD with fresh 3:1 checks, not by promoting `#C6A050` to body text.

---

**Veredicto del arquitecto: APROBADO (design gate).** Diseño congelado para construcción. `forge-reviewer` conserva el LGTM obligatorio del código resultante y `apex-forge` debe autorizar explícitamente commit, push y despliegue. La identidad verde aprobada sigue vigente hasta UAT (§4.6).
