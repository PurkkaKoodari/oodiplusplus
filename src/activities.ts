// activities.js: selected activities storage & (de)serialization

import {Activity, SerializedActivity} from "./classes"
import {Observable} from "./utils"

/** Attempts to deserialize a list of activities from a JSON-compatible object. */
export function deserializeActivities(serializedActivities: SerializedActivity[]): Activity[] {
    const activities = new Map<string, Activity>()
    for (const serializedActivity of serializedActivities) {
        const activity = Activity.deserialize(serializedActivity)
        activities.set(activity.identifier, activity)
    }
    return Array.from(activities.values())
}

/** Serializes selectedActivities to a JSON-compatible object. */
export function serializeSelectedActivities(): SerializedActivity[] {
    return selectedActivities.value.map(activity => activity.serialize())
}

/** Gets an existing copy of an activity, if one exists, or the given activity otherwise. */
export function getExistingSelectedActivity(parsed: Activity): Activity {
    return selectedActivities.value.find(selected => selected.identifier === parsed.identifier) ?? parsed
}

/** Selects an activity. */
export function selectActivity(activity: Activity): void {
    if (selectedActivities.value.some(selected => selected.identifier === activity.identifier)) throw new Error(`activity ${activity} is already selected`)
    selectedActivities.value = [...selectedActivities.value, activity]
    selectedActivities.changed()
}

/** Deselects an activity. */
export function deselectActivity(activity: Activity): void {
    selectedActivities.value = selectedActivities.value.filter(selected => selected.identifier !== activity.identifier)
    selectedActivities.changed()
}

/** The currently selected activities. */
export const selectedActivities = new Observable<readonly Activity[]>((() => {
    if (typeof GM_getValue !== "function") return []
    const serializedActivities = GM_getValue("selectedActivities", null)
    if (!serializedActivities) return []

    try {
        return deserializeActivities(serializedActivities)
    } catch (error) {
        console.error("Failed to load selected activities", error)
        return []
    }
})())

// add listener to auto-save activities on change
selectedActivities.addListener(() => {
    if (typeof GM_setValue !== "function") return

    GM_setValue("selectedActivities", serializeSelectedActivities())
})



/** The currently hovered activity, may be in selectedActivities or not. */
export const hoveredActivity = new Observable<Activity | null>(null)

export function hoverActivity(activity: Activity) {
    hoveredActivity.value = activity
}

export function unhoverActivity(activity: Activity) {
    if (hoveredActivity.value === activity) hoveredActivity.value = null
}
