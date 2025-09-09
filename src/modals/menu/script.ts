import menuModalString from "../../../assets/html/menu.html?raw";
import { createEl, popup } from "../../utils/functions.js";
import { generateConfigs } from "./generateConfigs.js";
import { version } from "../../../package.json";
import { ipcRenderer, shell } from "electron";
import Modal from "../modal.js";

import createCustomizationSection from "./customizationSection.js";
import createChangelogSection from "./changelogSection.js";
import createSettingsSection from "./settingsSection.js";

class MenuModal extends Modal {
  constructor() {
    super();
    this.modalHTMLString = menuModalString;
  }

  init() {
    super.init();
    this.modal!.id = "menuModal";
  }

  async work() {
    await generateConfigs();

    const _version = this.modal!.querySelector("#version") as HTMLElement;
    _version.textContent = `v${version}`;

    const clientIcon = this.modal!.querySelector(
      "#voxtulateIcon",
    ) as HTMLImageElement;
    clientIcon.src = "voxtulate://?path=assets/icons/icon.png";

    // Open by default
    this.modal!.querySelector(".mainContentBlock:first-child")!.classList.add(
      "active",
    );
    this.modal!.querySelector(".sideBarItem:first-child")!.classList.add(
      "active",
    );

    for (const item of Array.from(
      this.modal!.querySelectorAll(".sideBarItem")!,
    ))
      item.addEventListener("click", (e) => {
        const activeDiv = this.modal!.querySelector(".mainContentBlock.active");
        if (activeDiv) activeDiv.classList.remove("active");

        const activeBar = this.modal?.querySelector(".sideBarItem.active");
        if (activeBar) activeBar.classList.remove("active");
        item.classList.add("active");

        const targetDiv = this.modal!.querySelector(
          `#menuMainContent > div[name="${(e.target! as HTMLElement).id}"]`,
        ) as HTMLElement;
        if (targetDiv) targetDiv.classList.add("active");

        if (targetDiv.getAttribute("name") === "changelogSection")
          createChangelogSection();
      });

    for (const el of Array.from(this.modal!.querySelectorAll(".url")))
      el.addEventListener("click", (e) => {
        e.preventDefault();
        shell.openPath((el as HTMLLinkElement).href);
      });

    for (const el of Array.from(this.modal!.querySelectorAll(".copy")))
      el.addEventListener("click", (e) => {
        navigator.clipboard.writeText((e.target! as HTMLElement).innerText);
        popup("rgb(206, 185, 45)", "Copied!");
      });

    // Update client
    ipcRenderer.on("client-update", (_, data) => {
      if (data === null) popup("rgb(45, 206, 72)", "Update available!");
      else if (data === true) {
        const _updateButton = createEl(
          "button",
          { textContent: "Update!" },
          "updateBtn",
        );
        _updateButton.addEventListener("click", () => {
          ipcRenderer.send("client-update", "update");
          _version.innerText = "Updating...";
        });
        _version.innerText = "";
        _version.appendChild(_updateButton);
      } else _version.innerText = `Downloading... ${Math.round(data.percent)}%`;
    });

    createSettingsSection();
    await createCustomizationSection();
  }
}

export default MenuModal;
