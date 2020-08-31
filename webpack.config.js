const webpack = require("webpack")
const path = require("path")

const scriptVersion = require("./package.json").version.replace(/(\.0)+$/, "")

module.exports = {
    mode: "none",
    entry: {
        autoupdate: "./src/entry.noupdatecheck.ts",
        autocheck: "./src/entry.updatecheck.ts",
        folio: "./src/entry.noupdatecheck.ts",
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                include: path.resolve(__dirname, "src"),
            },
        ],
    },
    resolve: {
        extensions: [".js", ".ts"],
        modules: ["./node_modules", "./src"],
    },
    plugins: [
        new webpack.ProgressPlugin((percentage, message, ...args) => {
            console.info(`${(100 * percentage).toFixed(0)}%`, message, ...args)
        }),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(scriptVersion),
        }),
        new webpack.BannerPlugin({
            banner({chunk}) {
                let update = ""
                let scriptType
                if (chunk.name === "autoupdate") {
                    scriptType = "automatic update"
                    update = `\
// @updateURL    https://purkka.codes/oodi/oodiplusplus.autoupdate.user.js
// @downloadURL  https://purkka.codes/oodi/oodiplusplus.autoupdate.user.js
`
                } else if (chunk.name === "autocheck") {
                    scriptType = "automatic update check"
                    update = `\
// @grant        GM_xmlhttpRequest
// @connect      purkka.codes
`
                } else {
                    scriptType = "(tinfoil hat mode)"
                }
                return `\
// ==UserScript==
// @name         Oodi++ (automatic update check)
// @namespace    https://purkka.codes/
// @version      ${scriptVersion}
// @description  Efficiently plan your timetable right in Oodi and export it to your calendar.
// @author       PurkkaKoodari
// @include      https://oodi.aalto.fi/*
// @require      https://code.jquery.com/jquery-3.5.1.min.js#sha256=f7f6a5894f1d19ddad6fa392b2ece2c5e578cbf7da4ea805b6885eb6985b6e3d
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
${update}// ==/UserScript==
`
            },
            raw: true,
            entryOnly: true,
        }),
    ],
    output: {
        filename: "./oodiplusplus.[name].user.js",
        path: path.resolve(__dirname),
    },
}
