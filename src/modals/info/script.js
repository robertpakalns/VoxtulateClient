const { Config, defaultConfig } = require("../../config.js")
const { createEl, popup } = require("../../functions.js")
const { version } = require("../../../package.json")
const { readFileSync } = require("fs")
const { shell } = require("electron")
const Modal = require("../modal.js")
const path = require("path")
const config = new Config

class InfoModal extends Modal {
    constructor() {
        super()
        this.modalHTML = readFileSync(path.join(__dirname, "./index.html"), "utf8")
        this.modalCSS += `#infoModal { display: none }`
    }

    init() {
        super.init()
        this.modal.id = "infoModal"
    }

    work() {
        const { content: userKeybinding } = config.get("keybinding")
        const { content: defaultKeybinding } = defaultConfig.keybinding
        const keybindingBody = document.querySelector("#keyBody")

        const keybindingRow = (name, defaultKey, userKey) => {
            const _name = createEl("td", { textContent: name })
            const _default = createEl("td", { textContent: defaultKey })
            const _user = createEl("td", { textContent: userKey })
            const tr = createEl("tr", {}, "", [_name, _default, _user])

            keybindingBody.appendChild(tr)
        }

        document.querySelector("#version").textContent = version

        document.querySelectorAll(".url").forEach(el => el.addEventListener("click", e => {
            e.preventDefault()
            shell.openPath(el.href)
        }))

        for (const key in userKeybinding) keybindingRow(key, defaultKeybinding[key], userKeybinding[key])

        document.querySelectorAll(`#keyBody tr td:nth-child(${config.get("keybinding.enable") ? 2 : 3})`).forEach(el => el.style.opacity = "0.2")

        document.querySelectorAll(".copy").forEach(el => el.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.innerText)
            popup("rgb(206, 185, 45)", "Copied!")
        }))
    }
}

module.exports = InfoModal