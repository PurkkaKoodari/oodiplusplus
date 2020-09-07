// schedule.tsx: schedule storage and rendering

import {h, Fragment} from "preact"
import {useEffect, useState} from "preact/hooks"

import {Instance} from "./classes"
import {thisMonday, ONE_HOUR, finnishWeekday, timeOfDay, range, useObservable} from "./utils"
import {loc, locale, locf, language} from "./locales"
import {OpettaptiedUpdateableNotification} from "./opettaptied"
import {exportSelectedActivitiesAsIcal} from "./ical"
import {Tooltip} from "./tooltip"
import {deselectActivity, hoverActivity, hoveredActivity, selectedActivities, unhoverActivity} from "./activities"
import {ColorPicker, HSV, RGB, hsvToRgb, rgbToCss, textColor, rgbToHsv} from "./colors"

type RenderWeek = {
    instances: Instance[]
    weeks: Date[]
}

/** Holds preprocessed data of an Instance for the purposes of timetable rendering. */
class RenderInstance {
    instance: Instance
    weekday: number
    start: number
    end: number
    columns: {start: number, end: number} | null = null
    
    constructor(instance: Instance, weekday: number, start: number, end: number) {
        this.instance = instance
        this.weekday = weekday
        this.start = start
        this.end = end
        this.columns = null
    }

    overlaps(other: RenderInstance): boolean {
        return this !== other && this.weekday === other.weekday && this.start < other.end && other.start < this.end
    }
}

type InstanceViewProps = {
    renderInstance: RenderInstance
    columns: number[]
    firstHour: number
    onInstanceClick: (instance: Instance) => void
    selectedAction: ScheduleAction
    selectedColor: HSV
    selectedColorMode: ScheduleColorMode
}

function InstanceView({renderInstance, columns, firstHour, onInstanceClick, selectedAction, selectedColor, selectedColorMode}: InstanceViewProps) {
    const {instance} = renderInstance
    const {activity} = instance

    const hovered = useObservable(hoveredActivity)

    const needsUpdate = activity.needsUpdate ? (
        <Tooltip text={loc`schedule.dataUpdate.required`}>
            {events =>
                <div className="opp-outdated-indicator opp-alert-text" {...events}>&#x26A0;</div>
            }
        </Tooltip>
    ) : null

    // show tooltip based on action
    let tooltip
    switch (selectedAction) {
        case "remove":
            tooltip = loc`schedule.actions.remove.tooltip`
            break
        case "color":
            switch (selectedColorMode) {
                case "remove":
                    tooltip = loc`schedule.actions.color.remove.tooltip`
                    break
                case "eyedropper":
                    tooltip = loc`schedule.actions.color.eyedropper.tooltip`
                    break
                default:
                    tooltip = loc`schedule.actions.color.tooltip`
                    break
            }
            break
        default:
            tooltip = `\
${activity.course.code} ${activity.course.name}
${activity.type} ${activity.name}
${locale.weekdays[renderInstance.weekday]} ${locale.time(instance.start)}\u2013${locale.time(instance.end)}\
${instance.location && `\n${loc`schedule.tooltip.location`} ${instance.location}`}\
${activity.teachers.length ? `\n${loc`schedule.tooltip.teacher`} ${activity.teachers.map(teacher => teacher.name).join(", ")}` : ""}`
            break
    }
    
    // override activity color when coloring
    const color = selectedAction === "color" && selectedColorMode === "none" && hovered === activity ? hsvToRgb(selectedColor) : activity.color

    return (
        <Tooltip text={tooltip}>
            {({onMouseEnter, onMouseLeave}) =>
                <div
                        className={`opp-activity ${hovered === activity ? "opp-hovered" : ""}`}
                        lang={activity.language || language}
                        style={{
                            left: `${20 + 100 * renderInstance.weekday + 100 / columns[renderInstance.weekday] * renderInstance.columns!.start}px`,
                            top: `${20 + 60 * (renderInstance.start / ONE_HOUR - firstHour)}px`,
                            width: `${100 / columns[renderInstance.weekday] * (renderInstance.columns!.end - renderInstance.columns!.start + 1)}px`,
                            height: `${60 * (renderInstance.end - renderInstance.start) / ONE_HOUR}px`,
                            "background-color": color ? rgbToCss(color) : "",
                            color: color ? rgbToCss(textColor(color)) : "",
                        }}
                        onMouseEnter={() => {
                            hoverActivity(activity)
                            onMouseEnter()
                        }}
                        onMouseLeave={() => {
                            unhoverActivity(activity)
                            onMouseLeave()
                        }}
                        onClick={() => onInstanceClick(instance)}>
                    <a href={activity.url} onClick={e => e.stopPropagation()}>{activity.course.code}</a>
                    <span>{activity.name}</span>
                    <span>{instance.location}</span>
                    {needsUpdate}
                </div>
            }
        </Tooltip>
    )
}

