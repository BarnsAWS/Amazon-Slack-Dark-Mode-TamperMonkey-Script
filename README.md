# Amazon Slack Sign-In Dark Mode

CSS-only TamperMonkey userscript that paints the `https://amazon.enterprise.slack.com` sign-in page dark so there's no white flash before Midway redirects you into the workspace.

Once signed in, use Slack's native dark mode (Preferences → Themes → Dark) for the workspace itself.

## Repository Contents

- `slack_dark_mode.user.js` — the TamperMonkey userscript.
- `README.md` — this file.

## Install on Firefox

1. Install **TamperMonkey** for Firefox: <https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/>
2. Open the raw userscript URL — TamperMonkey will intercept and prompt to install:
   `https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js`
3. Click **Install**.
4. Visit `https://amazon.enterprise.slack.com` — the sign-in page should render dark immediately.

## Source References

- AWS Cloudscape Dark Mode Standard for LLM v3.3
- Amazon Dark Mode LLM Playbook v1.0
- BarnsAWS Dark Mode Rules (Documents\Coding Standards and Guides\BarnsAWS Dark Mode\Rules.md)
