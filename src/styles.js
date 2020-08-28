// styles.js: stylesheet for the app



GM_addStyle(`
/* hack the layout to be responsive so that it can take our sidebar */
#menu {
    position: sticky !important; /* sticky top bar - keeps the look but without fixed height */
}
.menu-topbar {
    position: static !important; /* this is normally absolute-positioned, but we need it to consume space */
    padding-right: 32px !important; /* make space for the sidebar button */
}
.menu-topbar, .menu-content-wrapper {
    height: auto !important; /* un-fix the heights of the blue top bar */
}
.menu-nav {
    position: static !important; /* this is normally relative-positioned to clear .menu-topbar, but we no longer need to */
}
.menu-content-wrapper, .menu-nav-list {
    display: flex !important; /* make the blue top bar & top nav items wrap if necessary */
    flex-wrap: wrap !important;
}
#body-wrapper {
    margin-top: 0 !important; /* we no longer need a top margin because we changed fixed positioning to sticky */
}
.usermenu__dropdown {
    position: absolute !important; /* make the user dropdown menu appear on top of the top bars instead of enlarging them */
    top: 100% !important;
    background: #0f3a58 !important;
    z-index: 1000 !important;
    padding: 0 10px 10px !important;
}

/* styles for classes injected to opettaptied.jsp */
.opp-hovered-activity {
    background: #ccf;
}
.opp-hovered-activity td, .opp-hovered-activity table {
    background: transparent !important;
}
.opp-activity-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

/* styles for the sidebar container itself */
@keyframes opp-sidebar-opener-alert {
    0% {
        background: #fff;
        padding: 10px 10px;
    }
    50% {
        background: #ccf;
        padding: 10px 12px;
    }
    100% {
        background: #fff;
        padding: 10px 10px;
    }
}
.opp-body-wrapper {
    position: relative;
    z-index: 0;
    height: 100vh;
    overflow: auto;
}
.opp-sidebar-wrapper {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000;
    height: 100vh;
    margin: 0;
    padding: 0;
    border-left: 1px solid black;
    background: white;
    font-size: 14px;
}
.opp-sidebar-content {
    width: 540px;
    height: 100vh;
    padding: 0 10px;
    box-sizing: border-box;
    overflow: hidden auto;
}
.opp-sidebar-opener {
    position: absolute;
    right: 100%;
    top: 10px;
    padding: 10px;
    border: 1px solid black;
    border-right: none;
    border-radius: 5px 0 0 5px;
    background: white;
    writing-mode: vertical-rl;
    cursor: pointer;
}
.opp-sidebar-opener.opp-alert {
    animation: 1s infinite ease opp-sidebar-opener-alert;
}

/* general styles for sidebar contents */
.opp-sidebar-wrapper h2 {
    font-size: 1.4em;
    margin: 0.4em 0;
}
.opp-sidebar-wrapper h3 {
    font-size: 1.25em;
    margin: 0.5em 0;
}
.opp-sidebar-wrapper h4 {
    font-size: 1.1em;
    margin: 0.6em 0;
}
.opp-sidebar-wrapper p {
    margin: 0.7em 0;
    padding: 0;
}
.opp-sidebar-wrapper ul {
    margin: 0.7em 0;
    padding: 0 0 0 2em;
}
.opp-sidebar-wrapper button {
    font-size: 14px;
}
.opp-alert-text {
    font-weight: bold;
    color: #a00;
}

/* styles for sidebar header/release notes */
.opp-whats-new {
    margin-bottom: 10px;
}
.opp-whats-new .opp-header, .opp-update-check {
    display: flex;
    align-items: baseline;
}
.opp-whats-new .opp-header :first-child, .opp-update-check :first-child {
    flex-grow: 1;
}

/* styles for schedule view */
.opp-schedule-actions {
    position: sticky;
    display: flex;
}
.opp-schedule-actions > * {
    margin-right: 5px;
}
.opp-schedule-actions button {
    background: #eee;
    color: black;
    border: 1px outset black;
    cursor: pointer;
}
.opp-schedule-actions button.opp-active {
    background: #ccf;
    border-style: inset;
}
.opp-schedule {
    position: relative;
    margin: 0 -10px;
}
.opp-schedule > div {
    position: absolute;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    border: 1px solid black;
}
.opp-schedule .opp-hour, .opp-schedule .opp-day {
    font-weight: bold;
}
@keyframes opp-schedule-hovered-activity {
    0% {
        background: #eef;
    }
    50% {
        background: #ccf;
    }
    100% {
        background: #eef;
    }
}
.opp-schedule .opp-activity.opp-hovered {
    animation: 1s infinite ease opp-schedule-hovered-activity;
}
@keyframes opp-schedule-hovered-activity-remove {
    0% {
        background: #fee;
    }
    50% {
        background: #fcc;
    }
    100% {
        background: #fee;
    }
}
.opp-schedule-view.opp-action-remove .opp-activity:hover {
    animation: 1s infinite ease opp-schedule-hovered-activity-remove;
    cursor: pointer;
}
.opp-schedule-view.opp-action-remove .opp-activity a {
    pointer-events: none;
}
`)

// flatten the blue top bar into the flex to make it flow nicer
$(".menu-content-wrapper").append($(".menu-topbar-actions-wrapper").children())
