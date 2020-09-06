type MapObj<V> = {[key: string]: V}

declare const VERSION: string

interface JQueryStatic {
    make<T extends HTMLElement>(name: string): JQuery<T>
}
