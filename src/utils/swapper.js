const { existsSync, mkdirSync, readdirSync, readFileSync } = require("fs")
const { Config, configDir } = require("./config.js")
const path = require("path")
const config = new Config

const swapper = webContents => {
    const reject = new Set([
        "api.adinplay.com",
        "www.google-analytics.com",
        "www.googletagmanager.com",
        "matomo.voxiom.io",
        "api.gameanalytics.com"
    ])
    const swapperList = JSON.parse(readFileSync(path.join(__dirname, "../../assets/swapperList.json")))

    const { adblocker, swapper } = config.get("client")

    const swapperFolder = path.join(configDir, "swapper")
    if (!existsSync(swapperFolder)) mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = new Set(readdirSync(swapperFolder))

    const swapFile = name => {

        // Resource detection based on the file name and extension
        if (!swapperFiles.has(name)) return null
        const localFilePath = path.join(swapperFolder, name)
        return existsSync(localFilePath) ? `file://${localFilePath}` : null
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {

        const { protocol, host, pathname } = new URL(url)

        if (protocol === "file:") return callback({})

        // Block ads and other scripts which are not voxiom related
        if (adblocker && reject.has(host)) return callback({ cancel: true })

        if (host === "voxiom.io" || host === "historynotes.club") {

            // Blocks sockets
            if (adblocker && pathname.startsWith("/socket.io")) return callback({ cancel: true })

            // Replaces the resource (script)
            // Gets a reference to the skin render function as window.renderSkin
            // This is a temporary solution for getting the skin render function
            // Updated: 5/9/2025
            if (pathname.endsWith("901e41c927c6d3ee5699.js")) return callback({ redirectURL: path.join(__dirname, "../../assets/script-0.9.2.0.js") })

            // Swapper
            if (swapper === "list" || swapper === "full") {
                const swap = swapFile(swapper === "full" ? pathname.split("/").pop() : swapperList[pathname])
                if (swap) return callback({ redirectURL: swap })
            }
        }

        return callback({})
    })
}

module.exports = swapper