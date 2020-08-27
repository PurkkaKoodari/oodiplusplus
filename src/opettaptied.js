// opettaptied.js: parsing and selecting activities from opettaptied.jsp



const parseOpettaptied = () => {
    // find and parse basic course information at the start of the page
    const courseInfo = new Course()
    const $root = $("#legacy-page-wrapper")
    // the information is in a table inside a single-cell table
    $root.children("table").first().find("table tr").each(function () {
        let key = null
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
    if (!courseInfo.code || !courseInfo.name) {
        console.error("Oodi++ couldn't parse course name or code from the page.")
        return
    }

    // walk each activity type table
    $("form[name=ilmotForm] > table.kll > tbody").each(function () {

        // activity type, such as "Lecture" or "Exercise"
        const activityType = $(this).children("tr").first().children("th:nth-child(3)").children("table").children("tbody") // first (header) row of .kll, table inside third cell
                .children("tr:nth-child(2)").children("th:nth-child(1)").text().trim() // second row of inner table, first cell

        // walk all options for this activity
        $(this).children("tr").slice(1).children("td:nth-child(3)").children("table").children("tbody") // all rows except first of .kll, table inside third cell
                .children("tr") // all rows
                .each(function () {

            // activity name, such as 
            const activityName = $(this).children("td:nth-child(1)").text().trim() // text of first cell of this row
            // if we can't find a name, we can't do much
            if (!activityName) return

            const activity = new Activity(courseInfo, activityType, activityName, location.href)

            // walk all date/time/location specifiers for this activity
            $(this).children("td:nth-child(3)").children("table").children("tbody") // table in third cell of this row
                    .children("tr").children("td:first-child") // first cell of each row
                    .each(function () {
                // parse out the date and time
                const match = /^\s*(\d{2})\.(\d{2})\.(\d{2})?(?:-(\d{2})\.(\d{2})\.(\d{2}))?\s+[a-zåäö]{2,3}\s+(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/.exec($(this).text())
                if (!match) return
                // find the location, if any
                const location = $(this).find("input.submit2").val() || ""
                // convert to Dates
                const [, day1, month1, year1, day2, month2, year2, hour1, minute1, hour2, minute2] = match
                const firstDate = new Date(+(year1 || year2) + 2000, +month1 - 1, +day1, +hour1, +minute1)
                const lastDate = day2 ? new Date(+year2 + 2000, +month2 - 1, +day2, +hour1, +minute1) : firstDate
                // iterate over all instances in the range
                for (const currDate = new Date(firstDate); currDate.getTime() <= lastDate.getTime(); currDate.setTime(currDate.getTime() + ONE_WEEK)) {
                    const start = new Date(currDate)
                    const end = new Date(currDate)
                    end.setHours(+hour2)
                    end.setMinutes(+minute2)
                    // handle potential day rollover (badly)
                    if (end.getTime() < start.getTime()) end.setTime(end.getTime() + ONE_DAY)
                    activity.instances.push(new Instance(activity, start, end, location))
                }
            })

            const $selectButton = $.make("button").attr("type", "button").prop("disabled", activity.inPast && !activity.selected).text(activity.selected ? "Remove" : "Select").click(() => {
                if (activity.selected) delete selectedActivities[activity.identifier]
                else selectedActivities[activity.identifier] = activity
                $selectButton.prop("disabled", activity.inPast && !activity.selected).text(activity.selected ? "Remove" : "Select")
                saveSelectedActivities()
                updateScheduleView()
            })

            if (!activity.instances.length) return

            $(this).children("td:nth-child(3)").append($selectButton)

            if (activity.inPast) {
                $selectButton.after(
                    $.make("span").text("This activity is in the past.")
                )
            }

            $(this).closest("tr").on("mouseenter", function () {
                $(this).addClass("opp-hovered-activity")
                hoveredActivity = activity
                updateScheduleView()
            }).on("mouseleave", function () {
                $(this).removeClass("opp-hovered-activity")
                if (hoveredActivity === activity) hoveredActivity = null
                updateScheduleView()
            })
        })
    })
}

if (location.pathname.startsWith("/a/opettaptied.jsp")) {
    parseOpettaptied()
}
