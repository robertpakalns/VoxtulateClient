const { createEl, popup, loadAsset } = require("../../utils/functions.js")
const { version } = require("../../../package.json")
const { ipcRenderer, shell } = require("electron")
const Modal = require("../modal.js")

const createCustomizationSection = require("./customizationSection.js")
const createChangelogSection = require("./changelogSection.js")
const createSettingsSection = require("./settingsSection.js")
const createInfoSection = require("./infoSection.js")

class MenuModal extends Modal {
    constructor() {
        super()
        this.modalHTMLPath = "./menu/index.html"
    }

    init() {
        super.init()
        this.modal.id = "menuModal"
    }

    work() {
        const _version = this.modal.querySelector("#version")
        _version.textContent = `v${version}`

        this.modal.querySelector("#voxtulateIcon").src = loadAsset("icon.png")
        this.modal.querySelector("#menuMainContent > div[name='settingsSection']").classList.add("active") // Open by default

        for (const item of this.modal.querySelectorAll(".sideBarItem")) item.addEventListener("click", e => {
            const activeDiv = this.modal.querySelector(".mainContentBlock.active")
            if (activeDiv) activeDiv.classList.remove("active")

            const targetDiv = this.modal.querySelector(`#menuMainContent > div[name="${e.target.id}"]`)
            if (!targetDiv) return

            targetDiv.classList.add("active")

            if (targetDiv.getAttribute("name") === "changelogSection") createChangelogSection()
        })

        for (const el of this.modal.querySelectorAll(".url")) el.addEventListener("click", e => {
            e.preventDefault()
            shell.openPath(el.href)
        })

        for (const el of this.modal.querySelectorAll(".copy")) el.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.innerText)
            popup("rgb(206, 185, 45)", "Copied!")
        })

        // Update client
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

        createSettingsSection()
        createCustomizationSection()
        createInfoSection()
    }
}

module.exports = MenuModal