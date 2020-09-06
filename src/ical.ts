// ical.ts: iCal export

import {Activity, Instance} from "./classes"
import {language, loc, locf} from "./locales"
import {selectedActivities} from "./activities"
import {downloadFile} from "./utils"

class IcalObject {
    type: string
    children: string[] = []

    constructor(type: string) {
        this.type = type
    }

    /** Adds a text property to this object. */
    addText(key: string, value: string, addEmpty: boolean = false) {
        if (value === "" && !addEmpty) return
        const escaped = value
                .replace(/\\/g, "\\\\") // escape backslashes
                .replace(/\r?\n/g, "\\n") // escape newlines
                .replace(/[,;]/g, "\\$&") // escape , and ;
                .replace(/\s+/g, " ") // normalize whitespace to single spaces
                .replace(/[\x00-\x1f\x7f]/g, "") // remove other control chars
        this.children.push(`${key}:${escaped}`)
    }

    /** Adds a date property to this object. */
    addDate(key: string, value: Date) {
        const dateStr = `${pad(4, value.getUTCFullYear())}${pad(2, value.getUTCMonth() + 1)}${pad(2, value.getUTCDate())}T${pad(2, value.getUTCHours())}${pad(2, value.getUTCMinutes())}${pad(2, value.getUTCSeconds())}Z`
        this.children.push(`${key}:${dateStr}`)
    }

    /** Adds a child object to this object. */
    add(child: IcalObject) {
        this.children.push(child.toString())
    }

    /** Converts this object to a iCal format compliant string. */
    toString(): string {
        const raw = `BEGIN:${this.type}\n${this.children.map(child => child + "\n").join("")}END:${this.type}`
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

/** Zero-pads a number to the given length. */
function pad(digits: number, num: number) {
    return num.toString().padStart(digits, "0")
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

// load current format strings
let currentFormat: IcalExportFormatStrings = typeof GM_getValue === "function" ? GM_getValue("icalExportFormat") : null
if (!currentFormat || !currentFormat.title || !currentFormat.description) {
    currentFormat = {
        title: "%c/%a %n",
        description: "%c %n\n%t %a\n%u",
    }
}

export function getIcalExportFormatStrings(): IcalExportFormatStrings {
    return currentFormat
}

export function setIcalExportFormatStrings(format: Partial<IcalExportFormatStrings>): void {
    currentFormat = {
        ...currentFormat,
        ...format,
    }
    if (typeof GM_setValue === "function") GM_setValue("icalExportFormat", currentFormat)
}

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
                return instance.start.toLocaleString(language)
            case "e":
                return instance.end.toLocaleString(language)
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
    calendar.addText("VERSION", "2.0")
    calendar.addText("PRODID", "-//PurkkaKoodari//Oodi++ ${VERSION}//EN")
    calendar.addText("METHOD", "PUBLISH")
    calendar.addText("NAME", loc`ical.title`)
    calendar.addText("DESCRIPTION", locf`ical.description`(VERSION, new Date().toLocaleString(language)))
    calendar.addText("X-WR-CALNAME", loc`ical.title`)
    calendar.addText("X-WR-CALDESC", locf`ical.description`(VERSION, new Date().toLocaleString(language)))
    for (const activity of activities) {
        let instanceNo = 0
        for (const instance of activity.instances) {
            const event = new IcalObject("VEVENT")
            event.addText("UID", instanceUid(instance, instanceNo))
            event.addDate("DTSTAMP", activity.lastUpdate)
            event.addDate("DTSTART", instance.start)
            event.addDate("DTEND", instance.end)
            event.addText("SUMMARY", formatString(instance, format.title))
            event.addText("DESCRIPTION", formatString(instance, format.description))
            event.addText("LOCATION", instance.location)
            event.addText("CATEGORIES", `${activity.course.code} ${activity.course.name}`)
            event.addText("CATEGORIES", activity.type)
            event.addText("URL", activity.url)
            calendar.add(event)
        }
    }
    return calendar.toString()
}

/** Converts selectedActivities to iCal format and opens a download dialog for the file. */
export function exportSelectedActivitiesAsIcal(): void {
    const icalContents = createIcalFromActivities(selectedActivities.value.values(), currentFormat)
    downloadFile(icalContents, "oodiplusplus.ics", "text/calendar")
}
