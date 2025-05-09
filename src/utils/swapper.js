const { existsSync, mkdirSync, readdirSync, readFileSync } = require("fs")
const { Config, configDir } = require("./config.js")
const path = require("path")
const config = new Config
const fetch = require("node-fetch")

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
        if (existsSync(localFilePath)) return `file://${localFilePath}`
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {

        if (url.startsWith("https://voxiom.io/socket.io")) return callback({ cancel: true })

        // Replace the script to get the skin render function
        // This is a temporal solution for getting the skin render function
        // Updated: 5/9/2025
        if (url.endsWith("901e41c927c6d3ee5699.js")) return callback({ redirectURL: path.join(__dirname, "../../assets/script-0.9.2.0.js") })

        if (url.startsWith("file://")) return callback({})

        // Block ads and other scripts which are not voxiom related
        if (adblocker && reject.has(new URL(url).host)) return callback({ cancel: true })

        // Swapper
        if (swapper === "full") {
            const swap = swapFile(new URL(url).pathname.split("/").pop())
            if (swap) return callback({ redirectURL: swap })
        }

        if (swapper === "list") {
            const swap = swapFile(swapperList[url])
            if (swap) return callback({ redirectURL: swap })
        }

        return callback({})
    })
}

module.exports = swapper