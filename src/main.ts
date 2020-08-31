// main.ts: main entry point

import {setSidebarOpen} from "./sidebar"
import {parseOpettaptied} from "./opettaptied"
import {whatsNewCheck} from "./settings"

export default function start() {
    console.info(`Oodi++ ${VERSION} active`)
    parseOpettaptied()
    setSidebarOpen(typeof GM_getValue === "function" && !!GM_getValue("sidebarOpen"), true)
    whatsNewCheck()
}
