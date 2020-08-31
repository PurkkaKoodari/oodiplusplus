// locales.ts: localization (including localization of page parsing)

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

/** Weekday names in the default locales. */
export const WEEKDAY_NAMES: MapObj<string[]> = {
    fi: ["ma", "ti", "ke", "to", "pe", "la", "su"],
    sv: ["må", "ti", "on", "to", "fr", "lö", "sö"],
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
}
