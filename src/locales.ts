// locales.ts: localization (including localization of page parsing)

import $ from "jquery"

import {zeropad} from "./utils"

/** The language code extracted from the page. */
export const language: string = (() => {
    let langAttr = $("html").attr("lang")!
    return ["fi", "sv", "en"].includes(langAttr) ? langAttr : "en"
})()



/** The headings of the course information table in the default locales. */
export const COURSE_INFO_KEYS: MapObj<string> = {
    "Tunniste": "code", "Kod": "code", "Code": "code",
    "Nimi": "name", "Namn": "name", "Name": "name",
}

type LocaleFormat = (...args: any[]) => string
type LocaleMessage = LocaleFormat | string

/** Tag for localization template strings. */
function fmt(strings: TemplateStringsArray, ...params: number[]): LocaleFormat {
    if (strings.length === 1) throw new Error("fmt must have parameters")

    return (...args: any[]) => {
        const parts = [strings[0]]
        for (let i = 0; i < strings.length - 1; i++) {
            parts.push(args[params[i]].toString(), strings[i + 1])
        }
        return parts.join("")
    }
}

type Locale = {
    weekdays: string[]
    date(date: Date): string
    time(date: Date): string
    datetime(date: Date): string
    messages: MapObj<LocaleMessage>
}

