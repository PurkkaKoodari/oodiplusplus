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
    scheduleBoxHoverBackground1: string
    scheduleBoxHoverBackground2: string
    scheduleBoxRemoveBackground1: string
    scheduleBoxRemoveBackground2: string
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
        scheduleBoxHoverBackground1: "#eef",
        scheduleBoxHoverBackground2: "#ccf",
        scheduleBoxRemoveBackground1: "#fee",
        scheduleBoxRemoveBackground2: "#fcc",
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
        scheduleBoxHoverBackground1: "#006",
        scheduleBoxHoverBackground2: "#118",
        scheduleBoxRemoveBackground1: "#400",
        scheduleBoxRemoveBackground2: "#600",
    },
}



/** The <style> element currently inserted by GM_addStyle. */
let themeStyle: HTMLStyleElement | null = null
/** The name of the current theme. */
let currentTheme: string

export function setTheme(themeName: string) {
    currentTheme = themeName
    GM_setValue("currentTheme", themeName)
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
body.opp-sidebar-open .opp-body-wrapper {
    margin-right: 540px;
}
.opp-sidebar-wrapper {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000;
    height: 100vh;
    width: 0;
    transition: width 0.3s ease;
    margin: 0;
    padding: 0;
    border-left: 1px solid #000;
    background: ${theme.background};
    font-size: 14px;
}
body.opp-sidebar-open .opp-sidebar-wrapper {
    width: 540px;
}
.opp-sidebar-content {
    width: 540px;
    height: 100vh;
    padding: 0 10px;
    box-sizing: border-box;
    overflow: hidden auto;
}
.opp-sidebar-opener {
    position: absolute;
    right: 100%;
    top: 10px;
    padding: 10px;
    border: 1px solid #000;
    border-right: none;
    border-radius: 5px 0 0 5px;
    background: #fff; /* intentionally not styled to match main Oodi side of page */
    color: #000;
    font-size: 14px;
    writing-mode: vertical-rl;
    cursor: pointer;
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
.opp-release-notes, .opp-settings {
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
    align-items: flex-start;
}
.opp-settings .opp-vertical > div {
    display: flex;
    flex-direction: column;
    flex: 1;
}
.opp-settings .opp-vertical > div > * {
    margin: 0 0 5px 0;
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

/* styles for schedule view */
.opp-schedule-actions {
    position: sticky;
    top: 0;
    z-index: 2000;
    display: flex;
    margin: 0 -10px -10px;
    padding: 10px;
    background: ${theme.background};
}
.opp-schedule-actions > * {
    margin-right: 5px;
}
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
.opp-schedule .opp-activity > span {
    overflow: hidden;
    overflow-wrap: anywhere;
    hyphens: auto;
    flex: 0 1 auto;
}
@keyframes opp-schedule-hovered-activity {
    0% {
        background: ${theme.scheduleBoxHoverBackground1};
    }
    50% {
        background: ${theme.scheduleBoxHoverBackground2};
    }
    100% {
        background: ${theme.scheduleBoxHoverBackground1};
    }
}
.opp-schedule .opp-activity.opp-hovered {
    animation: 1s infinite ease opp-schedule-hovered-activity;
}
@keyframes opp-schedule-hovered-activity-remove {
    0% {
        background: ${theme.scheduleBoxRemoveBackground1};
    }
    50% {
        background: ${theme.scheduleBoxRemoveBackground2};
    }
    100% {
        background: ${theme.scheduleBoxRemoveBackground1};
    }
}
.opp-schedule-view.opp-action-remove .opp-activity.opp-hovered {
    animation: 1s infinite ease opp-schedule-hovered-activity-remove;
    cursor: pointer;
}
.opp-schedule-view.opp-action-remove .opp-activity a {
    pointer-events: none;
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
