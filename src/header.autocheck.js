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

const scheduleNextUpdateCheck = (success, version) => {
    GM_setValue("lastUpdateCheck", {
        next: Date.now() + (success ? SUCCESS_UPDATE_INTERVAL : FAILED_UPDATE_INTERVAL),
        version,
    })
}

const updateCheck = () => {
    if (typeof GM_xmlhttpRequest !== "function" || typeof GM_setValue !== "function" || typeof GM_getValue !== "function") return
    // don't make a server request every time to save bandwidth
    const lastUpdateCheck = GM_getValue("lastUpdateCheck", null)
    if (lastUpdateCheck === null || Date.now() > lastUpdateCheck.next) {
        GM_xmlhttpRequest({
            method: "GET",
            url: UPDATE_URL,
            anonymous: true,
            onload({ responseText }) {
                const versionMatch = /\/\/ @version\s+([0-9.]+)/.exec(responseText)
                if (!versionMatch) {
                    console.error("Oodi++ update check failed: invalid userscript received")
                    scheduleNextUpdateCheck(false, "0.0")
                    return
                }
                scheduleNextUpdateCheck(true, versionMatch[1])
                checkVersion(versionMatch[1])
            },
            onerror() {
                console.error("Oodi++ update check failed: request failed")
                scheduleNextUpdateCheck(false, "0.0")
            }
        })
    } else {
        checkVersion(lastUpdateCheck.version)
    }
}

const checkVersion = upstreamVersion => {
    if (isNewer(GM_info.script.version, upstreamVersion)) {
        const $updateInfo = $.make("div").addClass("opp-new-version").append(
            $.make("h3").text("A new version of Oodi++ is available!")
        ).append(
            $.make("div")
                    .append("Click here to install it: ")
                    .append(
                        $.make("a")
                                .attr("href", UPDATE_URL)
                                .attr("target", "_blank")
                                .text(UPDATE_URL)
                    )
        )
        $sidebarContent.prepend($updateInfo)
        requestSidebarFocus()
    }
}
