const { app, BrowserWindow, ipcMain, dialog, protocol } = require("electron")
const { autoUpdater } = require("electron-updater")
const fs = require("fs")
const path = require("path")
const { Config, configPath } = require("./src/config.js")
const config = new Config

let mainWindow, settingsWindow, infoWindow

const createMain = async () => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        fullscreen: config.get("fullscreen"),
        title: `Voxtulate Client v${app.getVersion()}`,
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
    webContents.on("before-input-event", async (e, { key, type }) => {
        if (["F1", "F5", "F11", "F12"].includes(key)) e.preventDefault()

        if (key === "F1") settingsModal()
        if (key === "F2") infoModal()
        if (key === "F5") webContents.reload()
        if (key === "F11") mainWindow.setFullScreen(!mainWindow.isFullScreen())
        if (key === "F12") webContents.toggleDevTools()

        if (key === "Escape" && type === "keyUp") {
            if (!await webContents.executeJavaScript("document.querySelector('.faouwN') !== null")) e.preventDefault()
            webContents.executeJavaScript(`document.querySelector(".enmYtp") ? document.querySelector("canvas").requestPointerLock() : document.exitPointerLock()`)
        }
    })

    ipcMain.on("update-url-request", e => e.reply("update-url", webContents.getURL()))
    webContents.on("did-navigate-in-page", () => settingsWindow?.webContents.send("update-url", webContents.getURL()))

    const reject = JSON.parse(fs.readFileSync(path.join(__dirname, "src/reject.json"), "utf8"))
    const swapper = JSON.parse(fs.readFileSync(path.join(__dirname, "src/swapper.json"), "utf8"))

    const { adblocker } = config.get("client")
    const { enable: enableSwapper, content = {} } = config.get("swapper")

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {
        if (adblocker && reject.some(el => url.includes(el))) return callback({ cancel: true })

        const swappedUrl = enableSwapper && content[swapper[url]]
        return swappedUrl ? callback({ redirectURL: swappedUrl }) : callback({})
    })

    webContents.on("did-finish-load", () => {
        if (config.get("styles.enable") && config.get("styles.custom")) {
            webContents.insertCSS(config.get("styles.css"))
            webContents.executeJavaScript(config.get("styles.js"))
        }
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
        width: 800,
        resizable: false,
        title: `Voxtulate Client v${app.getVersion()} | Settings`,
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
    settingsWindow.webContents.on("before-input-event", (e, { key }) => {
        if (key === "Escape") {
            e.preventDefault()
            settingsWindow.close()
        }
    })
    settingsWindow.on("blur", () => settingsWindow.hide())
    settingsWindow.on("close", () => settingsWindow = null)
}

const infoModal = () => {
    if (infoWindow) return infoWindow.show()

    infoWindow = new BrowserWindow({
        height: 600,
        width: 800,
        resizable: false,
        title: `Voxtulate Client v${app.getVersion()} | Info`,
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
    infoWindow.webContents.on("before-input-event", (e, { key }) => {
        if (key === "Escape") {
            e.preventDefault()
            infoWindow.close()
        }
    })
    infoWindow.on("blur", () => infoWindow.hide())
    infoWindow.on("close", () => infoWindow = null)
}

if (config.get("client.fpsUncap")) app.commandLine.appendSwitch("disable-frame-rate-limit")
app.commandLine.appendSwitch("disable-gpu-vsync")

app.on("ready", () => {

    protocol.registerFileProtocol("file", ({ url }, c) => c({ path: path.normalize(decodeURIComponent(new URL(url).pathname)) }))

    createMain()
    autoUpdater.checkForUpdates()

    ipcMain.on("join-game", (_, url) => {
        mainWindow.loadURL(url)
        settingsWindow?.close()
    })

    const filters = { filters: [{ name: "JSON Files", extensions: ["json"] }] }

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
        if (!canceled && filePaths.length > 0) mainWindow.webContents.send("set-game-settings", JSON.stringify(fs.readFileSync(filePaths[0], "utf8")))
    })
    ipcMain.on("export-game-settings", async () => {
        const { canceled, filePath } = await dialog.showSaveDialog(filters)
        if (!canceled && filePath) mainWindow.webContents.send("get-game-settings", filePath)
    })

    ipcMain.on("change-custom-css", (_, code) => mainWindow.webContents.insertCSS(code))
    ipcMain.on("change-custom-js", (_, code) => mainWindow.webContents.executeJavaScript(code))

    ipcMain.on("relaunch", () => {
        app.relaunch()
        app.exit()
    })
})

const message = text => dialog.showMessageBox({
    icon: path.join(__dirname, "assets/icon.ico"),
    title: `Voxtulate Client v${app.getVersion()} | Update`,
    message: text
})

autoUpdater.on("update-available", () => message("A new version is available. It will be downloaded and installed."))
autoUpdater.on("update-downloaded", () => message("The update has been downloaded. It will be installed on restart.")
    .then(() => autoUpdater.quitAndInstall()))