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
        if (url.startsWith("file://")) return callback({})

        const { host, pathname } = new URL(url)

        // Block ads and other scripts which are not voxiom related
        if (adblocker && reject.has(host)) return callback({ cancel: true })

        if (host === "voxiom.io" || host === "historynotes.club") {
            if (pathname.startsWith("/socket.io")) return callback({ cancel: true })

            // Replace the script to get the skin render function
            // This is a temporal solution for getting the skin render function
            // Updated: 5/9/2025
            if (pathname.endsWith("901e41c927c6d3ee5699.js")) return callback({ redirectURL: path.join(__dirname, "../../assets/script-0.9.2.0.js") })

            // Swapper
            if (swapper === "full") {
                const swap = swapFile(pathname.split("/").pop())
                if (swap) return callback({ redirectURL: swap })
            }

            if (swapper === "list") {
                const swap = swapFile(swapperList[url])
                if (swap) return callback({ redirectURL: swap })
            }
        }

        return callback({})
    })
}

module.exports = swapper