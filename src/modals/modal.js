const { createEl } = require("../functions.js")

class Modal {
    constructor() {
        this.modal = null
        this.modalHTML = null
        this.modalCSS = null
    }

    init() {
        this.modal = createEl("div", { innerHTML: this.modalHTML })
        const modalStyles = createEl("style", { textContent: this.modalCSS })

        document.body.appendChild(this.modal)
        document.head.appendChild(modalStyles)

        const close = createEl("div", {}, "close", ["×"])
        const overlay = createEl("div", {}, "overlay")

        this.modal.prepend(overlay)
        this.modal.querySelector(".modal").prepend(close)

        close.addEventListener("click", () => this.modal.classList.toggle("open"))
        overlay.addEventListener("click", () => this.modal.classList.toggle("open"))
    }
}

module.exports = Modal