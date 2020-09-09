// styles.ts: stylesheet for the app

import $ from "jquery"

type Theme = Readonly<{
    background: string
    text: string
    linkText: string
    alertText: string
    successText: string

    settingsBackground: string
    settingsBorder: string

    buttonBackground: string
    buttonBorder: string
    buttonText: string
    buttonHoverBackground: string
    buttonActiveBackground: string

    tooltipBackground: string
    tooltipBorder: string
    tooltipText: string

    scheduleBoxBorder: string
    scheduleBoxHoverBackground: string
    scheduleBoxRemoveBackground: string
}>

export const THEMES: MapObj<Theme> = {
    light: {
        background: "#fff",
        text: "#000",
        linkText: "#223",
        alertText: "#a00",
        successText: "#0a0",

        settingsBackground: "#f3f3f3",
        settingsBorder: "#000",

        buttonBackground: "#eee",
        buttonBorder: "#000",
        buttonText: "#000",
        buttonHoverBackground: "#f3f3f3",
        buttonActiveBackground: "#ccf",

        tooltipBackground: "#fff",
        tooltipBorder: "#000",
        tooltipText: "#000",

        scheduleBoxBorder: "#000",
        scheduleBoxHoverBackground: "#ccf",
        scheduleBoxRemoveBackground: "#fcc",
    },
    dark: {
        background: "#080808",
        text: "#fff",
        linkText: "#ccd",
        alertText: "#f44",
        successText: "#1d1",

        settingsBackground: "#111",
        settingsBorder: "#fff",

        buttonBackground: "#333",
        buttonBorder: "#ccc",
        buttonText: "#fff",
        buttonHoverBackground: "#444",
        buttonActiveBackground: "#449",

        tooltipBackground: "#080808",
        tooltipBorder: "#ccc",
        tooltipText: "#fff",

        scheduleBoxBorder: "#fff",
        scheduleBoxHoverBackground: "#118",
        scheduleBoxRemoveBackground: "#600",
    },
}



/** The <style> element currently inserted by GM_addStyle. */
let themeStyle: HTMLStyleElement | null = null
/** The name of the current theme. */
let currentTheme: string

