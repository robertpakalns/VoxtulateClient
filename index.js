const { app, BrowserWindow, ipcMain, dialog, protocol, session } = require("electron")
const { Config, configPath } = require("./src/config.js")
const { readFileSync, writeFileSync } = require("fs")
const { message } = require("./src/functions.js")
const DiscordRPC = require("./src/utils/discord.js")
const path = require("path")
const rpc = new DiscordRPC
const config = new Config
const userScripts = require("./src/utils/userScripts.js")
const keybinding = require("./src/utils/keybinding.js")
const swapper = require("./src/utils/swapper.js")
const clientUpdater = require("./src/utils/clientUpdater.js")

let mainWindow
const domain = config.get("client.proxyDomain") ? "https://historynotes.club" : "https://voxiom.io"

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
    mainWindow.loadURL(domain)
    mainWindow.setFullScreen(config.get("client.fullscreen"))
    mainWindow.on("page-title-updated", e => e.preventDefault())

    keybinding(mainWindow)

    const { webContents } = mainWindow

    webContents.on("will-prevent-unload", e => e.preventDefault())
    ipcMain.on("update-url", e => e.reply("update-url", webContents.getURL()))
    webContents.on("did-navigate-in-page", () => {
        const url = webContents.getURL()
        webContents.send("update-url", url)
        rpc.setJoinURL(url.replace(domain, ""))
    })
    webContents.on("did-finish-load", () => {
        const url = webContents.getURL()
        webContents.send("update-url", url)
        rpc.setJoinURL(url.replace(domain, ""))

        userScripts(webContents)
    })

    webContents.on("new-window", (e, url) => {
        e.preventDefault()
        mainWindow.loadURL(url)
    })

    swapper(webContents)
}

if (config.get("client.fpsUncap")) app.commandLine.appendSwitch("disable-frame-rate-limit")
for (const el of ["in-process-gpu", "enable-quic", "enable-gpu-rasterization", "disable-gpu-vsync"]) app.commandLine.appendSwitch(el)

app.on("ready", () => {
    app.setAsDefaultProtocolClient("voxtulate")
    protocol.registerFileProtocol("file", ({ url }, c) => c({ path: path.normalize(decodeURIComponent(new URL(url).pathname)) }))
    createMain()

    const deepLink = process.argv.find(arg => arg.startsWith("voxtulate://"))
    if (deepLink) mainWindow.loadURL(`${domain}/${decodeURIComponent(deepLink.slice(12)).replace(/\/$/, "").replace(/\/#/g, "#")}`)

    if (config.get("client.firstJoin")) {
        setTimeout(() => message("Welcome", "Welcome to Voxtulate Client! Press F1 and F2 for more information. Have a good game!"), 3000)
        config.set("client.firstJoin", false)
    }

    clientUpdater()

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

    for (const e of ["change-crosshair", "change-opacity", "set-console", "toggle-hint", "change-styles"])
        ipcMain.on(e, (_, ...a) => webContents.send(e, ...a))

    const confirmAction = (message, callback) => {
        const result = dialog.showMessageBoxSync({
            type: "question",
            buttons: ["Yes", "No"],
            defaultId: 1,
            icon: path.join(__dirname, "assets/icon.ico"),
            title: "Voxtulate Client | Confirm",
            message
        })
        if (result === 0) callback()
    }

    ipcMain.on("clear-settings", () => confirmAction("Are you sure you want to clear client settings?", () => {
        config.default()
        app.relaunch()
        app.exit()
    }))
    ipcMain.on("clear-data", () => confirmAction("Are you sure you want to clear all stored data?", () => {
        session.defaultSession.clearStorageData([])
        app.relaunch()
        app.exit()
    }))
    ipcMain.on("relaunch", () => confirmAction("Are you sure you want to restart the application?", () => {
        app.relaunch()
        app.exit()
    }))
})