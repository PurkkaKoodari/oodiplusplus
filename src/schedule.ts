// schedule.ts: schedule storage and rendering

import {Activity, SerializedActivity, Instance, RenderInstance} from "./classes"
import {thisMonday, ONE_WEEK, ONE_HOUR, finnishWeekday, timeOfDay} from "./utils"
import {requestSidebarFocus} from "./sidebar"
import {WEEKDAY_NAMES, language} from "./locales"
import {updateOpettaptiedActivities} from "./opettaptied"
import {exportSelectedActivitiesAsIcal} from "./ical"
import {$make} from "./utils"

/** Attempts to deserialize a list of activities from a JSON-compatible object. */
export function deserializeActivities(serializedActivities: SerializedActivity[]) {
    const activities = new Map<string, Activity>()
    for (const serializedActivity of serializedActivities) {
        const activity = Activity.deserialize(serializedActivity)
        activities.set(activity.identifier, activity)
    }
    return activities
}

/** Serializes selectedActivities to a JSON-compatible object. */
export function serializeSelectedActivities(): SerializedActivity[] {
    return Array.from(selectedActivities.values()).map(activity => activity.serialize())
}

/** Attempts to load selectedActivities from the userscript storage. */
function loadSelectedActivities(): Map<string, Activity> {
    if (typeof GM_getValue !== "function") return new Map()
    const serializedActivities = GM_getValue("selectedActivities", null)
    if (!serializedActivities) return new Map()

    return deserializeActivities(serializedActivities)
}

/** Attempts to save selectedActivities to the userscript storage. */
export function saveSelectedActivities() {
    if (typeof GM_setValue !== "function") return

    GM_setValue("selectedActivities", serializeSelectedActivities())
}

/** Replaces selected activities with the given activities. */
export function setSelectedActivities(activities: Map<string, Activity>): void {
    selectedActivities.clear()
    for (const activity of activities.values()) selectedActivities.set(activity.identifier, activity)
    saveSelectedActivities()
    updateActivities()
}

/** Gets an array of selected activities. */
export function getSelectedActivities(): Iterable<Activity> {
    return selectedActivities.values()
}

/** Gets an existing copy of an activity, if one exists, or the given activity otherwise. */
export function getExistingSelectedActivity(parsed: Activity): Activity {
    return selectedActivities.get(parsed.identifier) ?? parsed
}

/** Checks whether an activity is selected. */
export function isActivitySelected(activity: Activity): boolean {
    return activity.identifier in selectedActivities
}

/** Selects an activity. */
export function selectActivity(activity: Activity): void {
    selectedActivities.set(activity.identifier, activity)
    saveSelectedActivities()
    updateActivities(activity)
}

/** Deselects an activity. */
export function deselectActivity(activity: Activity): void {
    selectedActivities.delete(activity.identifier)
    saveSelectedActivities()
    updateActivities(activity)
}

/** The currently selected activities. */
const selectedActivities = new Map<string, Activity>()
setSelectedActivities(loadSelectedActivities())



/** The currently hovered activity, may be in selectedActivities. */
let hoveredActivity: Activity | null = null

/** Checks whether an activity is hovered. */
export function isActivityHovered(activity: Activity) {
    return hoveredActivity === activity
}

/** Sets the hovered activity and updates all activity UI. */
export function setHoveredActivity(activity: Activity | null) {
    const toUpdate = [activity, hoveredActivity].filter(activity => activity !== null) as Activity[]
    hoveredActivity = activity
    updateActivities(...toUpdate)
}



/** Updates all activity UI. */
export function updateActivities(...activities: Activity[]) {
    updateScheduleView()
    updateOpettaptiedActivities(activities)
}



/** Don't run events while schedule is updating to avoid events being triggered due to elements appearing/disappearing. */
let scheduleUpdating = false

