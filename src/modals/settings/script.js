const { ipcRenderer, shell } = require("electron")
const { Config, configPath } = require("../../config.js")
const config = new Config()

const el = id => ({
    get element() { return document.getElementById(id) },
    get checked() { return this.element.checked },
    set checked(value) { this.element.checked = value },
    get value() { return this.element.value },
    set value(val) { this.element.value = val },
    event(type, callback) { this.element.addEventListener(type, callback) },
    class(name, toggle) { this.element.classList.toggle(name, toggle) }
})

const toggleElements = () => {
    const styles = el("enableStyles").checked
    const custom = el("customStyles").checked
    const swapper = el("enableSwapper").checked
    const keybinding = el("enableKeybinding").checked

    el("swapperTable").class("disabled", !swapper)
    el("keybindingTable").class("disabled", !keybinding)

    el("customStyles").element.disabled = !styles
    el("customCSS").element.disabled = !(styles && custom)
    el("customJS").element.disabled = !(styles && custom)
    el("swapperTable").element.querySelectorAll("input").forEach(el => el.disabled = !swapper)
    el("keybindingTable").element.querySelectorAll("input").forEach(el => el.disabled = !keybinding)
}

document.addEventListener("DOMContentLoaded", () => {
    el("fpsUncap").checked = config.get("client.fpsUncap")
    el("adblocker").checked = config.get("client.adblocker")
    el("enableCrosshair").checked = config.get("crosshair.enable")
    el("enableStyles").checked = config.get("styles.enable")
    el("customStyles").checked = config.get("styles.custom")
    el("console").checked = config.get("console")
    el("fullscreen").checked = config.get("fullscreen")
    el("enableSwapper").checked = config.get("swapper.enable")
    el("enableKeybinding").checked = config.get("keybinding.enable")

    el("crosshairURL").value = config.get("crosshair.url") ?? ""
    el("customCSS").value = config.get("styles.css") ?? ""
    el("customJS").value = config.get("styles.js") ?? ""
    el("chatOpacity").value = config.get("chatOpacity") ?? "100"

    const { content: c1 } = config.get("swapper")
    for (const swap in c1) swapperRow(swap, c1[swap])

    const { content: c2 } = config.get("keybinding")
    for (const key in c2) keybindingRow(key, c2[key])

    toggleElements()

    ipcRenderer.on("update-url", (_, url) => el("currentURL").element.innerText = url || "Unknown URL")
    ipcRenderer.send("update-url-request")
})

el("fpsUncap").event("change", e => config.set("client.fpsUncap", e.target.checked))
el("adblocker").event("change", e => config.set("client.adblocker", e.target.checked))

el("enableCrosshair").event("change", e => config.set("crosshair.enable", e.target.checked))
el("crosshairURL").event("input", e => config.set("crosshair.url", e.target.value))

el("joinLink").event("click", () => ipcRenderer.send("join-game", el("joinLinkURL").value))
el("copyURL").event("click", () => navigator.clipboard.writeText(el("currentURL").element.innerText))

el("importClientSettings").event("click", () => ipcRenderer.send("import-client-settings"))
el("exportClientSettings").event("click", () => ipcRenderer.send("export-client-settings"))
el("importGameSettings").event("click", () => ipcRenderer.send("import-game-settings"))
el("exportGameSettings").event("click", () => ipcRenderer.send("export-game-settings"))

el("enableStyles").event("click", e => {
    config.set("styles.enable", e.target.checked)
    toggleElements()
})
el("customStyles").event("click", e => {
    config.set("styles.custom", e.target.checked)
    toggleElements()
})

el("console").event("change", e => config.set("console", e.target.checked))
el("fullscreen").event("change", e => config.set("fullscreen", e.target.checked))
el("enableSwapper").event("change", e => {
    config.set("swapper.enable", e.target.checked)
    toggleElements()
})

el("enableKeybinding").event("change", e => {
    config.set("keybinding.enable", e.target.checked)
    toggleElements()
})

el("chatOpacity").event("input", e => config.set("chatOpacity", e.target.value))

el("customCSS").event("input", e => config.set("styles.css", e.target.value))
el("customJS").event("input", e => config.set("styles.js", e.target.value))

el("defaultSettings").event("click", () => {
    config.default()
    ipcRenderer.send("reload")
})
el("openConfigs").event("click", () => shell.openPath(configPath))
el("restart").event("click", () => ipcRenderer.send("relaunch"))

const tableBody = document.querySelector("#swapperBody")
const keybindingBody = document.querySelector("#keybindingBody")

const createEl = (tag, attrs = {}, className = "", append = []) => {
    const elem = document.createElement(tag)
    if (className) elem.classList.add(className)
    Object.keys(attrs).forEach(attr => elem[attr] = attrs[attr])
    elem.append(...append)
    return elem
}

const swapperRow = (name, value) => {
    const _inputChild = createEl("input", { type: "url", value }, "swapperInput")
    _inputChild.addEventListener("input", e => config.set(`swapper.content.${name}`, e.target.value))

    const _fileChild = createEl("input", { type: "file", id: `file-upload-${name}` }, "swapperInput")
    const _fileLabel = createEl("label", { textContent: "File", htmlFor: _fileChild.id }, "file-upload-label")

    _fileChild.addEventListener("change", ({ target: { files: [file] } }) => {
        if (file) {
            const { path } = file
            config.set(`swapper.content.${name}`, path)
            _inputChild.value = path
        }
    })

    const _name = createEl("td", { textContent: name })
    const _input = createEl("td", {}, "", [_inputChild])
    const _file = createEl("td", {}, "", [_fileChild, _fileLabel])

    const tr = createEl("tr", {}, "", [_name, _input, _file])
    tableBody.appendChild(tr)
}

const keybindingRow = (name, key) => {
    const _inputChild = createEl("input", { type: "text", value: key }, "keybindingInput")
    _inputChild.addEventListener("keydown", e => {
        e.preventDefault()
        _inputChild.value = e.code
        config.set(`keybinding.content.${name}`, e.code)
    })

    const _name = createEl("td", { textContent: name })
    const _input = createEl("td", {}, "", [_inputChild])
    const tr = createEl("tr", {}, "", [_name, _input])

    keybindingBody.appendChild(tr)
}