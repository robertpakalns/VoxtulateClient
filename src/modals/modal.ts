import { createEl } from "../preload/preloadFunctions.js";

class Modal {
  modal: HTMLElement | null = null;
  modalHTMLPath: string | null = null;
  modalHTMLString: string | null = null;

  init(): void {
    const modalHTML = this.modalHTMLString as string;

    this.modal = createEl("div", { innerHTML: modalHTML }, "modalWrapper");
    document.body.appendChild(this.modal);

    const close = createEl("div", {}, "close", ["×"]);
    const overlay = createEl("div", {}, "overlay");

    this.modal.prepend(overlay);
    this.modal.querySelector(".modal")?.prepend(close);

    const toggle = () => this.modal?.classList.toggle("open");
    close.addEventListener("click", toggle);
    overlay.addEventListener("click", toggle);
  }
}

export default Modal;
