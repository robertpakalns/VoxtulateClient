import { createEl, popup } from "../../preload/preloadFunctions.js";
import settingsJson from "../../../assets/settings.json?raw";
import { config } from "../../preload/preloadUtils.js";
import { ipcRenderer } from "electron";

type RequiresType = "restart" | "refresh" | null;

export interface Setting {
  id?: string;
  name: string;
  description: string;
  type: "checkbox" | "select";
  config: string;
  section: "settings";
  requires?: RequiresType;
  select?: string[];
}

const data = JSON.parse(settingsJson) as Setting[];

export const sendNotification = (requires: RequiresType): void => {
  if (requires === "restart")
    popup("#e74c3c", "Restart the client to apply this setting.");
  else if (requires === "refresh")
    popup("#e89b0bff", "Refresh the page to apply this setting.");
};

export const appendConfig = (data: Setting, configCont: HTMLElement): void => {
  const parentCont = document.querySelector(
    `div[name=${data.section}Section] > div.settingsCont`,
  );

  const name = createEl("div", {}, "name", [data.name]);
  const description = createEl("div", {}, "subText", [data.description]);
  const requiresLabel =
    data.requires === "restart"
      ? "Requires client restart"
      : data.requires === "refresh"
        ? "Requires page refresh"
        : "";
  const requires = createEl(
    "div",
    {},
    data.requires === "restart"
      ? "restart"
      : data.requires === "refresh"
        ? "refresh"
        : "",
    [requiresLabel],
  );

  const upCont = createEl("div", {}, "upCont", [name, requires]);
  const downCont = createEl("div", {}, "downCont", [description]);

  const leftCont = createEl("div", {}, "leftCont", [upCont, downCont]);
  const cont = createEl("div", {}, "configCont", [leftCont, configCont]);

  parentCont?.appendChild(cont);
};

export const generateConfigs = async (): Promise<void> => {
  for (const el of data) {
    let configCont;
    if (el.type === "checkbox") {
      configCont = createEl(
        "input",
        { type: "checkbox", ...(el.id ? { id: el.id } : {}) },
        "",
        [],
      ) as HTMLInputElement;
      configCont.checked = (await config.get(el.config)) as boolean;
      configCont.addEventListener("change", async (e) => {
        await config.set(el.config, (e.target as HTMLInputElement).checked);
        sendNotification(el.requires as RequiresType);
      });
    } else if (el.type === "select") {
      configCont = createEl("select", {}, "", []) as HTMLSelectElement;
      configCont.addEventListener("change", async (e) => {
        await config.set(el.config, (e.target as HTMLOptionElement).value);
        sendNotification(el.requires as RequiresType);
      });

      if (el.select) {
        for (const i of el.select) {
          const option = createEl("option", { value: i }, "", [i]);
          configCont.appendChild(option);
        }

        const saved = (await config.get(el.config)) as string;
        if (saved && el.select.includes(saved)) {
          configCont.value = saved;
        } else {
          configCont.value = el.select[0];
          await config.set(el.config, el.select[0]);
        }
      }
    } else {
      configCont = createEl("div", {}, "", []);
    }

    appendConfig(el, configCont);
  }

  // Toggle
  const toggleObject = {
    modalHint: "toggle-menu-modal",
    toggleKDRatio: "toggle-kd-ratio",
    clientStyles: "toggle-client-styles",
  };
  for (const [id, event] of Object.entries(toggleObject)) {
    document.querySelector(`#${id}`)?.addEventListener("change", (e) => {
      ipcRenderer.send(event, (e.target as HTMLInputElement).checked);
    });
  }
};
