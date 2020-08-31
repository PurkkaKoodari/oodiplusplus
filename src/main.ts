// main.ts: main entry point

import {setSidebarOpen} from "./sidebar"
import {parseOpettaptied} from "./opettaptied"
import { updateActivities } from "./schedule"

export default function start() {
    console.info(`Oodi++ ${VERSION} active`)
    parseOpettaptied()
    updateActivities()
    setSidebarOpen(typeof GM_getValue === "function" && !!GM_getValue("sidebarOpen"), true)
}
