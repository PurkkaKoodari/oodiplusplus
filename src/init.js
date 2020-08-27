// init.js: init code and common utilities



const VERSION = typeof GM_info === "object" ? GM_info.script.version : "unknown version"
console.info(`Oodi++ ${VERSION} active`)




// Get the language code from the page.
let language = $("html").attr("lang")
if (!["fi", "sv", "en"].includes(language)) language = "fi"




// Various time constants in milliseconds.
const ONE_MINUTE = 60 * 1000
const ONE_HOUR = 60 * ONE_MINUTE
const ONE_DAY = 24 * ONE_HOUR
const ONE_WEEK = 7 * ONE_DAY




/** 
 * Converts a Date.getDay() value to the corresponding index where 0 = Monday.
 * @param {number} dateDay
 */
const finnishWeekday = dateDay => (dateDay + 6) % 7

/** 
 * Gets the number of milliseconds after midnight, in local time, from the given Date.
 * @param {Date} date
 */
const timeOfDay = date => (date.getTime() - date.getTimezoneOffset() * ONE_MINUTE) % ONE_DAY

/**
 * Creates a named HTML element. Same as $("<nodeName></nodeName>") but faster and safer. 
 * @param {string} nodeName
 */
$.make = nodeName => $(document.createElement(nodeName))




/** The start of the current week's Monday at the time of page load. */
const thisMonday = new Date()
thisMonday.setTime(thisMonday.getTime() - timeOfDay(thisMonday))
while (thisMonday.getDay() != 1) thisMonday.setTime(thisMonday.getTime() - ONE_DAY)




/** Attempts to load selectedActivities from the userscript storage. */
const loadSelectedActivities = () => {
    if (typeof GM_getValue !== "function") return {}
    const serializedActivities = GM_getValue("selectedActivities", null)
    if (!serializedActivities) return {}

    const activities = {}
    for (const {course, type, name, url, instances} of serializedActivities) {
        const activity = new Activity(course, type, name, url)
        activity.instances = instances.map(({start, end, location}) => ({
            activity,
            start: new Date(start),
            end: new Date(end),
            location,
        }))
        activities[activity.identifier] = activity
    }
    return activities
}

/** Attempts to save selectedActivities to the userscript storage. */
const saveSelectedActivities = () => {
    if (typeof GM_setValue !== "function") return

    const serializedActivities = Array.from(Object.values(selectedActivities)).map(({course, type, name, url, instances}) => ({
        course,
        type,
        name,
        url,
        instances: instances.map(({start, end, location}) => ({
            start: start.toString(),
            end: end.toString(),
            location,
        }))
    }))
    GM_setValue("selectedActivities", serializedActivities)
}

/** The currently selected activities. */
const selectedActivities = loadSelectedActivities()
/** The currently hovered activity, may be in selectedActivities. */
let hoveredActivity = null




// flatten the blue top bar into the flex to make it flow nicer
$(".menu-content-wrapper").append($(".menu-topbar-actions-wrapper").children())
