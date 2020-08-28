// classes.js: data classes



/** Compared to Activity.dataVersion to see which activities need an update. */
const CURRENT_DATA_VERSION = 1

/** Represents a course that contains activities. */
class Course {
    constructor() {
        this.code = null
        this.name = null
    }
}

/** Represents an activity like a lecture or exercise. These are the units one can choose in Oodi. */
class Activity {
    /**
     * @param {Course} course 
     * @param {string} type 
     * @param {string} name 
     * @param {string} opetTapId
     * @param {number} dataVersion
     */
    constructor(course, type, name, opetTapId, dataVersion = CURRENT_DATA_VERSION) {
        this.course = course
        this.type = type
        this.name = name
        this.opetTapId = opetTapId
        this.dataVersion = dataVersion
        this.instances = []
        this.updateOpettaptied = () => {}
        this.updatedActivity = null
    }

    /** An identifier for the activity that is considered unique. */
    get identifier() {
        return `${this.course.code} ${this.name}`
    }

    /** Checks whether or not this activity is currently selected. */
    get selected() {
        return this.identifier in selectedActivities
    }

    /** Checks whether or not all instances of this activity are in the past. */
    get inPast() {
        return this.instances.every(instance => instance.start.getTime() < thisMonday.getTime())
    }

    /** Updates this activity from the parsed activity. */
    update() {
        if (!this.updatedActivity) throw new Error("nothing to update")
        this.course = this.updatedActivity.course
        this.type = this.updatedActivity.type
        this.opetTapId = this.updatedActivity.opetTapId
        this.instances = this.updatedActivity.instances
        this.dataVersion = CURRENT_DATA_VERSION
        this.updatedActivity = null
    }
}

/** Represents a single instance of an activity, like a single lecture. */
class Instance {
    /**
     * @param {Activity} activity 
     * @param {Date} start 
     * @param {Date} end 
     * @param {string} location 
     */
    constructor(activity, start, end, location) {
        this.activity = activity
        this.start = start
        this.end = end
        this.location = location
    }
}

/** Holds preprocessed data of an Instance for the purposes of timetable rendering. */
class RenderInstance {
    /**
     * @param {Instance} instance 
     * @param {number} weekday 
     * @param {number} start 
     * @param {number} end 
     */
    constructor(instance, weekday, start, end) {
        this.instance = instance
        this.weekday = weekday
        this.start = start
        this.end = end
        this.columns = null
    }

    overlaps(other) {
        return this !== other && this.weekday === other.weekday && this.start < other.end && other.start < this.end
    }
}
