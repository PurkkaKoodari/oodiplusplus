// userscript.d.ts: declaration files for userscript API

declare function GM_getValue(key: string, defaultValue?: any): any
declare function GM_setValue(key: string, value: any): void

type GMXmlHttpRequestResult = {
    finalUrl: string
    readyState: number
    status: number
    statusText: string
    responseHeaders: { [key: string]: string }
    response: any
    responseXML: XMLDocument
    responseText: string
}

type GMXmlHttpRequestOptions = {
    method: "GET" | "HEAD" | "POST"
    url: string
    headers?: { [key: string]: string }
    data?: string
    cookie?: string
    binary?: boolean
    nocache?: boolean
    revalidate?: boolean
    timeout?: number
    context?: any
    responseType?: "arraybuffer" | "blob" | "json"
    overrideMimeType?: string
    anonymous?: boolean
    fetch?: boolean
    username?: string
    password?: string
    onabort?: () => void
    onerror?: () => void
    onloadstart?: () => void
    onprogress?: () => void
    onreadystatechange?: () => void
    ontimeout?: () => void
    onload?: (result: GMXmlHttpRequestResult) => void
}

type GMXmlHttpRequestAbort = {
    abort(): void
}

declare function GM_xmlhttpRequest(options: GMXmlHttpRequestOptions): GMXmlHttpRequestAbort

declare function GM_addStyle(style: string): HTMLStyleElement

declare const GM_info: readonly {
    script: {
        author: string
        copyright: string
        description: string
        excludes: string[]
        homepage: null
        icon: string | null
        icon64: string | null
        includes: string[]
        lastUpdated: number
        matches: string[]
        downloadMode: string
        name: string
        namespace: string
        options: {
            awareOfChrome: boolean
            compat_arrayleft: boolean
            compat_foreach: boolean
            compat_forvarin: boolean
            compat_metadata: boolean
            compat_prototypes: boolean
            compat_uW_gmonkey: boolean
            noframes: boolean
            override: {
                excludes: boolean
                includes: boolean
                orig_excludes: string[]
                orig_includes: string[]
                use_excludes: string[]
                use_includes: string[]
            }
            run_at: "document-end" | "document-start"
        }
        position: number
        resources: string[]
        "run-at": "document-end" | "document-start"
        system: boolean
        unwrap: boolean
        version: string
    }
    scriptMetaStr?: string
    scriptSource: string
    scriptUpdateURL?: string
    scriptWillUpdate: boolean
    scriptHandler: string
    isIncognito: boolean
    isFirstPartyIsolation: boolean
    version: string
}
