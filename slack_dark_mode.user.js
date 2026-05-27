// ==UserScript==
// @name         Amazon Slack Sign-In Dark Mode
// @namespace    https://github.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script
// @version      1.0.0
// @match        https://amazon.enterprise.slack.com/*
// @match        https://*.enterprise.slack.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js
// @downloadURL  https://raw.githubusercontent.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script/main/slack_dark_mode.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Early paint — eliminate white flash before stylesheet loads.
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

/* Sign-in card */
[class*="card"], [class*="Card"], [class*="panel"], [class*="Panel"],
[class*="container"], [class*="Container"], [class*="content"], [class*="Content"],
[class*="form"], [class*="Form"], [class*="auth"], [class*="Auth"],
[class*="signin"], [class*="SignIn"], [class*="login"], [class*="Login"],
[class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"],
main, [role="main"], section, article {
    background-color: #1b232d !important;
    border-color: #424650 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* Slack top bar / header */
header, nav, [class*="header"], [class*="Header"],
[class*="topbar"], [class*="TopBar"], [class*="nav"], [class*="Nav"] {
    background-color: #161d26 !important;
    border-color: #424650 !important;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
}

/* Body text / paragraphs */
p, span, label, div {
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
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

/* Slack green "Sign in with Amazon Corp" button — preserve brand color */
[class*="btn-primary"], [class*="c-button--primary"],
[class*="sign_in"], [class*="SignIn"] button,
button[data-qa="sign_in_button"], [class*="ladda-button"],
[style*="background-color: rgb(0"], [style*="background:#"] {
    background-color: revert !important;
    color: revert !important;
    -webkit-text-fill-color: revert !important;
    border-color: revert !important;
}

/* "Email and password" secondary button */
[class*="btn-secondary"], [class*="c-button--outline"],
[class*="secondary"], button:not([class*="primary"]):not([class*="ladda"]) {
    background-color: #232b37 !important;
    color: #e9edf2 !important;
    -webkit-text-fill-color: #e9edf2 !important;
    border: 1px solid #424650 !important;
}

/* Inputs */
input, textarea, select {
    background-color: #1b232d !important;
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

/* Focus ring */
:focus-visible {
    outline: 2px solid #7e57c2 !important;
    outline-offset: 2px !important;
}

/* Footer / fine print */
[class*="footer"], [class*="Footer"], footer {
    background-color: #161d26 !important;
    color: #a1a8b3 !important;
    -webkit-text-fill-color: #a1a8b3 !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 10px !important; background: #161d26 !important; }
::-webkit-scrollbar-track { background: #161d26 !important; }
::-webkit-scrollbar-thumb { background: #424650 !important; border-radius: 5px !important; }
::-webkit-scrollbar-thumb:hover { background: #5a6b8a !important; }

/* Media exemption */
img, video, canvas, picture, svg, iframe, object, embed {
    background-color: transparent !important;
    filter: none !important;
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
