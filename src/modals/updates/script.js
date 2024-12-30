const { createEl } = require("../../functions.js")
const Modal = require("../modal.js")
const path = require("path")
const { readFileSync } = require("fs")

const updates = JSON.parse(readFileSync(path.join(__dirname, "../../../assets/jsons/voxtulateUpdates.json"), "utf8"))

class UpdatesModal extends Modal {
    constructor() {
        super()
        this.modalHTML = readFileSync(path.join(__dirname, "./index.html"), "utf8")
        this.modalCSS += `
        #updatesModal { display: none }
        #updatesModal * { font-family: "Roboto", sans-serif }
        .updatesTitle { margin: 10px; font-weight: 900 }
        .updatesCont { margin: 10px; padding: 10px }`
    }

    init() {
        super.init()
        this.modal.id = "updatesModal"
    }

    work() {
        for (const update of updates) {
            const title = createEl("div", {}, "updatesTitle", [`${update.version} - ${update.date}`])
            const description = createEl("ul")

            for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

            const cont = createEl("div", {}, "updatesCont", [title, description])
            document.querySelector(".updates").append(cont)
        }
    }
}


module.exports = UpdatesModal