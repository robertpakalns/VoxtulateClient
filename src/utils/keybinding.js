const { Config, defaultConfig } = require("../config.js")
const config = new Config

const keybinding = mainWindow => {
    const { webContents } = mainWindow
    const keybindings = config.get("keybinding.enable") ? config.get("keybinding.content") : defaultConfig.keybinding.content
    const { Close_Modal, Settings, Info, Updates, Reload, Fullscreen, DevTools } = keybindings

    const keySet = new Set([Settings, Info, Updates, Reload, Fullscreen, DevTools])

    webContents.on("before-input-event", (e, { code, type }) => {
        if (keySet.has(code)) e.preventDefault()
        if (code == "F4") e.preventDefault() // TEMP

        // Fix of the in-game pause button due to older electron version
        if (code !== Close_Modal && code === "Escape" && type === "keyUp") return webContents.send("toggle-window", "null")

        switch (code) {
            case "F4": webContents.send("toggle-window", "menuModal"); break // TEMP
            case Close_Modal: if (type === "keyUp") webContents.send("toggle-window", "null"); break
            case Settings: webContents.send("toggle-window", "settingsModal"); break
            case Info: webContents.send("toggle-window", "infoModal"); break // REMOVE
            case Updates: webContents.send("toggle-window", "updatesModal"); break // REMOVE
            case Reload: webContents.reload(); break
            case Fullscreen: mainWindow.setFullScreen(!mainWindow.isFullScreen()); break
            case DevTools: webContents.toggleDevTools(); break
            default: break
        }
    })
}

module.exports = keybinding