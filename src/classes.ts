// classes.ts: data classes

import {isActivitySelected} from "./schedule"
import {thisMonday} from "./utils"

/** Compared to Activity.dataVersion to see which activities need an update. */
const CURRENT_DATA_VERSION = 1

export type SerializedCourse = {
    code: string
    name: string
}

/** Represents a course that contains activities. */
export class Course {
    /** The code of the course, such as CS-A1100. */
    code: string
    /** The name of the course, such as Programming 1. */
    name: string

    constructor(code: string, name: string) {
        this.code = code
        this.name = name
    }

    /** Serializes this course to a JSON-compatible object. */
    serialize(): SerializedCourse {
        return {
            code: this.code,
            name: this.name,
        }
    }

    /** Deserializes a course from the form outputted by serialize(). */
    static deserialize({code, name}: SerializedCourse) {
        if (typeof code !== "string" || !code) throw new Error("missing course code")
        if (typeof name !== "string" || !name) throw new Error("missing course name")

        return new Course(code, name)
    }
}

export type SerializedActivity = {
    course: SerializedCourse
    type: string
    name: string
    opetTapId: string
    lastUpdate: string
    dataVersion: number
    instances: SerializedInstance[]
}

/** Represents an activity like a lecture or exercise. These are the units one can choose in Oodi. */
export class Activity {
    /** The course containing this Activity. */
    course: Course
    /** The type of the activity, such as Lecture. */
    type: string
    /** The name of the activity, such as L01. */
    name: string
    /** The id of the course, found in the opettaptied.jsp URL as OpetTap. */
    opetTapId: string
    /** The latest moment the activity was updated. */
    lastUpdate: Date
    /** The latest version of data imported into the activity. */
    dataVersion: number
    /** The instances of this activity. */
    instances: Instance[] = []
    /** An instance of Activity used as a "dumb container" containing updated data from the current page. */
    updatedActivity: Activity | null = null
    /** A function to call to update the HTML injected into opettaptied.js with this activity's data. */
    updateOpettaptied: () => void = () => {}

    constructor(course: Course, type: string, name: string, opetTapId: string, lastUpdate: Date, dataVersion: number = CURRENT_DATA_VERSION) {
        this.course = course
        this.type = type
        this.name = name
        this.opetTapId = opetTapId
        this.lastUpdate = lastUpdate
        this.dataVersion = dataVersion
    }

    /** An identifier for the activity that is considered unique. */
    get identifier() {
        return `${this.course.code} ${this.name}`
    }

    /** Checks whether or not this activity is currently selected. */
    get selected() {
        return isActivitySelected(this)
    }

    /** Checks whether or not all instances of this activity are in the past. */
    get inPast() {
        return this.instances.every(instance => instance.start.getTime() < thisMonday.getTime())
    }

    /** Checks whether or not this activity needs a data update. */
    get needsUpdate() {
        return this.dataVersion < CURRENT_DATA_VERSION
    }

    /** Updates this activity from the parsed activity. */
    update() {
        if (!this.updatedActivity) throw new Error("nothing to update")
        this.course = this.updatedActivity.course
        this.type = this.updatedActivity.type
        this.opetTapId = this.updatedActivity.opetTapId
        this.instances = this.updatedActivity.instances
        this.dataVersion = CURRENT_DATA_VERSION
        this.lastUpdate = this.updatedActivity.lastUpdate
        this.updatedActivity = null
    }

    /** Serializes this activity to a JSON-compatible object. */
    serialize(): SerializedActivity {
        return {
            course: this.course.serialize(),
            type: this.type,
            name: this.name,
            opetTapId: this.opetTapId,
            dataVersion: this.dataVersion,
            lastUpdate: this.lastUpdate.toISOString(),
            instances: this.instances.map(instance => instance.serialize()),
        }
    }

    /** Deserializes an activity from the form outputted by serialize(). */
    static deserialize({course, type, name, opetTapId, lastUpdate, dataVersion, instances}: SerializedActivity) {
        const courseObj = Course.deserialize(course)

        if (typeof type !== "string") throw new Error("invalid activity type")
        if (typeof name !== "string" || !name) throw new Error("missing activity name")
        if (opetTapId && typeof opetTapId !== "string") throw new Error("invalid activity opetTapId")
        const lastUpdateDate = new Date(lastUpdate || new Date())
        if (isNaN(lastUpdateDate.getTime())) throw new Error("invalid activity lastUpdate")
        const dataVersionNum = dataVersion || 0
        if (typeof dataVersionNum !== "number") throw new Error("invalid activity dataVersion")

        const activity = new Activity(courseObj, type, name, opetTapId, lastUpdateDate, dataVersionNum)
        activity.instances = instances.map(serializedInstance => Instance.deserialize(activity, serializedInstance))
        return activity
    }
}

export type SerializedInstance = {
    start: string
    end: string
    location: string
}

/** Represents a single instance of an activity, like a single lecture. */
export class Instance {
    /** The activity containing this instance. */
    activity: Activity
    /** The starting time of this instance. */
    start: Date
    /** The ending time of this instance. */
    end: Date
    /** The location of this instance. */
    location: string

    constructor(activity: Activity, start: Date, end: Date, location: string) {
        this.activity = activity
        this.start = start
        this.end = end
        this.location = location
    }

    /** Serializes this instance to a JSON-compatible object. */
    serialize(): SerializedInstance {
        return {
            start: this.start.toISOString(),
            end: this.end.toISOString(),
            location: this.location,
        }
    }

    /** Deserializes an instance from the form outputted by serialize(). */
    static deserialize(activity: Activity, {start, end, location}: SerializedInstance) {
        const startDate = new Date(start)
        if (isNaN(startDate.getTime())) throw new Error("invalid instance start")
        const endDate = new Date(end)
        if (isNaN(endDate.getTime())) throw new Error("invalid instance end")
        if (typeof location !== "string") throw new Error("invalid instance location")

        return new Instance(activity, startDate, endDate, location)
    }
}

/** Holds preprocessed data of an Instance for the purposes of timetable rendering. */
export class RenderInstance {
    instance: Instance
    weekday: number
    start: number
    end: number
    columns: {start: number, end: number} | null = null
    
    constructor(instance: Instance, weekday: number, start: number, end: number) {
        this.instance = instance
        this.weekday = weekday
        this.start = start
        this.end = end
        this.columns = null
    }

    overlaps(other: RenderInstance): boolean {
        return this !== other && this.weekday === other.weekday && this.start < other.end && other.start < this.end
    }
}
