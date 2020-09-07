// tooltip.tsx: floating tooltip

import {useEffect, useState} from "preact/hooks"
import $ from "jquery"

import "./utils"

const visibleTooltips: ({id: number, text: string})[] = []

let mousePos: {x: number, y: number} = {x: 0, y: 0}

let currentId = 0

export type TooltipProps = {
    text: string | null
    children: (events: {onMouseEnter: () => void, onMouseLeave: () => void}) => any
}

export function Tooltip({text, children}: TooltipProps) {
    const [id] = useState(currentId++)

    // close tooltip on unmount
    useEffect(() => setTooltip(null, id), [text])

    return children({
        onMouseEnter: () => setTooltip(text, id),
        onMouseLeave: () => setTooltip(null, id),
    })
}

function setTooltip(text: string | null, id: any) {
    // remove tooltip with this id
    let index
    while ((index = visibleTooltips.findIndex(visible => visible.id === id)) !== -1) visibleTooltips.splice(index, 1)
    // then add this tooltip as the topmost one
    if (text !== null) visibleTooltips.push({id, text})
    updateTooltip()
}

function updateTooltip() {
    if (visibleTooltips.length) {
        $tooltip
                .text(visibleTooltips[visibleTooltips.length - 1].text)
                .show()

        const width = $tooltip.outerWidth()!
        const height = $tooltip.outerHeight()!
        $tooltip.css({
            left: `${mousePos.x + 10 + width > window.innerWidth ? mousePos.x - 10 - width : mousePos.x + 10}px`,
            top: `${Math.max(0, Math.min(window.innerHeight - height, mousePos.y - 10))}px`,
        })
    } else {
        $tooltip.hide()
    }
}

const $tooltip = $.make("div")
        .addClass("opp-tooltip")
        .hide()
        .appendTo("body")

// track mouse position
$("body").mousemove(e => {
    mousePos = {x: e.clientX, y: e.clientY}
    updateTooltip()
})