export function setTheme(themeName: string) {
    currentTheme = themeName
    if (typeof GM_setValue === "function") GM_setValue("currentTheme", themeName)
    const theme = THEMES[themeName]

    $(themeStyle as HTMLStyleElement).remove()
    themeStyle = GM_addStyle(`
/* hack the layout to be responsive so that it can take our sidebar */
#menu {
    position: sticky !important; /* sticky top bar - keeps the look but without fixed height */
}
.menu-topbar {
    position: static !important; /* this is normally absolute-positioned, but we need it to consume space */
    padding-right: 32px !important; /* make space for the sidebar button */
}
.menu-topbar, .menu-content-wrapper {
    height: auto !important; /* un-fix the heights of the blue top bar */
}
.menu-nav {
    position: static !important; /* this is normally relative-positioned to clear .menu-topbar, but we no longer need to */
}
.menu-content-wrapper, .menu-nav-list {
    display: flex !important; /* make the blue top bar & top nav items wrap if necessary */
    flex-wrap: wrap !important;
}
#body-wrapper {
    margin-top: 0 !important; /* we no longer need a top margin because we changed fixed positioning to sticky */
}
.usermenu__dropdown {
    position: absolute !important; /* make the user dropdown menu appear on top of the top bars instead of enlarging them */
    top: 100% !important;
    background: #0f3a58 !important;
    z-index: 1000 !important;
    padding: 0 10px 10px !important;
}

/* styles for classes injected to opettaptied.jsp */
.opp-hovered-activity {
    background: #ccf;
}
.opp-hovered-activity td, .opp-hovered-activity table {
    background: transparent !important;
}
.opp-activity-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

/* styles for the sidebar container itself */
.opp-body-wrapper {
    position: relative;
    z-index: 0;
    height: 100vh;
    overflow: auto;
    transition: margin-right 0.3s ease;
}
.opp-sidebar-wrapper {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000;
    height: 100vh;
    transition: width 0.3s ease;
    margin: 0;
    padding: 0;
    border-left: 1px solid #000;
    background: ${theme.background};
    font-size: 14px;
}
body.opp-sidebar-closed .opp-body-wrapper {
    margin-right: 0 !important; /* override value set by JS */
}
body.opp-sidebar-closed .opp-sidebar-wrapper {
    width: 0 !important; /* override value set by JS */
}
body.opp-sidebar-resizing .opp-body-wrapper, body.opp-sidebar-resizing .opp-sidebar-wrapper {
    transition: none;
}
.opp-sidebar-content {
    height: 100vh;
    padding: 0 10px;
    box-sizing: border-box;
    overflow: hidden auto;
}
.opp-sidebar-buttons {
    position: absolute;
    right: 100%;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}
.opp-sidebar-buttons button {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #000;
    border-right: none;
    border-radius: 5px 0 0 5px;
    background: #fff; /* intentionally not styled to match main Oodi side of page */
    color: #000;
    font-size: 14px;
    width: 18px;
    box-sizing: content-box;
}
.opp-sidebar-opener {
    writing-mode: vertical-rl;
    cursor: pointer;
}
.opp-sidebar-resizer {
    cursor: ew-resize;
}
@keyframes opp-sidebar-opener-alert {
    0% {
        background: #fff;
        padding: 10px 10px;
    }
    50% {
        background: #ccf;
        padding: 10px 12px;
    }
    100% {
        background: #fff;
        padding: 10px 10px;
    }
}
.opp-sidebar-opener.opp-alert {
    animation: 1s infinite ease opp-sidebar-opener-alert;
}

/* general styles for sidebar contents */
.opp-sidebar-content, .opp-sidebar-content h2, .opp-sidebar-content h3, .opp-sidebar-content h4, .opp-sidebar-content p, .opp-sidebar-content li {
    color: ${theme.text};
}
.opp-sidebar-content a:link, .opp-sidebar-content a:visited, .opp-sidebar-content a:active {
    color: ${theme.linkText};
}
.opp-sidebar-content h2 {
    font-size: 1.4em;
    margin: 0.4em 0;
}
.opp-sidebar-content h3 {
    font-size: 1.25em;
    margin: 0.5em 0;
}
.opp-sidebar-content h4 {
    font-size: 1.1em;
    margin: 0.6em 0;
}
.opp-sidebar-content p {
    margin: 0.7em 0;
    padding: 0;
}
.opp-sidebar-content ul {
    margin: 0.7em 0;
    padding: 0 0 0 2em;
}
.opp-sidebar-content button {
    font-size: 14px;
    background: ${theme.buttonBackground};
    color: ${theme.buttonText};
    border: 1px solid ${theme.buttonBorder};
    cursor: pointer;
}
.opp-sidebar-content button:hover {
    background: ${theme.buttonHoverBackground};
}
.opp-sidebar-content button.opp-active {
    background: ${theme.buttonActiveBackground};
}
.opp-sidebar-content .opp-alert-text {
    font-weight: bold;
    color: ${theme.alertText};
}
.opp-sidebar-content .opp-success-text {
    font-weight: bold;
    color: ${theme.successText};
}

/* styles for sidebar header/release notes/settings */
.opp-sidebar-header {
    margin-bottom: 10px;
}
.opp-sidebar-header .opp-header, .opp-update-check {
    display: flex;
    align-items: baseline;
}
.opp-sidebar-header .opp-header :first-child, .opp-update-check :first-child {
    flex-grow: 1;
}
.opp-update-check {
    margin-bottom: 10px;
}
.opp-sidebar-header .opp-header button {
    margin-left: 10px;
}
.opp-settings-wrapper {
    height: 0;
    overflow: hidden;
}
.opp-settings-wrapper.opp-open {
    height: auto;
}
.opp-about, .opp-release-notes, .opp-settings {
    padding: 0 10px;
    margin-bottom: 10px;
    background: ${theme.settingsBackground};
    border: 1px solid ${theme.settingsBorder};
}
.opp-settings .opp-horizontal, .opp-settings .opp-vertical {
    display: flex;
    margin: 10px 0;
}
.opp-settings .opp-horizontal {
    flex-wrap: wrap;
    align-items: baseline;
}
.opp-settings .opp-horizontal > * {
    margin: 0 5px 5px 0;
}
.opp-settings .opp-vertical {
    align-items: stretch;
    flex-direction: column;
}
.opp-settings .opp-vertical > * {
    margin: 0 0 5px 0;
}
.opp-settings .opp-vertical > button {
    align-self: flex-start;
}
.opp-settings fieldset {
    border: 1px solid ${theme.buttonBorder};
}
.opp-settings textarea {
    resize: vertical;
}
.opp-help-tooltip {
    display: inline-block;
    width: 1.2em;
    height: 1.2em;
    margin-left: 5px;
    line-height: 1.2em;
    text-align: center;
    border-radius: 100%;
    border: 1px solid ${theme.buttonBorder};
    background: ${theme.buttonBackground};
    color: ${theme.buttonText};
    cursor: help;
}

/* styles for schedule actions */
.opp-schedule-actions {
    position: sticky;
    top: 0;
    z-index: 2000;
    margin: 0 -10px -10px;
    padding: 10px;
    background: ${theme.background};
}
.opp-schedule-action-buttons {
    display: flex;
}
.opp-schedule-action-buttons > * {
    margin-right: 5px;
}
.opp-color-picker-wrapper {
    max-height: 0;
    transition: max-height 0.3s ease;
    overflow: hidden;
}
.opp-color-picker-wrapper.opp-open {
    max-height: 130px;
}
.opp-color-picker-wrapper .opp-color-picker {
    margin-top: 10px;
}
.opp-color-picker-wrapper .opp-color-picker-special {
    display: flex;
    margin-top: 5px;
    padding-left: 5px;
}
.opp-color-picker-wrapper .opp-color-picker-special button {
    flex: 1 1 0;
    margin-right: 5px;
}

/* styles for schedule view */
.opp-schedule {
    position: relative;
    margin: 0 -10px;
}
.opp-schedule > div {
    position: absolute;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    border: 1px solid ${theme.scheduleBoxBorder};
    overflow: hidden;
}
.opp-schedule .opp-hour, .opp-schedule .opp-day {
    font-weight: bold;
}
.opp-schedule .opp-activity > * {
    color: inherit !important;
    background: none !important;
    overflow: hidden;
    overflow-wrap: anywhere;
    hyphens: auto;
}
.opp-schedule .opp-activity > span {
    flex: 0 1 auto;
}
.opp-schedule-view.opp-action-remove .opp-activity, .opp-schedule-view.opp-action-color .opp-activity {
    cursor: pointer;
}
.opp-schedule-view.opp-action-remove .opp-activity > a, .opp-schedule-view.opp-action-color .opp-activity > a {
    pointer-events: none;
}
@keyframes opp-schedule-hovered-activity {
    0% {
        opacity: 0.75;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.75;
    }
}
.opp-schedule-view .opp-activity.opp-hovered {
    animation: 1s infinite ease opp-schedule-hovered-activity;
}
.opp-schedule-view.opp-action-none .opp-activity.opp-hovered {
    background-color: ${theme.scheduleBoxHoverBackground}; /* don't override colored activities */
    color: ${theme.text};
}
.opp-schedule-view.opp-action-remove .opp-activity.opp-hovered {
    background-color: ${theme.scheduleBoxRemoveBackground} !important; /* override colored activities */
    color: ${theme.text} !important;
}
.opp-schedule-view.opp-action-color.opp-color-remove .opp-activity.opp-hovered {
    background-color: transparent !important; /* override colored activities */
    color: ${theme.text} !important;
}
.opp-schedule .opp-activity .opp-outdated-indicator {
    position: absolute;
    right: 0;
    bottom: 0;
    border: solid ${theme.scheduleBoxBorder};
    border-width: 1px 0 0 1px;
    background: ${theme.background};
    font-size: 1.2em;
    line-height: 1;
    padding: 5px;
    cursor: help;
}

/* styles for the color picker */
.opp-color-picker {
    display: grid;
    grid-template-columns: auto 80px;
    grid-template-rows: 1fr 1fr 1fr;
    grid-gap: 10px 5px;
    padding: 5px 5px 5px 0;
    height: 90px;
    box-sizing: border-box;
    user-select: none;
}
.opp-color-slider {
    grid-column: 1;
}
.opp-color-slider .opp-color-slider-bg {
    position: relative;
    margin: 0 5px;
    height: 20px;
    border: 1px solid ${theme.buttonBorder};
    box-sizing: border-box;
    cursor: crosshair;
}
.opp-color-slider .opp-color-slider-handle {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 9px;
    transform: translateX(-50%);
    pointer-events: none;
    background: ${theme.buttonBackground};
    border: 1px solid ${theme.buttonBorder};
    box-sizing: border-box;
}
.opp-color-chosen {
    grid-column: 2;
    grid-row: 1/4;
}

/* styles for tooltip */
.opp-tooltip {
    position: fixed;
    z-index: 3000;
    max-width: 400px;
    border: 1px solid ${theme.tooltipBorder};
    padding: 10px;
    box-sizing: border-box;
    font-size: 14px;
    background: ${theme.tooltipBackground};
    color: ${theme.tooltipText};
    white-space: pre-line;
    pointer-events: none;
}
    `)
}

/** Gets the current theme name. */
export function getTheme() {
    return currentTheme
}

// load current theme setting
let loadedTheme = typeof GM_getValue === "function" ? GM_getValue("currentTheme") : null
// default to light theme to match Oodi UI
if (!(loadedTheme in THEMES)) loadedTheme = "light"
setTheme(loadedTheme)

// flatten the blue top bar into the flex to make it flow nicer
$(".menu-content-wrapper").append($(".menu-topbar-actions-wrapper").children())