type WeekViewProps = {
    renderWeek: RenderWeek
    onInstanceClick: (instance: Instance) => void
    selectedAction: ScheduleAction
    selectedColor: HSV
    selectedColorMode: ScheduleColorMode
}

function WeekView({renderWeek, onInstanceClick, selectedAction, selectedColor, selectedColorMode}: WeekViewProps) {
    // transform list of weeks into list of ranges
    const weekRanges = [{start: renderWeek.weeks[0], end: renderWeek.weeks[0]}]
    for (const week of renderWeek.weeks.slice(1)) {
        const expectedEndToContinue = new Date(weekRanges[weekRanges.length - 1].end)
        expectedEndToContinue.setDate(expectedEndToContinue.getDate() + 7)
        if (week.getTime() === expectedEndToContinue.getTime()) weekRanges[weekRanges.length - 1].end = week
        else weekRanges.push({start: week, end: week})
    }
    // stringify date ranges
    const dateHeader = weekRanges.map(range => {
        const lastSunday = new Date(range.end)
        lastSunday.setDate(lastSunday.getDate() + 6)
        return `${locale.date(range.start)}\u2013${locale.date(lastSunday)}`
    }).join(", ")

    // compute horizontal slots for overlapping instances and first/last hours
    let firstHour = 24
    let lastHour = 0
    const columns = [1, 1, 1, 1, 1, 0, 0]
    const renderInstances = []
    for (const instance of renderWeek.instances) {
        // convert to Finnish weekdays here
        const weekday = finnishWeekday(instance.start.getDay())
        const start = timeOfDay(instance.start)
        const end = start + instance.end.getTime() - instance.start.getTime()
        const renderInstance = new RenderInstance(instance, weekday, start, end)
        // update hours
        firstHour = Math.min(firstHour, Math.floor(start / ONE_HOUR))
        lastHour = Math.max(lastHour, Math.ceil(end / ONE_HOUR))
        // this is O(n^2) but I'm lazy and it's fast enough
        const overlappingColumns = []
        for (const other of renderInstances) {
            if (renderInstance.overlaps(other)) overlappingColumns.push(other.columns!.start)
        }
        // find a free column
        let column = 0
        while (overlappingColumns.includes(column)) column++
        renderInstance.columns = {start: column, end: column}
        // keep track of how many columns are used per weekday
        columns[weekday] = Math.max(columns[weekday], column + 1)
        renderInstances.push(renderInstance)
    }
    // do a second pass to widen any instances necessary
    for (const renderInstance of renderInstances) {
        // still O(n^2), still lazy and still fast enough
        const overlappingColumns = []
        for (const other of renderInstances) {
            if (renderInstance.overlaps(other)) {
                for (let column = other.columns!.start; column <= other.columns!.end; column++) overlappingColumns.push(column)
            }
        }
        // expand left & right
        while (renderInstance.columns!.start > 0 && !overlappingColumns.includes(renderInstance.columns!.start - 1)) renderInstance.columns!.start--
        while (renderInstance.columns!.end < columns[renderInstance.weekday] - 1 && !overlappingColumns.includes(renderInstance.columns!.end + 1)) renderInstance.columns!.end++
    }

    // see if there is anything in the weekends
    const daysToRender = columns[5] > 0 || columns[6] > 0 ? 7 : 5

    return (
        <>
            <h3>{dateHeader}</h3>
            <div className="opp-schedule" style={{height: `${20 + (lastHour - firstHour) * 60}px`}}>
                {range(daysToRender).map(day =>
                    <div
                            className="opp-day"
                            style={{
                                left: `${20 + 100 * day}px`,
                                top: "0",
                                width: `${500 / daysToRender}px`,
                                height: "20px",
                            }}
                            key={`day${day}`}>
                        {locale.weekdays[day]}
                    </div>
                )}
                {range(firstHour, lastHour).map(hour => 
                    <div
                            className="opp-hour"
                            style={{
                                left: "0",
                                top: `${20 + 60 * (hour - firstHour)}px`,
                                width: "20px",
                                height: "60px",
                            }}
                            key={`hour${hour}`}>
                        {hour.toString().padStart(2, "0")}
                    </div>
                )}
                {renderInstances.map(renderInstance =>
                    <InstanceView
                            renderInstance={renderInstance}
                            columns={columns}
                            firstHour={firstHour}
                            onInstanceClick={onInstanceClick}
                            selectedAction={selectedAction}
                            selectedColor={selectedColor}
                            selectedColorMode={selectedColorMode} />
                )}
            </div>
        </>
    )
}

