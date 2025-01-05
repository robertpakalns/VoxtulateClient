const { createEl, sessionFetch } = require("../../functions.js")
const Modal = require("../modal.js")
const path = require("path")
const { readFileSync } = require("fs")

class UpdatesModal extends Modal {
    constructor() {
        super()
        this.modalHTML = readFileSync(path.join(__dirname, "./index.html"), "utf8")
        this.updatesData = null
    }

    init() {
        super.init()
        this.modal.id = "updatesModal"
    }

    async work() {
        this.updatesData = await sessionFetch("https://tricko.pro/assets/tricko/voxtulateUpdates.json")
        
        for (const update of this.updatesData) {
            const title = createEl("h3", {}, "updatesTitle", [`${update.version} - ${update.date}`])
            const description = createEl("ul")

            for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

            const cont = createEl("div", {}, "updatesCont", [title, description])
            document.querySelector(".updates").append(cont)
        }
    }
}


module.exports = UpdatesModal