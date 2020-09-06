// ical.ts: iCal export

import {Activity, Instance} from "./classes"
import {language, loc, locale, locf} from "./locales"
import {selectedActivities} from "./activities"
import {downloadFile, Observable, zeropad} from "./utils"

class IcalProperty {
    key: string
    value: string
    props: Map<string, string> = new Map()

    constructor(key: string, value: string) {
        this.key = key
        this.value = value
    }

    param(key: string, value: string): this {
        this.props.set(key, value)
        return this
    }

    toString() {
        let result = `${this.key}`
        for (const [key, value] of this.props) result += `;${key}="${value}"`
        result += `:${this.value}`
        return result
    }

    static text(key: string, value: string, addEmpty: boolean = false): IcalProperty | null {
        if (value === "" && !addEmpty) return null
        const escaped = value
                .replace(/\\/g, "\\\\") // escape backslashes
                .replace(/\r?\n/g, "\\n") // escape newlines
                .replace(/[,;]/g, "\\$&") // escape , and ;
                .replace(/\s+/g, " ") // normalize whitespace to single spaces
                .replace(/[\x00-\x1f\x7f]/g, "") // remove other control chars
        return new IcalProperty(key, escaped)
    }

    static date(key: string, value: Date): IcalProperty {
        const dateStr = zeropad`${value.getUTCFullYear()}[4]${value.getUTCMonth() + 1}[2]${value.getUTCDate()}[2]T${value.getUTCHours()}[2]${value.getUTCMinutes()}[2]${value.getUTCSeconds()}[2]Z`
        return new IcalProperty(key, dateStr)
    }
}

class IcalObject {
    type: string
    children: (IcalObject | IcalProperty)[] = []

    constructor(type: string) {
        this.type = type
    }

    /** Adds a child object to this object. */
    add(child: IcalObject | IcalProperty | null) {
        if (child !== null) this.children.push(child)
    }

    /** Converts this object to a iCal format compliant string. */
    toString(): string {
        const raw = `BEGIN:${this.type}\n${this.children.map(child => child.toString() + "\n").join("")}END:${this.type}`
        // limit lines to 75 octets
        const lines = raw.split(/\r?\n/g)
        return lines.flatMap(line => {
            let split = []
            while (line.length > 75) {
                split.push(line.substring(0, 75))
                line = "\t" + line.substring(75)
            }
            split.push(line)
            return split
        }).join("\r\n")
    }
}

/** Computes an unique ID for an instance for use in iCal. */
function instanceUid(instance: Instance, instanceNo: number) {
    const uniquePart = btoa(`${instance.activity.course.code}\x00${instance.activity.name}\x00${instanceNo}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
    return `opp-${uniquePart}@purkka.codes`
}

export type IcalExportFormatStrings = Readonly<{
    title: string
    description: string
}>

export const DEFAULT_ICAL_EXPORT_FORMAT = {
    title: "%c/%a %n",
    description: "%c %n\n%t %a\n%u",
}

/** Format strings used for iCal exports. */
export const icalExportFormatStrings = new Observable<IcalExportFormatStrings>((() => {
    const loadedFormat = typeof GM_getValue === "function" ? GM_getValue("icalExportFormat") : null
    if (!loadedFormat || !loadedFormat.title || !loadedFormat.description) return DEFAULT_ICAL_EXPORT_FORMAT
    return loadedFormat
})())

icalExportFormatStrings.addListener(currentFormat => {
    if (typeof GM_setValue === "function") GM_setValue("icalExportFormat", currentFormat)
})

/** Formats an event title or description. */
function formatString(instance: Instance, format: string) {
    return format.replace(/%[cntalseu]/g, match => {
        switch (match[1]) {
            case "c":
                return instance.activity.course.code
            case "n":
                return instance.activity.course.name
            case "t":
                return instance.activity.type
            case "a":
                return instance.activity.name
            case "l":
                return instance.location
            case "s":
                return locale.datetime(instance.start)
            case "e":
                return locale.datetime(instance.end)
            case "u":
                return instance.activity.url
            default:
                throw new Error()
        }
    })
}

/** Generates an iCal file from the given activities. */
function createIcalFromActivities(activities: Iterable<Activity>, format: IcalExportFormatStrings) {
    const calendar = new IcalObject("VCALENDAR")
    calendar.add(IcalProperty.text("VERSION", "2.0"))
    calendar.add(IcalProperty.text("PRODID", "-//PurkkaKoodari//Oodi++ ${VERSION}//EN"))
    calendar.add(IcalProperty.text("METHOD", "PUBLISH"))
    calendar.add(IcalProperty.text("NAME", loc`ical.title`))
    calendar.add(IcalProperty.text("DESCRIPTION", locf`ical.description`(VERSION, locale.datetime(new Date()))))
    calendar.add(IcalProperty.text("X-WR-CALNAME", loc`ical.title`))
    calendar.add(IcalProperty.text("X-WR-CALDESC", locf`ical.description`(VERSION, locale.datetime(new Date()))))
    for (const activity of activities) {
        let instanceNo = 0
        for (const instance of activity.instances) {
            const event = new IcalObject("VEVENT")
            event.add(IcalProperty.text("UID", instanceUid(instance, instanceNo)))
            event.add(IcalProperty.date("DTSTAMP", activity.lastUpdate))
            event.add(IcalProperty.date("DTSTART", instance.start))
            event.add(IcalProperty.date("DTEND", instance.end))
            event.add(IcalProperty.text("SUMMARY", formatString(instance, format.title)))
            event.add(IcalProperty.text("DESCRIPTION", formatString(instance, format.description)))
            event.add(IcalProperty.text("LOCATION", instance.location))
            event.add(IcalProperty.text("CATEGORIES", `${activity.course.code} ${activity.course.name}`))
            event.add(IcalProperty.text("CATEGORIES", activity.type))
            for (const teacher of activity.teachers) event.add(new IcalProperty("ATTENDEE", `mailto:${teacher.email}`).param("CN", teacher.name))
            event.add(IcalProperty.text("URL", activity.url))
            calendar.add(event)
        }
    }
    return calendar.toString()
}

/** Converts selectedActivities to iCal format and opens a download dialog for the file. */
export function exportSelectedActivitiesAsIcal(): void {
    const icalContents = createIcalFromActivities(selectedActivities.value, icalExportFormatStrings.value)
    downloadFile(icalContents, "oodiplusplus.ics", "text/calendar")
}
