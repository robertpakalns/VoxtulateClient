const { createEl } = require("../functions.js")
const { readFileSync } = require("fs")
const path = require("path")

class Modal {

    constructor() {
        this.modal = null
        this.modalHTMLPath = null
    }

    init() {
        const modalHTML = readFileSync(path.join(__dirname, this.modalHTMLPath), "utf8")
        this.modal = createEl("div", { innerHTML: modalHTML }, "wrapper")
        document.body.appendChild(this.modal)

        const close = createEl("div", {}, "close", ["×"])
        const overlay = createEl("div", {}, "overlay")

        this.modal.prepend(overlay)
        this.modal.querySelector(".modal").prepend(close)

        const toggle = () => this.modal.classList.toggle("open")
        close.addEventListener("click", toggle)
        overlay.addEventListener("click", toggle)
    }
}

module.exports = Modal