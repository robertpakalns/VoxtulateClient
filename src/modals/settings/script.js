const { Config, configPath, configDir } = require("../../config.js")
const { el, createEl, popup } = require("../../functions.js")
const { readFileSync } = require("fs")
const { ipcRenderer, shell } = require("electron")
const Modal = require("../modal.js")
const path = require("path")
const config = new Config

class SettingsModal extends Modal {
    constructor() {
        super()
        this.modalHTML = readFileSync(path.join(__dirname, "./index.html"), "utf8")
    }

    init() {
        super.init()
        this.modal.id = "settingsModal"
    }

    work() {
        const checkedObject = {
            adblocker: "client.adblocker",
            fpsUncap: "client.fpsUncap",
            fullscreen: "client.fullscreen",
            hint: "client.hint",
            proxyDomain: "client.proxyDomain",

            rpc: "discord.joinButton",
            rpcNotification: "discord.notification",

            inventorySorting: "interface.inventorySorting",
            console: "interface.console",
            customStyles: "interface.clientStyles",
        }

        for (const [id, key] of Object.entries(checkedObject)) {
            el(id).checked = config.get(key)
            el(id).event("change", e => config.set(key, e.target.checked))
        }

        el("swapperNull").event("change", () => config.set("client.swapper", null))
        el("swapperList").event("change", () => config.set("client.swapper", "list"))
        el("swapperFull").event("change", () => config.set("client.swapper", "full"))

        el("chatOpacity").value = config.get("interface.chatOpacity") ?? "100"

        ipcRenderer.on("update-url", (_, url) => el("currentURL").element.innerText = url || "Unknown URL")
        ipcRenderer.send("update-url")

        el("hint").event("change", e => ipcRenderer.send("toggle-hint", e.target.checked))

        el("joinLink").event("click", () => ipcRenderer.send("join-game", el("joinLinkURL").value))

        el("customStyles").event("click", e => ipcRenderer.send("change-styles", e.target.checked))
        el("console").event("change", e => ipcRenderer.send("set-console", e.target.checked))

        el("chatOpacity").event("input", e => {
            config.set("interface.chatOpacity", e.target.value)
            ipcRenderer.send("change-opacity", e.target.value)
        })

        el("defaultSettings").event("click", () => ipcRenderer.send("clear-settings"))
        el("clearData").event("click", () => ipcRenderer.send("clear-data"))
        el("restart").event("click", () => ipcRenderer.send("relaunch"))

        el("openConfigs").event("click", () => shell.openPath(configPath))
        el("openSwapper").event("click", () => shell.openPath(path.join(configDir, "swapper")))
        el("openFolder").event("click", () => shell.openPath(configDir))

        const restartMessage = () => popup("rgb(231, 76, 60)", "Restart the client to apply this setting.")
        for (const e of ["swapperFull", "swapperList", "swapperNull", "fpsUncap", "proxyDomain", "rpc", "rpcNotification", "adblocker", "inventorySorting", "fullscreen"])
            el(e).event("click", restartMessage)
    }
}

module.exports = SettingsModal