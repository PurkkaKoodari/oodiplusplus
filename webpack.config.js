const webpack = require("webpack")
const path = require("path")

const scriptVersion = require("./package.json").version.replace(/(\.0)+$/, "")

const preactVersion = require("preact/package.json").version
const jqueryVersion = require("jquery/package.json").version

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
                test: /\.tsx?$/,
                use: "ts-loader",
                include: path.resolve(__dirname, "src"),
            },
        ],
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
        modules: ["./node_modules", "./src"],
        alias: {
            jquery: "jquery/dist/jquery.slim.min.js",
        },
    },
    plugins: [
        new webpack.ProgressPlugin((percentage, message, ...args) => {
            console.info(`${(100 * percentage).toFixed(0)}%`, message, ...args)
        }),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(scriptVersion),
            PREACT_VERSION: JSON.stringify(preactVersion),
            JQUERY_VERSION: JSON.stringify(jqueryVersion),
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
                    scriptType = "tinfoil hat mode"
                }
                return `\
// ==UserScript==
// @name         Oodi++ (${scriptType})
// @namespace    https://purkka.codes/
// @version      ${scriptVersion}
// @description  Efficiently plan your timetable right in Oodi and export it to your calendar.
// @author       PurkkaKoodari
// @include      https://oodi.aalto.fi/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
${update}// ==/UserScript==

/*! Oodi++ is licensed under the MIT license. */
/*! Includes jQuery v${jqueryVersion} | (c) JS Foundation and other contributors | jquery.org/license */
/*! Includes Preact v${preactVersion} | https://preactjs.com/ | MIT License */

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
