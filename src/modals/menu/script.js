const Modal = require("../modal.js")
const path = require("path")
const { readFileSync } = require("fs")
const { el } = require("../../functions.js")
const { version } = require("../../../package.json")

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
        el("version").element.textContent = version
        el("voxtulateIcon").element.src = path.join(__dirname, "../../../assets/icon.png")
    }
}

module.exports = MenuModal