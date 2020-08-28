// ==UserScript==
// @name         Oodi++ (automatic update check)
// @namespace    https://purkka.codes/
// @version      __VERSION__
// @description  Efficiently plan your timetable right in Oodi and export it to your calendar.
// @author       PurkkaKoodari
// @include      https://oodi.aalto.fi/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      purkka.codes
// @require      https://code.jquery.com/jquery-3.5.1.min.js#sha256=f7f6a5894f1d19ddad6fa392b2ece2c5e578cbf7da4ea805b6885eb6985b6e3d
// ==/UserScript==

const UPDATE_URL = "https://purkka.codes/oodi/oodiplusplus.autocheck.user.js"
// check up to every 4 hours when checks succeed
const SUCCESS_UPDATE_INTERVAL = 4 * 60 * 60 * 1000
// recheck in 15 minutes when checks fail
const FAILED_UPDATE_INTERVAL = 15 * 60 * 1000

const isNewer = (ours, upstream) => {
    const ourVersion = ours.split(/\./g)
    const upstreamVersion = upstream.split(/\./g)
    for (let i = 0; i < ourVersion.length && i < upstreamVersion.length; i++) {
        if (+upstreamVersion[i] > +ourVersion[i]) return true
        if (+upstreamVersion[i] < +ourVersion[i]) return false
    }
    if (upstreamVersion.length > ourVersion.length) return true
    return false
}

const scheduleNextUpdateCheck = (success, version = "0.0") => {
    GM_setValue("lastUpdateCheck", {
        last: Date.now(),
        next: Date.now() + (success ? SUCCESS_UPDATE_INTERVAL : FAILED_UPDATE_INTERVAL),
        version,
    })
}

let $updateCheckState

const initUpdateCheck = () => {
    if (typeof GM_xmlhttpRequest !== "function" || typeof GM_setValue !== "function" || typeof GM_getValue !== "function") return

    // add update check info in sidebar
    $updateCheckState = $.make("div")
    const $updateCheckInfo = $.make("div")
            .addClass("opp-update-check")
            .append($updateCheckState)
            .append(
                $.make("button")
                        .attr("type", "button")
                        .text("Check")
                        .click(checkVersionOnline)
            )
    $releaseNotes.before($updateCheckInfo)

    // don't make a server request every time to save bandwidth
    const lastUpdateCheck = GM_getValue("lastUpdateCheck", null)
    if (lastUpdateCheck === null || Date.now() > lastUpdateCheck.next) {
        checkVersionOnline()
    } else {
        checkVersion(lastUpdateCheck.version)
        $updateCheckState.text(`Last update check: ${new Date(lastUpdateCheck.last).toLocaleString(language)}`)
    }
}

const checkVersionOnline = () => {
    $updateCheckState.text(`Checking for update\u2026`)
    // load script file from server
    GM_xmlhttpRequest({
        method: "GET",
        url: `${UPDATE_URL}?_=${Date.now()}`,
        nocache: true,
        anonymous: true,
        onload({ responseText }) {
            // parse @version from metadata block
            const versionMatch = /\/\/ @version\s+([0-9.]+)/.exec(responseText)
            if (!versionMatch) {
                console.error("Oodi++ update check failed: invalid userscript received")
                $updateCheckState.text("Update check failed.")
                scheduleNextUpdateCheck(false)
                return
            }
            scheduleNextUpdateCheck(true, versionMatch[1])
            $updateCheckState.text(`Last update check: ${new Date().toLocaleString(language)}`)
            checkVersion(versionMatch[1])
        },
        onerror() {
            console.error("Oodi++ update check failed: request failed")
            $updateCheckState.text("Update check failed.")
            scheduleNextUpdateCheck(false)
        }
    })
}

const checkVersion = upstreamVersion => {
    // remove old update info
    $sidebarHeader.find(".opp-new-version").remove()

    // add update info if a new version is available
    if (isNewer(GM_info.script.version, upstreamVersion)) {
        const $updateInfo = $.make("div").addClass("opp-new-version").append(
            $.make("h3")
                    .addClass("opp-alert-text")
                    .text(`A new version of Oodi++ is available: ${upstreamVersion}!`)
        ).append(
            $.make("div")
                    .append("Click here to install it, then refresh the page: ")
                    .append(
                        $.make("a")
                                .attr("href", UPDATE_URL)
                                .attr("target", "_blank")
                                .text(UPDATE_URL)
                    )
        )
        $sidebarHeader.prepend($updateInfo)
        requestSidebarFocus()
    }
}
