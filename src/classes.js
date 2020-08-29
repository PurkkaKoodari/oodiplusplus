// classes.js: data classes



/** Compared to Activity.dataVersion to see which activities need an update. */
const CURRENT_DATA_VERSION = 1

/** Represents a course that contains activities. */
class Course {
    /**
     * @param {string} code 
     * @param {string} name 
     */
    constructor(code, name) {
        this.code = code
        this.name = name
    }

    /** Serializes this course to a JSON-compatible object. */
    serialize() {
        return {
            code: this.code,
            name: this.name,
        }
    }

    /** Deserializes a course from the form outputted by serialize(). */
    static deserialize({code, name}) {
        return new Course(code, name)
    }
}

/** Represents an activity like a lecture or exercise. These are the units one can choose in Oodi. */
class Activity {
    /**
     * @param {Course} course 
     * @param {string} type 
     * @param {string} name 
     * @param {string} opetTapId
     * @param {Date} lastUpdate
     * @param {number} dataVersion
     */
    constructor(course, type, name, opetTapId, lastUpdate, dataVersion = CURRENT_DATA_VERSION) {
        this.course = course
        this.type = type
        this.name = name
        this.opetTapId = opetTapId
        this.dataVersion = dataVersion
        this.lastUpdate = lastUpdate
        /**
         * @type {Instance[]}
         */
        this.instances = []
        this.updateOpettaptied = () => {}
        /**
         * @type {Activity|null}
         */
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
        this.lastUpdate = this.updatedActivity.lastUpdate
        this.updatedActivity = null
    }

    /** Serializes this activity to a JSON-compatible object. */
    serialize() {
        return {
            course: this.course.serialize(),
            type: this.type,
            name: this.name,
            opetTapId: this.opetTapId,
            dataVersion: this.dataVersion,
            lastUpdate: this.lastUpdate.toString(),
            instances: this.instances.map(instance => instance.serialize()),
        }
    }

    /** Deserializes an activity from the form outputted by serialize(). */
    static deserialize({course, type, name, opetTapId, lastUpdate, dataVersion, instances}) {
        const courseObj = Course.deserialize(course)
        const activity = new Activity(courseObj, type, name, opetTapId, new Date(lastUpdate || new Date()), dataVersion || 0)
        activity.instances = instances.map(serializedInstance => Instance.deserialize(activity, serializedInstance))
        return activity
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

    /** Serializes this instance to a JSON-compatible object. */
    serialize() {
        return {
            start: this.start.toString(),
            end: this.end.toString(),
            location: this.location,
        }
    }

    /** Deserializes an instance from the form outputted by serialize(). */
    static deserialize(activity, {start, end, location}) {
        return new Instance(activity, new Date(start), new Date(end), location)
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
