# Amazon Slack Dark Mode — TamperMonkey Userscript

A TamperMonkey userscript that paints the Amazon Enterprise Slack pre-auth pages — sign-in, workspace picker, "Get started" — with the Cloudscape Polaris Dark Mode palette. Once you're inside the workspace, use Slack's native dark mode (Preferences → Themes → Dark) for the chat experience itself.

Two layers per Section 3.1 of the BarnsAWS Dark Mode Rules: CSS injected at `document-start`, plus a JS computed-style scanner that catches inline-styled and runtime-injected light surfaces.

## Repository Contents

- `slack_dark_mode.user.js` — the TamperMonkey userscript.
- `README.md` — installation, verification, troubleshooting.
- `ABOUT.md` — purpose, design principles, architecture, maintenance notes.
- `LICENSE` — MIT.

## Behavior Coverage

- **Page body / shell** — `body`, main, content wrappers paint at `#161d26` (Cloudscape BODY).
- **Top bar with Slack logo** — paints at `#232b37` (HOVER), one shade lighter than body so the black Slack logo SVG is visible without inverting it.
- **Sign-in card / workspace picker tiles** — paint at `#1b232d` (SURFACE) with `#424650` borders.
- **Workspace tiles** — AWS, Amazon Storefronts, Affinity Groups, Activate, etc. paint as cards with hover lift to `#232b37`.
- **Search box** — `#0a0f15` inset surface with muted-text placeholder at full opacity.
- **Body text** — primary text tier `#e9edf2`; muted/secondary text `#a1a8b3`.
- **Links** — `#42b4ff` default, `#79c0ff` hover/focus.
- **Slack green primary CTA** — preserved via `revert` so brand color stays intact.
- **Authored illustrations** — the "people shaking hands" illustration and workspace icons render unchanged (image carve-out per Section 3.13).
- **Mutation handling** — debounced 250 ms MutationObserver re-applies on dynamic content.
- **Safety passes** — 500 / 1500 / 3000 ms after `window.load`.

## Install on Chrome

1. Install **TamperMonkey** from the Chrome Web Store: <https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo>
2. Open the TamperMonkey dashboard and confirm the extension is enabled.
3. Open the raw userscript URL — TamperMonkey will intercept and prompt to install:
   `https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js`
4. Click **Install**.
5. Visit `https://amazon.enterprise.slack.com` and refresh once.

## Install on Firefox

1. Install **TamperMonkey** for Firefox: <https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/>
2. Open the TamperMonkey dashboard and confirm the extension is enabled.
3. Open the raw userscript URL — TamperMonkey will intercept and prompt to install:
   `https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js`
4. Click **Install**.
5. Visit `https://amazon.enterprise.slack.com` and refresh once.

## Verification Checklist

- [ ] Page background is `#161d26`, no white residue.
- [ ] Top bar with Slack logo paints `#232b37`; the black "slack" wordmark is visible against the lighter header.
- [ ] Workspace picker card ("Workspaces at Amazon") paints `#1b232d` with a thin `#424650` border.
- [ ] Search box ("Search workspaces") paints `#0a0f15` with a muted placeholder.
- [ ] Workspace tiles (AWS, Amazon Storefronts, Affinity Groups, Activate) render as `#1b232d` cards with `#424650` borders; hover lifts to `#232b37`.
- [ ] "People shaking hands" illustration is visible (not blanked).
- [ ] "Sign in with Amazon Corp" green button keeps Slack's brand green.
- [ ] Links render `#42b4ff`, hover to `#79c0ff`.
- [ ] Body text contrast meets at least 4.5:1 against the surface.

## Troubleshooting

- **Bright sections after load** — hard-refresh (Ctrl+F5). Safety passes re-run at 500 / 1500 / 3000 ms after load.
- **Slack logo invisible (still black on dark)** — the header should paint `#232b37`. If it stayed dark `#161d26`, file an issue with the header element's outerHTML so a more specific selector can be added.
- **Workspace illustration missing** — the image carve-out should preserve `<img>` and authored `background-image`. If a tile renders solid dark, the wrapper class isn't in the carve-out yet — file an issue with the wrapper class name.
- **Inside the workspace stays light** — that's expected. This script only covers the pre-auth pages. Use Slack's native dark mode (Preferences → Themes → Dark) for the workspace itself.

## Boundary Note

This Userscript covers Slack's web-rendered pre-auth pages on `amazon.enterprise.slack.com` (and `*.enterprise.slack.com`, plus a few `*.slack.com/signin`, `/workspace-signin`, `/get-started`, `/ssb` paths) in Chrome and Firefox via TamperMonkey. **`moz-extension://` contexts are out of scope** — Firefox security boundaries block TamperMonkey from injecting CSS or JS into another extension's internal UI. The Slack desktop app (Electron) is also out of scope; use Slack's native dark theme there.

## Source References

- AWS Cloudscape Dark Mode Standard for LLM v3.3 — palette tokens, JS Nuclear Pass, Observer Pattern, anti-patterns.
- Amazon Dark Mode LLM Playbook v1.0 — folder/file scheme, source-notation rules, repository initialization workflow.
- BarnsAWS Dark Mode Rules v2026-05-22 (BarnsAWS Dark Mode Rules) — Section 3.12 Authored Embedded Content Carve-Out, Section 3.13 Defensive Selector Discipline.
- Firefox Amazon Quick Dark Mode MCP Reproduction Guide v1.0 — extension-boundary fallback path.
