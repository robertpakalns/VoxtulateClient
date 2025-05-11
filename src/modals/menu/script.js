const { createEl, el, popup, loadAsset } = require("../../utils/functions.js")
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
        el("version").element.textContent = `v${version}`
        el("voxtulateIcon").element.src = loadAsset("icon.png")

        document.querySelector(".mainContent > div[name='settingsButton']").classList.add("active") // Open by default

        for (const item of document.querySelectorAll(".sideBarItem")) item.addEventListener("click", e => {
            const activeDiv = document.querySelector(".mainContentBlock.active")
            if (activeDiv) activeDiv.classList.remove("active")

            const targetDiv = document.querySelector(`.mainContent div[name="${e.target.id}"]`)
            if (!targetDiv) return

            targetDiv.classList.add("active")

            if (targetDiv.getAttribute("name") === "changelogButton") createChangelogSection()
        })

        for (const el of document.querySelectorAll(".url")) el.addEventListener("click", e => {
            e.preventDefault()
            shell.openPath(el.href)
        })

        for (const el of document.querySelectorAll(".copy")) el.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.innerText)
            popup("rgb(206, 185, 45)", "Copied!")
        })

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

        createSettingsSection()
        createCustomizationSection()
        createInfoSection()
    }
}

module.exports = MenuModal