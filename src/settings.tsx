// settings.tsx: settings and release notes

import {h} from "preact"
import {useEffect, useState} from "preact/hooks"
import $ from "jquery"

import {Activity} from "./classes"
import {THEMES, getTheme, setTheme} from "./styles"
import {DEFAULT_ICAL_EXPORT_FORMAT, icalExportFormatStrings} from "./ical"
import {downloadFile, useObservable} from "./utils"
import {locf, loc} from "./locales"
import {Tooltip} from "./tooltip"
import {deserializeActivities, selectedActivities, serializeSelectedActivities} from "./activities"

const CHANGELOG = [
    {
        version: "0.5",
        changes: [
            "Added sidebar resizing",
        ],
    },
    {
        version: "0.4",
        changes: [
            "Major rewrite using Preact",
            "Activities can now be colored in schedule view",
            "Added teacher information",
        ],
    },
    {
        version: "0.3",
        changes: [
            "Schedule can now be exported as iCal (.ics)",
            "Added dark theme under settings",
            "Added localization in Finnish",
            "Schedule can be exported & imported as JSON",
        ],
    },
    {
        version: "0.2",
        changes: [
            "Activities can now be removed in schedule view",
            "Activity details can be updated by visiting the course page",
            "Added activity tooltips in schedule view",
            "NOTE: Links in the schedule view will be broken until activities are updated by visiting the course page manually. This is due to a data format change and will not occur with future updates.",
        ],
    },
    {
        version: "0.1",
        changes: [
            "Initial public release",
        ],
    },
]

const COMMITS_URL = `https://gitlab.com/PurkkaKoodari/oodiplusplus/-/commits/v${VERSION}`
const WEBSITE_URL = "https://purkka.codes/oodi/"

function About() {
    return (
        <div className="opp-about">
            <p>
                <a href={WEBSITE_URL} target="_blank">Oodi++</a> is created by <a href="https://purkka.codes/" target="_blank">PurkkaKoodari</a> and
                is licensed under the <a href={`${WEBSITE_URL}LICENSE`} target="_blank">MIT license</a>.
            </p>
            <p>
                Oodi++ contains code from <a href="https://preactjs.com" target="_blank">Preact {PREACT_VERSION}</a>, licensed
                under the <a href="https://github.com/preactjs/preact/blob/master/LICENSE" target="_blank">MIT license</a>,
                and <a href="https://jquery.com/" target="_blank">jQuery {JQUERY_VERSION}</a>, licensed under
                the <a href="https://jquery.org/license/" target="_blank">MIT license.</a>
            </p>
        </div>
    )
}

function ReleaseNotes() {
    const whatsNew = unseenReleaseNotes ? (
        <p className="opp-success-text">
            {locf`settings.appUpdated`(VERSION)}
        </p>
    ) : null

    return (
        <div className="opp-release-notes">
            {whatsNew}
            <p>For a full list of changes, see <a href={COMMITS_URL} target="_blank">the commit history</a>.</p>
            {CHANGELOG.flatMap(({version, changes}) => [
                <h4 key={`title${version}`}>version {version}</h4>,
                <ul key={`list${version}`}>
                    {changes.map(change => <li>{change}</li>)}
                </ul>,
            ])}
        </div>
    )
}

function tryImportSelectedActivities(jsonText: string, failMessage: string) {
    let imported: Activity[]
    try {
        imported = deserializeActivities(JSON.parse(jsonText))
    } catch (error) {
        console.error("Import failed:", error)
        alert(failMessage)
        return
    }
    selectedActivities.value = imported
    alert(locf`settings.import.success`(Object.keys(imported).length))
}

const $importFileChooser = $.make<HTMLInputElement>("input")
        .attr("type", "file")
        .attr("accept", ".json,application/json")
        .addClass("opp-import-file-chooser")
        .on("change", () => {
            if (!$importFileChooser[0].files!.length) return
            $importFileChooser[0].files![0].text().then(text => tryImportSelectedActivities(text, loc`settings.import.failed.file`))
        })
        .hide()
        .appendTo("body")

function IcalFormatHelpButton() {
    return (
        <Tooltip text={loc`settings.ical.format.help`}>
            {events => <span className="opp-help-tooltip" {...events}>?</span>}
        </Tooltip>
    )
}

