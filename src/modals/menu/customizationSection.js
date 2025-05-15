const { createEl, loadAsset, restartMessage } = require("../../utils/functions.js")
const { userScriptsPath } = require("../../../src/utils/userScripts.js")
const { readFileSync, writeFileSync } = require("fs")
const { Config } = require("../../utils/config.js")
const { ipcRenderer } = require("electron")
const config = new Config

const createCustomizationSection = () => {
    const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"))
    const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig

    const cont = document.getElementById("customization")

    // Userscripts
    const userScriptsInit = (obj, id) => {
        const _block = cont.querySelector(`#${id}`)

        if (Object.keys(obj).length === 0) {
            _block.innerText = "..."
            return
        }

        for (const key in obj) {
            const _checkbox = createEl("input", { type: "checkbox", checked: obj[key] })
            _checkbox.addEventListener("change", e => {
                obj[key] = e.target.checked
                writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
            })

            const _text = createEl("span", {}, "", [key])
            const _cont = createEl("div", {}, "content", [_checkbox, _text])
            _block.appendChild(_cont)
        }
    }

    userScriptsInit(scripts, "userScripts")
    userScriptsInit(styles, "userStyles")

    const _userScriptsEnabled = cont.querySelector("#userScriptsEnabled")
    _userScriptsEnabled.checked = userScriptsEnabled
    _userScriptsEnabled.addEventListener("change", e => {
        toggleUserScripts()
        userScriptsConfig.enable = e.target.checked
        writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
    })

    const toggleUserScripts = () => {
        const checked = _userScriptsEnabled.checked
        cont.querySelector("#userScriptsBlock").classList.toggle("disabled", !checked)
        for (const item of cont.querySelector("#userScripts").querySelectorAll("input")) item.disabled = !checked
        for (const item of cont.querySelector("#userStyles").querySelectorAll("input")) item.disabled = !checked
    }

    toggleUserScripts()

    // Import/export data
    const settingsObject = {
        importClientSettings: "import-client-settings",
        exportClientSettings: "export-client-settings",
        importGameSettings: "import-game-settings",
        exportGameSettings: "export-game-settings",
    }
    for (const [id, event] of Object.entries(settingsObject))
        cont.querySelector(`#${id}`).addEventListener("click", () => ipcRenderer.send(event))

    // Custom crosshair
    const _enableCrosshair = cont.querySelector("#enableCrosshair")
    const _crosshairURL = cont.querySelector("#crosshairURL")
    const fileIconURL = loadAsset("icons/file.svg")
    cont.querySelector("#file-icon").src = fileIconURL
    _enableCrosshair.checked = config.get("crosshair.enable")
    _enableCrosshair.addEventListener("change", e => {
        toggleCrosshair()
        config.set("crosshair.enable", e.target.checked)
        ipcRenderer.send("change-crosshair", e.target.checked, _crosshairURL.value)
    })

    _crosshairURL.value = config.get("crosshair.url") ?? ""
    _crosshairURL.addEventListener("input", e => {
        config.set("crosshair.url", e.target.value)
        ipcRenderer.send("change-crosshair", _enableCrosshair.checked, e.target.value)
    })

    const _crosshairFile = cont.querySelector("#crosshairFile")
    _crosshairFile.addEventListener("change", ({ target: { files: [file] } }) => {
        if (!file) return
        const { path } = file
        config.set("crosshair.url", path)
        _crosshairURL.value = path
        ipcRenderer.send("change-crosshair", _enableCrosshair.checked, _crosshairURL.value)
    })

    const toggleCrosshair = () => {
        const checked = _enableCrosshair.checked
        _crosshairURL.disabled = !checked
        _crosshairFile.disabled = !checked
        cont.querySelector("#crosshairContent").classList.toggle("disabled", !checked)
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

        cont.querySelector("#keybindingBody").appendChild(tr)
    }

    const { content: c2 } = config.get("keybinding")
    for (const key in c2) keybindingRow(key, c2[key])

    const _enableKeybinding = cont.querySelector("#enableKeybinding")
    const _keybindingTable = cont.querySelector("#keybindingTable")

    const toggleKeybinding = () => {
        const checked = _enableKeybinding.checked
        _keybindingTable.classList.toggle("disabled", !checked)
        for (const item of _keybindingTable.querySelectorAll("input")) item.disabled = !checked
    }

    toggleKeybinding()
    _enableKeybinding.checked = config.get("keybinding.enable")
    _enableKeybinding.addEventListener("change", () => {
        restartMessage()
        toggleKeybinding()
    })

    // Swapper
    const swapperEl = cont.querySelector(`input[name="swapper"][value="${config.get("client.swapper")}"]`)
    if (swapperEl) swapperEl.checked = true
    else {
        cont.querySelector('input[name="swapper"][value="disabled"]').checked = true
        config.set("client.swapper", "disabled")
    }
    for (const el of cont.querySelectorAll("input[name='swapper']")) el.addEventListener("change", e => {
        restartMessage()
        if (e.target.checked) config.set("client.swapper", e.target.value)
    })
}

module.exports = createCustomizationSection