/** Weekday names in the default locales. */
export const LOCALES: MapObj<Locale> = {
    fi: {
        weekdays: ["ma", "ti", "ke", "to", "pe", "la", "su"],
        date(date) {
            return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
        },
        time(date) {
            return zeropad`${date.getHours()}[0].${date.getMinutes()}[2]`
        },
        datetime(date) {
            return `${this.date(date)} ${this.time(date)}`
        },
        messages: {
            "alert.dataUpdate.available": fmt`${0} aktiviteettia tällä sivulla on muuttunut Oodi++:aan lisäämisen jälkeen. `,
            "alert.dataUpdate.available.differentLang": fmt`${0} niistä on lisätty eri kielellä kuin Oodin nykyinen kieli, mikä voi aiheuttaa tämän. `,
            "alert.dataUpdate.required": fmt`${0} aktiviteetin data on vanhassa muodossa. Käy niiden kurssisivuilla päivittääksesi ne.`,
            "alert.dataUpdate.updateAll": "Päivitä kaikki",
            "alert.deletePast": fmt`${0} aktiviteetilla ei ole yhtään tapahtumaa tulevaisuudessa. `,
            "alert.deletePast.delete": "Poista kaikki",
            "appTitle": fmt`Oodi++ ${0}`,
            "ical.title": "Oodi++ lukujärjestys",
            "ical.description": fmt`Viety Oodi++ versiosta ${0} ${1}`,
            "opettaptied.add": "Lisää Oodi++:aan",
            "opettaptied.dataUpdate": "Päivitä Oodi++:ssa",
            "opettaptied.dataUpdate.tooltip": "Klikkaa päivittääksesi samanniminen aktiviteetti Oodi++:ssa tältä sivulta löytyvillä tiedoilla",
            "opettaptied.inpast": "Tämä aktiviteetti on menneisyydessä.",
            "opettaptied.remove": "Poista Oodi++:sta",
            "schedule.actions.title": "Työkalut:",
            "schedule.actions.remove": "Poista",
            "schedule.actions.exportIcal": "Vie iCal-tiedostoon",
            "schedule.dataUpdate.required": "Tämän aktiviteetin data on vanhentuneessa muodossa. Käy sen kurssisivulla päivittääksesi sen.",
            "schedule.empty.allInPast": "Kaikki valitut aktiviteetit ovat menneisyydessä. Valitse lisää aktiviteetteja näyttääksesi lukujärjestyksen.",
            "schedule.empty.noSelection": "Valitse aktiviteetteja Oodista näyttääksesi lukujärjestyksen.",
            "schedule.tooltip.location": "Sijainti:",
            "schedule.tooltip.teacher": "Opettaja:",
            "settings.appUpdated": fmt`Oodi++ on päivitetty versioon ${0}. Tässä uudet ominaisuudet.`,
            "settings.export.file": "Vie data tiedostoon",
            "settings.export.text": "Vie data tekstinä",
            "settings.export.text.prompt": "Kopioi tietosi tästä:",
            "settings.ical.format": "iCal-vienti",
            "settings.ical.format.description": "Tapahtuman kuvaus:",
            "settings.ical.format.help": `\
Käytä näitä symboleja iCal-tapahtumien muotoiluun:
%c \u2013 kurssikoodi, kuten CS-A1234
%n \u2013 kurssin nimi, kuten Ohjelmointi 1
%t \u2013 aktiviteetin tyyppi, kuten Luento
%a \u2013 aktiviteetin koodi, kuten L01
%l \u2013 sijainti
%s \u2013 alkupäivä ja -aika
%e \u2013 loppupäivä ja -aika
%u \u2013 WebOodi-URL`,
            "settings.ical.format.reset": "Palauta oletukset",
            "settings.ical.format.title": "Tapahtuman nimi:",
            "settings.import.confirm": "Haluatko varmasti POISTAA PYSYVÄSTI kaikki Oodi++:aan lisätyt aktiviteetit ja korvata ne tuoduilla?",
            "settings.import.failed.file": "Aktiviteettien tuominen epäonnistui. Syöttämäsi teksti on todennäköisesti rikki tai virheellinen. Aiemmat aktiviteettisi ovat ennallaan.",
            "settings.import.failed.text": "Aktiviteettien tuominen epäonnistui. Valitsemasi tiedosto on todennäköisesti rikki tai virheellinen. Aiemmat aktiviteettisi ovat ennallaan.",
            "settings.import.file": "Tuo data tiedostosta",
            "settings.import.success": fmt`${0} aktiviteettia tuotiin.`,
            "settings.import.text": "Tuo data tekstinä",
            "settings.import.text.prompt": "Syötä viety teksti:",
            "settings.language": "Oodi++:n kieli synkronoidaan automaattisesti Oodin kielen kanssa.",
            "settings.releaseNotes": "Versiohistoria",
            "settings.reset": "Nollaa data",
            "settings.reset.confirm": "Haluatko varmasti POISTAA PYSYVÄSTI kaikki Oodi++:aan lisätyt aktiviteetit?",
            "settings.theme": "Teema",
            "settings.theme.dark": "Tumma",
            "settings.theme.light": "Vaalea",
            "settings.title": "Asetukset",
            "update.available": fmt`Uusi versio Oodi++:sta on saatavilla: ${0}!`,
            "update.check": "Tarkista",
            "update.checking": "Tarkistetaan päivityksiä\u2026",
            "update.failed": "Päivitysten tarkistaminen epäonnistui.",
            "update.install": "Klikkaa tästä asentaaksesi sen, sitten päivitä sivu: ",
            "update.lastCheck": fmt`Päivitykset tarkistettu viimeksi: ${0}`,
        },
    },
    sv: {
        weekdays: ["må", "ti", "on", "to", "fr", "lö", "sö"],
        date(date) {
            return zeropad`${date.getFullYear()}[4]-${date.getMonth() + 1}[2]-${date.getDate()}[2]`
        },
        time(date) {
            return zeropad`${date.getHours()}[0]:${date.getMinutes()}[2]`
        },
        datetime(date) {
            return `${this.date(date)} ${this.time(date)}`
        },
        messages: {},
    },
    en: {
        weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        date(date) {
            return zeropad`${date.getFullYear()}[4]-${date.getMonth() + 1}[2]-${date.getDate()}[2]`
        },
        time(date) {
            return zeropad`${date.getHours()}[0]:${date.getMinutes()}[2]`
        },
        datetime(date) {
            return `${this.date(date)} ${this.time(date)}`
        },
        messages: {
            "alert.dataUpdate.available": fmt`${0} activities on this page have changed since they were added to Oodi++. `,
            "alert.dataUpdate.available.differentLang": fmt`${0} of them were added in a language other than Oodi's current language, which may cause this. `,
            "alert.dataUpdate.required": fmt`${0} activities are using an outdated data format. Visit their course pages to update them.`,
            "alert.dataUpdate.updateAll": "Update all",
            "alert.deletePast": fmt`${0} activities have no upcoming instances. `,
            "alert.deletePast.delete": "Delete all",
            "appTitle": fmt`Oodi++ ${0}`,
            "ical.title": "Oodi++ Schedule",
            "ical.description": fmt`Exported from Oodi++ ${0} at ${1}`,
            "opettaptied.add": "Add to Oodi++",
            "opettaptied.dataUpdate": "Update in Oodi++",
            "opettaptied.dataUpdate.tooltip": "Click to update the activity with the same name in Oodi++ with the details from this page",
            "opettaptied.inpast": "This activity is in the past.",
            "opettaptied.remove": "Remove from Oodi++",
            "schedule.actions.title": "Schedule tools:",
            "schedule.actions.remove": "Remove",
            "schedule.actions.exportIcal": "Export iCal",
            "schedule.dataUpdate.required": "This activity's data is in an outdated format. Visit its course page to update it.",
            "schedule.empty.allInPast": "All currently selected activities are in the past. Select more activities from Oodi to display a schedule.",
            "schedule.empty.noSelection": "Select activities from Oodi to display a schedule.",
            "schedule.tooltip.location": "Location:",
            "schedule.tooltip.teacher": "Teacher:",
            "settings.appUpdated": fmt`Oodi++ was updated to version ${0}. Here's what's new.`,
            "settings.export.file": "Export data to file",
            "settings.export.text": "Export data as text",
            "settings.export.text.prompt": "Copy your schedule here:",
            "settings.ical.format": "iCal export",
            "settings.ical.format.description": "Event description:",
            "settings.ical.format.help": `\
Use these symbols to format iCal events:
%c \u2013 course code, such as CS-A1234
%n \u2013 course name, such as Programming 1
%t \u2013 activity type, such as Lecture
%a \u2013 activity code, such as L01
%l \u2013 location
%s \u2013 start time/date
%e \u2013 end time/date
%u \u2013 WebOodi URL`,
            "settings.ical.format.reset": "Restore defaults",
            "settings.ical.format.title": "Event title:",
            "settings.import.confirm": "Are you sure you want to PERMANENTLY DELETE all activities added to Oodi++ and replace them with imported ones?",
            "settings.import.failed.file": "Failed to import activities. Most likely the text you entered is broken or incorrect. Your previous activities have been preserved.",
            "settings.import.failed.text": "Failed to import activities. Most likely the file you chose is broken or incorrect. Your previous activities have been preserved.",
            "settings.import.file": "Import data from file",
            "settings.import.success": fmt`Successfully imported ${0} activities.`,
            "settings.import.text": "Import data as text",
            "settings.import.text.prompt": "Enter the exported text:",
            "settings.language": "The language of Oodi++ is automatically synchronized with Oodi's language.",
            "settings.releaseNotes": "Release notes",
            "settings.reset": "Reset data",
            "settings.reset.confirm": "Are you sure you want to PERMANENTLY DELETE all activities added to Oodi++?",
            "settings.theme": "Theme",
            "settings.theme.dark": "Dark",
            "settings.theme.light": "Light",
            "settings.title": "Settings",
            "update.available": fmt`A new version of Oodi++ is available: ${0}!`,
            "update.check": "Check",
            "update.checking": "Checking for update\u2026",
            "update.failed": "Update check failed.",
            "update.install": "Click here to install it, then refresh the page: ",
            "update.lastCheck": fmt`Last update check: ${0}`,
        },
    },
}

export const locale = LOCALES[language]

function getTranslation(key: string): LocaleMessage {
    // by default, return English string, but update the locale to deduplicate the warnings
    if (!(key in locale.messages)) {
        if (!(key in LOCALES["en"].messages)) throw new Error(`invalid translation key ${key}`)
        console.warn(`Untranslated string in ${language}: ${key}`)
        locale.messages[key] = LOCALES["en"].messages[key]
    }
    return locale.messages[key]
}

/** Gets a plain string translation. */
export function loc(key: TemplateStringsArray | string): string {
    return getTranslation(typeof key === "string" ? key : key[0]) as string
}

/** Gets a formatted string translation */
export function locf([key]: TemplateStringsArray): LocaleFormat {
    return getTranslation(typeof key === "string" ? key : key[0]) as LocaleFormat
}
