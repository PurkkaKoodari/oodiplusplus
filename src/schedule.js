// schedule.js: schedule rendering



const updateScheduleView = () => {
    scheduleUpdating = true
    // nuke the current tables
    $scheduleView.empty()

    // compile a list of all instances
    const allInstances = []
    const activitiesToRender = Object.values(selectedActivities)
    if (hoveredActivity && !(hoveredActivity.identifier in selectedActivities)) activitiesToRender.push(hoveredActivity)
    for (const activity of activitiesToRender) {
        allInstances.push(...activity.instances)
    }
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
            $.make("h3").text(anySelected ? "All currently selected activities are in the past. Select more activities from Oodi to display a schedule." : "Select activities from Oodi to display a schedule.")
        )
        return
    }

    // weeks are clumped together if schedules are identical
    const weekContentIndex = {}
    const currentWeek = new Date(thisMonday)
    while (allInstances.length > 0) {
        // find instances during this week and compile a "week contents" string from it
        const weekStart = new Date(currentWeek)
        const weekEnd = new Date(currentWeek.getTime() + ONE_WEEK)
        const weekInstances = []
        let weekContents = ""
        while (allInstances.length > 0 && allInstances[0].start.getTime() < weekEnd.getTime()) {
            const instance = allInstances.shift()
            weekInstances.push(instance)
            weekContents += `${instance.activity.identifier} ${instance.start.getDay()} ${timeOfDay(instance.start)} ${timeOfDay(instance.end)}\n`
        }
        if (weekInstances.length !== 0) {
            // add week contents to index
            if (!(weekContents in weekContentIndex)) weekContentIndex[weekContents] = {instances: weekInstances, weeks: []}
            weekContentIndex[weekContents].weeks.push(new Date(weekStart))
        }
        // advance to next week
        currentWeek.setTime(currentWeek.getTime() + ONE_WEEK)
    }

    // sort schedules by first week
    const schedules = Array.from(Object.values(weekContentIndex))
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
                if (renderInstance.overlaps(other)) overlappingColumns.push(other.columns.start)
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
                    for (let column = other.columns.start; column <= other.columns.end; column++) overlappingColumns.push(column)
                }
            }
            // expand left & right
            while (renderInstance.columns.start > 0 && !overlappingColumns.includes(renderInstance.columns.start - 1)) renderInstance.columns.start--
            while (renderInstance.columns.end < columns[renderInstance.weekday] - 1 && !overlappingColumns.includes(renderInstance.columns.end + 1)) renderInstance.columns.end++
        }
        // see if there is anything in the weekends
        const daysToRender = columns[5] > 0 || columns[6] > 0 ? 7 : 5

        const $schedule = $.make("div")
                .addClass("opp-schedule")
                .css({height: `${20 + (lastHour - firstHour) * 60}px`})
        // render header
        for (let day = 0; day < daysToRender; day++) {
            $schedule.append(
                $.make("div")
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
                $.make("div")
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
            const $instance = $.make("div")
                    .addClass("opp-activity")
                    .toggleClass("opp-hovered", hoveredActivity === renderInstance.instance.activity)
                    .css({
                        left: `${20 + 100 * renderInstance.weekday + 100 / columns[renderInstance.weekday] * renderInstance.columns.start}px`,
                        top: `${20 + 60 * (renderInstance.start / ONE_HOUR - firstHour)}px`,
                        width: `${100 / columns[renderInstance.weekday] * (renderInstance.columns.end - renderInstance.columns.start + 1)}px`,
                        height: `${60 * (renderInstance.end - renderInstance.start) / ONE_HOUR}px`,
                    })
                    .attr("title", `${renderInstance.instance.activity.course.code} ${renderInstance.instance.activity.course.name}\n` +
                            `${renderInstance.instance.activity.type} ${renderInstance.instance.activity.name}\n` +
                            `${WEEKDAY_NAMES[language][renderInstance.weekday]} ${renderInstance.instance.start.toLocaleTimeString(language)}\u2013${renderInstance.instance.end.toLocaleTimeString(language)}\n` +
                            `${renderInstance.instance.location}`)
                    .append(
                        $.make("a")
                                .attr("href", `https://${location.host}/a/opettaptied.jsp?OpetTap=${renderInstance.instance.activity.opetTapId}`)
                                .text(renderInstance.instance.activity.course.code)
                                // stop click events from the link from propagating to the schedule event
                                .click(e => e.stopPropagation())
                    )
                    .append(
                        $.make("span").text(renderInstance.instance.activity.name)
                    )
                    .append(
                        $.make("span").text(renderInstance.instance.location)
                    )
                    .click(() => scheduleClickAction(renderInstance.instance.activity))
                    // be a bit paranoid to avoid unnecessary events
                    .on("mouseenter", () => !scheduleUpdating && hoveredActivity !== renderInstance.instance.activity && setHoveredActivity(renderInstance.instance.activity))
                    .on("mouseleave", () => !scheduleUpdating && hoveredActivity === renderInstance.instance.activity && setHoveredActivity(null))
            $schedule.append($instance)
        
            // add outdatedness indicator if applicable
            if (renderInstance.instance.activity.dataVersion < CURRENT_DATA_VERSION) {
                $instance.append(
                    $.make("div")
                            .addClass("opp-outdated-indicator opp-alert-text")
                            .text("\u26A0")
                            .attr("title", "This activity's data is in an outdated format. Visit its course page to update it.")
                )
            }
        }

        $scheduleView
                .append(
                    $.make("h3").text(dateHeader)
                )
                .append($schedule)
    }
    scheduleUpdating = false
    
    // remove old data format notices
    $(".opp-outdated-format-alert").remove()
    // add notice and blink opener if activities use outdated data formats
    const needDataFormatUpdate = Array.from(Object.values(selectedActivities)).filter(activity => activity.dataVersion < CURRENT_DATA_VERSION).length
    if (needDataFormatUpdate > 0) {
        const $updateNotification = $.make("p")
                .addClass("opp-alert-text opp-outdated-format-alert")
                .append(`${needDataFormatUpdate} activities are using an outdated data format. Visit their course pages to update them.`)
        $scheduleActions.before($updateNotification)
        requestSidebarFocus()
    }
}

/**
 * @param {Activity} activity 
 */
const removeActivityFromSchedule = activity => {
    // unselect the activity
    delete selectedActivities[activity.identifier]
    saveSelectedActivities()
    // stop hovering the activity
    if (hoveredActivity === activity) setHoveredActivity(null)
    // update UI
    updateScheduleView()
    activity.updateOpettaptied()
    // only delete one per click
    setScheduleAction(null)()
}

let scheduleClickAction = () => {}
let scheduleClickActionClass = "none"

const setScheduleAction = (action, actionClass = "none") => function () {
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
        $(this).addClass("opp-active")
    } else {
        scheduleClickAction = () => {}
    }
}

const $scheduleActions = $.make("div")
        .addClass("opp-schedule-actions")
        .append(
            $.make("div").text("Schedule tools:")
        )
        .append(
            $.make("button")
                    .attr("type", "button")
                    .text("Remove")
                    .click(setScheduleAction(removeActivityFromSchedule, "remove"))
        )

const $scheduleView = $.make("div").addClass("opp-schedule-view")
$sidebarContent.append($scheduleActions).append($scheduleView)

/** Don't run events while schedule is updating to avoid events being triggered due to elements appearing/disappearing. */
let scheduleUpdating = false

updateScheduleView()
