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




/** Attempts to deserialize a list of activities from a JSON-compatible object. */
const deserializeActivities = serializedActivities => {
    const activities = {}
    for (const serializedActivity of serializedActivities) {
        const activity = Activity.deserialize(serializedActivity)
        activities[activity.identifier] = activity
    }
    return activities
}

/** Serializes selectedActivities to a JSON-compatible object. */
const serializeSelectedActivities = () => {
    return Array.from(Object.values(selectedActivities)).map(activity => activity.serialize())
}

/** Attempts to load selectedActivities from the userscript storage. */
const loadSelectedActivities = () => {
    if (typeof GM_getValue !== "function") return {}
    const serializedActivities = GM_getValue("selectedActivities", null)
    if (!serializedActivities) return {}

    return deserializeActivities(serializedActivities)
}

/** Attempts to save selectedActivities to the userscript storage. */
const saveSelectedActivities = () => {
    if (typeof GM_setValue !== "function") return

    GM_setValue("selectedActivities", serializeSelectedActivities())
}

/** Removes all selected activities. */
const clearSelectedActivities = () => {
    for (const key of Object.keys(selectedActivities)) delete selectedActivities[key]
}

/**
 * Replaces selectedActivities with the given activities.
 * @param {Object<string, Activity>} activities
 */
const setSelectedActivities = activities => {
    clearSelectedActivities()
    for (const activity of Object.values(activities)) selectedActivities[activity.identifier] = activity
}

/**
 * The currently selected activities.
 * @type {Object<string, Activity>}
 */
const selectedActivities = {}
setSelectedActivities(loadSelectedActivities())

/**
 * The currently hovered activity, may be in selectedActivities.
 * @type {Activity|null}
 */
let hoveredActivity = null

/**
 * Sets the hovered activity and updates all activity UI.
 * @param {Activity|null} activity
 */
const setHoveredActivity = activity => {
    hoveredActivity = activity
    updateActivities()
}

/** Updates all activity UI. */
const updateActivities = () => {
    updateScheduleView()
    for (const opettaptiedActivity of opettaptiedActivities) opettaptiedActivity.updateOpettaptied()
}
