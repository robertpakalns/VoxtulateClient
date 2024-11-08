const { app, BrowserWindow, ipcMain, dialog, protocol, session } = require("electron")
const { autoUpdater } = require("electron-updater")
const fs = require("fs")
const path = require("path")
const { Config, configPath, defaultConfig } = require("./src/config.js")
const config = new Config
const DiscordRPC = require("./src/discord.js")
const rpc = new DiscordRPC

let mainWindow, settingsWindow, infoWindow
const keybinding = config.get("keybinding.enable") ? config.get("keybinding.content") : defaultConfig.keybinding.content

const createMain = async () => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        fullscreen: config.get("client.fullscreen"),
        title: "Voxtulate Client",
        icon: path.join(__dirname, "assets/icon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "src/ui/script.js"),
            webSecurity: false
        }
    })

    mainWindow.setMenu(null)
    mainWindow.loadURL("https://voxiom.io")
    mainWindow.on("page-title-updated", e => e.preventDefault())

    const { webContents } = mainWindow

    webContents.on("will-prevent-unload", e => e.preventDefault())
    webContents.on("before-input-event", (e, { code, type }) => {
        if ([keybinding.Settings, keybinding.Reload, keybinding.Fullscreen, keybinding.DevTools].includes(code)) e.preventDefault()

        if (code === keybinding.Settings) settingsModal()
        if (code === keybinding.Info) infoModal()
        if (code === keybinding.Reload) webContents.reload()
        if (code === keybinding.Fullscreen) mainWindow.setFullScreen(!mainWindow.isFullScreen())
        if (code === keybinding.DevTools) webContents.toggleDevTools()

        if (code === "Escape" && type === "keyUp") webContents.executeJavaScript(`document.querySelector(".enmYtp") ? document.querySelector("canvas").requestPointerLock() : document.exitPointerLock()`)
    })

    ipcMain.on("update-url", e => e.reply("update-url", webContents.getURL()))
    webContents.on("did-navigate-in-page", () => {
        const url = webContents.getURL()
        settingsWindow?.webContents.send("update-url", url)
        rpc.setJoinURL(url.replace("https://voxiom.io/", "voxtulate://"))
    })

    const reject = JSON.parse(fs.readFileSync(path.join(__dirname, "src/reject.json"), "utf8"))
    const { adblocker, swapper } = config.get("client")

    const swapperFolder = path.join(app.getPath("documents"), "VoxtulateClient", "swapper")
    if (!fs.existsSync(swapperFolder)) fs.mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = fs.readdirSync(swapperFolder)

    const swappedFile = url => {
        const resource = new URL(url).pathname.split("/").pop()
        if (swapperFiles.includes(resource)) {
            const localFilePath = path.join(swapperFolder, resource)
            if (fs.existsSync(localFilePath)) return `file://${localFilePath}`
        }
        return null
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {
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

const settingsModal = () => {
    if (settingsWindow) return settingsWindow.show()

    settingsWindow = new BrowserWindow({
        height: 600,
        width: 810,
        resizable: false,
        title: "Voxtulate Client | Settings",
        icon: path.join(__dirname, "assets/icon.ico"),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    settingsWindow.setMenu(null)
    settingsWindow.loadFile(path.join(__dirname, "src/modals/settings/index.html"))

    settingsWindow.webContents.on("did-finish-load", () => settingsWindow.show())
    settingsWindow.webContents.on("before-input-event", (_, { code }) => code === keybinding.Close_Modal && settingsWindow.hide())
    settingsWindow.on("blur", () => settingsWindow.hide())
    settingsWindow.on("close", () => settingsWindow = null)

    ipcMain.on("reload", () => settingsWindow.webContents.reload())
}

const infoModal = () => {
    if (infoWindow) return infoWindow.show()

    infoWindow = new BrowserWindow({
        height: 600,
        width: 800,
        resizable: false,
        title: "Voxtulate Client | Info",
        icon: path.join(__dirname, "assets/icon.ico"),
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    infoWindow.setMenu(null)
    infoWindow.loadFile(path.join(__dirname, "src/modals/info/index.html"))

    infoWindow.webContents.on("did-finish-load", () => infoWindow.show())
    infoWindow.webContents.on("before-input-event", (_, { code }) => code === keybinding.Close_Modal && infoWindow.hide())
    infoWindow.on("blur", () => infoWindow.hide())
    infoWindow.on("close", () => infoWindow = null)
}

if (config.get("client.fpsUncap")) app.commandLine.appendSwitch("disable-frame-rate-limit")
for (const el of ["disable-gpu-vsync", "in-process-gpu", "enable-quic", "enable-gpu-rasterization", "enable-pointer-lock-options"]) app.commandLine.appendSwitch(el)

const message = message => dialog.showMessageBox({ icon: path.join(__dirname, "assets/icon.ico"), title: "Voxtulate Client | Update", message })

app.on("ready", () => {
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

    ipcMain.on("join-game", (_, url) => setTimeout(() => {
        mainWindow.loadURL(url)
        settingsWindow?.close()
    }, 100))

    const filters = { filters: [{ name: "JSON Files", extensions: ["json"] }] }
    const { webContents } = mainWindow

    ipcMain.on("import-client-settings", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(filters)
        if (!canceled && filePaths.length > 0) fs.writeFileSync(config.file, fs.readFileSync(filePaths[0], "utf8"))
    })
    ipcMain.on("export-client-settings", async () => {
        const { canceled, filePath } = await dialog.showSaveDialog(filters)
        if (!canceled && filePath) fs.writeFileSync(filePath, fs.readFileSync(configPath))
    })
    ipcMain.on("import-game-settings", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(filters)
        if (!canceled && filePaths.length > 0) webContents.send("set-game-settings", JSON.stringify(fs.readFileSync(filePaths[0], "utf8")))
    })
    ipcMain.on("export-game-settings", async () => {
        const { canceled, filePath } = await dialog.showSaveDialog(filters)
        if (!canceled && filePath) webContents.send("get-game-settings", filePath)
    })

    for (const e of ["change-crosshair", "change-opacity", "set-console", "change-css", "change-js"])
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