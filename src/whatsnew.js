const CHANGELOG = [
    {
        version: "0.1",
        changes: [
            "Initial public release",
        ],
    },
]

const $releaseNotesList = $.make("div").addClass("opp-release-notes")

for (const {version, changes} of CHANGELOG) {
    $releaseNotesList
            .append(
                $.make("h3").text(`version ${version}`)
            )
            .append(
                $.make("ul").append(
                    changes.map(change => $.make("li").text(change))
                )
            )
}

const $releaseNotes = $.make("div")
        .addClass("opp-whats-new")
        .append(
            $.make("div")
                    .addClass("opp-header")
                    .append(
                        $.make("h2").text(`Oodi++ ${VERSION}`)
                    )
                    .append(
                        $.make("button")
                                .attr("type", "button")
                                .text("Release notes")
                                .click(() => $releaseNotesList.slideToggle())
                    )
        )
        .append($releaseNotesList)

$sidebarContent.prepend($whatsNew)

// If there are release notes the user hasn't seen, ping the user.
const unseenNotes = typeof GM_getValue === "function" && GM_getValue("whatsNewVersion") !== CHANGELOG[0].version
if (unseenNotes) requestSidebarFocus()
else $releaseNotesList.hide()

// Called when the sidebar opens to mark the notes as seen.
const whatsNewSeen = () => {
    typeof GM_setValue === "function" && GM_setValue("whatsNewVersion", CHANGELOG[0].version)
}
