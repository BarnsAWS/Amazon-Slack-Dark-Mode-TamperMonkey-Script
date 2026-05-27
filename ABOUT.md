# About Amazon Slack Dark Mode

## Purpose

`slack_dark_mode.user.js` is a TamperMonkey userscript that paints the pre-auth pages on `https://amazon.enterprise.slack.com` (and related Slack web entry points) with the AWS Cloudscape Polaris Dark Mode palette so the sign-in card, workspace picker, and "Get started" landing pages match the rest of the BarnsAWS dark mode family. Inside the workspace itself, Slack's native dark theme handles everything.

## Design Principles

- **Cloudscape palette as source of truth.** Surfaces, text tiers, links, focus rings all use Cloudscape tokens (`#161d26` body, `#1b232d` surface, `#232b37` hover, `#424650` border, `#42b4ff` link, `#79c0ff` link-hover). No hand-picked hex.
- **Top bar painted lighter than body so logos render.** Slack ships a black SVG wordmark in the upper-left header. Painting the header at `#232b37` (one shade lighter than the `#161d26` body) keeps the black logo visible without inverting it. This avoids the `filter: invert(1)` anti-pattern from Section 3.3 of the rules.
- **Two-layer architecture.** CSS injection at `document-start` paints surfaces dark before Slack's stylesheet runs; a JS luminance-bucket scanner catches inline-styled and runtime-injected light surfaces.
- **No `filter: invert(1)` global.** Authored brand colors (the green "Sign in with Amazon Corp" button, workspace icons) stay correct.
- **Defensive selector discipline (Section 3.13).** Shell rules use enumerated Slack `c-base_layout` / `p-workspace_index` / `p-team_directory` / `p-marketing` class names, NOT a wholesale `[class*="layout"]` substring match.
- **Image-bearing carve-out.** The "people shaking hands" illustration on the workspace picker, workspace icon thumbnails, and any `<img>` are exempt from background painting via `revert`.
- **Authored-content carve-out (Section 3.12).** `<iframe>` / `<object>` / `<embed>` and any wrapper containing them stays transparent so authored content (auth pop-ups, OAuth iframes) renders unchanged.

## Script Architecture

The script runs in seven phases, each marked with a `// Source pattern: ...` comment per Section 3.8.

### Framework Hook

Sets `document.documentElement.style.colorScheme = 'dark'` at `document-start`. Slack's pages don't use `awsui-*`, so we skip the `awsui-polaris-dark-mode` class step that the AWS-internal scripts use.

### CSS Injection

At `document-start`, a single `<style id="barnsaws-slack-dark-mode-style">` element is appended to `document.head` (or `document.documentElement` if head isn't ready). Retry loop tries up to 100 `requestAnimationFrame` ticks. Stylesheet covers:

- `html` / `body` body surface.
- Top bar / `header` / `nav` at the lighter `#232b37` so the Slack logo is visible.
- Workspace picker shell — `c-base_layout`, `p-workspace_index`, `p-team_directory`, `p-marketing`, `p-page` (enumerated, not substring).
- Sign-in card / workspace tiles — narrowed enumerated list (no `[class*="card"]` substring per Section 3.13).
- Inputs, links, primary CTA preserved via `revert`, secondary buttons painted dark.
- Image-bearing carve-out for `<img>`, `[class*="thumbnail"]`, `[class*="avatar"]`, `[class*="icon"]`, `[class*="illustration"]`.
- Authored-content carve-out for `iframe`, `object`, `embed` and `:has(> iframe)` ancestors.

### Nuclear_Pass

Walks every non-media element, parses computed `background-color`, computes luminance `0.299*R + 0.587*G + 0.114*B`, and reassigns by bucket:

- `> 200` → `#161d26` (BODY)
- `[140, 200]` → `#1b232d` (SURFACE)
- `[100, 140)` → `#232b37` (HOVER)
- `< 100` → unchanged

Excludes media tags AND any descendant of an iframe/object/embed/Slack-logo carve-out wrapper. Text reassignment fires only when text luminance is `< 120`; links use `#42b4ff`, everything else uses primary text tier.

### Top_Bar_Detector

`header`, `nav`, `[role="banner"]`, plus position-based detection (fixed/sticky/absolute with `top < 100`) gets painted at `#232b37` (HOVER), not `#161d26` (BODY), so the Slack logo SVG renders against a lighter surface.

### Mutation_Observer

Attached to `documentElement` with `{ childList, subtree, attributes, attributeFilter: ['style','class','id'] }`. Mutations coalesce into one combined pass per 250 ms window.

### Safety_Pass

On `window.load`, three `setTimeout` timers schedule the combined pass at 500 / 1500 / 3000 ms.

### Shadow_Pierce

Recurses open shadow roots up to depth 10 / 500 hosts / 2000 ms. Re-injects byte-identical stylesheet inside each open root and runs a scoped Nuclear_Pass.

## Why This Repository Exists

When you load `https://amazon.enterprise.slack.com`, you see a sequence of white pages — sign-in card, workspace picker, "Workspaces at Amazon" landing — before Midway redirects you into the workspace. Slack's native dark mode only kicks in once you're inside a workspace. This Userscript covers the gap so engineers using dark mode across their internal toolchain don't get a flash of bright white every time they switch workspaces or come back from an SSO redirect.

## Maintenance Notes

- **Palette updates.** Cloudscape tokens are the source of truth. If Cloudscape revs the dark palette, update the `PALETTE` constant at the top of `slack_dark_mode.user.js`.
- **Slack class taxonomy drift.** Slack rewrites their pre-auth pages periodically. The current rules use `c-base_layout`, `p-workspace_index`, `p-team_directory`, `p-marketing` — if Slack switches to a new prefix, capture the new wrapper class names from DevTools and extend the enumerated shell list.
- **Header lightness vs logo visibility.** The Slack logo is rendered as a black SVG. The header rule paints `#232b37` (HOVER) to make it visible. If Slack switches to a white logo (e.g. for their dark mode marketing pages), the header could go to `#161d26` (BODY).
- **Section 3.12 carve-out (authored embedded content).** OAuth iframes, embedded captchas, and any future `<iframe>` content stays transparent so authored surfaces render correctly.
- **Section 3.13 carve-out (image-bearing classes).** Don't widen the shell selector to `[class*="card"]` or `[class*="content"]`. Use enumerated lists. If Slack adds a new layout class, add it explicitly.

## Source References

- AWS Cloudscape Dark Mode Standard for LLM v3.3 — palette tokens, JS Nuclear Pass, Observer Pattern, anti-patterns.
- Amazon Dark Mode LLM Playbook v1.0 — folder/file scheme, source-notation rules, repository initialization workflow.
- BarnsAWS Dark Mode Rules v2026-05-22 — Section 3.12 (Authored Embedded Content Carve-Out), Section 3.13 (Defensive Selector Discipline).
- Firefox Amazon Quick Dark Mode MCP Reproduction Guide v1.0 — extension-boundary fallback path for `moz-extension://` rendering.