type ScheduleAction = "none" | "remove" | "color"
type ScheduleColorMode = "none" | "eyedropper" | "remove"

type ScheduleActionButtonProps<T extends string> = {
    action: T
    selected: T
    setSelected: (action: T) => void
    children: any
}

function ScheduleActionButton<T extends string>({action, selected, setSelected, children}: ScheduleActionButtonProps<T>) {
    return (
        <button
                type="button"
                className={selected === action ? "opp-active" : ""}
                onClick={() => setSelected(selected === action ? "none" as T : action)}>
            {children}
        </button>
    )
}

function NeedUpdateNotification() {
    // even though this is not used, pull it in to ensure we get updated
    useObservable(selectedActivities)

    const needUpdate = needDataFormatUpdate()
    if (!needUpdate) return null

    return (
        <p className="opp-alert-text">
            {locf`alert.dataUpdate.required`(needUpdate)}
        </p>
    )
}

function DeletePastNotification() {
    // even though this is not used, pull it in to ensure we get updated
    useObservable(selectedActivities)

    const inPast = activitiesInPast()
    if (!inPast) return null

    function deleteAllPast() {
        selectedActivities.value = selectedActivities.value.filter(activity => !activity.inPast)
    }

    return (
        <p className="opp-alert-text">
            {locf`alert.deletePast`(inPast)}
            <button type="button" onClick={deleteAllPast}>{loc`alert.deletePast.delete`}</button>
        </p>
    )
}

