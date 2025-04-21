const { version } = require("../../../package.json")
const { createEl, el, popup } = require("../../functions.js")
const { ipcRenderer, shell } = require("electron")
const Modal = require("../modal.js")
const { readFileSync } = require("fs")
const path = require("path")

const { Config, defaultConfig, configDir } = require("../../config.js")
const config = new Config

class MenuModal extends Modal {
    constructor() {
        super()
        this.modalHTML = readFileSync(path.join(__dirname, "./index.html"), "utf8")
    }

    init() {
        super.init()
        this.modal.id = "menuModal"
    }

    work() {
        el("version").element.textContent = `v${version}`
        el("voxtulateIcon").element.src = path.join(__dirname, "../../../assets/icon.png")

        document.querySelector(".mainContent > div[name='settingsButton']").classList.add("active") // Open by default

        document.querySelectorAll(".sideBarItem").forEach(item => {
            item.addEventListener("click", e => {
                document.querySelectorAll(".mainContent > div").forEach(el => el.classList.remove("active"))
                const targetDiv = document.querySelector(`.mainContent div[name="${e.target.id}"]`)
                if (targetDiv) targetDiv.classList.add("active")
            })
        })

        document.querySelectorAll(".url").forEach(el => el.addEventListener("click", e => {
            e.preventDefault()
            shell.openPath(el.href)
        }))
        document.querySelectorAll(".copy").forEach(el => el.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.innerText)
            popup("rgb(206, 185, 45)", "Copied!")
        }))

        // Update client
        const _version = el("version").element
        ipcRenderer.on("client-update", (_, data) => {
            if (data === null) popup("rgb(45, 206, 72)", "Update available!")
            else if (data === true) {
                const _updateButton = createEl("button", { textContent: "Update!" })
                _updateButton.addEventListener("click", () => {
                    ipcRenderer.send("client-update", "update")
                    _version.innerText = "Updating..."
                })
                _version.innerText = ""
                _version.appendChild(_updateButton)
            }
            else _version.innerText = `Downloading... ${Math.round(data.percent)}%`
        })

        // Render pages
        this.renderInfoPage()
    }

    renderInfoPage() {
        const { content: userKeybinding } = config.get("keybinding")
        const { content: defaultKeybinding } = defaultConfig.keybinding

        for (const key in userKeybinding) {
            const _name = createEl("td", { textContent: key })
            const _default = createEl("td", { textContent: defaultKeybinding[key] })
            const _user = createEl("td", { textContent: userKeybinding[key] })
            const _tr = createEl("tr", {}, "", [_name, _default, _user])

            document.querySelector("#keyBody").appendChild(_tr)
        }

        document.querySelectorAll(`#keyBody tr td:nth-child(${config.get("keybinding.enable") ? 2 : 3})`).forEach(el => el.style.opacity = "0.2")

        const dirObj = {
            "Client User Data": "/",
            "Config File": "/config.json",
            "Swapper Folder": "/swapper",
            "Scripts Folder": "/scripts",
            "Styles Folder": "/styles",
            "Userscripts Config": "/userscripts.json"
        }

        for (const el in dirObj) {
            const _name = createEl("td", { textContent: el })
            const _button = createEl("button", {}, "", "Open")
            _button.addEventListener("click", () => shell.openPath(path.join(configDir, dirObj[el])))
            const _buttonTd = createEl("td", {}, "", [_button])
            const _tr = createEl("tr", {}, "", [_name, _buttonTd])

            document.querySelector("#dirBody").appendChild(_tr)
        }
    }
}

module.exports = MenuModal