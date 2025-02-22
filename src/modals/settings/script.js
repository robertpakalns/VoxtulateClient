const { el, createEl, popup } = require("../../functions.js")
const { Config, configPath, configDir } = require("../../config.js")
const { ipcRenderer, shell } = require("electron")
const { readFileSync } = require("fs")
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
            const keybinding = el("enableKeybinding").checked
            el("keybindingTable").class("disabled", !keybinding)
            el("keybindingTable").element.querySelectorAll("input").forEach(el => el.disabled = !keybinding)
        }

        el("rpc").checked = config.get("client.rpc")
        el("hint").checked = config.get("client.hint")
        el("fpsUncap").checked = config.get("client.fpsUncap")
        el("adblocker").checked = config.get("client.adblocker")
        el("fullscreen").checked = config.get("client.fullscreen")
        el("enableSwapper").checked = config.get("client.swapper")
        el("enableCrosshair").checked = config.get("crosshair.enable")
        el("customStyles").checked = config.get("interface.clientStyles")
        el("enableKeybinding").checked = config.get("keybinding.enable")
        el("console").checked = config.get("interface.console")
        el("inventorySorting").checked = config.get("interface.inventorySorting")

        el("crosshairURL").value = config.get("crosshair.url") ?? ""
        el("chatOpacity").value = config.get("interface.chatOpacity") ?? "100"

        const { content: c2 } = config.get("keybinding")
        for (const key in c2) keybindingRow(key, c2[key])

        toggleKeybinding()

        ipcRenderer.on("update-url", (_, url) => el("currentURL").element.innerText = url || "Unknown URL")
        ipcRenderer.send("update-url")

        el("fpsUncap").event("change", e => config.set("client.fpsUncap", e.target.checked))
        el("adblocker").event("change", e => config.set("client.adblocker", e.target.checked))
        el("inventorySorting").event("change", e => config.set("interface.inventorySorting", e.target.checked))
        el("rpc").event("change", e => config.set("client.rpc", e.target.checked))
        el("hint").event("change", e => {
            config.set("client.hint", e.target.checked)
            ipcRenderer.send("toggle-hint", e.target.checked)
        })

        el("enableCrosshair").event("change", e => {
            config.set("crosshair.enable", e.target.checked)
            ipcRenderer.send("change-crosshair", el("enableCrosshair").checked, el("crosshairURL").value)
        })
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

        el("customStyles").event("click", e => {
            config.set("interface.clientStyles", e.target.checked)
            ipcRenderer.send("change-styles", e.target.checked)
        })

        el("console").event("change", e => {
            config.set("interface.console", e.target.checked)
            ipcRenderer.send("set-console", e.target.checked)
        })
        el("fullscreen").event("change", e => config.set("client.fullscreen", e.target.checked))
        el("enableSwapper").event("change", e => config.set("client.swapper", e.target.checked))

        el("enableKeybinding").event("change", e => {
            config.set("keybinding.enable", e.target.checked)
            toggleKeybinding()
        })

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

        for (const e of ["fpsUncap", "rpc", "adblocker", "inventorySorting", "fullscreen", "enableSwapper", "enableKeybinding"])
            el(e).event("click", () => popup("rgb(231, 76, 60)", "Restart the client to apply this setting."))
    }
}

module.exports = SettingsModal