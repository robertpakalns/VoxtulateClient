const { createEl } = require("../functions.js")
const { Config } = require("../config.js")

const config = new Config

class Modal {
    constructor() {
        this.modal = null
        this.modalHTML = null
        this.modalCSS = null
    }

    init() {
        this.modal = createEl("div", { innerHTML: this.modalHTML, classList: "wrapper" })
        const modalStyles = createEl("style", { textContent: this.modalCSS })

        document.body.appendChild(this.modal)
        document.head.appendChild(modalStyles)

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