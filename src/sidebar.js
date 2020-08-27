// sidebar.js: sidebar layout and functionality



let sidebarOpen = typeof GM_getValue === "function" ? !!GM_getValue("sidebarOpen") : false

// wrap the body contents such that the main scrollbar is to the left of our sidebar
const $bodyWrapper = $.make("div")
        .addClass("opp-body-wrapper")
        .css({marginRight: sidebarOpen ? "540px" : "0"})
        .append($("body").children().not("script, noscript"))
        .appendTo("body")

const $sidebarOpener = $.make("button")
        .attr("type", "button")
        .text("OODI++")
        .addClass("opp-sidebar-opener")
        .click(() => {
    sidebarOpen = !sidebarOpen
    typeof GM_setValue === "function" && GM_setValue("sidebarOpen", sidebarOpen)
    $bodyWrapper.animate({marginRight: sidebarOpen ? "540px" : "0"})
    $sidebarWrapper.animate({width: sidebarOpen ? "540px" : "0"})
    if (sidebarOpen) {
        $sidebarOpener.removeClass("opp-alert")
        whatsNewSeen()
    }
})

const $sidebarContent = $.make("div")
        .addClass("opp-sidebar-content")

const $sidebarWrapper = $.make("div")
        .addClass("opp-sidebar-wrapper")
        .css({width: sidebarOpen ? "540px" : "0"})
        .append($sidebarContent)
        .append($sidebarOpener)

$("body").append($sidebarWrapper)

const requestSidebarFocus = () => {
    if (!sidebarOpen) $sidebarOpener.addClass("opp-alert")
}
