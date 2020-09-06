// sidebar.ts: sidebar layout and functionality

import {h, render} from "preact"
import {useEffect, useState} from "preact/hooks"
import $ from "jquery"

import {SidebarHeader, unseenReleaseNotes} from "./settings"
import {ScheduleView, needDataFormatUpdate, activitiesInPast} from "./schedule"
import {updateableOnThisPage} from "./opettaptied"
import {Observable, useObservable} from "./utils"
import {hoveredActivity, selectedActivities} from "./activities"
import "./utils"

const sidebarInitiallyOpen = typeof GM_getValue === "function" && !!GM_getValue("sidebarOpen")

function Sidebar() {
    const [open, setOpen] = useState(sidebarInitiallyOpen)

    useEffect(() => void $("body").toggleClass("opp-sidebar-open", open), [open])

    const focusRequested = useObservable(sidebarFocusRequested)

    function toggleSidebar() {
        const willBeOpen = !open
        setOpen(willBeOpen)
        if (willBeOpen) sidebarFocusRequested.value = false
        if (typeof GM_setValue === "function") GM_setValue("sidebarOpen", willBeOpen)
    }

    return (
        <div className="opp-sidebar-wrapper">
            <button
                    className={`opp-sidebar-opener ${focusRequested ? "opp-alert" : ""}`}
                    onClick={toggleSidebar}>
                OODI++
            </button>
            <div className="opp-sidebar-content">
                <SidebarHeader sidebarOpen={open} />
                <ScheduleView sidebarOpen={open} />
            </div>
        </div>
    )
}

// wrap the body contents such that the main scrollbar is to the left of our sidebar
$.make("div")
        .addClass("opp-body-wrapper")
        .appendTo("body")
        .append($("body").children().not("script, noscript, .opp-body-wrapper, .opp-tooltip"))

const $sidebarWrapper = $.make("div").appendTo("body")

$("body").toggleClass("opp-sidebar-open", sidebarInitiallyOpen)

export function renderSidebar() {
    render(<Sidebar />, document.body, $sidebarWrapper[0])
}

const sidebarFocusRequested = new Observable(unseenReleaseNotes || needDataFormatUpdate() > 0 || updateableOnThisPage() > 0 || activitiesInPast() > 0)

/** Starts blinking the sidebar opener if the sidebar is closed. */
export function requestSidebarFocus() {
    sidebarFocusRequested.value = true
}
