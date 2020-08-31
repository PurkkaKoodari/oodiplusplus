// sidebar.ts: sidebar layout and functionality

import {whatsNewSeen, $sidebarHeader} from "./settings"
import {setScheduleAction, $scheduleActions, $scheduleView, $activitiesNeedDataUpdate} from "./schedule"
import {$activityDataUpdateable} from "./opettaptied"
import {$make} from "./utils"

let sidebarOpen = false

/** Opens or closes the sidebar. */
export function setSidebarOpen(open: boolean, instant: boolean = false) {
    sidebarOpen = open
    typeof GM_setValue === "function" && GM_setValue("sidebarOpen", open)

    if (instant) {
        $bodyWrapper.css({marginRight: open ? "540px" : "0"})
        $sidebarWrapper.css({width: open ? "540px" : "0"})
    } else {
        $bodyWrapper.animate({marginRight: open ? "540px" : "0"})
        $sidebarWrapper.animate({width: open ? "540px" : "0"})
    }
    
    if (open) {
        // when opening, stop the open button blinking
        $sidebarOpener.removeClass("opp-alert")
        // and mark release notes as seen
        whatsNewSeen()
    } else {
        // when closing, deselect schedule actions
        setScheduleAction(null)()
    }
}

// wrap the body contents such that the main scrollbar is to the left of our sidebar
const $bodyWrapper = $make("div")
        .addClass("opp-body-wrapper")
        .css({marginRight: sidebarOpen ? "540px" : "0"})
        .append($("body").children().not("script, noscript"))
        .appendTo("body")

const $sidebarOpener = $make("button")
        .attr("type", "button")
        .text("OODI++")
        .addClass("opp-sidebar-opener")
        .click(() => setSidebarOpen(!sidebarOpen))

const $sidebarContent = $make("div")
        .addClass("opp-sidebar-content")
        .append($sidebarHeader)
        .append($activityDataUpdateable)
        .append($activitiesNeedDataUpdate)
        .append($scheduleActions)
        .append($scheduleView)

const $sidebarWrapper = $make("div")
        .addClass("opp-sidebar-wrapper")
        .append($sidebarContent)
        .append($sidebarOpener)

$("body").append($sidebarWrapper)

/** Starts blinking the sidebar opener if the sidebar is closed. */
export function requestSidebarFocus() {
    if (!sidebarOpen) $sidebarOpener.addClass("opp-alert")
}
