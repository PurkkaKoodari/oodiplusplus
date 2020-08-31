// utils.ts: general utility functions



/** Creates a named HTML element. Same as $("<nodeName></nodeName>") but faster and safer. */
export function $make<T extends HTMLElement = HTMLElement>(nodeName: string): JQuery<T> {
    return $(document.createElement(nodeName)) as JQuery<T>
}



/** Opens a file download dialog. */
export function downloadFile(contents: string, fileName: string, mimeType: string) {
    const blob = new Blob([contents], {type: mimeType})
    const objectUrl = URL.createObjectURL(blob)
    const $link = $make("a")
            .attr("href", objectUrl)
            .attr("download", fileName)
            .hide()
            .appendTo("body")
    $link[0].click()
    $link.remove()
    URL.revokeObjectURL(objectUrl)
}



// Various time constants in milliseconds.
export const ONE_MINUTE = 60 * 1000
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
export const ONE_WEEK = 7 * ONE_DAY

/** Converts a Date.getDay() value to the corresponding index where 0 = Monday. */
export const finnishWeekday = (dateDay: number) => (dateDay + 6) % 7

/** Gets the number of milliseconds after midnight, in local time, from the given Date. */
export const timeOfDay = (date: Date) => (date.getTime() - date.getTimezoneOffset() * ONE_MINUTE) % ONE_DAY



/** The start of the current week's Monday at the time of page load. */
export const thisMonday = new Date()
thisMonday.setTime(thisMonday.getTime() - timeOfDay(thisMonday))
while (thisMonday.getDay() != 1) thisMonday.setTime(thisMonday.getTime() - ONE_DAY)
