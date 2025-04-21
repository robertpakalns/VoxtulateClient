const { userScriptsPath } = require("../../../src/utils/userScripts.js")
const { Config, configPath, configDir } = require("../../config.js")
const { el, createEl, popup } = require("../../functions.js")
const { readFileSync, writeFileSync } = require("fs")
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
        const keybindingRow = (name, key) => {
            const _inputChild = createEl("input", { type: "text", value: key })
            _inputChild.addEventListener("keydown", e => {
                e.preventDefault()
                _inputChild.value = e.code
                config.set(`keybinding.content.${name}`, e.code)
            })

            const _name = createEl("td", { textContent: name })
            const _input = createEl("td", {}, "", [_inputChild])
            const tr = createEl("tr", {}, "", [_name, _input])

            el("keybindingBody").element.appendChild(tr)
        }

        const toggleKeybinding = () => {
            const checked = el("enableKeybinding").checked
            el("keybindingTable").class("disabled", !checked)
            el("keybindingTable").element.querySelectorAll("input").forEach(el => el.disabled = !checked)
        }

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

            enableCrosshair: "crosshair.enable",

            enableKeybinding: "keybinding.enable"
        }

        for (const [id, key] of Object.entries(checkedObject)) {
            el(id).checked = config.get(key)
            el(id).event("change", e => config.set(key, e.target.checked))
        }

        el("swapperNull").event("change", () => config.set("client.swapper", null))
        el("swapperList").event("change", () => config.set("client.swapper", "list"))
        el("swapperFull").event("change", () => config.set("client.swapper", "full"))

        el("crosshairURL").value = config.get("crosshair.url") ?? ""
        el("chatOpacity").value = config.get("interface.chatOpacity") ?? "100"

        const { content: c2 } = config.get("keybinding")
        for (const key in c2) keybindingRow(key, c2[key])

        toggleKeybinding()

        ipcRenderer.on("update-url", (_, url) => el("currentURL").element.innerText = url || "Unknown URL")
        ipcRenderer.send("update-url")

        el("hint").event("change", e => ipcRenderer.send("toggle-hint", e.target.checked))

        el("enableCrosshair").event("change", e => ipcRenderer.send("change-crosshair", e.target.checked, el("crosshairURL").value))
        el("crosshairURL").event("input", e => {
            config.set("crosshair.url", e.target.value)
            ipcRenderer.send("change-crosshair", el("enableCrosshair").checked, el("crosshairURL").value)
        })
        el("crosshairFile").event("change", ({ target: { files: [file] } }) => {
            if (!file) return
            const { path } = file
            config.set("crosshair.url", path)
            el("crosshairURL").element.value = path
            ipcRenderer.send("change-crosshair", el("enableCrosshair").checked, el("crosshairURL").value)
        })

        el("joinLink").event("click", () => ipcRenderer.send("join-game", el("joinLinkURL").value))

        const fileIconURL = path.join(__dirname, "../../../assets/icons/file.svg")
        document.querySelector(".file-icon").src = fileIconURL
        document.querySelectorAll(".copy").forEach(el => el.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.innerText)
            popup("rgb(206, 185, 45)", "Copied!")
        }))

        el("importClientSettings").event("click", () => ipcRenderer.send("import-client-settings"))
        el("exportClientSettings").event("click", () => ipcRenderer.send("export-client-settings"))
        el("importGameSettings").event("click", () => ipcRenderer.send("import-game-settings"))
        el("exportGameSettings").event("click", () => ipcRenderer.send("export-game-settings"))

        el("customStyles").event("click", e => ipcRenderer.send("change-styles", e.target.checked))
        el("console").event("change", e => ipcRenderer.send("set-console", e.target.checked))
        el("enableKeybinding").event("change", toggleKeybinding)

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
        for (const e of ["swapperFull", "swapperList", "swapperNull", "fpsUncap", "proxyDomain", "rpc", "rpcNotification", "adblocker", "inventorySorting", "fullscreen", "enableKeybinding"])
            el(e).event("click", restartMessage)
    }
}

module.exports = SettingsModal