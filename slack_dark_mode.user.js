// ==UserScript==
// @name         Amazon Slack Dark Mode
// @namespace    https://github.com/BarnsAWS/Amazon-Slack-Dark-Mode-TamperMonkey-Script
// @version      1.3.0
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

    // === EARLY PAINT (synchronous, before DOM tree exists) ===
    // Eliminates the white flash before the stylesheet loads.
    try {
        if (document.documentElement) {
            document.documentElement.style.backgroundColor = '#161d26';
            document.documentElement.style.colorScheme = 'dark';
        }
    } catch (_) { /* never block the rest of the script */ }

    // Cloudscape "Polaris Dark Mode" palette tokens (Rules.md Section 7).
    const PALETTE = {
        BODY:                  '#161d26', // Primary surface (body, shell)
        SURFACE:               '#1b232d', // Cards, panels, tiles
        HOVER:                 '#232b37', // Hover, selected, AND top bar (so black Slack logo shows)
        BORDER:                '#424650',
        TEXT_PRIMARY:          '#e9edf2',
        TEXT_MUTED:            '#a1a8b3',
        LINK:                  '#42b4ff',
        LINK_HOVER:            '#79c0ff',
        SCROLLBAR_THUMB_HOVER: '#5a6b8a',
        KIRO_ACCENT:           '#7e57c2',
    };

    const STYLE_ID = 'barnsaws-slack-dark-mode-style';
    const MAX_INJECT_ATTEMPTS = 100;
    const MAX_OBSERVER_ATTACH_ATTEMPTS = 100;
    const OBSERVER_DEBOUNCE_MS = 250;
    const SAFETY_PASS_DELAYS_MS = Object.freeze([500, 1500, 3000]);
    const SHADOW_PIERCE_DEPTH_LIMIT = 10;
    const SHADOW_PIERCE_HOST_LIMIT = 500;
    const SHADOW_PIERCE_TIMEOUT_MS = 2000;
    const NUCLEAR_BG_BUCKET_HIGH = 200;
    const NUCLEAR_BG_BUCKET_MID  = 140;
    const NUCLEAR_BG_BUCKET_LOW  = 100;
    const NUCLEAR_TEXT_THRESHOLD = 120;
    const COLOR_SCHEME_DEADLINE_MS = 50;

    const EXCLUDED_TAGS = Object.freeze(
        ['IMG','VIDEO','CANVAS','SVG','PICTURE','IFRAME','OBJECT','EMBED'],
    );
    const EXCLUDED_TAG_SET = new Set(EXCLUDED_TAGS);
    const TOP_BAR_DESCENDANT_EXCLUDED = new Set(
        ['IMG','VIDEO','AUDIO','CANVAS','PICTURE','SVG','IFRAME'],
    );

    // Authored-content carve-out wrappers (Rules.md Section 3.12).
    // Plus image-bearing class hints (Rules.md Section 3.13) so workspace
    // icons / illustrations / avatars never get repainted.
    const PLAYER_WRAPPER_SELECTOR =
        'iframe, object, embed, ' +
        '[class*="pdfViewer"], [class*="pdf-viewer"], ' +
        '[class*="viewerContainer"], [class*="viewer-container"], ' +
        '[class*="scorm-player"], [class*="scorm-frame"], ' +
        '#player, #viewer, #viewerContainer, #pdfViewer';

    const IMAGE_CARVE_OUT_SELECTOR =
        '[class*="userPhoto"], [class*="userImage"], [class*="userAvatar"], ' +
        '[class*="badgePhoto"], [class*="profilePhoto"], [class*="profileImage"], ' +
        '[class*="avatar"], [class*="Avatar"], [class*="thumbnail"], [class*="thumb"], ' +
        '[class*="illustration"], [class*="Illustration"], ' +
        '[class*="workspace_icon"], [class*="WorkspaceIcon"], ' +
        '[class*="team_icon"], [class*="TeamIcon"], ' +
        '[class*="emoji"], [class*="Emoji"]';

    // Source cue: BarnsAWS Phone Tool reference userscript - Kiro accent
    const KIRO_ACCENT_RULES = Object.freeze({
        focusVisible: ':focus-visible',
        forbiddenSurfaces: ['body', 'header', 'nav', 'main'],
    });

    const STYLE_TEXT = `
:root { color-scheme: dark !important; }

html, body {
    background-color: ${PALETTE.BODY} !important;
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
    opacity: 1 !important;
}

/* === TOP BAR / HEADER ===
   Painted at HOVER (#232b37), one shade lighter than body, so the black
   Slack wordmark SVG is visible without inverting it. Per Rules.md 3.3
   we don't apply filter:invert(1). Per 3.13 these are enumerated, not
   substring-matched. */
header, nav, [role="banner"],
.c-base_layout__header, .p-page_header, .p-top_nav, .p-client_header,
.p-workspace_header, .p-team_directory_header {
    background-color: ${PALETTE.HOVER} !important;
    border-bottom: 1px solid ${PALETTE.BORDER} !important;
}

/* === SHELL / LAYOUT (enumerated Slack pre-auth class names per 3.13) === */
.c-base_layout, .c-base_layout__main,
.p-base_layout, .p-page,
.p-workspace_index, .p-team_directory,
.p-marketing, .p-marketing__inner,
.p-get_started, .p-find_workspaces,
main, [role="main"] {
    background-color: ${PALETTE.BODY} !important;
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
}

/* === SIGN-IN / WORKSPACE PICKER CARD ===
   Enumerated card class hooks Slack actually uses. NO [class*="card"]
   wholesale match (3.13). */
.c-card, .p-card,
.p-workspaces_index_card, .p-workspace_card,
.p-team_card, .p-find_workspaces__card,
.p-signin_form, .p-signin_card,
.p-marketing_card, .p-banner,
.c-modal__content, .c-dialog__content {
    background-color: ${PALETTE.SURFACE} !important;
    border: 1px solid ${PALETTE.BORDER} !important;
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
}

/* Workspace tile hover */
.p-workspaces_index_card:hover, .p-workspace_card:hover,
.p-team_card:hover, .p-find_workspaces__card:hover {
    background-color: ${PALETTE.HOVER} !important;
}

/* Headings + body text (Rules.md 3.3 - paired color + -webkit-text-fill-color) */
h1, h2, h3, h4, h5, h6, p, span, label, li, td, th, dt, dd {
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
}

/* Muted / secondary text - enumerated Slack class hooks */
.c-fine_print, .p-fine_print, .p-marketing__subtitle,
.p-signin__hint, .c-secondary_text {
    color: ${PALETTE.TEXT_MUTED} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_MUTED} !important;
}

/* Anchors */
a, [role="link"] {
    color: ${PALETTE.LINK} !important;
    -webkit-text-fill-color: ${PALETTE.LINK} !important;
}
a:hover, a:focus-visible, [role="link"]:hover, [role="link"]:focus-visible {
    color: ${PALETTE.LINK_HOVER} !important;
    -webkit-text-fill-color: ${PALETTE.LINK_HOVER} !important;
}

/* Inputs / search */
input, textarea, select, [role="searchbox"], [role="combobox"], [role="textbox"] {
    background-color: #0a0f15 !important;
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
    border: 1px solid ${PALETTE.BORDER} !important;
    caret-color: ${PALETTE.TEXT_PRIMARY} !important;
}
::placeholder, ::-webkit-input-placeholder, ::-moz-placeholder, :-ms-input-placeholder {
    color: ${PALETTE.TEXT_MUTED} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_MUTED} !important;
    opacity: 1 !important;
}

/* Primary CTA buttons - preserve Slack brand green via revert */
.c-button--primary, .c-button--outline_destructive, .ladda-button,
button[data-qa="sign_in_button"],
.p-signin_form__submit_button {
    background-color: revert !important;
    background-image: revert !important;
    color: revert !important;
    -webkit-text-fill-color: revert !important;
    border-color: revert !important;
    filter: none !important;
}

/* Secondary / outlined buttons */
.c-button--outline, .c-button--default, .c-button--unstyled {
    background-color: ${PALETTE.HOVER} !important;
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
    border: 1px solid ${PALETTE.BORDER} !important;
}

/* Generic <button> fallback - only if not already a Slack class above */
button:not(.c-button--primary):not(.ladda-button):not([data-qa="sign_in_button"]) {
    background-color: ${PALETTE.HOVER} !important;
    color: ${PALETTE.TEXT_PRIMARY} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_PRIMARY} !important;
    border: 1px solid ${PALETTE.BORDER} !important;
}

/* Borders / dividers */
hr, .c-divider, .c-base_layout__divider {
    border-color: ${PALETTE.BORDER} !important;
    background-color: ${PALETTE.BORDER} !important;
}

/* Footer */
footer, .c-base_layout__footer, .p-marketing__footer {
    background-color: ${PALETTE.BODY} !important;
    color: ${PALETTE.TEXT_MUTED} !important;
    -webkit-text-fill-color: ${PALETTE.TEXT_MUTED} !important;
}

/* Focus ring - Kiro accent reserved for keyboard focus only (Rules.md 3.2) */
:focus-visible {
    outline: 2px solid ${PALETTE.KIRO_ACCENT} !important;
    outline-offset: 2px !important;
}

/* Scrollbar */
::-webkit-scrollbar { width: 10px !important; height: 10px !important; background: ${PALETTE.BODY} !important; }
::-webkit-scrollbar-track { background: ${PALETTE.BODY} !important; }
::-webkit-scrollbar-thumb { background: ${PALETTE.BORDER} !important; border-radius: 5px !important; }
::-webkit-scrollbar-thumb:hover { background: ${PALETTE.SCROLLBAR_THUMB_HOVER} !important; }
* { scrollbar-color: ${PALETTE.BORDER} ${PALETTE.BODY} !important; scrollbar-width: thin !important; }

/* === IMAGE-BEARING CARVE-OUT (Rules.md Section 3.13) ===
   Never strip background-image or repaint surfaces holding authored
   illustrations / avatars / workspace icons / emoji. */
[class*="userPhoto"], [class*="userImage"], [class*="userAvatar"],
[class*="badgePhoto"], [class*="profilePhoto"], [class*="profileImage"],
[class*="avatar"], [class*="Avatar"], [class*="thumbnail"], [class*="thumb"],
[class*="illustration"], [class*="Illustration"],
[class*="workspace_icon"], [class*="WorkspaceIcon"],
[class*="team_icon"], [class*="TeamIcon"],
[class*="emoji"], [class*="Emoji"] {
    background-color: revert !important;
    background-image: revert !important;
    filter: none !important;
}

/* === AUTHORED-CONTENT CARVE-OUT (Rules.md Section 3.12) ===
   Never paint behind iframes / objects / embeds. */
iframe, object, embed,
.frame, #player, #viewer, #viewerContainer, #pdfViewer {
    background-color: transparent !important;
    background-image: none !important;
}
:has(> iframe), :has(> object), :has(> embed) {
    background-color: transparent !important;
    background-image: none !important;
}

/* Slack logo SVG - render as primary text color so the black wordmark
   becomes light. Targeted at the actual Slack logo classes only, not
   every <svg> on the page. */
.c-slacklogo, .c-slacklogo *,
.p-marketing__logo, .p-marketing__logo *,
img[alt="Slack"], img[src*="slack-logo"] {
    color: ${PALETTE.TEXT_PRIMARY} !important;
    fill: ${PALETTE.TEXT_PRIMARY} !important;
}
.c-slacklogo path, .p-marketing__logo path {
    fill: ${PALETTE.TEXT_PRIMARY} !important;
}

/* Media exemption (Rules.md 3.3 - never alter img/video/canvas) */
img, video, canvas, picture, svg, iframe, object, embed {
    background-color: transparent !important;
    filter: none !important;
}
`;

    if (typeof globalThis !== 'undefined') {
        try {
            globalThis.__BARNSAWS_SLACK_DARK_MODE = Object.freeze({
                PALETTE: Object.freeze(PALETTE),
                STYLE_ID, STYLE_TEXT,
                MAX_INJECT_ATTEMPTS, MAX_OBSERVER_ATTACH_ATTEMPTS,
                OBSERVER_DEBOUNCE_MS, SAFETY_PASS_DELAYS_MS,
                SHADOW_PIERCE_DEPTH_LIMIT, SHADOW_PIERCE_HOST_LIMIT, SHADOW_PIERCE_TIMEOUT_MS,
                NUCLEAR_BG_BUCKET_HIGH, NUCLEAR_BG_BUCKET_MID, NUCLEAR_BG_BUCKET_LOW,
                NUCLEAR_TEXT_THRESHOLD, COLOR_SCHEME_DEADLINE_MS,
                EXCLUDED_TAGS,
                PLAYER_WRAPPER_SELECTOR, IMAGE_CARVE_OUT_SELECTOR,
                KIRO_ACCENT_RULES,
            });
        } catch (e) { /* noop */ }
    }

    let gmAddStyleInvoked = false;
    let frameworkHookInvoked = false;

    function nowMs() {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            return performance.now();
        }
        return Date.now();
    }

    function parseRgb(s) {
        if (typeof s !== 'string') return null;
        const m = /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*([\d.]+))?/i.exec(s);
        if (!m) return null;
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (a < 0.5) return null;
        return [Number(m[1]), Number(m[2]), Number(m[3])];
    }

    function luminance(r, g, b) {
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    function pickBackgroundBucket(L) {
        if (L > NUCLEAR_BG_BUCKET_HIGH) return PALETTE.BODY;
        if (L >= NUCLEAR_BG_BUCKET_MID && L <= NUCLEAR_BG_BUCKET_HIGH) return PALETTE.SURFACE;
        if (L >= NUCLEAR_BG_BUCKET_LOW && L <  NUCLEAR_BG_BUCKET_MID)  return PALETTE.HOVER;
        return null;
    }

    function isExcludedTag(el) {
        return !!(el && el.tagName && EXCLUDED_TAG_SET.has(el.tagName));
    }

    function isInsideExcluded(el) {
        for (let cur = el && el.parentElement; cur; cur = cur.parentElement) {
            if (cur.tagName && EXCLUDED_TAG_SET.has(cur.tagName)) return true;
        }
        return false;
    }

    function isInsidePlayerWrapper(el) {
        try {
            return !!(el && el.closest && el.closest(PLAYER_WRAPPER_SELECTOR));
        } catch (_) {
            return false;
        }
    }

    function isInsideImageCarveOut(el) {
        try {
            return !!(el && el.closest && el.closest(IMAGE_CARVE_OUT_SELECTOR));
        } catch (_) {
            return false;
        }
    }

    function isLinkElement(el) {
        try {
            return typeof el.matches === 'function' && el.matches('a, [role="link"]');
        } catch (_) {
            return false;
        }
    }

    function runFrameworkHook() {
        if (frameworkHookInvoked) return;
        frameworkHookInvoked = true;
        const start = nowMs();
        function applyOnce() {
            if (typeof document === 'undefined' || !document.documentElement) return false;
            try { document.documentElement.style.colorScheme = 'dark'; }
            catch (err) {
                try { console.warn('[Slack Dark Mode] colorScheme set failed', err && err.message); }
                catch (_) {}
            }
            return true;
        }
        function tryColorScheme() {
            if (applyOnce()) return;
            if (nowMs() - start >= COLOR_SCHEME_DEADLINE_MS) return;
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tryColorScheme);
            else if (typeof setTimeout === 'function') setTimeout(tryColorScheme, 0);
        }
        tryColorScheme();
    }

    // Source pattern: AWS Cloudscape Dark Mode Standard - CSS Injection
    function injectStyle() {
        const existingHead = (typeof document !== 'undefined' && document.head)
            ? document.head.querySelector('style#' + STYLE_ID) : null;
        const existingRoot = (typeof document !== 'undefined' && document.documentElement)
            ? document.documentElement.querySelector('style#' + STYLE_ID) : null;
        if (existingHead || existingRoot) {
            invokeGmAddStyleOnce();
            return;
        }
        let attempts = 0;
        function tryAppend() {
            attempts += 1;
            const parent =
                (typeof document !== 'undefined' && document.head) ||
                (typeof document !== 'undefined' && document.documentElement) || null;
            if (parent) {
                if (parent.querySelector('style#' + STYLE_ID)) {
                    invokeGmAddStyleOnce();
                    return;
                }
                try {
                    const styleEl = document.createElement('style');
                    styleEl.id = STYLE_ID;
                    styleEl.type = 'text/css';
                    styleEl.textContent = STYLE_TEXT;
                    parent.appendChild(styleEl);
                } catch (e) {
                    try { console.warn('[Slack Dark Mode] CSS injection failed:', e); } catch (_) {}
                }
                invokeGmAddStyleOnce();
                return;
            }
            if (attempts >= MAX_INJECT_ATTEMPTS) {
                try { console.warn('[Slack Dark Mode] CSS injection retry exhausted'); } catch (_) {}
                invokeGmAddStyleOnce();
                return;
            }
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tryAppend);
            else if (typeof setTimeout === 'function') setTimeout(tryAppend, 0);
        }
        tryAppend();
    }

    function invokeGmAddStyleOnce() {
        if (gmAddStyleInvoked) return;
        if (typeof GM_addStyle === 'function') {
            try { GM_addStyle(STYLE_TEXT); }
            catch (e) {
                try { console.warn('[Slack Dark Mode] GM_addStyle threw:', e); } catch (_) {}
            }
            gmAddStyleInvoked = true;
        }
    }

    // Source pattern: AWS Cloudscape Dark Mode Standard - JS Nuclear Pass
    function nuclearPass(root) {
        const scope = (root && typeof root.querySelectorAll === 'function')
            ? root : (typeof document !== 'undefined' ? document : null);
        if (!scope) return;
        let elements;
        try { elements = scope.querySelectorAll('*'); } catch (_) { return; }
        const compute = (typeof getComputedStyle === 'function') ? getComputedStyle : null;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (!el || !el.tagName) continue;
            if (isExcludedTag(el)) continue;
            if (isInsideExcluded(el)) continue;
            // Carve-outs (Rules.md 3.12 + 3.13)
            if (isInsidePlayerWrapper(el)) continue;
            if (isInsideImageCarveOut(el)) continue;
            try {
                const cs = compute ? compute(el) : null;
                if (!cs) continue;
                const bgRgb = parseRgb(cs.backgroundColor);
                if (bgRgb) {
                    const L = luminance(bgRgb[0], bgRgb[1], bgRgb[2]);
                    const target = pickBackgroundBucket(L);
                    if (target && el.style && typeof el.style.setProperty === 'function') {
                        el.style.setProperty('background-color', target, 'important');
                    }
                }
                const txtRgb = parseRgb(cs.color);
                if (txtRgb) {
                    const tL = luminance(txtRgb[0], txtRgb[1], txtRgb[2]);
                    if (tL < NUCLEAR_TEXT_THRESHOLD) {
                        const target = isLinkElement(el) ? PALETTE.LINK : PALETTE.TEXT_PRIMARY;
                        if (el.style && typeof el.style.setProperty === 'function') {
                            el.style.setProperty('color', target, 'important');
                            el.style.setProperty('-webkit-text-fill-color', target, 'important');
                        }
                    }
                }
            } catch (_) { /* swallow per-element */ }
        }
    }

    // Source pattern: AWS Cloudscape Dark Mode Standard - Top-Bar Detection
    // The top bar paints HOVER (#232b37), one shade lighter than body, so the
    // black Slack wordmark SVG is visible without inverting the SVG itself.
    function topBarDetector(root) {
        const scope = (root && typeof root.querySelectorAll === 'function')
            ? root : (typeof document !== 'undefined' ? document : null);
        if (!scope) return;
        const compute = (typeof getComputedStyle === 'function') ? getComputedStyle : null;
        const candidates = new Set();
        try {
            scope.querySelectorAll(
                'header, nav, [role="banner"], .c-base_layout__header, .p-page_header, .p-top_nav, .p-client_header, .p-workspace_header, .p-team_directory_header'
            ).forEach((el) => candidates.add(el));
        } catch (_) {}
        try {
            const all = scope.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
                const el = all[i];
                try {
                    const cs = compute ? compute(el) : null;
                    if (!cs) continue;
                    const pos = cs.position;
                    if (pos !== 'fixed' && pos !== 'sticky' && pos !== 'absolute') continue;
                    if (typeof el.getBoundingClientRect !== 'function') continue;
                    const rect = el.getBoundingClientRect();
                    if (rect && rect.top < 100) candidates.add(el);
                } catch (_) {}
            }
        } catch (_) {}
        candidates.forEach((el) => {
            if (isInsidePlayerWrapper(el)) return;
            if (isInsideImageCarveOut(el)) return;
            try {
                if (el.style && typeof el.style.setProperty === 'function') {
                    el.style.setProperty('background-color', PALETTE.HOVER, 'important');
                }
                let descendants;
                try { descendants = el.querySelectorAll('*'); } catch (_) { descendants = []; }
                for (let i = 0; i < descendants.length; i++) {
                    const desc = descendants[i];
                    if (!desc || !desc.tagName) continue;
                    if (TOP_BAR_DESCENDANT_EXCLUDED.has(desc.tagName)) continue;
                    if (isInsidePlayerWrapper(desc)) continue;
                    if (isInsideImageCarveOut(desc)) continue;
                    try {
                        if (desc.style && typeof desc.style.setProperty === 'function') {
                            desc.style.setProperty('color', PALETTE.TEXT_PRIMARY, 'important');
                            desc.style.setProperty('-webkit-text-fill-color', PALETTE.TEXT_PRIMARY, 'important');
                        }
                    } catch (_) {}
                }
            } catch (_) {}
        });
    }

    function shadowPierce(root) {
        const startedAt = nowMs();
        let hostsVisited = 0;
        let warned = false;
        function warnOnce(msg) {
            if (warned) return;
            warned = true;
            try { console.warn(msg); } catch (_) {}
        }
        function walk(scope, depth) {
            if (!scope || depth >= SHADOW_PIERCE_DEPTH_LIMIT) return;
            if (nowMs() - startedAt >= SHADOW_PIERCE_TIMEOUT_MS) {
                warnOnce('[Slack Dark Mode] shadow-pierce time bound reached');
                return;
            }
            if (hostsVisited >= SHADOW_PIERCE_HOST_LIMIT) {
                warnOnce('[Slack Dark Mode] shadow-pierce host bound reached');
                return;
            }
            let allEls;
            try { allEls = scope.querySelectorAll('*'); } catch (_) { return; }
            for (let i = 0; i < allEls.length; i++) {
                const host = allEls[i];
                if (!host) continue;
                let sr;
                try { sr = host.shadowRoot; } catch (_) { sr = null; }
                if (!sr) continue;
                hostsVisited += 1;
                if (hostsVisited > SHADOW_PIERCE_HOST_LIMIT) {
                    warnOnce('[Slack Dark Mode] shadow-pierce host bound reached');
                    return;
                }
                let existing = null;
                try { existing = sr.querySelector && sr.querySelector('style#' + STYLE_ID); }
                catch (_) { existing = null; }
                if (!existing) {
                    try {
                        const styleEl = document.createElement('style');
                        styleEl.id = STYLE_ID;
                        styleEl.type = 'text/css';
                        styleEl.textContent = STYLE_TEXT;
                        sr.appendChild(styleEl);
                    } catch (_) {}
                }
                try { nuclearPass(sr); }
                catch (e) {
                    try { console.warn('[Slack Dark Mode] shadow nuclear failed', e); } catch (_) {}
                }
                walk(sr, depth + 1);
            }
        }
        walk((root && typeof root.querySelectorAll === 'function')
            ? root : (typeof document !== 'undefined' ? document : null), 0);
    }

    function runCombinedPass() {
        try { nuclearPass(typeof document !== 'undefined' ? document : null); }
        catch (e) { try { console.warn('[Slack Dark Mode] nuclearPass failed', e); } catch (_) {} }
        try { topBarDetector(typeof document !== 'undefined' ? document : null); }
        catch (e) { try { console.warn('[Slack Dark Mode] topBarDetector failed', e); } catch (_) {} }
        try { shadowPierce(typeof document !== 'undefined' ? document : null); }
        catch (e) { try { console.warn('[Slack Dark Mode] shadowPierce failed', e); } catch (_) {} }
    }

    // Source pattern: AWS Cloudscape Dark Mode Standard - Observer Pattern
    function attachObserver() {
        let timer = null;
        let attempts = 0;
        function scheduleDebouncedPass() {
            if (timer != null) return;
            const fire = () => { timer = null; runCombinedPass(); };
            if (typeof setTimeout !== 'function') { fire(); return; }
            timer = setTimeout(fire, OBSERVER_DEBOUNCE_MS);
        }
        function tryAttach() {
            attempts += 1;
            const target =
                (typeof document !== 'undefined' && document.documentElement) ||
                (typeof document !== 'undefined' && document.body) || null;
            if (target) {
                if (typeof MutationObserver !== 'function') {
                    try { console.warn('[Slack Dark Mode] MutationObserver unavailable'); } catch (_) {}
                    return;
                }
                try {
                    new MutationObserver(scheduleDebouncedPass).observe(target, {
                        childList: true, subtree: true, attributes: true,
                        attributeFilter: ['style', 'class', 'id'],
                    });
                } catch (e) {
                    try { console.warn('[Slack Dark Mode] observer attach failed', e && e.message); } catch (_) {}
                }
                return;
            }
            if (attempts >= MAX_OBSERVER_ATTACH_ATTEMPTS) {
                try { console.warn('[Slack Dark Mode] observer attach retry exhausted'); } catch (_) {}
                return;
            }
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tryAttach);
            else if (typeof setTimeout === 'function') setTimeout(tryAttach, 0);
        }
        tryAttach();
    }

    function safetyPass() { runCombinedPass(); }

    function scheduleSafetyPassesNow() {
        if (typeof setTimeout !== 'function') return;
        for (let i = 0; i < SAFETY_PASS_DELAYS_MS.length; i++) {
            try { setTimeout(safetyPass, SAFETY_PASS_DELAYS_MS[i]); } catch (_) {}
        }
    }

    function registerSafetyPasses() {
        if (typeof window === 'undefined') return;
        if (typeof document !== 'undefined' && document.readyState === 'complete') {
            scheduleSafetyPassesNow();
            return;
        }
        try { window.addEventListener('load', scheduleSafetyPassesNow, { once: true }); }
        catch (_) {
            try { window.addEventListener('load', scheduleSafetyPassesNow); } catch (_) {}
        }
    }

    runFrameworkHook();
    injectStyle();
    attachObserver();
    registerSafetyPasses();

    if (typeof globalThis !== 'undefined') {
        try {
            const o = globalThis.__BARNSAWS_SLACK_DARK_MODE || {};
            globalThis.__BARNSAWS_SLACK_DARK_MODE = Object.freeze(
                Object.assign({}, o, {
                    runCombinedPass, nuclearPass, topBarDetector, shadowPierce, safetyPass,
                    pickBackgroundBucket, parseRgb, luminance,
                    isExcludedTag, isInsideExcluded, isInsidePlayerWrapper, isInsideImageCarveOut,
                }),
            );
        } catch (_) {}
    }
})();
