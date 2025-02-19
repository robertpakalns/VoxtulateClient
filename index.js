const { app, BrowserWindow, ipcMain, dialog, protocol, session } = require("electron")
const { Config, configPath, defaultConfig } = require("./src/config.js")
const { autoUpdater } = require("electron-updater")
const DiscordRPC = require("./src/discord.js")
const path = require("path")
const rpc = new DiscordRPC
const config = new Config
const { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } = require("fs")

let mainWindow
const keybinding = config.get("keybinding.enable") ? config.get("keybinding.content") : defaultConfig.keybinding.content

const createMain = async () => {
    mainWindow = new BrowserWindow({
        title: "Voxtulate Client",
        icon: path.join(__dirname, "assets/icon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "src/ui/script.js"),
            webSecurity: false
        }
    })

    mainWindow.maximize()
    mainWindow.setMenu(null)
    mainWindow.loadURL("https://voxiom.io")
    mainWindow.setFullScreen(config.get("client.fullscreen"))
    mainWindow.on("page-title-updated", e => e.preventDefault())

    const { webContents } = mainWindow

    webContents.on("will-prevent-unload", e => e.preventDefault())
    webContents.on("before-input-event", (e, { code, type }) => {
        const { Close_Modal, Settings, Info, Updates, Reload, Fullscreen, DevTools } = keybinding
        if ([Settings, Info, Updates, Reload, Fullscreen, DevTools].includes(code)) e.preventDefault()

        if (code === Close_Modal && type === "keyUp") webContents.send("toggle-window", "null")
        if (code === Settings) webContents.send("toggle-window", "settingsModal")
        if (code === Info) webContents.send("toggle-window", "infoModal")
        if (code === Updates) webContents.send("toggle-window", "updatesModal")
        if (code === Reload) webContents.reload()
        if (code === Fullscreen) mainWindow.setFullScreen(!mainWindow.isFullScreen())
        if (code === DevTools) webContents.toggleDevTools()

        if (code !== Close_Modal && code === "Escape" && type === "keyUp") webContents.send("toggle-window", "null")
    })

    ipcMain.on("update-url", e => e.reply("update-url", webContents.getURL()))
    webContents.on("did-navigate-in-page", () => {
        const url = webContents.getURL()
        webContents.send("update-url", url)
        rpc.setJoinURL(url.replace("https://voxiom.io/", "voxtulate://"))
    })
    webContents.on("did-finish-load", () => {
        const url = webContents.getURL()
        webContents.send("update-url", url)
        rpc.setJoinURL(url.replace("https://voxiom.io/", "voxtulate://"))
    })

    const reject = JSON.parse(readFileSync(path.join(__dirname, "src/reject.json"), "utf8"))
    const { adblocker, swapper } = config.get("client")

    const swapperFolder = path.join(app.getPath("documents"), "VoxtulateClient/swapper")
    if (!existsSync(swapperFolder)) mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = readdirSync(swapperFolder)

    const swappedFile = url => {
        const resource = new URL(url).pathname.split("/").pop()
        if (swapperFiles.includes(resource)) {
            const localFilePath = path.join(swapperFolder, resource)
            if (existsSync(localFilePath)) return `file://${localFilePath}`
        }
        return null
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {
        if (url.includes("7cb119bcceb97088c8ad.js")) return callback({ redirectURL: path.join(__dirname, "assets/script-0.9.2.0.js") })
        if (url.startsWith("file://")) return callback({})
        if (adblocker && reject.some(el => url.includes(el))) return callback({ cancel: true })
        if (swapper) {
            const swap = swappedFile(url)
            if (swap) return callback({ redirectURL: swap })
        }
        return callback({})
    })

    webContents.on("new-window", (e, url) => {
        e.preventDefault()
        mainWindow.loadURL(url)
    })
}

if (config.get("client.fpsUncap")) app.commandLine.appendSwitch("disable-frame-rate-limit")
for (const el of ["in-process-gpu", "enable-quic", "enable-gpu-rasterization", "disable-gpu-vsync"]) app.commandLine.appendSwitch(el)

const message = message => dialog.showMessageBox({ icon: path.join(__dirname, "assets/icon.ico"), title: "Voxtulate Client | Update", message })

app.on("ready", () => {
    app.setAsDefaultProtocolClient("voxtulate")
    protocol.registerFileProtocol("file", ({ url }, c) => c({ path: path.normalize(decodeURIComponent(new URL(url).pathname)) }))
    createMain()

    const deepLink = process.argv.find(arg => arg.startsWith("voxtulate://"))
    if (deepLink) mainWindow.loadURL(`https://voxiom.io/${decodeURIComponent(deepLink.slice(12)).replace(/\/$/, "").replace(/\/#/g, "#")}`)
    app.setAsDefaultProtocolClient("voxtulate")

    if (config.get("client.firstJoin")) {
        setTimeout(() => message("Welcome to Voxtulate Client! Press F1 and F2 for more information. Have a good game!"), 3000)
        config.set("client.firstJoin", false)
    }

    autoUpdater.checkForUpdates()

    ipcMain.on("join-game", (_, url) => mainWindow.loadURL(url))

    const { webContents } = mainWindow

    const f = { filters: [{ name: "JSON Files", extensions: ["json"] }] }
    ipcMain.on("import-client-settings", () => dialog.showOpenDialog(f).then(({ canceled, filePaths }) => {
        if (!canceled && filePaths.length > 0) writeFileSync(config.file, readFileSync(filePaths[0], "utf8"))
    }))
    ipcMain.on("export-client-settings", () => dialog.showSaveDialog(f).then(({ canceled, filePath }) => {
        if (!canceled && filePath) writeFileSync(filePath, readFileSync(configPath))
    }))
    ipcMain.on("import-game-settings", () => dialog.showOpenDialog(f).then(({ canceled, filePaths }) => {
        if (!canceled && filePaths.length > 0) webContents.send("set-game-settings", JSON.stringify(readFileSync(filePaths[0], "utf8")))
    }))
    ipcMain.on("export-game-settings", () => dialog.showSaveDialog(f).then(({ canceled, filePath }) => {
        if (!canceled && filePath) webContents.send("get-game-settings", filePath)
    }))

    for (const e of ["change-crosshair", "change-opacity", "set-console", "change-css", "change-js", "toggle-hint"])
        ipcMain.on(e, (_, ...a) => webContents.send(e, ...a))

    ipcMain.on("clear-data", () => session.defaultSession.clearStorageData([]))
    ipcMain.on("relaunch", () => {
        app.relaunch()
        app.exit()
    })
})

autoUpdater.on("update-available", () => message("A new version is available. It will be downloaded and installed."))
autoUpdater.on("update-downloaded", () => message("The update has been downloaded. It will be installed on restart.")
    .then(() => autoUpdater.quitAndInstall()))