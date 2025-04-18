const { createEl } = require("../functions.js")

class Modal {
    
    constructor() {
        this.modal = null
        this.modalHTML = null
    }

    init() {
        this.modal = createEl("div", { innerHTML: this.modalHTML }, "wrapper")
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