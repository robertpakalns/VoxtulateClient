const { createEl, el, popup, sessionFetch, getAsset } = require("../../functions.js")
const { userScriptsPath } = require("../../../src/utils/userScripts.js")
const { readFileSync, writeFileSync } = require("fs")
const { version } = require("../../../package.json")
const { ipcRenderer, shell } = require("electron")
const Modal = require("../modal.js")
const path = require("path")

const { Config, configDir } = require("../../config.js")
const config = new Config

class MenuModal extends Modal {
    constructor() {
        super()
        this.modalHTMLPath = "./menu/index.html"
    }

    init() {
        super.init()
        this.modal.id = "menuModal"
        this.changelogData = null
    }

    restartMessage() {
        popup("rgb(231, 76, 60)", "Restart the client to apply this setting.")
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

        this.renderSettingsPage()
        this.renderCustomizationPage()
        this.renderInfoPage()
    }

    renderSettingsPage() {
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
        }

        for (const [id, key] of Object.entries(checkedObject)) {
            el(id).checked = config.get(key)
            el(id).event("change", e => config.set(key, e.target.checked))
        }



        ipcRenderer.on("update-url", (_, url) => el("currentURL").element.innerText = url || "Unknown URL")
        ipcRenderer.send("update-url")
        el("joinLink").event("click", () => ipcRenderer.send("join-game", el("joinLinkURL").value))


        el("hint").event("change", e => ipcRenderer.send("toggle-hint", e.target.checked))
        el("console").event("change", e => ipcRenderer.send("set-console", e.target.checked))
        el("chatOpacity").value = config.get("interface.chatOpacity") ?? "100"
        el("chatOpacity").event("input", e => {
            config.set("interface.chatOpacity", e.target.value)
            ipcRenderer.send("change-opacity", e.target.value)
        })
        el("customStyles").event("click", e => ipcRenderer.send("change-styles", e.target.checked))

        el("defaultSettings").event("click", () => ipcRenderer.send("clear-settings"))
        el("clearData").event("click", () => ipcRenderer.send("clear-data"))
        el("restart").event("click", () => ipcRenderer.send("relaunch"))

        for (const e of ["fpsUncap", "proxyDomain", "rpc", "rpcNotification", "adblocker", "inventorySorting", "fullscreen"])
            el(e).event("click", this.restartMessage)
    }

    renderCustomizationPage() {
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
            el("userScripts").element.querySelectorAll("input").forEach(el => el.disabled = !checked)
            el("userStyles").element.querySelectorAll("input").forEach(el => el.disabled = !checked)
        }

        toggleUserScripts()

        // Import/export data
        el("importClientSettings").event("click", () => ipcRenderer.send("import-client-settings"))
        el("exportClientSettings").event("click", () => ipcRenderer.send("export-client-settings"))
        el("importGameSettings").event("click", () => ipcRenderer.send("import-game-settings"))
        el("exportGameSettings").event("click", () => ipcRenderer.send("export-game-settings"))

        // Custom crosshair
        const fileIconURL = path.join(__dirname, "../../../assets/icons/file.svg")
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
            el("keybindingTable").element.querySelectorAll("input").forEach(el => el.disabled = !checked)
        }

        const { content: c2 } = config.get("keybinding")
        for (const key in c2) keybindingRow(key, c2[key])

        toggleKeybinding()
        el("enableKeybinding").checked = config.get("keybinding.enable")
        el("enableKeybinding").event("change", e => {
            this.restartMessage()
            toggleKeybinding()
            config.set("crosshair.url", e.target.value)
        })

        // Swapper
        document.querySelector(`input[value="${config.get("client.swapper") || "disabled"}"]`).checked = true
        const swapperRadios = document.querySelectorAll("input[name='swapper']")
        swapperRadios.forEach(el => el.addEventListener("change", (e => {
            this.restartMessage()
            if (e.target.checked) config.set("client.swapper", e.target.value)
        })))
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