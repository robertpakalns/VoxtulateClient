import { createEl } from "../../preload/preloadFunctions.js";
import { config } from "../../preload/preloadUtils.js";
import { ipcRenderer } from "electron";

const createCustomizationSection = async (): Promise<void> => {
  const writeConfig = async (): Promise<void> =>
    ipcRenderer.invoke(
      "write-userscripts-config",
      JSON.stringify(userScriptsConfig, null, 2),
    );

  const userScriptsConfig = JSON.parse(
    await ipcRenderer.invoke("read-userscripts-config"),
  );
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
        writeConfig();
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
    writeConfig();
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

  // Fast CSS
  const fastCSSURL = cont.querySelector("#fastCSSURL") as HTMLInputElement;
  fastCSSURL?.addEventListener("change", (e) =>
    config.set("fastCSS.url", (e.target as HTMLInputElement).value),
  );
  fastCSSURL!.value = (await config.get("fastCSS.url")) as string;

  const fastCSSValue = cont.querySelector(
    "#fastCSSValue",
  ) as HTMLTextAreaElement;
  fastCSSValue?.addEventListener("input", (e) =>
    config.set("fastCSS.value", (e.target as HTMLInputElement).value),
  );
  fastCSSValue!.value = (await config.get("fastCSS.value")) as string;

  const enableFastCSS = cont.querySelector(
    "#enableFastCSS",
  ) as HTMLInputElement;

  for (const id of ["enableFastCSS", "fastCSSURL", "fastCSSValue"]) {
    const eventType = id === "enableFastCSS" ? "change" : "input";
    cont.querySelector(`#${id}`)?.addEventListener(eventType, () => {
      ipcRenderer.send(
        "change-fast-css",
        enableFastCSS.checked,
        fastCSSURL.value,
        fastCSSValue.value,
      );
    });
  }

  const toggleFastCSS = () => {
    const checked = enableFastCSS?.checked;
    fastCSSURL.disabled = !checked;
    fastCSSValue.disabled = !checked;
    fastCSSURL.classList.toggle("disabled", !checked);
    fastCSSValue.classList.toggle("disabled", !checked);
  };

  toggleFastCSS();
  enableFastCSS.addEventListener("change", toggleFastCSS);

  // Custom crosshair
  const _enableCrosshair = cont.querySelector(
    "#enableCrosshair",
  ) as HTMLInputElement;
  const _crosshairURL = cont.querySelector("#crosshairURL") as HTMLInputElement;
  // _enableCrosshair.checked = (await config.get("crosshair.enable")) as boolean;
  _enableCrosshair.addEventListener("change", async (e) => {
    toggleCrosshair();
    await config.set(
      "crosshair.enable",
      (e.target as HTMLInputElement).checked,
    );
    ipcRenderer.send(
      "change-crosshair",
      (e.target as HTMLInputElement).checked,
      _crosshairURL.value,
    );
  });

  _crosshairURL.value = ((await config.get("crosshair.url")) as string) ?? "";
  _crosshairURL.addEventListener("input", async (e) => {
    await config.set("crosshair.url", (e.target as HTMLInputElement).value);
    ipcRenderer.send(
      "change-crosshair",
      _enableCrosshair.checked,
      (e.target as HTMLInputElement).value,
    );
  });

  const _crosshairFile = cont.querySelector(
    "#crosshairFile",
  ) as HTMLInputElement;
  _crosshairFile.addEventListener("change", async ({ target }: Event) => {
    const file = (target as HTMLInputElement).files?.[0];
    if (!file) return;

    const { path } = file;
    await config.set("crosshair.url", path);
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
    _inputChild.addEventListener("keydown", async (e) => {
      e.preventDefault();
      _inputChild.value = e.code;
      ipcRenderer.send("change-keybind", name, e.code);
      await config.set(`keybinding.content.${name}`, e.code);
    });

    const _name = createEl("td", { textContent: name });
    const _input = createEl("td", {}, "", [_inputChild]);
    const tr = createEl("tr", {}, "", [_name, _input]);

    cont.querySelector("#keybindingBody")!.appendChild(tr);
  };

  const { content: c2 } = (await config.get("keybinding")) as {
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
  _enableKeybinding.checked = (await config.get(
    "keybinding.enable",
  )) as boolean;
  _enableKeybinding.addEventListener("change", () => {
    ipcRenderer.send("toggle-keybind-enable", _enableKeybinding.checked);
    toggleKeybinding();
  });
};

export default createCustomizationSection;
