const { createEl, el, loadAsset, restartMessage } = require("../../utils/functions.js")
const { userScriptsPath } = require("../../../src/utils/userScripts.js")
const { readFileSync, writeFileSync } = require("fs")
const { Config } = require("../../utils/config.js")
const { ipcRenderer } = require("electron")
const config = new Config

const createCustomizationSection = () => {
    const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"))
    const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig

    const userScriptsRow = (obj, key, id) => {
        const _checkbox = createEl("input", { type: "checkbox", checked: obj[key] })
        _checkbox.addEventListener("change", e => {
            obj[key] = e.target.checked
            writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
        })

        const _text = createEl("span", {}, "", [key])
        const _cont = createEl("div", {}, "content", [_checkbox, _text])

        el(id).element.appendChild(_cont)
    }

    for (const key in scripts) userScriptsRow(scripts, key, "userScripts")
    for (const key in styles) userScriptsRow(styles, key, "userStyles")

    el("userScriptsEnabled").checked = userScriptsEnabled
    el("userScriptsEnabled").event("change", e => {
        toggleUserScripts()
        userScriptsConfig.enable = e.target.checked
        writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
    })

    const toggleUserScripts = () => {
        const checked = el("userScriptsEnabled").checked
        el("userScriptsBlock").class("disabled", !checked)
        for (const item of el("userScripts").element.querySelectorAll("input")) item.disabled = !checked
        for (const item of el("userStyles").element.querySelectorAll("input")) item.disabled = !checked
    }

    toggleUserScripts()

    // Import/export data
    el("importClientSettings").event("click", () => ipcRenderer.send("import-client-settings"))
    el("exportClientSettings").event("click", () => ipcRenderer.send("export-client-settings"))
    el("importGameSettings").event("click", () => ipcRenderer.send("import-game-settings"))
    el("exportGameSettings").event("click", () => ipcRenderer.send("export-game-settings"))

    // Custom crosshair
    const fileIconURL = loadAsset("icons/file.svg")
    document.querySelector(".file-icon").src = fileIconURL
    el("enableCrosshair").checked = config.get("crosshair.enable")
    el("enableCrosshair").event("change", e => {
        toggleCrosshair()
        config.set("crosshair.enable", e.target.checked)
        ipcRenderer.send("change-crosshair", e.target.checked, el("crosshairURL").value)
    })

    el("crosshairURL").value = config.get("crosshair.url") ?? ""
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

    const toggleCrosshair = () => {
        const checked = el("enableCrosshair").checked
        el("crosshairURL").element.disabled = !checked
        el("crosshairFile").element.disabled = !checked
        el("crosshairContent").class("disabled", !checked)
    }

    toggleCrosshair()

    // Keybinding
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
        for (const item of el("keybindingTable").element.querySelectorAll("input")) item.disabled = !checked
    }

    const { content: c2 } = config.get("keybinding")
    for (const key in c2) keybindingRow(key, c2[key])

    toggleKeybinding()
    el("enableKeybinding").checked = config.get("keybinding.enable")
    el("enableKeybinding").event("change", e => {
        restartMessage()
        toggleKeybinding()
        config.set("crosshair.url", e.target.value)
    })

    // Swapper
    const swapperEl = document.querySelector(`input[value="${config.get("client.swapper")}"]`)
    if (swapperEl) swapperEl.checked = true
    else {
        document.querySelector('input[name="swapper"][value="disabled"]').checked = true
        config.set("client.swapper", "disabled")
    }
    const swapperRadios = document.querySelectorAll("input[name='swapper']")
    for (const el of swapperRadios) el.addEventListener("change", e => {
        restartMessage()
        if (e.target.checked) config.set("client.swapper", e.target.value)
    })
}

module.exports = createCustomizationSection