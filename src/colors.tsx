// colors.tsx: color math and color picker

import {h} from "preact"
import {useState} from "preact/hooks"

import {range} from "./utils"
import CSS_COLORS from "./csscolors"

export type RGB = [number, number, number]
export type HSV = [number, number, number]
export type YUV = [number, number, number]

/** Validates that the given array represents a valid RGB color. */
export function isValidRgb(rgb: number[]): rgb is RGB {
    return rgb.length === 3 && rgb.every(item => 0 <= item && item <= 1)
}

/** Validates that the given array represents a valid HSV color. */
export function isValidHsv(hsv: number[]): hsv is HSV {
    const [h, s, v] = hsv
    return hsv.length === 3 && 0 <= h && h <= 360 && 0 <= s && s <= 1 && 0 <= v && v <= 1
}

/** Converts an HSV color to RGB. */
export function hsvToRgb([h, s, v]: HSV): RGB {
    const hp = h / 60 % 6
    const c = s * v
    const x = c * (1 - Math.abs(hp % 2 - 1))
    const m = v - c
    switch (Math.floor(hp)) {
        case 0:
            return [c + m, x + m, m]
        case 1:
            return [x + m, c + m, m]
        case 2:
            return [m, c + m, x + m]
        case 3:
            return [m, x + m, c + m]
        case 4:
            return [x + m, m, c + m]
        case 5:
            return [c + m, m, x + m]
    }
    throw new Error("invalid hue")
}

/** Converts an RGB color to HSV. */
export function rgbToHsv([r, g, b]: RGB): HSV {
    const m = Math.min(r, g, b)   
    const v = Math.max(r, g, b)
    const c = v - m
    const s = v === 0 ? 0 : c / v
    if (c === 0) return [0, 0, v]
    else if (v === r) return [(360 + 60 * (g - b) / c) % 360, s, v]
    else if (v === g) return [(480 + 60 * (b - r) / c) % 360, s, v]
    else return [(600 + 60 * (r - g) / c) % 360, s, v]
}

/** Converts an RGB color to a YUV color based on BT.709. */
export function rgbToYuv([r, g, b]: RGB): YUV {
    return [
        r * 0.2126 + g * 0.7152 + b * 0.0722,
        r * -0.09991 + g * -0.33609 + b * 0.436,
        r * 0.615 + g * -0.55861 + b * -0.05639,
    ]
}

/** Returns either black or white, based on which has better contrast against the given background. */
export function textColor(background: RGB): RGB {
    const [y] = rgbToYuv(background)
    return y < 0.5 ? [1, 1, 1] : [0, 0, 0]
}

/** Converts an RGB color to a CSS rgb() value. */
export function rgbToCss([r, g, b]: RGB) {
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

/** CSS colors converted to YUV for nearestCssColor, lazy-generated. */
let cssColorsYuv: [string, YUV][] | null = null

/** Approximates the nearest CSS3 named color to the given RGB color using YUV. */
export function nearestCssColor(rgb: RGB): string {
    // lazily convert CSS colors to YUV
    if (cssColorsYuv === null) cssColorsYuv = Object.entries(CSS_COLORS).map(([name, [r, g, b]]) => [name, rgbToYuv([r / 255, g / 255, b / 255])])

    const [ourY, ourU, ourV] = rgbToYuv(rgb) 
    let best = ""
    let bestScore = Infinity
    for (const [name, [cssY, cssU, cssV]] of cssColorsYuv) {
        const score = Math.hypot(cssY - ourY, cssU - ourU, cssV - ourV)
        if (score < bestScore) {
            best = name
            bestScore = score
        }
    }
    return best
}

type ColorSliderProps = {
    value: number
    setValue: (value: number) => void
    background: string
    max: number
}

function ColorSlider({value, setValue, background, max}: ColorSliderProps) {
    const [down, setDown] = useState(false)

    function handleDown(e: MouseEvent) {
        if (e.button === 0) {
            setDown(true)
            handleMove(e, true)
        }
    }
    function handleMove(e: MouseEvent, justDown: boolean = false) {
        if ((down || justDown) && (e.buttons & 1)) {
            const width = (e.target as HTMLElement).offsetWidth - 10
            const pos = e.offsetX - 5
            setValue(Math.max(0, Math.min(max, pos / width * max)))
        }
    }
    function handleUp() {
        setDown(false)
    }

    return (
        <div
                class="opp-color-slider"
                onMouseDown={handleDown}
                onMouseMove={handleMove}
                onMouseUp={handleUp}
                onMouseLeave={handleUp}>
            <div
                    class="opp-color-slider-bg"
                    style={{"background-image": background}}>
                <div
                        class="opp-color-slider-handle"
                        style={{left: `${value / max * 100}%`}} />
            </div>
        </div>
    )
}

type ColorPickerProps = {
    color: HSV
    setColor: (color: HSV) => void
}

export function ColorPicker({color, setColor}: ColorPickerProps) {
    // h_ is named to not collide with preact's h
    const [h_, s, v] = color

    const hueBackground = `linear-gradient(to right, ${range(7).map(pos => rgbToCss(hsvToRgb([pos * 60, s, v]))).join(", ")})`
    const saturationBackground = `linear-gradient(to right, ${rgbToCss(hsvToRgb([h_, 0, v]))}, ${rgbToCss(hsvToRgb([h_, 1, v]))})`
    const valueBackground = `linear-gradient(to right, ${rgbToCss(hsvToRgb([h_, s, 0]))}, ${rgbToCss(hsvToRgb([h_, s, 1]))})`

    return (
        <div className="opp-color-picker">
            <ColorSlider
                    max={360}
                    background={hueBackground}
                    value={h_}
                    setValue={newH => setColor([newH, s, v])} />
            <ColorSlider
                    max={1}
                    background={saturationBackground}
                    value={s}
                    setValue={newS => setColor([h_, newS, v])} />
            <ColorSlider
                    max={1}
                    background={valueBackground}
                    value={v}
                    setValue={newV => setColor([h_, s, newV])} />
            <div
                    className="opp-color-chosen"
                    style={{background: rgbToCss(hsvToRgb(color))}} />
        </div>
    )
}