export function ScheduleView({sidebarOpen}: {sidebarOpen: boolean}) {
    const selected = useObservable(selectedActivities)
    const hovered = useObservable(hoveredActivity)

    // compile a list of all instances
    const activitiesToRender = [...selected]
    if (hovered && !hovered.selected) activitiesToRender.push(hovered)
    const allInstances = activitiesToRender.map(activity => activity.instances).flat()
    const anySelected = allInstances.length !== 0
    // sort instances to a predictable order
    allInstances.sort((lhs, rhs) => {
        if (lhs.start.getTime() != rhs.start.getTime()) return lhs.start.getTime() - rhs.start.getTime()
        if (lhs.end.getTime() != rhs.end.getTime()) return lhs.end.getTime() - rhs.end.getTime()
        return lhs.activity.identifier.localeCompare(rhs.activity.identifier)
    })

    // skip weeks that already started
    while (allInstances.length > 0 && allInstances[0].start <= thisMonday) allInstances.shift()

    if (allInstances.length === 0) {
        return (
            <h3>{anySelected ? loc`schedule.empty.allInPast` : loc`schedule.empty.noSelection`}</h3>
        )
    }

    // weeks are clumped together if schedules are identical
    const weekContentIndex = new Map<string, RenderWeek>()
    const currentWeek = new Date(thisMonday)
    while (allInstances.length > 0) {
        // find instances during this week and compile a "week contents" string from it
        const weekStart = new Date(currentWeek)
        const weekEnd = new Date(currentWeek)
        weekEnd.setDate(weekStart.getDate() + 7)
        const weekInstances = []
        let weekContents = ""
        while (allInstances.length > 0 && allInstances[0].start < weekEnd) {
            const instance = allInstances.shift()!
            weekInstances.push(instance)
            weekContents += `${instance.activity.identifier} ${instance.start.getDay()} ${timeOfDay(instance.start)} ${timeOfDay(instance.end)}\n`
        }
        if (weekInstances.length !== 0) {
            // add week contents to index
            if (!weekContentIndex.has(weekContents)) weekContentIndex.set(weekContents, {instances: weekInstances, weeks: []})
            weekContentIndex.get(weekContents)!.weeks.push(new Date(weekStart))
        }
        // advance to next week
        currentWeek.setDate(currentWeek.getDate() + 7)
    }

    // sort schedules by first week
    const renderWeeks: RenderWeek[] = Array.from(weekContentIndex.values())
    renderWeeks.sort((lhs, rhs) => lhs.weeks[0].getTime() - rhs.weeks[0].getTime())

    // schedule action status
    const [selectedAction, setSelectedAction] = useState<ScheduleAction>("none")
    const [selectedColor, setSelectedColor] = useState<HSV>([Math.random() * 360, 1, 1])
    const [selectedColorMode, setSelectedColorMode] = useState<ScheduleColorMode>("none")

    // deselect tool if sidebar closes
    useEffect(() => {
        if (!sidebarOpen) setSelectedAction("none")
    }, [sidebarOpen])

    // deselect remove-color/eyedropper when coloring stops
    useEffect(() => {
        if (selectedAction !== "color") setSelectedColorMode("none")
    }, [selectedAction])

    // deselect remove-color/eyedropper when color set manually
    function onColorChanged(color: HSV) {
        setSelectedColor(color)
        setSelectedColorMode("none")
    }

    // called by InstanceView when clicked
    function onInstanceClick(instance: Instance) {
        const {activity} = instance
        switch (selectedAction) {
            case "remove":
                // make sure the activity doesn't get stuck as hovered
                unhoverActivity(activity)
                deselectActivity(activity)
                // only delete one per click
                setSelectedAction("none")
                break
            case "color":
                if (selectedColorMode === "remove") {
                    activity.color = null
                    selectedActivities.value = [...selectedActivities.value]
                } else if (selectedColorMode === "eyedropper") {
                    if (activity.color) setSelectedColor(rgbToHsv(activity.color))
                    setSelectedColorMode("none")
                } else {
                    activity.color = hsvToRgb(selectedColor)
                    selectedActivities.value = [...selectedActivities.value]
                }
                break
        }
    }

    return (
        <>
            <NeedUpdateNotification />
            <OpettaptiedUpdateableNotification />
            <DeletePastNotification />
            <div className="opp-schedule-actions">
                <div className="opp-schedule-action-buttons">
                    <div>{loc`schedule.actions.title`}</div>
                    <ScheduleActionButton selected={selectedAction} setSelected={setSelectedAction} action={"remove"}>
                        {loc`schedule.actions.remove`}
                    </ScheduleActionButton>
                    <ScheduleActionButton selected={selectedAction} setSelected={setSelectedAction} action={"color"}>
                        {loc`schedule.actions.color`}
                    </ScheduleActionButton>
                    <button type="button" onClick={() => exportSelectedActivitiesAsIcal()}>
                        {loc`schedule.actions.exportIcal`}
                    </button>
                </div>
                <div class={`opp-color-picker-wrapper ${selectedAction === "color" ? "opp-open" : ""}`}>
                    <ColorPicker color={selectedColor} setColor={onColorChanged} />
                    <div class="opp-color-picker-special">
                        <ScheduleActionButton selected={selectedColorMode} setSelected={setSelectedColorMode} action={"eyedropper"}>
                            {loc`schedule.actions.color.eyedropper`}
                        </ScheduleActionButton>
                        <ScheduleActionButton selected={selectedColorMode} setSelected={setSelectedColorMode} action={"remove"}>
                            {loc`schedule.actions.color.remove`}
                        </ScheduleActionButton>
                    </div>
                </div>
            </div>
            <div className={`opp-schedule-view opp-action-${selectedAction} ${selectedAction === "color" ? `opp-color-${selectedColorMode}` : ""}`}>
                {renderWeeks.map(renderWeek => 
                    <WeekView
                            renderWeek={renderWeek}
                            onInstanceClick={onInstanceClick}
                            selectedAction={selectedAction}
                            selectedColor={selectedColor}
                            selectedColorMode={selectedColorMode} />
                )}
            </div>
        </>
    )
}

/** Gets the number of activities that are using an outdated data version. */
export function needDataFormatUpdate() {
    return selectedActivities.value.filter(activity => activity.needsUpdate).length
}

/** Gets the number of activities that have no instances in the future. */
export function activitiesInPast() {
    return selectedActivities.value.filter(activity => activity.inPast).length
}