function Settings() {
    function exportText() {
        prompt(loc`settings.export.text.prompt`, JSON.stringify(serializeSelectedActivities()))
    }
    function exportFile() {
        downloadFile(JSON.stringify(serializeSelectedActivities()), "oodiplusplus.json", "application/json")
    }
    function importText() {
        if (!confirm(loc`settings.import.confirm`)) return
        const json = prompt(loc`settings.import.text.prompt`)
        if (!json) return
        tryImportSelectedActivities(json, loc`settings.import.failed.text`)
    }
    function importFile() {
        if (!confirm(loc`settings.import.confirm`)) return
        $importFileChooser[0].click()
    }
    function reset() {
        if (!confirm(loc`settings.reset.confirm`)) return
        selectedActivities.value = []
    }

    const icalFormatStrings = useObservable(icalExportFormatStrings)

    return (
        <div className="opp-settings">
            <h4>{loc`settings.title`}</h4>
            <div>{loc`settings.language`}</div>
            <fieldset className="opp-horizontal">
                <legend>{loc`settings.theme`}</legend>
                {Object.keys(THEMES).flatMap(theme => [
                    <input
                            className="opp-theme-button"
                            id={`opp-theme-button-${theme}`}
                            type="radio"
                            name="opp-theme-selection"
                            checked={getTheme() === theme}
                            onChange={e => (e.target as HTMLInputElement).checked && setTheme(theme)}
                            key={`radio${theme}`} />,
                    <label for={`opp-theme-button-${theme}`} key={`label${theme}`}>
                        {loc(`settings.theme.${theme}`)}
                    </label>
                ])}
            </fieldset>
            <fieldset className="opp-vertical">
                <legend>{loc`settings.ical.format`}</legend>
                <button type="button" onClick={() => icalExportFormatStrings.value = DEFAULT_ICAL_EXPORT_FORMAT}>
                    {loc`settings.ical.format.reset`}
                </button>
                <label for="opp-ical-title-format">
                    {loc`settings.ical.format.title`}
                    <IcalFormatHelpButton />
                </label>
                <input
                        id="opp-ical-title-format"
                        type="text"
                        required={true}
                        value={icalFormatStrings.title}
                        onChange={e => {
                            const value = (e.target as HTMLInputElement).value
                            if (!value.trim()) return
                            icalExportFormatStrings.value = {...icalExportFormatStrings.value, title: value}
                        }} />
                <label for="opp-ical-description-format">
                    {loc`settings.ical.format.description`}
                    <IcalFormatHelpButton />
                </label>
                <textarea
                        id="opp-ical-description-format" 
                        required={true}
                        value={icalFormatStrings.description}
                        onChange={e => {
                            const value = (e.target as HTMLInputElement).value
                            icalExportFormatStrings.value = {...icalExportFormatStrings.value, description: value}
                        }} />
            </fieldset>
            <div className="opp-horizontal">
                <button type="button" onClick={exportText}>
                    {loc`settings.export.text`}
                </button>
                <button type="button" onClick={importText}>
                    {loc`settings.import.text`}
                </button>
                <button type="button" onClick={exportFile}>
                    {loc`settings.export.file`}
                </button>
                <button type="button" onClick={importFile}>
                    {loc`settings.import.file`}
                </button>
                <button type="button" onClick={reset}>
                    {loc`settings.reset`}
                </button>
            </div>
        </div>
    )
}

function SettingsContainer({open, children}: {open: boolean, children: any}) {
    return (
        <div className={`opp-settings-wrapper ${open ? "opp-open" : ""}`}>
            {children}
        </div>
    )
}

/** updatecheck.ts is plugged in here for update-checking builds. */
let UpdateCheckComponent: () => any = () => null

export function setUpdateCheckComponent(Component: () => any) {
    UpdateCheckComponent = Component
}

/** Contains the app title, release notes and settings. */
export function SidebarHeader({sidebarOpen}: {sidebarOpen: boolean}) {
    useEffect(() => {
        if (sidebarOpen && typeof GM_setValue === "function") GM_setValue("whatsNewVersion", CHANGELOG[0].version)
    }, [sidebarOpen])

    const [visiblePart, setVisiblePart] = useState<string | null>(unseenReleaseNotes ? "release-notes" : null)

    function changeVisibleHeaderPart(part: string) {
        return () => setVisiblePart(part === visiblePart ? null : part)
    }

    return (
        <div className="opp-sidebar-header">
            <div className="opp-header">
                <h2>{locf`appTitle`(VERSION)}</h2>
                <button
                        type="button"
                        className={visiblePart === "about" ? "opp-active" : ""}
                        onClick={changeVisibleHeaderPart("about")}>
                    {loc`settings.about`}
                </button>
                <button
                        type="button"
                        className={visiblePart === "release-notes" ? "opp-active" : ""}
                        onClick={changeVisibleHeaderPart("release-notes")}>
                    {loc`settings.releaseNotes`}
                </button>
                <button
                        type="button"
                        className={visiblePart === "settings" ? "opp-active" : ""}
                        onClick={changeVisibleHeaderPart("settings")}>
                    {loc`settings.title`}
                </button>
            </div>
            <UpdateCheckComponent />
            
            <SettingsContainer open={visiblePart === "about"}>
                <About />
            </SettingsContainer>
            <SettingsContainer open={visiblePart === "release-notes"}>
                <ReleaseNotes />
            </SettingsContainer>
            <SettingsContainer open={visiblePart === "settings"}>
                <Settings />
            </SettingsContainer>
        </div>
    )
}

/** If there are release notes the user hasn't seen, ping the user. */
export const unseenReleaseNotes = typeof GM_getValue === "function" && GM_getValue("whatsNewVersion") !== CHANGELOG[0].version
