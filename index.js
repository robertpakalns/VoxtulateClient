const { app, BrowserWindow, ipcMain, dialog, session } = require("electron")
const { autoUpdater } = require("electron-updater")
const fs = require("fs")
const path = require("path")
const { Config, appDataPath } = require("./src/config.js")
const config = new Config

let mainWindow, settingsWindow

const createMain = async () => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        title: `Voxtulate Client v${app.getVersion()}`,
        icon: path.join(__dirname, "assets/icon.ico"),
        webPreferences: {
            preload: path.join(__dirname, "src/ui/script.js")
        }
    })

    mainWindow.maximize()
    mainWindow.setMenu(null)
    mainWindow.loadURL("https://voxiom.io")
    mainWindow.on("page-title-updated", e => e.preventDefault())

    const { webContents } = mainWindow

    webContents.on("will-prevent-unload", e => e.preventDefault())
    webContents.on("before-input-event", async (e, { key, type }) => {
        if (["F1", "F5", "F11", "F12"].includes(key)) e.preventDefault()

        if (key === "F1") settingsModal()
        if (key === "F5") webContents.reload()
        if (key === "F11") mainWindow.setFullScreen(!mainWindow.isFullScreen())
        if (key === "F12") webContents.toggleDevTools()

        if (key === "Escape" && type === "keyUp") {
            if (!await webContents.executeJavaScript("document.querySelector('.faouwN') !== null")) e.preventDefault()
            webContents.executeJavaScript(`document.querySelector(".enmYtp") ? document.querySelector("canvas").requestPointerLock() : document.exitPointerLock()`)
        }
    })

    ipcMain.on("update-url-request", e => e.reply("update-url", webContents.getURL()))

    if (config.get("client.adblocker")) session.defaultSession.webRequest.onBeforeRequest(JSON.parse(fs.readFileSync(path.join(__dirname, "src/reject.json"), "utf8")), (_, c) => c({ cancel: true }))

    webContents.on("did-finish-load", () => {
        if (config.get("styles.enable") && config.get("styles.custom")) {
            webContents.insertCSS(config.get("styles.css"))
            webContents.executeJavaScript(config.get("styles.js"))
        }
    })
}

const settingsModal = () => {
    if (settingsWindow) return settingsWindow.show()

    settingsWindow = new BrowserWindow({
        height: 550,
        width: 810,
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
    settingsWindow.loadFile(path.join(__dirname, "src/settings/index.html"))

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

if (config.get("client.fpsUncap")) app.commandLine.appendSwitch("disable-frame-rate-limit")
app.commandLine.appendSwitch("disable-gpu-vsync")

app.on("ready", () => {
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
        if (!canceled && filePath) fs.writeFileSync(filePath, fs.readFileSync(path.join(appDataPath, "config.json")))
    })
    ipcMain.on("import-game-settings", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(filters)
        if (!canceled && filePaths.length > 0) mainWindow.webContents.send("set-game-settings", JSON.stringify(fs.readFileSync(filePaths[0], "utf8")))
    })
    ipcMain.on("export-game-settings", async () => {
        const { canceled, filePath } = await dialog.showSaveDialog(filters)
        if (!canceled && filePath) mainWindow.webContents.send("get-game-settings", filePath)
    })

    ipcMain.on("relaunch", () => {
        app.relaunch()
        app.exit()
    })

    ipcMain.on("change-custom-css", (_, code) => mainWindow.webContents.insertCSS(code))
    ipcMain.on("change-custom-js", (_, code) => mainWindow.webContents.executeJavaScript(code))
})

autoUpdater.on("update-available", () => dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update Available",
    message: "A new version is available. It will be downloaded and installed."
}))

autoUpdater.on("update-downloaded", () => dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update Downloaded",
    message: "The update has been downloaded. It will be installed on restart."
})
    .then(() => autoUpdater.quitAndInstall()))