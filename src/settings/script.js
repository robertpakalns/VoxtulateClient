const { ipcRenderer } = require("electron")
const { Config } = require("../config.js")

const config = new Config()
const el = id => ({
    element: document.getElementById(id),
    event(type, callback) {
        this.element.addEventListener(type, callback)
    }
})

const toggleElements = () => {
    const enableStylesChecked = el("enableStyles").element.checked
    const customStylesChecked = el("customStyles").element.checked

    el("customStyles").element.disabled = !enableStylesChecked

    if (!enableStylesChecked) {
        el("customCSS").element.disabled = true
        el("customJS").element.disabled = true
    }
    else {
        el("customCSS").element.disabled = !customStylesChecked
        el("customJS").element.disabled = !customStylesChecked
        if (!customStylesChecked) {
            el("customCSS").element.disabled = true
            el("customJS").element.disabled = true
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    el("fpsUncap").element.checked = config.get("client.fpsUncap")
    el("adblocker").element.checked = config.get("client.adblocker")
    el("enableCrosshair").element.checked = config.get("crosshair.enable")
    el("enableStyles").element.checked = config.get("styles.enable")
    el("customStyles").element.checked = config.get("styles.custom")
    el("console").element.checked = config.get("console")

    el("crosshairURL").element.value = config.get("crosshair.url") ?? ""
    el("customCSS").element.value = config.get("styles.css") ?? ""
    el("customJS").element.value = config.get("styles.js") ?? ""

    toggleElements()

    ipcRenderer.on("update-url", (_, url) => el("currentURL").element.innerText = url || "Unknown URL")
    ipcRenderer.send("update-url-request")
})

el("fpsUncap").event("change", e => config.set("client.fpsUncap", e.target.checked))
el("adblocker").event("change", e => config.set("client.adblocker", e.target.checked))

el("enableCrosshair").event("change", e => config.set("crosshair.enable", e.target.checked))
el("crosshairURL").event("input", e => config.set("crosshair.url", e.target.value))

el("joinLink").event("click", () => ipcRenderer.send("join-game", el("joinLinkURL").element.value))
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

el("customCSS").event("input", e => config.set("styles.css", e.target.value))
el("customJS").event("input", e => config.set("styles.js", e.target.value))

el("clearSettings").event("click", () => {
    config.clear()
    el("fpsUncap").element.checked = true
    el("adblocker").element.checked = true
    el("console").element.checked = true
    el("enableStyles").element.checked = true

    el("enableCrosshair").element.checked = false
    el("customStyles").element.checked = false

    el("crosshairURL").element.value = ""
    el("joinLinkURL").element.value = ""
    el("customCSS").element.value = ""
    el("customJS").element.value = ""
})
el("restart").event("click", () => ipcRenderer.send("relaunch"))