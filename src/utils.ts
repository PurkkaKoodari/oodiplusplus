// utils.ts: general utility functions

import {useState, useEffect} from "preact/hooks"
import $ from "jquery"



/** Creates a named HTML element. Same as $("<nodeName></nodeName>") but faster and safer. */
$.make = function <T extends HTMLElement = HTMLElement>(nodeName: string): JQuery<T> {
    return $(document.createElement(nodeName)) as JQuery<T>
}



/** Opens a file download dialog. */
export function downloadFile(contents: string, fileName: string, mimeType: string) {
    const blob = new Blob([contents], {type: mimeType})
    const objectUrl = URL.createObjectURL(blob)
    const $link = $.make("a")
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

/** Converts a Date.getDay() value to the corresponding index where 0 = Monday. */
export const finnishWeekday = (dateDay: number) => (dateDay + 6) % 7

/** Gets the number of milliseconds after midnight, in local time, from the given Date. */
export const timeOfDay = (date: Date) => (date.getTime() - date.getTimezoneOffset() * ONE_MINUTE) % ONE_DAY



/** The start of the current week's Monday at the time of page load. */
export const thisMonday = new Date()
thisMonday.setTime(thisMonday.getTime() - timeOfDay(thisMonday))
while (thisMonday.getDay() != 1) thisMonday.setDate(thisMonday.getDate() - 1)



/** Creates an array with the numbers from start to end-1, like Python's range. */
export function range(start: number, end?: number) {
    if (end === undefined) {
        end = start
        start = 0
    }
    if (end <= start) return []
    return Array(end - start).fill(null).map((_, pos) => pos + start)
}



type Listener<T> = (value: T) => void

/** Allows for listening for changes in a value. */
export class Observable<T> {
    private current: T
    private listeners: (Listener<T>)[] = []

    constructor(value: T) {
        this.current = value
    }

    get value() {
        return this.current
    }

    set value(value: T) {
        this.current = value
        for (const listener of this.listeners) listener(this.current)
    }

    addListener(listener: Listener<T>): Listener<T> {
        this.listeners.push(listener)
        return listener
    }

    removeListener(listener: Listener<T>) {
        this.listeners.splice(this.listeners.findIndex(list => list === listener), 1)
    }
}

/** Observes an Observable via a React hook. */
export function useObservable<T>(observable: Observable<T>): T {
    const [stored, setStored] = useState(observable.value)

    useEffect(() => {
        const listener = observable.addListener(setStored)
        return () => observable.removeListener(listener)
    })

    return stored
}



/** Template literal tag that allows a compact format for zeropadding numbers. */
export function zeropad(strings: TemplateStringsArray, ...numbers: number[]) {
    const result = [strings[0]]
    for (let i = 1; i < strings.length; i++) {
        const match = /^\[(\d+)\]/.exec(strings[i])
        if (!match) throw new Error("invalid format")
        const width = +match[1]
        const rest = strings[i].substring(match[0].length)
        result.push(numbers[i - 1].toString().padStart(width, "0") + rest)
    }
    return result.join("")
}
