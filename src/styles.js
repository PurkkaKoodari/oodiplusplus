// styles.js: stylesheet for the app



GM_addStyle(`
/* hack the layout to be responsive so that it can take our sidebar */
#menu {
    position: sticky !important; /* sticky top bar - keeps the look but without fixed height */
}
/* un-position these top bar parts/* sticky top bar - keeps the look but without fixed height */
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

.opp-hovered-activity {
    background: #ddf;
}
.opp-hovered-activity td {
    background: transparent !important;
}

/* styles for the sidebar */
@keyframes opp-sidebar-opener-alert {
    0% {
        background: #fff;
    }
    50% {
        background: #ccf;
    }
    100% {
        background: #fff;
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
.opp-sidebar-wrapper p, .opp-sidebar-wrapper ul {
    margin: 0.7em 0;
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
.opp-new-version h3 {
    color: #900;
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
`)
