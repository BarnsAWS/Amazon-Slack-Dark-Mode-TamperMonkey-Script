// ==UserScript==
// @name         Amazon Slack Dark Mode
// @namespace    https://github.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script
// @version      1.1.0
// @match        https://amazon.enterprise.slack.com/*
// @match        https://*.enterprise.slack.com/*
// @match        https://*.slack.com/signin*
// @match        https://*.slack.com/workspace-signin*
// @match        https://*.slack.com/get-started*
// @match        https://*.slack.com/ssb*
// @run-at       document-start
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js
// @downloadURL  https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Early paint — eliminate white flash.
    try {
        if (document.documentElement) {
            document.documentElement.style.backgroundColor = '#161d26';
            document.documentElement.style.colorScheme = 'dark';
        }
    } catch (_) {}

    const STYLE_ID = 'barnsaws-slack-dark-mode-style';
    const CSS = `
:root { color-scheme: dark !important; }

html, body {
    background-color: #161d26 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* === SLACK LOGO AREA (upper-left) ===
   The Slack logo is black SVG text on a dark header — lighten the header
   background so the logo is visible. */
header, [class*="header"], [class*="Header"],
[class*="top_nav"], [class*="TopNav"], [class*="p-top_nav"],
[class*="client_header"], [class*="workspace_header"],
nav, [role="banner"] {
    background-color: #232b37 !important;
    border-bottom: 1px solid #424650 !important;
}

/* Slack logo SVG — invert so black text becomes white on the dark header */
header svg, [class*="header"] svg, [class*="Header"] svg,
nav svg, [role="banner"] svg,
[class*="slack_logo"], [class*="SlackLogo"],
[class*="c-slacklogo"], [aria-label*="Slack"] {
    filter: invert(1) brightness(2) !important;
}

/* === MAIN CONTENT AREA === */
main, [role="main"], [class*="content"], [class*="Content"],
[class*="page"], [class*="Page"], [class*="wrapper"], [class*="Wrapper"],
[class*="container"], [class*="Container"],
[class*="workspace"], [class*="Workspace"],
[class*="body"], [class*="Body"],
section, article, div[class] {
    background-color: #161d26 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* === SIGN-IN / WORKSPACE PICKER CARD === */
[class*="card"], [class*="Card"],
[class*="panel"], [class*="Panel"],
[class*="modal"], [class*="Modal"],
[class*="dialog"], [class*="Dialog"],
[class*="form"], [class*="Form"],
[class*="auth"], [class*="Auth"],
[class*="signin"], [class*="SignIn"],
[class*="login"], [class*="Login"],
[class*="workspace_list"], [class*="WorkspaceList"],
[class*="team_list"], [class*="TeamList"],
[class*="get_started"], [class*="GetStarted"] {
    background-color: #1b232d !important;
    border: 1px solid #424650 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* Workspace tiles / team cards */
[class*="workspace_card"], [class*="WorkspaceCard"],
[class*="team_card"], [class*="TeamCard"],
[class*="workspace_item"], [class*="WorkspaceItem"],
[class*="team_item"], [class*="TeamItem"],
[class*="p-workspace_list_item"], [class*="p-team_list_item"] {
    background-color: #1b232d !important;
    border: 1px solid #424650 !important;
}
[class*="workspace_card"]:hover, [class*="WorkspaceCard"]:hover,
[class*="team_card"]:hover, [class*="TeamCard"]:hover,
[class*="workspace_item"]:hover, [class*="WorkspaceItem"]:hover {
    background-color: #232b37 !important;
}

/* Search box */
input, textarea, select, [role="searchbox"], [role="combobox"] {
    background-color: #0a0f15 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
    border: 1px solid #424650 !important;
    caret-color: #e9edf2 !important;
}
::placeholder {
    color: #a1a8b3 !important;
    -webkit-text-fill-color: #a1a8b3 !important;
    opacity: 1 !important;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* Body text */
p, span, label, li, td, th, dt, dd {
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* Muted / secondary text */
[class*="muted"], [class*="Muted"], [class*="secondary"], [class*="Secondary"],
[class*="subtitle"], [class*="Subtitle"], [class*="hint"], [class*="Hint"],
small, [class*="fine_print"] {
    color: #a1a8b3 !important;
    -webkit-text-fill-color: #a1a8b3 !important;
}

/* Links */
a, [role="link"] {
    color: #42b4ff !important;
    -webkit-text-fill-color: #42b4ff !important;
}
a:hover, a:focus-visible {
    color: #79c0ff !important;
    -webkit-text-fill-color: #79c0ff !important;
}

/* Primary CTA buttons — preserve Slack's green/brand color */
[class*="btn-primary"], [class*="c-button--primary"],
[class*="ladda-button"], [class*="p-download_modal__button"],
button[data-qa="sign_in_button"],
[style*="background-color: rgb(0"], [style*="background-color: #"] {
    background-color: revert !important;
    color: revert !important;
    -webkit-text-fill-color: revert !important;
    border-color: revert !important;
    filter: none !important;
}

/* "Launch in Slack" / secondary buttons */
[class*="btn-secondary"], [class*="c-button--outline"],
[class*="btn-link"], button:not([class*="primary"]):not([class*="ladda"]):not([class*="sign_in"]) {
    background-color: #232b37 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
    border: 1px solid #424650 !important;
}

/* Borders / dividers */
hr, [class*="divider"], [class*="Divider"], [class*="separator"], [class*="Separator"] {
    border-color: #424650 !important;
    background-color: #424650 !important;
}

/* Footer */
footer, [class*="footer"], [class*="Footer"] {
    background-color: #161d26 !important;
    color: #a1a8b3 !important;
    -webkit-text-fill-color: #a1a8b3 !important;
}

/* "Recommended workspaces" / info banners */
[class*="banner"], [class*="Banner"],
[class*="notice"], [class*="Notice"],
[class*="info"], [class*="Info"],
[class*="recommendation"], [class*="Recommendation"] {
    background-color: #1b232d !important;
    border: 1px solid #424650 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* Focus ring */
:focus-visible {
    outline: 2px solid #7e57c2 !important;
    outline-offset: 2px !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 10px !important; background: #161d26 !important; }
::-webkit-scrollbar-track { background: #161d26 !important; }
::-webkit-scrollbar-thumb { background: #424650 !important; border-radius: 5px !important; }
::-webkit-scrollbar-thumb:hover { background: #5a6b8a !important; }
* { scrollbar-color: #424650 #161d26 !important; scrollbar-width: thin !important; }

/* Media exemption — authored images (workspace icons, people illustrations) */
img, video, canvas, picture, iframe, object, embed {
    background-color: transparent !important;
    filter: none !important;
}

/* Inline-style white override (catch-all for Slack's inline bg paints) */
[style*="background-color: rgb(255, 255, 255)"],
[style*="background-color: white"],
[style*="background-color:#fff"],
[style*="background: rgb(255, 255, 255)"],
[style*="background: white"],
[style*="background:#fff"],
[style*="background: #fff"],
[style*="background-color: #ffffff"],
[style*="background: #ffffff"] {
    background-color: #1b232d !important;
}
`;

    function inject() {
        if (document.getElementById(STYLE_ID)) return;
        const parent = document.head || document.documentElement;
        if (!parent) { requestAnimationFrame(inject); return; }
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        parent.appendChild(style);
        if (typeof GM_addStyle === 'function') {
            try { GM_addStyle(CSS); } catch (_) {}
        }
    }

    inject();
})();
