// schedule.js: schedule rendering



const updateScheduleView = () => {
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
        console.log(schedule)
        // transform list of weeks into list of ranges
        const weekRanges = [{start: schedule.weeks[0], end: schedule.weeks[0]}]
        for (const week of schedule.weeks.slice(1)) {
            if (week.getTime() !== weekRanges[weekRanges.length - 1].end.getTime() + ONE_WEEK) weekRanges.push({start: week, end: week})
            else weekRanges[weekRanges.length - 1].end = week
        }
        // stringify date ranges
        const dateHeader = weekRanges.map(range => `${range.start.toLocaleDateString(language)}-${new Date(range.end.getTime() + ONE_WEEK - 1).toLocaleDateString(language)}`).join(", ")
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
            $schedule.append(
                $.make("div")
                        .addClass("opp-activity")
                        .css({
                            left: `${20 + 100 * renderInstance.weekday + 100 / columns[renderInstance.weekday] * renderInstance.columns.start}px`,
                            top: `${20 + 60 * (renderInstance.start / ONE_HOUR - firstHour)}px`,
                            width: `${100 / columns[renderInstance.weekday] * (renderInstance.columns.end - renderInstance.columns.start + 1)}px`,
                            height: `${60 * (renderInstance.end - renderInstance.start) / ONE_HOUR}px`,
                            background: hoveredActivity !== null && renderInstance.instance.activity.identifier === hoveredActivity.identifier ? "#ddf" : "#fff",
                        })
                        .append(
                            $.make("a")
                                    .attr("href", renderInstance.instance.activity.url)
                                    .text(renderInstance.instance.activity.course.code)
                        )
                        .append(
                            $.make("span").text(renderInstance.instance.activity.name)
                        )
                        .append(
                            $.make("span").text(renderInstance.instance.location)
                        )
            )
        }

        $scheduleView
                .append(
                    $.make("h3").text(dateHeader)
                )
                .append($schedule)
    }
}

const $scheduleView = $.make("div")
$sidebarContent.append($scheduleView)

updateScheduleView()