function updateScheduleView() {
    scheduleUpdating = true
    // nuke the current tables
    $scheduleView.empty()

    // compile a list of all instances
    const activitiesToRender = Array.from(selectedActivities.values())
    if (hoveredActivity && !hoveredActivity.selected) activitiesToRender.push(hoveredActivity)
    const allInstances = activitiesToRender.map(activity => activity.instances).flat()
    const anySelected = allInstances.length !== 0
    // sort instances to a predictable order
    allInstances.sort((lhs, rhs) => {
        if (lhs.start.getTime() != rhs.start.getTime()) return lhs.start.getTime() - rhs.start.getTime()
        if (lhs.end.getTime() != rhs.end.getTime()) return lhs.end.getTime() - rhs.end.getTime()
        return lhs.activity.identifier.localeCompare(rhs.activity.identifier)
    })

    // skip weeks that already started
    while (allInstances.length > 0 && allInstances[0].start.getTime() <= thisMonday.getTime()) allInstances.shift()

    if (allInstances.length === 0) {
        $scheduleView.append(
            $make("h3").text(anySelected ? "All currently selected activities are in the past. Select more activities from Oodi to display a schedule." : "Select activities from Oodi to display a schedule.")
        )
        return
    }

    // weeks are clumped together if schedules are identical
    type RenderWeek = {
        instances: Instance[]
        weeks: Date[]
    }
    const weekContentIndex = new Map<string, RenderWeek>()
    const currentWeek = new Date(thisMonday)
    while (allInstances.length > 0) {
        // find instances during this week and compile a "week contents" string from it
        const weekStart = new Date(currentWeek)
        const weekEnd = new Date(currentWeek.getTime() + ONE_WEEK)
        const weekInstances = []
        let weekContents = ""
        while (allInstances.length > 0 && allInstances[0].start.getTime() < weekEnd.getTime()) {
            const instance = allInstances.shift()!
            weekInstances.push(instance)
            weekContents += `${instance.activity.identifier} ${instance.start.getDay()} ${timeOfDay(instance.start)} ${timeOfDay(instance.end)}\n`
        }
        if (weekInstances.length !== 0) {
            // add week contents to index
            if (!weekContentIndex.has(weekContents)) weekContentIndex.set(weekContents, {instances: weekInstances, weeks: []})
            weekContentIndex.get(weekContents)!.weeks.push(new Date(weekStart))
        }
        // advance to next week
        currentWeek.setTime(currentWeek.getTime() + ONE_WEEK)
    }

    // sort schedules by first week
    const schedules: RenderWeek[] = Array.from(weekContentIndex.values())
    schedules.sort((lhs, rhs) => lhs.weeks[0].getTime() - rhs.weeks[0].getTime())

    for (const schedule of schedules) {
        // transform list of weeks into list of ranges
        const weekRanges = [{start: schedule.weeks[0], end: schedule.weeks[0]}]
        for (const week of schedule.weeks.slice(1)) {
            if (week.getTime() !== weekRanges[weekRanges.length - 1].end.getTime() + ONE_WEEK) weekRanges.push({start: week, end: week})
            else weekRanges[weekRanges.length - 1].end = week
        }
        // stringify date ranges
        const dateHeader = weekRanges.map(range => `${range.start.toLocaleDateString(language)}\u2013${new Date(range.end.getTime() + ONE_WEEK - 1).toLocaleDateString(language)}`).join(", ")
        // compute horizontal slots for overlapping instances and first/last hours
        let firstHour = 24
        let lastHour = 0
        const columns = [1, 1, 1, 1, 1, 0, 0]
        const renderInstances = []
        for (const instance of schedule.instances) {
            // convert to Finnish weekdays here
            const weekday = finnishWeekday(instance.start.getDay())
            const start = timeOfDay(instance.start)
            const end = start + instance.end.getTime() - instance.start.getTime()
            const renderInstance = new RenderInstance(instance, weekday, start, end)
            // update hours
            firstHour = Math.min(firstHour, Math.floor(start / ONE_HOUR))
            lastHour = Math.max(lastHour, Math.ceil(end / ONE_HOUR))
            // this is O(n^2) but I'm lazy and it's fast enough
            const overlappingColumns = []
            for (const other of renderInstances) {
                if (renderInstance.overlaps(other)) overlappingColumns.push(other.columns!.start)
            }
            // find a free column
            let column = 0
            while (overlappingColumns.includes(column)) column++
            renderInstance.columns = {start: column, end: column}
            // keep track of how many columns are used per weekday
            columns[weekday] = Math.max(columns[weekday], column + 1)
            renderInstances.push(renderInstance)
        }
        // do a second pass to widen any instances necessary
        for (const renderInstance of renderInstances) {
            // still O(n^2), still lazy and still fast enough
            const overlappingColumns = []
            for (const other of renderInstances) {
                if (renderInstance.overlaps(other)) {
                    for (let column = other.columns!.start; column <= other.columns!.end; column++) overlappingColumns.push(column)
                }
            }
            // expand left & right
            while (renderInstance.columns!.start > 0 && !overlappingColumns.includes(renderInstance.columns!.start - 1)) renderInstance.columns!.start--
            while (renderInstance.columns!.end < columns[renderInstance.weekday] - 1 && !overlappingColumns.includes(renderInstance.columns!.end + 1)) renderInstance.columns!.end++
        }
        // see if there is anything in the weekends
        const daysToRender = columns[5] > 0 || columns[6] > 0 ? 7 : 5

        const $schedule = $make("div")
                .addClass("opp-schedule")
                .css({height: `${20 + (lastHour - firstHour) * 60}px`})
        // render header
        for (let day = 0; day < daysToRender; day++) {
            $schedule.append(
                $make("div")
                        .addClass("opp-day")
                        .css({
                            left: `${20 + 100 * day}px`,
                            top: "0",
                            width: `${500 / daysToRender}px`,
                            height: "20px",
                        })
                        .text(WEEKDAY_NAMES[language][day])
            )
        }
        // render hour markers
        for (let hour = firstHour; hour < lastHour; hour++) {
            $schedule.append(
                $make("div")
                        .addClass("opp-hour")
                        .css({
                            left: "0",
                            top: `${20 + 60 * (hour - firstHour)}px`,
                            width: "20px",
                            height: "60px",
                        })
                        .text(hour.toString().padStart(2, "0"))
            )
        }
        // render instances
        for (const renderInstance of renderInstances) {
            const $instance = $make("div")
                    .addClass("opp-activity")
                    .toggleClass("opp-hovered", hoveredActivity === renderInstance.instance.activity)
                    .css({
                        left: `${20 + 100 * renderInstance.weekday + 100 / columns[renderInstance.weekday] * renderInstance.columns!.start}px`,
                        top: `${20 + 60 * (renderInstance.start / ONE_HOUR - firstHour)}px`,
                        width: `${100 / columns[renderInstance.weekday] * (renderInstance.columns!.end - renderInstance.columns!.start + 1)}px`,
                        height: `${60 * (renderInstance.end - renderInstance.start) / ONE_HOUR}px`,
                    })
                    .attr("title", `${renderInstance.instance.activity.course.code} ${renderInstance.instance.activity.course.name}\n` +
                            `${renderInstance.instance.activity.type} ${renderInstance.instance.activity.name}\n` +
                            `${WEEKDAY_NAMES[language][renderInstance.weekday]} ${renderInstance.instance.start.toLocaleTimeString(language)}\u2013${renderInstance.instance.end.toLocaleTimeString(language)}\n` +
                            `${renderInstance.instance.location}`)
                    .append(
                        $make("a")
                                .attr("href", `https://${location.host}/a/opettaptied.jsp?OpetTap=${renderInstance.instance.activity.opetTapId}`)
                                .text(renderInstance.instance.activity.course.code)
                                // stop click events from the link from propagating to the schedule event
                                .click(e => e.stopPropagation())
                    )
                    .append(
                        $make("span").text(renderInstance.instance.activity.name)
                    )
                    .append(
                        $make("span").text(renderInstance.instance.location)
                    )
                    .click(() => scheduleClickAction(renderInstance.instance.activity))
                    // be a bit paranoid to avoid unnecessary events
                    .on("mouseenter", () => !scheduleUpdating && hoveredActivity !== renderInstance.instance.activity && setHoveredActivity(renderInstance.instance.activity))
                    .on("mouseleave", () => !scheduleUpdating && hoveredActivity === renderInstance.instance.activity && setHoveredActivity(null))
            $schedule.append($instance)
        
            // add outdatedness indicator if applicable
            if (renderInstance.instance.activity.needsUpdate) {
                $instance.append(
                    $make("div")
                            .addClass("opp-outdated-indicator opp-alert-text")
                            .text("\u26A0")
                            .attr("title", "This activity's data is in an outdated format. Visit its course page to update it.")
                )
            }
        }

        $scheduleView
                .append(
                    $make("h3").text(dateHeader)
                )
                .append($schedule)
    }
    scheduleUpdating = false
    
    // remove old data format notices
    $activitiesNeedDataUpdate.hide().empty()
    // add notice and blink opener if activities use outdated data formats
    const needDataFormatUpdate = Array.from(selectedActivities.values()).filter(activity => activity.needsUpdate).length
    if (needDataFormatUpdate > 0) {
        $activitiesNeedDataUpdate
                .addClass("opp-alert-text opp-outdated-format-alert")
                .append(`${needDataFormatUpdate} activities are using an outdated data format. Visit their course pages to update them.`)
                .show()
        requestSidebarFocus()
    }
}

