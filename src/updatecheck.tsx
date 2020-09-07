// updatecheck.tsx: auto update check code

import {h, Fragment} from "preact"
import {useState, useEffect} from "preact/hooks"

import {requestSidebarFocus} from "./sidebar"
import {loc, locale, locf} from "./locales"
import {setUpdateCheckComponent} from "./settings"

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

/**
 * Plugs the update check component into the settings.
 * This is done here to ensure that nothing depends on updatecheck for tinfoil builds.
 */
export function initUpdateCheck() {
    setUpdateCheckComponent(UpdateCheck)
}

function UpdateCheck() {
    const [upstreamVersion, setUpstreamVersion] = useState("0.0")
    const [status, setStatus] = useState("")
    const [forcedCheck, setForcedCheck] = useState<{} | null>(null)

    useEffect(() => {
        if (typeof GM_xmlhttpRequest !== "function" || typeof GM_setValue !== "function" || typeof GM_getValue !== "function") {
            setStatus("Can't check for updates without access to userscript functions.")
            return
        }

        // don't check too often
        const lastUpdateCheck = GM_getValue("lastUpdateCheck", null)
        if (forcedCheck === null && lastUpdateCheck !== null && Date.now() < lastUpdateCheck.next) {
            setUpstreamVersion(lastUpdateCheck.version)
            setStatus(locf`update.lastCheck`(locale.datetime(new Date(lastUpdateCheck.last))))
            return
        }

        setStatus(loc`update.checking`)
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
                    setStatus(loc`update.failed`)
                    scheduleNextUpdateCheck(false)
                    return
                }
                scheduleNextUpdateCheck(true, versionMatch[1])
                setStatus(locf`update.lastCheck`(locale.datetime(new Date(lastUpdateCheck.last))))
                setUpstreamVersion(versionMatch[1])
            },
            onerror() {
                console.error("Oodi++ update check failed: request failed")
                setStatus(loc`update.failed`)
                scheduleNextUpdateCheck(false)
            }
        })
    }, [forcedCheck])

    useEffect(() => {
        if (isNewer(VERSION, upstreamVersion)) requestSidebarFocus()
    }, [upstreamVersion])

    const newVersion = isNewer(VERSION, upstreamVersion) ? (
        <p className="opp-new-version">
            <h3 className="opp-alert-text">{locf`update.available`(upstreamVersion)}</h3>
            <div>
                {loc`update.install`}
                <a href={UPDATE_URL} target="_blank">{UPDATE_URL}</a>
            </div>
        </p>
    ) : null

    return (
        <>
            <div className="opp-update-check">
                <div>{status}</div>
                <button type="button" onClick={() => setForcedCheck({})}>
                    {loc`update.check`}
                </button>
            </div>
            {newVersion}
        </>
    )
}
