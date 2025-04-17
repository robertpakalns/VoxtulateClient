const { readFileSync, existsSync, mkdirSync, readdirSync } = require("fs")
const { Config, configDir } = require("../config.js")
const path = require("path")
const config = new Config

const swapper = webContents => {
    const reject = JSON.parse(readFileSync(path.join(__dirname, "../reject.json"), "utf8"))
    const { adblocker, swapper } = config.get("client")

    const swapperFolder = path.join(configDir, "swapper")
    if (!existsSync(swapperFolder)) mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = new Set(readdirSync(swapperFolder))

    const swapFile = url => {

        // Resource detection based on the file name and extension
        const resource = new URL(url).pathname.split("/").pop()
        if (!swapperFiles.has(resource)) return null
        const localFilePath = path.join(swapperFolder, resource)
        if (existsSync(localFilePath)) return `file://${localFilePath}`
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {

        // This is a temporal solution for getting the skin render function 
        if (url.includes("7cb119bcceb97088c8ad.js")) return callback({ redirectURL: path.join(__dirname, "../../assets/script-0.9.2.0.js") })

        if (url.startsWith("file://")) return callback({})

        // Block ads and other scripts which are not voxiom related
        if (adblocker && reject.some(el => url.includes(el))) return callback({ cancel: true })

        // Swapper
        if (swapper) {
            const swap = swapFile(url)
            if (swap) return callback({ redirectURL: swap })
        }

        return callback({})
    })
}

module.exports = swapper