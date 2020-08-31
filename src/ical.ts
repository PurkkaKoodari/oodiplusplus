// ical.ts: iCal export

import {Activity, Instance} from "./classes"
import {language} from "./locales"
import {getSelectedActivities} from "./schedule"
import {downloadFile} from "./utils"

/** Escapes a raw string to an iCal text value. */
function escapeIcalText(text: string) {
    return text
            .replace(/\\/g, "\\\\") // escape backslashes
            .replace(/\r?\n/g, "\\n") // escape newlines
            .replace(/[,;]/g, "\\$1") // escape , and ;
            .replace(/\s+/g, " ") // normalize whitespace to single spaces
            .replace(/[\x00-\x1f\x7f]/g, "") // remove other control chars
}

/** Zero-pads a number to the given length. */
function pad(digits: number, num: number) {
    return num.toString().padStart(digits, "0")
}

/** Formats a Date to an iCal datetime value. */
function formatIcalDate(date: Date) {
    return `${pad(4, date.getUTCFullYear())}${pad(2, date.getUTCMonth() + 1)}${pad(2, date.getUTCDate())}T${pad(2, date.getUTCHours())}${pad(2, date.getUTCMinutes())}${pad(2, date.getUTCSeconds())}Z`
}

/** Computes an unique ID for an instance for use in iCal. */
function instanceUid(instance: Instance, instanceNo: number) {
    const uniquePart = btoa(`${instance.activity.course.code}\x00${instance.activity.name}\x00${instanceNo}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
    return `opp-${uniquePart}@purkka.codes`
}

/** Generates an iCal file from the given activities. */
function createIcalFromActivities(activities: Iterable<Activity>) {
    let file = `\
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PurkkaKoodari//Oodi++ ${VERSION}//EN
METHOD:PUBLISH
NAME:Oodi++ Schedule
DESCRIPTION:Exported from Oodi++ ${VERSION} at ${new Date().toLocaleString(language)}
X-WR-CALNAME:Oodi++ Schedule
X-WR-CALDESC:Exported from Oodi++ ${VERSION} at ${new Date().toLocaleString(language)}
`
    for (const activity of activities) {
        let instanceNo = 0
        for (const instance of activity.instances) {
            file += `\
BEGIN:VEVENT
UID:${escapeIcalText(instanceUid(instance, instanceNo))}
DTSTAMP:${formatIcalDate(instance.activity.lastUpdate)}
DTSTART:${formatIcalDate(instance.start)}
DTEND:${formatIcalDate(instance.end)}
SUMMARY:${escapeIcalText(`${instance.activity.course.code}/${instance.activity.name} ${instance.activity.course.name}`)}
DESCRIPTION:${escapeIcalText(`${instance.activity.course.code} ${instance.activity.course.name}\n${instance.activity.type} ${instance.activity.name}\nhttps://${location.host}/a/opettaptied.jsp?OpetTap=${instance.activity.opetTapId}`)}
LOCATION:${escapeIcalText(instance.location)}
CATEGORIES:${escapeIcalText(`${instance.activity.course.code} ${instance.activity.course.name}`)}
CATEGORIES:${escapeIcalText(instance.activity.type)}
URL:https://${location.host}/a/opettaptied.jsp?OpetTap=${instance.activity.opetTapId}
END:VEVENT
`
        }
    }
    file += `\
END:VCALENDAR
`
    // the iCal spec calls for CRLF so make sure all line breaks are CRLF
    file = file.replace(/\r?\n/g, "\r\n")
    // limit lines to 75 octets
    file = file.split("\r\n").map(line => {
        let split = ""
        while (line.length > 75) {
            split += line.substring(0, 75) + "\r\n"
            line = "\t" + line.substring(75)
        }
        split += line
        return split
    }).join("\r\n")
    return file
}

/** Converts selectedActivities to iCal format and opens a download dialog for the file. */
export function exportSelectedActivitiesAsIcal() {
    const icalContents = createIcalFromActivities(getSelectedActivities())
    downloadFile(icalContents, "oodiplusplus.ics", "text/calendar")
}