function removeActivityFromSchedule(activity: Activity) {
    // stop hovering the activity
    if (hoveredActivity === activity) hoveredActivity = null
    // deselect and update UI
    deselectActivity(activity)
    // only delete one per click
    setScheduleAction(null)()
}

let scheduleClickAction = (activity: Activity) => {}
let scheduleClickActionClass = "none"

export const setScheduleAction = (action: ((activity: Activity) => void) | null, actionClass: string = "none") => function (this: HTMLElement | void) {
    // cancel on second click
    if (scheduleClickAction === action) {
        setScheduleAction(null)()
        return
    }
    // update schedule view mode
    $scheduleView.removeClass(scheduleClickActionClass)
    scheduleClickActionClass = `opp-action-${actionClass}`
    $scheduleView.addClass(scheduleClickActionClass)
    // deactivate any currently active buttons
    $(".opp-schedule-actions button").removeClass("opp-active")
    if (action !== null) {
        scheduleClickAction = action
        $(this as HTMLElement).addClass("opp-active")
    } else {
        scheduleClickAction = () => {}
    }
}

export const $scheduleActions = $make("div")
        .addClass("opp-schedule-actions")
        .append(
            $make("div").text("Schedule tools:")
        )
        .append(
            $make("button")
                    .attr("type", "button")
                    .text("Remove")
                    .click(setScheduleAction(removeActivityFromSchedule, "remove"))
        )
        .append(
            $make("button")
                    .attr("type", "button")
                    .text("Export iCal")
                    .click(() => exportSelectedActivitiesAsIcal())
        )

export const $scheduleView = $make("div").addClass("opp-schedule-view")

export const $activitiesNeedDataUpdate = $make("p").hide()
