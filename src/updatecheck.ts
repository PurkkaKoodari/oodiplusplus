// updatecheck.ts

import {requestSidebarFocus} from "./sidebar"
import {language, loc, locf} from "./locales"
import {$releaseNotes} from "./settings"
import {$make} from "./utils"

/** URL of the built script upstream. */
const UPDATE_URL = "https://purkka.codes/oodi/oodiplusplus.autocheck.user.js"

/** Updates are checked up to every 4 hours when the requests succeed. */
const SUCCESS_UPDATE_INTERVAL = 4 * 60 * 60 * 1000
/** Updates are checked up to every 15 minutes when the requests fail. */
const FAILED_UPDATE_INTERVAL = 15 * 60 * 1000

/** Compares two version strings and returns if the upstream one is newer. */
function isNewer(ours: string, upstream: string) {
    const ourVersion = ours.split(/\./g)
    const upstreamVersion = upstream.split(/\./g)
    for (let i = 0; i < ourVersion.length && i < upstreamVersion.length; i++) {
        if (+upstreamVersion[i] > +ourVersion[i]) return true
        if (+upstreamVersion[i] < +ourVersion[i]) return false
    }
    if (upstreamVersion.length > ourVersion.length) return true
    return false
}

/** Saves the time of the next update check in the future. */
function scheduleNextUpdateCheck(success: boolean, version: string = "0.0") {
    typeof GM_setValue === "function" && GM_setValue("lastUpdateCheck", {
        last: Date.now(),
        next: Date.now() + (success ? SUCCESS_UPDATE_INTERVAL : FAILED_UPDATE_INTERVAL),
        version,
    })
}

/** Shows the update-check state string. */
const $updateCheckState = $make("div")

/** The bar containing $updateCheckState and the Check button. */
export const $updateCheckInfo = $make("div")
        .addClass("opp-update-check")
        .append($updateCheckState)
        .append(
            $make("button")
                    .attr("type", "button")
                    .text(loc`update.check`)
                    .click(checkVersionOnline)
        )

/** Shows the notification about a new version. */
export const $newVersionInfo = $make("div")
        .addClass("opp-new-version")
        .hide()

/** Adds update things to UI and checks for an update, reusing a previous version check if it's fresh enough. */
export function initUpdateCheck() {
    if (typeof GM_xmlhttpRequest !== "function" || typeof GM_setValue !== "function" || typeof GM_getValue !== "function") return

    $releaseNotes.before($newVersionInfo, $updateCheckInfo)

    // don't make a server request every time to save bandwidth
    const lastUpdateCheck = GM_getValue("lastUpdateCheck", null)
    if (lastUpdateCheck === null || Date.now() > lastUpdateCheck.next) {
        checkVersionOnline()
    } else {
        upstreamVersionReceived(lastUpdateCheck.version)
        $updateCheckState.text(locf`update.lastCheck`(new Date(lastUpdateCheck.last).toLocaleString(language)))
    }
}

/** Forces a check of the latest upstream version. */
function checkVersionOnline() {
    $updateCheckState.text(loc`update.checking`)
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
                $updateCheckState.text(loc`update.failed`)
                scheduleNextUpdateCheck(false)
                return
            }
            scheduleNextUpdateCheck(true, versionMatch[1])
            $updateCheckState.text(locf`update.lastCheck`(new Date().toLocaleString(language)))
            upstreamVersionReceived(versionMatch[1])
        },
        onerror() {
            console.error("Oodi++ update check failed: request failed")
            $updateCheckState.text(loc`update.failed`)
            scheduleNextUpdateCheck(false)
        }
    })
}

/** Adds notification of new version to sidebar if applicable. */
function upstreamVersionReceived(upstreamVersion: string) {
    // remove old update info
    $newVersionInfo.empty().hide()

    // add update info if a new version is available
    if (isNewer(VERSION, upstreamVersion)) {
        $newVersionInfo
                .append(
                    $make("h3")
                            .addClass("opp-alert-text")
                            .text(locf`update.available`(upstreamVersion))
                )
                .append(
                    $make("div")
                            .append(loc`update.install`)
                            .append(
                                $make("a")
                                        .attr("href", UPDATE_URL)
                                        .attr("target", "_blank")
                                        .text(UPDATE_URL)
                            )
                )
                .show()
        requestSidebarFocus()
    }
}
