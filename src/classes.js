// classes.js: data classes



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
     * @param {string} url 
     */
    constructor(course, type, name, url) {
        this.course = course
        this.type = type
        this.name = name
        this.url = url
        this.instances = []
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