// schedule.ts: schedule storage and rendering

import {h, Fragment} from "preact"
import {useEffect, useState} from "preact/hooks"

import {Instance} from "./classes"
import {thisMonday, ONE_WEEK, ONE_HOUR, finnishWeekday, timeOfDay, range, useObservable} from "./utils"
import {loc, locale, locf, language} from "./locales"
import {OpettaptiedUpdateableNotification} from "./opettaptied"
import {exportSelectedActivitiesAsIcal} from "./ical"
import {Tooltip} from "./tooltip"
import {deselectActivity, hoverActivity, hoveredActivity, selectedActivities, unhoverActivity} from "./activities"

/** Don't run events while schedule is updating to avoid events being triggered due to elements appearing/disappearing. */
let scheduleUpdating = false

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
}

function InstanceView({renderInstance, columns, firstHour, onInstanceClick}: InstanceViewProps) {
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

    const tooltip = `\
${activity.course.code} ${activity.course.name}
${activity.type} ${activity.name}
${locale.weekdays[renderInstance.weekday]} ${instance.start.toLocaleTimeString(language)}\u2013${instance.end.toLocaleTimeString(language)}\
${instance.location && `\nLocation: ${instance.location}`}\
${activity.teachers.length ? `\nTeacher: ${activity.teachers.map(teacher => teacher.name).join(", ")}` : ""}`
    
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
}

function WeekView({renderWeek, onInstanceClick}: WeekViewProps) {
    // transform list of weeks into list of ranges
    const weekRanges = [{start: renderWeek.weeks[0], end: renderWeek.weeks[0]}]
    for (const week of renderWeek.weeks.slice(1)) {
        if (week.getTime() !== weekRanges[weekRanges.length - 1].end.getTime() + ONE_WEEK) weekRanges.push({start: week, end: week})
        else weekRanges[weekRanges.length - 1].end = week
    }
    // stringify date ranges
    const dateHeader = weekRanges.map(range => `${range.start.toLocaleDateString(language)}\u2013${new Date(range.end.getTime() + ONE_WEEK - 1).toLocaleDateString(language)}`).join(", ")

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
            <div class="opp-schedule" style={{height: `${20 + (lastHour - firstHour) * 60}px`}}>
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
                            onInstanceClick={onInstanceClick} />
                )}
            </div>
        </>
    )
}

type ScheduleAction = {
    name: string
    action: (instance: Instance) => void
    singleUse: boolean
}

const NO_ACTION: ScheduleAction = {
    name: "none",
    action: () => {},
    singleUse: false
}

const REMOVE_ACTION: ScheduleAction = {
    name: "remove",
    action: ({activity}) => {
        // stop hovering the activity
        unhoverActivity(activity)
        // deselect and update UI
        deselectActivity(activity)
    },
    singleUse: true
}

type ScheduleActionButtonProps = {
    action: ScheduleAction
    selectedAction: ScheduleAction
    setSelectedAction: (action: ScheduleAction) => void
    children: any
}

function ScheduleActionButton({action, selectedAction, setSelectedAction, children}: ScheduleActionButtonProps) {
    const selected = selectedAction.name === action.name
    return (
        <button
                type="button"
                className={selected ? "opp-active" : ""}
                onClick={() => setSelectedAction(selected ? NO_ACTION : REMOVE_ACTION)}>
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
        <p className="opp-alert-text opp-outdated-format-alert">
            {locf`alert.dataUpdate.required`(needUpdate)}
        </p>
    )
}

export function ScheduleView({sidebarOpen}: {sidebarOpen: boolean}) {
    const selected = useObservable(selectedActivities)
    const hovered = useObservable(hoveredActivity)

    // compile a list of all instances
    const activitiesToRender = Array.from(selected)
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
    while (allInstances.length > 0 && allInstances[0].start.getTime() <= thisMonday.getTime()) allInstances.shift()

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
        const weekEnd = new Date(currentWeek.getTime() + ONE_WEEK)
        const weekInstances = []
        let weekContents = ""
        while (allInstances.length > 0 && allInstances[0].start.getTime() < weekEnd.getTime()) {
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
        currentWeek.setTime(currentWeek.getTime() + ONE_WEEK)
    }

    // sort schedules by first week
    const renderWeeks: RenderWeek[] = Array.from(weekContentIndex.values())
    renderWeeks.sort((lhs, rhs) => lhs.weeks[0].getTime() - rhs.weeks[0].getTime())    

    const [selectedAction, setSelectedAction] = useState(NO_ACTION)

    useEffect(() => {
        if (!sidebarOpen) setSelectedAction(NO_ACTION)
    })

    function onInstanceClick(instance: Instance) {
        selectedAction.action(instance)
        if (selectedAction.singleUse) setSelectedAction(NO_ACTION)
    }

    return (
        <>
            <NeedUpdateNotification />
            <OpettaptiedUpdateableNotification />
            <div className="opp-schedule-actions">
                <div>{loc`schedule.actions.title`}</div>
                <ScheduleActionButton
                        selectedAction={selectedAction}
                        setSelectedAction={setSelectedAction}
                        action={REMOVE_ACTION}>
                    {loc`schedule.actions.remove`}
                </ScheduleActionButton>
                <button type="button" onClick={() => exportSelectedActivitiesAsIcal()}>
                    {loc`schedule.actions.exportIcal`}
                </button>
            </div>
            <div className={`opp-schedule-view opp-action-${selectedAction.name}`}>
                {renderWeeks.map(renderWeek => 
                    <WeekView renderWeek={renderWeek} onInstanceClick={onInstanceClick} />
                )}
            </div>
        </>
    )
}

/** Gets the number of activities that are using an outdated data version. */
export function needDataFormatUpdate() {
    return Array.from(selectedActivities.value.values()).filter(activity => activity.needsUpdate).length
}
