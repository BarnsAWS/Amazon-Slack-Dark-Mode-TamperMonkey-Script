// ==UserScript==
// @name         Amazon Slack Dark Mode
// @namespace    https://github.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script
// @version      1.2.0
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

    // === EARLY PAINT ===
    try {
        if (document.documentElement) {
            document.documentElement.style.backgroundColor = '#161d26';
            document.documentElement.style.colorScheme = 'dark';
        }
    } catch (_) {}

    const PALETTE = {
        BODY:    '#161d26',
        SURFACE: '#1b232d',
        HOVER:   '#232b37',
        BORDER:  '#424650',
        TEXT:    '#e9edf2',
        MUTED:   '#a1a8b3',
        LINK:    '#42b4ff',
    };

    const STYLE_ID = 'barnsaws-slack-dark-mode-style';
    const CSS = `
:root { color-scheme: dark !important; }

html, body {
    background-color: ${PALETTE.BODY} !important;
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
}

/* === HEADER / TOP NAV — paint LIGHTER than body so black Slack logo is visible === */
header, [class*="header"], [class*="Header"],
[class*="top_nav"], [class*="TopNav"], [class*="p-top_nav"],
[class*="client_header"], [class*="workspace_header"],
[class*="p-page_header"], [class*="PageHeader"],
[class*="c-base_layout__header"], [class*="navbar"], [class*="Navbar"],
nav, [role="banner"], [role="navigation"] {
    background-color: ${PALETTE.HOVER} !important;
    background-image: none !important;
    border-bottom: 1px solid ${PALETTE.BORDER} !important;
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
}

/* Slack logo SVG — invert so black text becomes white */
header svg, [class*="header"] svg, [class*="Header"] svg,
nav svg, [role="banner"] svg,
[class*="slack_logo"], [class*="SlackLogo"],
[class*="c-slacklogo"],
img[alt*="Slack"], img[src*="slack-logo"] {
    filter: invert(1) brightness(2) !important;
}

/* === SHELL / LAYOUT === */
[class*="c-base_layout"], [class*="p-base_layout"],
[class*="p-workspace_index"], [class*="p-team_directory"],
[class*="p-marketing"], [class*="p-page"],
[class*="layout"], [class*="Layout"],
[class*="wrapper"], [class*="Wrapper"],
main, [role="main"], section, article {
    background-color: ${PALETTE.BODY} !important;
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
}

/* === CARDS / TILES / PANELS === */
[class*="card"], [class*="Card"],
[class*="panel"], [class*="Panel"],
[class*="modal"], [class*="Modal"],
[class*="dialog"], [class*="Dialog"],
[class*="tile"], [class*="Tile"],
[class*="form"], [class*="Form"],
[class*="auth"], [class*="Auth"],
[class*="signin"], [class*="SignIn"],
[class*="login"], [class*="Login"],
[class*="workspace_list"], [class*="WorkspaceList"],
[class*="team_list"], [class*="TeamList"],
[class*="workspace_card"], [class*="WorkspaceCard"],
[class*="team_card"], [class*="TeamCard"],
[class*="workspace_item"], [class*="WorkspaceItem"],
[class*="team_item"], [class*="TeamItem"],
[class*="get_started"], [class*="GetStarted"],
[class*="banner"], [class*="Banner"],
[class*="recommendation"], [class*="Recommendation"],
[class*="notice"], [class*="Notice"],
[class*="info"], [class*="Info"] {
    background-color: ${PALETTE.SURFACE} !important;
    border-color: ${PALETTE.BORDER} !important;
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
}

[class*="card"]:hover, [class*="Card"]:hover,
[class*="tile"]:hover, [class*="Tile"]:hover,
[class*="workspace_item"]:hover, [class*="WorkspaceItem"]:hover,
[class*="team_item"]:hover, [class*="TeamItem"]:hover {
    background-color: ${PALETTE.HOVER} !important;
}

/* Headings / text */
h1, h2, h3, h4, h5, h6, p, span, label, li, td, th, dt, dd, div {
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
}

/* Muted / secondary text */
[class*="muted"], [class*="Muted"], [class*="secondary"], [class*="Secondary"],
[class*="subtitle"], [class*="Subtitle"], [class*="hint"], [class*="Hint"],
[class*="description"], [class*="Description"],
small, [class*="fine_print"], [class*="FinePrint"] {
    color: ${PALETTE.MUTED} !important;
    -webkit-text-fill-color: ${PALETTE.MUTED} !important;
}

/* Links */
a, [role="link"] {
    color: ${PALETTE.LINK} !important;
    -webkit-text-fill-color: ${PALETTE.LINK} !important;
}
a:hover, a:focus-visible {
    color: #79c0ff !important;
    -webkit-text-fill-color: #79c0ff !important;
}

/* Inputs / search */
input, textarea, select, [role="searchbox"], [role="combobox"], [role="textbox"] {
    background-color: #0a0f15 !important;
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
    border: 1px solid ${PALETTE.BORDER} !important;
    caret-color: ${PALETTE.TEXT} !important;
}
::placeholder, ::-webkit-input-placeholder, ::-moz-placeholder {
    color: ${PALETTE.MUTED} !important;
    -webkit-text-fill-color: ${PALETTE.MUTED} !important;
    opacity: 1 !important;
}

/* Primary CTA buttons — preserve Slack brand green/etc. */
[class*="btn-primary"], [class*="c-button--primary"],
[class*="ladda-button"],
button[data-qa="sign_in_button"],
[class*="p-download_modal__button"] {
    background-color: revert !important;
    background-image: revert !important;
    color: revert !important;
    -webkit-text-fill-color: revert !important;
    border-color: revert !important;
    filter: none !important;
}

/* Secondary buttons */
[class*="btn-secondary"], [class*="c-button--outline"], [class*="btn-link"],
button:not([class*="primary"]):not([class*="ladda"]):not([class*="sign_in"]) {
    background-color: ${PALETTE.HOVER} !important;
    color: ${PALETTE.TEXT} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT} !important;
    border: 1px solid ${PALETTE.BORDER} !important;
}

/* Borders / dividers */
hr, [class*="divider"], [class*="Divider"],
[class*="separator"], [class*="Separator"] {
    border-color: ${PALETTE.BORDER} !important;
    background-color: ${PALETTE.BORDER} !important;
}

/* Footer */
footer, [class*="footer"], [class*="Footer"] {
    background-color: ${PALETTE.BODY} !important;
    color: ${PALETTE.MUTED} !important;
    -webkit-text-fill-color: ${PALETTE.MUTED} !important;
}

/* Focus ring */
:focus-visible {
    outline: 2px solid #7e57c2 !important;
    outline-offset: 2px !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 10px !important; background: ${PALETTE.BODY} !important; }
::-webkit-scrollbar-track { background: ${PALETTE.BODY} !important; }
::-webkit-scrollbar-thumb { background: ${PALETTE.BORDER} !important; border-radius: 5px !important; }
::-webkit-scrollbar-thumb:hover { background: #5a6b8a !important; }
* { scrollbar-color: ${PALETTE.BORDER} ${PALETTE.BODY} !important; scrollbar-width: thin !important; }

/* Inline-style white override */
[style*="background-color: rgb(255, 255, 255)"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background-color: white"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background-color:#fff"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background: rgb(255, 255, 255)"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background: white"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background:#fff"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background-color: #ffffff"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe),
[style*="background: #ffffff"]:not(img):not(video):not(canvas):not(svg):not(picture):not(iframe) {
    background-color: ${PALETTE.SURFACE} !important;
}

/* Media exemption */
img, video, canvas, picture, iframe, object, embed {
    background-color: transparent !important;
    filter: none !important;
}
`;

    const STYLE_TEXT = CSS;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const parent = document.head || document.documentElement;
        if (!parent) { requestAnimationFrame(injectStyle); return; }
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = STYLE_TEXT;
        parent.appendChild(style);
        if (typeof GM_addStyle === 'function') {
            try { GM_addStyle(STYLE_TEXT); } catch (_) {}
        }
    }

    // === JS NUCLEAR PASS — luminance-bucket any remaining light surface ===
    const EXCLUDED_TAGS = new Set(['IMG','VIDEO','CANVAS','SVG','PATH','CIRCLE','RECT','POLYGON','LINE','POLYLINE','ELLIPSE','G','DEFS','USE','SYMBOL','CLIPPATH','MASK','TEXT','TSPAN','PICTURE','IFRAME','OBJECT','EMBED']);

    function parseRgb(s) {
        if (typeof s !== 'string') return null;
        const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/i.exec(s);
        if (!m) return null;
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (a < 0.5) return null;
        return [+m[1], +m[2], +m[3]];
    }

    function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

    function nuclearPass() {
        let all;
        try { all = document.querySelectorAll('*'); } catch (_) { return; }
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            const tag = el.tagName ? el.tagName.toUpperCase() : '';
            if (EXCLUDED_TAGS.has(tag)) continue;
            if (el.closest && el.closest('svg, iframe, object, embed, [class*="slack_logo"], [class*="SlackLogo"]')) continue;
            let cs;
            try { cs = getComputedStyle(el); } catch (_) { continue; }
            const bg = parseRgb(cs.backgroundColor);
            if (bg) {
                const L = lum(bg[0], bg[1], bg[2]);
                let target = null;
                if (L > 200) target = PALETTE.BODY;
                else if (L >= 140) target = PALETTE.SURFACE;
                else if (L >= 100) target = PALETTE.HOVER;
                if (target) {
                    try { el.style.setProperty('background-color', target, 'important'); } catch (_) {}
                }
            }
            const txt = parseRgb(cs.color);
            if (txt) {
                const tL = lum(txt[0], txt[1], txt[2]);
                if (tL < 120) {
                    const isLink = (tag === 'A') || (el.closest && el.closest('a, [role="link"]'));
                    const c = isLink ? PALETTE.LINK : PALETTE.TEXT;
                    try {
                        el.style.setProperty('color', c, 'important');
                        el.style.setProperty('-webkit-text-fill-color', c, 'important');
                    } catch (_) {}
                }
            }
        }
    }

    // Debounced observer for dynamic content
    let timer = null;
    function scheduleSweep() {
        if (timer != null) return;
        timer = setTimeout(() => { timer = null; nuclearPass(); }, 250);
    }

    function attachObserver() {
        const target = document.documentElement || document.body;
        if (!target) { requestAnimationFrame(attachObserver); return; }
        if (typeof MutationObserver !== 'function') return;
        try {
            new MutationObserver(scheduleSweep).observe(target, {
                childList: true, subtree: true,
                attributes: true, attributeFilter: ['style', 'class'],
            });
        } catch (_) {}
    }

    function scheduleSafetyPasses() {
        if (typeof window === 'undefined') return;
        const fire = () => {
            setTimeout(nuclearPass, 500);
            setTimeout(nuclearPass, 1500);
            setTimeout(nuclearPass, 3000);
        };
        if (document.readyState === 'complete') fire();
        else window.addEventListener('load', fire, { once: true });
    }

    injectStyle();
    attachObserver();
    scheduleSafetyPasses();
})();
