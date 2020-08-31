// settings.ts: settings and release notes

import {deserializeActivities, serializeSelectedActivities, setSelectedActivities} from "./schedule"
import {Activity} from "./classes"
import {requestSidebarFocus} from "./sidebar"
import {$updateCheckInfo, $newVersionInfo} from "./updatecheck"
import {THEMES, getTheme, setTheme} from "./styles"
import {$make, downloadFile} from "./utils"

const CHANGELOG = [
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

const $releaseNotes = $make("div")
        .addClass("opp-release-notes")
        .append(
            CHANGELOG.map(({version, changes}) => [
                $make("h4").text(`version ${version}`),
                $make("ul").append(
                    changes.map(change => $make("li").text(change))
                ),
            ]).flat()
        )

function tryImportSelectedActivities(jsonText: string, sourceKind: string) {
    let imported: Map<string, Activity>
    try {
        imported = deserializeActivities(JSON.parse(jsonText))
    } catch (error) {
        console.error("Import failed:", error)
        alert(`Failed to import activities. Most likely ${sourceKind} is broken.`)
        return
    }
    setSelectedActivities(imported)
    alert(`Successfully imported ${Object.keys(imported).length} activities.`)
}

const $importFileChooser = $make<HTMLInputElement>("input")
        .attr("type", "file")
        .attr("accept", ".json,application/json")
        .addClass("opp-import-file-chooser")
        .on("change", () => {
            if (!$importFileChooser[0].files!.length) return
            $importFileChooser[0].files![0].text().then(text => tryImportSelectedActivities(text, "the file you chose"))
        })
        .hide()
        .appendTo("body")

const $settings = $make("div")
        .addClass("opp-settings")
        .append(
            $make("h4").text("Settings")
        )
        .append(
            $make("div").text("The language of Oodi++ is automatically synchronized with Oodi's language.")
        )
        .append(
            $make("div")
                    .append("Theme: ")
                    .append(
                        Object.keys(THEMES).map(theme => [
                            $make("input")
                                    .addClass("opp-theme-button")
                                    .attr("id", `opp-theme-button-${theme}`)
                                    .attr("type", "radio")
                                    .attr("name", "opp-theme-selection")
                                    .prop("checked", getTheme() === theme)
                                    .on("input", function () {
                                        if ($(this).prop("checked")) setTheme(theme)
                                    }),
                            $make("label")
                                    .attr("for", `opp-theme-button-${theme}`)
                                    .text(`${theme}`),
                        ]).flat()
                    )
        )
        .append(
            $make("div")
                    .append(
                        $make("button")
                                .attr("type", "button")
                                .text("Export data as text")
                                .click(() => prompt("Copy your schedule here: ", JSON.stringify(serializeSelectedActivities())))
                    )
                    .append(
                        $make("button")
                                .text("Import data as text")
                                .click(() => {
                                    if (!confirm("Are you sure you want to PERMANENTLY DELETE all activities added to Oodi++ and replace them with imported ones?")) return
                                    const json = prompt("Enter the exported text:")
                                    if (!json) return
                                    tryImportSelectedActivities(json, "the text you entered")
                                })
                    )
                    .append(
                        $make("button")
                                .attr("type", "button")
                                .text("Export data to file")
                                .click(() => downloadFile(JSON.stringify(serializeSelectedActivities()), "oodiplusplus.json", "application/json"))
                    )
                    .append(
                        $make("button")
                                .text("Import data from file")
                                .click(() => {
                                    if (!confirm("Are you sure you want to PERMANENTLY DELETE all activities added to Oodi++ and replace them with imported ones?")) return
                                    $importFileChooser[0].click()
                                })
                    )
                    .append(
                        $make("button")
                                .attr("type", "button")
                                .text("Reset data")
                                .click(() => {
                                    if (!confirm("Are you sure you want to PERMANENTLY DELETE all activities added to Oodi++?")) return
                                    setSelectedActivities(new Map())
                                })
                    )
        )

const $showReleaseNotes = $make("button")
        .attr("type", "button")
        .text("Release notes")
        .click(() => setVisibleHeaderPart("release-notes"))

const $showSettings = $make("button")
        .attr("type", "button")
        .text("Settings")
        .click(() => setVisibleHeaderPart("settings"))

/** Contains the app title, release notes and settings. */
export const $sidebarHeader = $make("div")
        .addClass("opp-sidebar-header")
        .append(
            $make("div")
                    .addClass("opp-header")
                    .append(
                        $make("h2").text(`Oodi++ ${VERSION}`)
                    )
                    .append($showReleaseNotes)
                    .append($showSettings)
        )
        .append($updateCheckInfo)
        .append($newVersionInfo)
        .append($releaseNotes)
        .append($settings)



let visibleHeaderPart: "release-notes" | "settings" | null = null

/** Opens or closes settings or release notes. */
function setVisibleHeaderPart(part: "release-notes" | "settings" | null, instant: boolean = false) {
    // second click toggles
    if (part !== null && visibleHeaderPart === part) {
        setVisibleHeaderPart(null)
        return
    }
    visibleHeaderPart = part
    if (instant) {
        $releaseNotes.toggle(part === "release-notes")
        $settings.toggle(part === "settings")
    } else {
        // this is ugly, but slideToggle() doesn't work like toggle() for whatever reason
        if (part === "release-notes") $releaseNotes.slideDown()
        else $releaseNotes.slideUp()
        if (part === "settings") $settings.slideDown()
        else $settings.slideUp()
    }
    $showReleaseNotes.toggleClass("opp-active", part === "release-notes")
    $showSettings.toggleClass("opp-active", part === "settings")
}



/** Called when the sidebar opens to mark the notes as seen. */
export function whatsNewSeen() {
    typeof GM_setValue === "function" && GM_setValue("whatsNewVersion", CHANGELOG[0].version)
}



// If there are release notes the user hasn't seen, ping the user.
const unseenNotes = typeof GM_getValue === "function" && GM_getValue("whatsNewVersion") !== CHANGELOG[0].version
if (unseenNotes) {
    $releaseNotes.before(
        $make("p")
                .addClass("opp-success-text")
                .text(`Oodi++ was updated to version ${VERSION}. Here's what's new.`)
    )
    setVisibleHeaderPart("release-notes", true)
    requestSidebarFocus()
} else {
    setVisibleHeaderPart(null, true)
}
