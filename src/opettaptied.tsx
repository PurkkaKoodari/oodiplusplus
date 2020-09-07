// opettaptied.ts: parsing and selecting activities from opettaptied.jsp

import {h} from "preact"
import $ from "jquery"

import {Activity, Course, Instance, Teacher} from "./classes"
import {requestSidebarFocus} from "./sidebar"
import {COURSE_INFO_KEYS, language, loc, locf} from "./locales"
import {useObservable} from "./utils"
import {deselectActivity, getExistingSelectedActivity, selectActivity, selectedActivities, hoveredActivity, unhoverActivity, hoverActivity} from "./activities"

/** Parsed activities from opettaptied.jsp. */
export const opettaptiedActivities = (() => {
    if (!location.pathname.startsWith("/a/opettaptied.jsp")) return []

    // parse OpetTap from url
    const opetTapIdMatch = /\bOpetTap=(\d+)\b/.exec(location.search)
    const opetTapId = opetTapIdMatch && opetTapIdMatch[1]
    // find and parse basic course information at the start of the page
    const courseInfo: MapObj<string> = {}
    const $root = $("#legacy-page-wrapper")
    // the information is in a table inside a single-cell table
    $root.children("table").first().find("table tr").each(function () {
        let key: string | false | null = null
        $(this).find("td").each(function () {
            if (key === null) {
                // "header cells" are <td class="H">
                if ($(this).hasClass("H")) {
                    // figure out which field this is, if possible
                    const keyText = $(this).text().trim()
                    key = keyText in COURSE_INFO_KEYS ? COURSE_INFO_KEYS[keyText] : false
                }
            } else {
                // handle data cells after known header cells
                if (key !== false) courseInfo[key] = $(this).text().trim()
                key = null
            }
        })
    })
    // if we can't find these, there's very little we can do
    if (!courseInfo.code || !courseInfo.name || !opetTapId) {
        console.error("Oodi++ couldn't parse course name or code from the page.")
        return []
    }
    const course = new Course(courseInfo.code, courseInfo.name)

    const activities: Activity[] = []

    // walk each activity type table
    $("form[name=ilmotForm] > table.kll > tbody").each(function () {

        // activity type, such as "Lecture" or "Exercise"
        const activityType = $(this).children("tr").first().children("th:nth-child(3)").children("table").children("tbody") // first (header) row of .kll, table inside third cell
                .children("tr").children("th").children("table").children("tbody") // only cell of this table (yes, wtf?)
                .children("tr:last-child").children("th:nth-child(1)").text().trim() // last (second) row of inner table, first cell

        // walk all options for this activity
        $(this).children("tr").slice(1).children("td:nth-child(3)").children("table").children("tbody") // all rows except first of .kll, table inside third cell
                .children("tr") // all rows
                .each(function () {

            // activity name, such as L01
            const activityName = $(this).children("td:nth-child(1)").text().trim() // text of first cell of this row
            // if we can't find a name, we can't do much
            if (!activityName) return

            // parse teachers
            const teachers = $(this).children("td:nth-child(2)").find("a[href]").toArray().flatMap(link => {
                const teacherName = $(link).text().trim()
                const emailMatch = /\s*mailto:\s*(?:[^<>@\s]+<)?([^\s<>@]+@[^\s<>@]+)>?/.exec($(link).attr("href")!)
                if (!emailMatch) return []
                return new Teacher(teacherName, emailMatch[1])
            })

            // reuse activity from selectedActivities if one exists
            const parsedActivity = new Activity(course, activityType, activityName, opetTapId, language, teachers, null, new Date())
            const activity = getExistingSelectedActivity(parsedActivity)

            // walk all date/time/location specifiers for this activity
            $(this).children("td:nth-child(3)").children("table").children("tbody") // table in third cell of this row
                    .children("tr").children("td:first-child") // first cell of each row
                    .each(function () {
                // parse out the date and time
                const match = /^\s*(\d{2})\.(\d{2})\.(\d{2})?(?:-(\d{2})\.(\d{2})\.(\d{2}))?\s+[a-zåäö]{2,3}\s+(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/.exec($(this).text())
                if (!match) return
                // find the location, if any
                const location = $(this).find("input.submit2").val() as string || ""
                // convert to Dates
                const [, day1, month1, year1, day2, month2, year2, hour1, minute1, hour2, minute2] = match
                const firstDate = new Date(+(year1 || year2) + 2000, +month1 - 1, +day1, +hour1, +minute1)
                const lastDate = day2 ? new Date(+year2 + 2000, +month2 - 1, +day2, +hour1, +minute1) : firstDate
                // iterate over all instances in the range
                for (const currDate = new Date(firstDate); currDate <= lastDate; currDate.setDate(currDate.getDate() + 7)) {
                    const start = new Date(currDate)
                    const end = new Date(currDate)
                    end.setHours(+hour2)
                    end.setMinutes(+minute2)
                    // handle potential day rollover (badly)
                    if (end < start) end.setDate(end.getDate() + 1)
                    // add the instances to the parsed activity, but make them refer to the actual one - parsedActivity is just a dumb container
                    parsedActivity.instances.push(new Instance(activity, start, end, location))
                }
            })

            // check if the activity was previously selected and needs an update
            let needsUpdate = false
            if (activity !== parsedActivity) {
                if (activity.needsUpdate) {
                    needsUpdate = true
                } else if (activity.course.name !== parsedActivity.course.name || activity.type !== parsedActivity.type || activity.opetTapId !== parsedActivity.opetTapId) {
                    needsUpdate = true
                } else if (activity.instances.length !== parsedActivity.instances.length) {
                    needsUpdate = true
                } else {
                    for (let i = 0; i < activity.instances.length; i++) {
                        const instance = activity.instances[i]
                        const parsedInstance = parsedActivity.instances[i]
                        if (instance.start.getTime() !== parsedInstance.start.getTime() || instance.end.getTime() !== parsedInstance.end.getTime() || instance.location !== parsedInstance.location) {
                            needsUpdate = true
                            break
                        }
                    }
                }
            }
            if (needsUpdate) activity.updatedActivity = parsedActivity

            // don't add anything to activities without instances
            if (!activity.selected && !activity.instances.length) return

            activities.push(activity)

            // create "Add to Oodi++" button
            const $selectButton = $.make("button")
                    .attr("type", "button")
                    .click(() => {
                if (activity.selected) deselectActivity(activity)
                else selectActivity(activity)
                requestSidebarFocus()
            })
            // create "Update in Oodi++" button
            const $updateButton = $.make("button")
                    .attr("type", "button")
                    .attr("title", loc`opettaptied.dataUpdate.tooltip`)
                    .text(loc`opettaptied.dataUpdate`)
                    .click(() => {
                activity.update()
                selectedActivities.value = [...selectedActivities.value]
            })

            // method to update the stuff added to this page
            activity.updateOpettaptied = () => {
                // update hover state
                $(this).parent().closest("tr").toggleClass("opp-hovered-activity", hoveredActivity.value === activity)
                // make select button active/inactive and update its text
                $selectButton
                        .prop("disabled", activity.inPast && !activity.selected)
                        .text(activity.selected ? loc`opettaptied.remove` : loc`opettaptied.add`)
                // show update button if necessary
                $updateButton.toggle(activity.canUpdate && !activity.inPast)
            }
            activity.updateOpettaptied()

            // add actions to row
            $(this).children("td:nth-child(3)").append(
                $.make("div")
                        .addClass("opp-activity-actions")
                        .append($selectButton)
                        .append($updateButton)
            )

            // add explanation if activity is in the past
            if (activity.inPast) {
                $selectButton.after(
                    $.make("div").text(loc`opettaptied.inpast`)
                )
            }

            // add hover listeners
            $(this).parent().closest("tr")
                    .on("mouseenter", () => hoverActivity(activity))
                    .on("mouseleave", () => unhoverActivity(activity))
        })
    })

    return activities
})()

/** Updates the injected HTML in opettaptied.jsp. */
function updateOpettaptiedActivities() {
    for (const activity of opettaptiedActivities) activity.updateOpettaptied()
}

selectedActivities.addListener(updateOpettaptiedActivities)
hoveredActivity.addListener(updateOpettaptiedActivities)

export function OpettaptiedUpdateableNotification() {
    // even though this is not used, pull it in to ensure we get updated
    useObservable(selectedActivities)

    // add notice and blink opener button if changes are detected
    const updateable = updateableOnThisPage()
    if (!updateable) return null

    const differentLang = opettaptiedActivities.filter(activity => activity.canUpdate && activity.language && activity.language !== language).length

    function updateAllActivities() {
        for (const activity of opettaptiedActivities) {
            if (activity.canUpdate) activity.update()
        }
        selectedActivities.value = [...selectedActivities.value]
    }

    return (
        <p className="opp-alert-text">
            {locf`alert.dataUpdate.available`(updateable)}
            {differentLang ? locf`alert.dataUpdate.available.differentLang`(differentLang) : null}
            <button type="button" onClick={updateAllActivities}>{loc`alert.dataUpdate.updateAll`}</button>
        </p>
    )
}

/** Gets the number of activities with outdated data that can be updated on this opettaptied.jsp page. */
export function updateableOnThisPage() {
    return opettaptiedActivities.filter(activity => activity.canUpdate).length
}
