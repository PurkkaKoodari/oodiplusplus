// sidebar.tsx: sidebar layout and functionality

import {h, render} from "preact"
import {useCallback, useEffect, useState} from "preact/hooks"
import $ from "jquery"

import {SidebarHeader, unseenReleaseNotes} from "./settings"
import {ScheduleView, needDataFormatUpdate, activitiesInPast} from "./schedule"
import {updateableOnThisPage} from "./opettaptied"
import {Observable, useEventHandler, useObservable} from "./utils"

function sidebarWidthLimits(): [number, number] {
    const max = window.innerWidth - 50
    const min = Math.min(500, max)
    return [min, max]
}

function sidebarResizable(): boolean {
    const [minWidth, maxWidth] = sidebarWidthLimits()
    return minWidth !== maxWidth
}

const initiallyOpen = typeof GM_getValue === "function" && !!GM_getValue("sidebarOpen")
const initialWidth = (() => {
    const loadedWidth = typeof GM_getValue === "function" ? +GM_getValue("sidebarWidth") : NaN
    const [minWidth, maxWidth] = sidebarWidthLimits()
    return isNaN(loadedWidth) ? minWidth : Math.max(minWidth, Math.min(maxWidth, loadedWidth))
})()

function Sidebar() {
    const [open, setOpen] = useState(initiallyOpen)
    const [width, setWidth] = useState(initialWidth)
    const [resizing, setResizing] = useState<[number, number] | null>(null)
    const [resizable, setResizable] = useState(sidebarResizable())

    const focusRequested = useObservable(sidebarFocusRequested)

    // update width and classes into body, and save openness and width into storage
    useEffect(() => {
        $("body")
                .toggleClass("opp-sidebar-open", open)
                .toggleClass("opp-sidebar-closed", !open)
                .toggleClass("opp-sidebar-resizing", !!resizing)
        
        if (typeof GM_setValue === "function") GM_setValue("sidebarOpen", open)
    }, [open, resizing])
    
    useEffect(() => {
        $bodyWrapper.css({marginRight: `${width}px`})

        if (typeof GM_setValue === "function") GM_setValue("sidebarWidth", width)
    }, [width])

    // handler for open button
    function toggleSidebar() {
        const willBeOpen = !open
        setOpen(willBeOpen)
        sidebarFocusRequested.value = false
    }

    // handler for resize button
    function startResize(e: MouseEvent) {
        setResizing([width, e.clientX])
    }

    // handle actual resizing
    useEventHandler(window, "mousemove", (e: MouseEvent) => {
        console.log(resizing, e.clientX)
        if (resizing) {
            const [startWidth, startPos] = resizing
            const rawWidth = startPos - e.clientX + startWidth
            const [minWidth, maxWidth] = sidebarWidthLimits()
            setWidth(Math.max(minWidth, Math.min(maxWidth, rawWidth)))
        }
    }, [resizing])

    // stop resizing when mouse button is unpressed or window focus is lost
    useEventHandler(window, "mouseup", () => {
        setResizing(null)
    }, [])
    useEventHandler(window, "mouseleave", () => {
        setResizing(null)
    }, [])
    useEventHandler(window, "blur", () => {
        setResizing(null)
    }, [])

    // re-clamp width and update resizability on window resize
    useEventHandler(window, "resize", () => {
        const [minWidth, maxWidth] = sidebarWidthLimits()
        setResizable(minWidth !== maxWidth)
        // re-clamp only when sidebar open
        if (!open) return
        setWidth(Math.max(minWidth, Math.min(maxWidth, width)))
    }, [open, width])

    const resizer = open && resizable ? (
        <button
                className="opp-sidebar-resizer"
                onMouseDown={startResize}>
            &#x21D4;
        </button>
    ) : null

    return (
        <div className="opp-sidebar-wrapper" style={{width: `${width}px`}}>
            <div className={`opp-sidebar-buttons`}>
                <button
                        className={`opp-sidebar-opener ${!open && focusRequested ? "opp-alert" : ""}`}
                        onClick={toggleSidebar}>
                    OODI++
                </button>
                {resizer}
            </div>
            <div className="opp-sidebar-content" style={{width: `${width}px`}}>
                <SidebarHeader sidebarOpen={open} />
                <ScheduleView sidebarOpen={open} />
            </div>
        </div>
    )
}

// wrap the body contents such that the main scrollbar is to the left of our sidebar
const $bodyWrapper = $.make("div")
        .addClass("opp-body-wrapper")
        .appendTo("body")
        .append($("body").children().not("script, noscript, .opp-body-wrapper, .opp-tooltip"))
        .css({marginRight: `${initialWidth}px`})

const $sidebarWrapper = $.make("div").appendTo("body")

$("body")
        .toggleClass("opp-sidebar-open", initiallyOpen)
        .toggleClass("opp-sidebar-closed", !initiallyOpen)

export function renderSidebar() {
    render(<Sidebar />, document.body, $sidebarWrapper[0])
}

const sidebarFocusRequested = new Observable(unseenReleaseNotes || needDataFormatUpdate() > 0 || updateableOnThisPage() > 0 || activitiesInPast() > 0)

/** Starts blinking the sidebar opener if the sidebar is closed. */
export function requestSidebarFocus() {
    sidebarFocusRequested.value = true
}
