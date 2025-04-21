const { createEl, el, popup, sessionFetch, getAsset } = require("../../functions.js")
const { userScriptsPath } = require("../../../src/utils/userScripts.js")
const { readFileSync, writeFileSync } = require("fs")
const { version } = require("../../../package.json")
const { ipcRenderer, shell } = require("electron")
const Modal = require("../modal.js")
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
        this.changelogData = null
    }

    work() {
        el("version").element.textContent = `v${version}`
        el("voxtulateIcon").element.src = path.join(__dirname, "../../../assets/icon.png")

        document.querySelector(".mainContent > div[name='settingsButton']").classList.add("active") // Open by default

        document.querySelectorAll(".sideBarItem").forEach(item => {
            item.addEventListener("click", e => {
                document.querySelectorAll(".mainContent > div").forEach(el => el.classList.remove("active"))
                const targetDiv = document.querySelector(`.mainContent div[name="${e.target.id}"]`)
                if (targetDiv) {
                    targetDiv.classList.add("active")
                    if (!this.changelogData) this.renderChangelogPage()
                }
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

        this.renderUserscriptsPage()
        this.renderInfoPage()
    }

    renderUserscriptsPage() {
        const restartMessage = () => popup("rgb(231, 76, 60)", "Restart the client to apply this setting.")

        const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"))
        const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig

        const userScriptsRow = (obj, key, id) => {
            const _checkbox = createEl("input", { type: "checkbox", checked: obj[key] })
            _checkbox.addEventListener("change", e => {
                restartMessage()
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
            restartMessage()
            userScriptsConfig.enable = e.target.checked
            writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
        })

        const toggleUserScripts = () => {
            const checked = el("userScriptsEnabled").checked
            el("userScriptsBlock").class("disabled", !checked)
            el("userScripts").element.querySelectorAll("input").forEach(el => el.disabled = !checked)
            el("userStyles").element.querySelectorAll("input").forEach(el => el.disabled = !checked)
        }

        toggleUserScripts()

        const dirObj = {
            "Scripts Folder": "scripts",
            "Styles Folder": "styles",
            "Userscripts Config": "userscripts.json"
        }

        for (const el in dirObj) {
            const _name = createEl("td", { textContent: el })
            const _button = createEl("button", {}, "", "Open")
            _button.addEventListener("click", () => shell.openPath(path.join(configDir, dirObj[el])))
            const _buttonTd = createEl("td", {}, "", [_button])
            const _tr = createEl("tr", {}, "", [_name, _buttonTd])

            document.querySelector("#userscriptsDirBody").appendChild(_tr)
        }
    }

    async renderChangelogPage() {

        // Load data
        const _spin = createEl("div", {}, "spin")
        const _loading = createEl("div", {}, "loader", [_spin])

        el("clientUpdatesText").element.appendChild(_loading)

        this.changelogData = await sessionFetch(getAsset("tricko/voxtulateUpdates.json"))
        el("clientUpdatesText").element.removeChild(_loading)

        // Render page
        for (const update of this.changelogData) {
            const title = createEl("h3", {}, "updatesTitle", [`${update.version} - ${update.date}`])
            const description = createEl("ul")

            for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

            const cont = createEl("div", {}, "updatesCont", [title, description])
            el("clientUpdatesText").element.append(cont)

            const _nav = createEl("button", {}, "", [update.version])
            _nav.addEventListener("click", () => cont.scrollIntoView({ behavior: "smooth" }))

            el("clientUpdatesNavigator").element.append(_nav)
        }
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
            "Config File": "config.json",
            "Swapper Folder": "swapper",
            "Scripts Folder": "scripts",
            "Styles Folder": "styles",
            "Userscripts Config": "userscripts.json"
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