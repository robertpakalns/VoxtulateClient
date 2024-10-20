const { shell } = require("electron")
const { Config, defaultConfig } = require("../../config.js")
const config = new Config
const { createEl } = require("../../functions.js")
const { version } = require("../../../package.json")

const { content: userKeybinding } = config.get("keybinding")
const { content: defaultKeybinding } = defaultConfig.keybinding
const keybindingBody = document.querySelector("#keybindingBody")

const keybindingRow = (name, defaultKey, userKey) => {
    const _name = createEl("td", { textContent: name })
    const _default = createEl("td", { textContent: defaultKey })
    const _user = createEl("td", { textContent: userKey })
    const tr = createEl("tr", {}, "", [_name, _default, _user])

    keybindingBody.appendChild(tr)
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#version").textContent = version

    document.querySelectorAll(".url").forEach(el => el.addEventListener("click", e => {
        e.preventDefault()
        shell.openPath(el.href)
    }))

    for (const key in userKeybinding) keybindingRow(key, defaultKeybinding[key], userKeybinding[key])
    if (!config.get("keybinding.enable")) document.querySelectorAll("#keybindingBody tr td:nth-child(3)").forEach(el => el.style.opacity = "0.2")
    else document.querySelectorAll("#keybindingBody tr td:nth-child(2)").forEach(el => el.style.opacity = "0.2")

    document.querySelectorAll(".copy").forEach(el => el.addEventListener("click", e => navigator.clipboard.writeText(e.target.innerText)))
})