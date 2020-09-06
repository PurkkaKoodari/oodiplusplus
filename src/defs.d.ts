type MapObj<V> = {[key: string]: V}

declare const VERSION: string
declare const PREACT_VERSION: string
declare const JQUERY_VERSION: string

interface JQueryStatic {
    make<T extends HTMLElement>(name: string): JQuery<T>
}
