import { createEl, restartMessage } from "../../utils/functions.js";
import { userScriptsPath } from "../../../src/utils/userScripts.js";
import { readFileSync, writeFileSync } from "fs";
import { Config } from "../../utils/config.js";
import { ipcRenderer } from "electron";

const config = new Config();

const createCustomizationSection = () => {
  const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"));
  const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig;

  const cont = document.getElementById("customization") as HTMLElement;

  // Userscripts
  const userScriptsInit = (obj: Record<string, boolean>, id: string): void => {
    const _block = cont.querySelector(`#${id}`) as HTMLElement;

    if (Object.keys(obj).length === 0) {
      _block.innerText = "...";
      return;
    }

    for (const key in obj) {
      const _checkbox = createEl("input", {
        type: "checkbox",
        checked: obj[key],
      });
      _checkbox.addEventListener("change", (e) => {
        obj[key] = (e.target as HTMLInputElement).checked;
        writeFileSync(
          userScriptsPath,
          JSON.stringify(userScriptsConfig, null, 2),
        );
      });

      const _text = createEl("span", {}, "", [key]);
      const _cont = createEl("div", {}, "content", [_checkbox, _text]);
      _block.appendChild(_cont);
    }
  };

  userScriptsInit(scripts, "userScripts");
  userScriptsInit(styles, "userStyles");

  const _userScriptsEnabled = cont.querySelector(
    "#userScriptsEnabled",
  ) as HTMLInputElement;
  _userScriptsEnabled.checked = userScriptsEnabled;
  _userScriptsEnabled.addEventListener("change", (e) => {
    toggleUserScripts();
    userScriptsConfig.enable = (e.target as HTMLInputElement).checked;
    writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2));
  });

  const toggleUserScripts = () => {
    const checked = _userScriptsEnabled.checked;
    cont
      .querySelector("#userScriptsBlock")!
      .classList.toggle("disabled", !checked);
    for (const item of Array.from(
      cont.querySelector("#userScripts")!.querySelectorAll("input"),
    ))
      item.disabled = !checked;
    for (const item of Array.from(
      cont.querySelector("#userStyles")!.querySelectorAll("input"),
    ))
      item.disabled = !checked;
  };

  toggleUserScripts();

  // Custom crosshair
  const _enableCrosshair = cont.querySelector(
    "#enableCrosshair",
  ) as HTMLInputElement;
  const _crosshairURL = cont.querySelector("#crosshairURL") as HTMLInputElement;
  const fileIconURL = "voxtulate://?path=assets/icons/file.svg";
  (cont.querySelector("#file-icon") as HTMLImageElement).src = fileIconURL;
  _enableCrosshair.checked = config.get("crosshair.enable") as boolean;
  _enableCrosshair.addEventListener("change", (e) => {
    toggleCrosshair();
    config.set("crosshair.enable", (e.target as HTMLInputElement).checked);
    ipcRenderer.send(
      "change-crosshair",
      (e.target as HTMLInputElement).checked,
      _crosshairURL.value,
    );
  });

  _crosshairURL.value = (config.get("crosshair.url") as string) ?? "";
  _crosshairURL.addEventListener("input", (e) => {
    config.set("crosshair.url", (e.target as HTMLInputElement).value);
    ipcRenderer.send(
      "change-crosshair",
      _enableCrosshair.checked,
      (e.target as HTMLInputElement).value,
    );
  });

  const _crosshairFile = cont.querySelector(
    "#crosshairFile",
  ) as HTMLInputElement;
  _crosshairFile.addEventListener("change", ({ target }: Event) => {
    const file = (target as HTMLInputElement).files?.[0];
    if (!file) return;

    const { path } = file;
    config.set("crosshair.url", path);
    _crosshairURL.value = path;

    ipcRenderer.send(
      "change-crosshair",
      _enableCrosshair.checked,
      _crosshairURL.value,
    );
  });

  const toggleCrosshair = () => {
    const checked = _enableCrosshair.checked;
    _crosshairURL.disabled = !checked;
    _crosshairFile.disabled = !checked;
    cont
      .querySelector("#crosshairContent")!
      .classList.toggle("disabled", !checked);
  };

  toggleCrosshair();

  // Keybinding
  const keybindingRow = (name: string, key: string): void => {
    const _inputChild = createEl("input", {
      type: "text",
      value: key,
    }) as HTMLInputElement;
    _inputChild.addEventListener("keydown", (e) => {
      e.preventDefault();
      _inputChild.value = e.code;
      config.set(`keybinding.content.${name}`, e.code);
    });

    const _name = createEl("td", { textContent: name });
    const _input = createEl("td", {}, "", [_inputChild]);
    const tr = createEl("tr", {}, "", [_name, _input]);

    cont.querySelector("#keybindingBody")!.appendChild(tr);
  };

  const { content: c2 } = config.get("keybinding") as {
    content: Record<string, string>;
  };
  for (const key in c2) keybindingRow(key, c2[key]);

  const _enableKeybinding = cont.querySelector(
    "#enableKeybinding",
  ) as HTMLInputElement;
  const _keybindingTable = cont.querySelector(
    "#keybindingTable",
  ) as HTMLElement;

  const toggleKeybinding = () => {
    const checked = _enableKeybinding.checked;
    _keybindingTable.classList.toggle("disabled", !checked);
    for (const item of Array.from(_keybindingTable.querySelectorAll("input")))
      item.disabled = !checked;
  };

  toggleKeybinding();
  _enableKeybinding.checked = config.get("keybinding.enable") as boolean;
  _enableKeybinding.addEventListener("change", () => {
    restartMessage();
    toggleKeybinding();
  });
};

export default createCustomizationSection;
