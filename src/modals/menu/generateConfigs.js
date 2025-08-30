const { createEl, popup } = require("../../utils/functions.js");
const settingsJson = require("../../../assets/settings.json");
const { Config } = require("../../utils/config.js");
const { ipcRenderer } = require("electron");

const config = new Config();

const data = settingsJson;

const sendNotification = (requires) => {
  if (requires === "restart")
    popup("#e74c3c", "Restart the client to apply this setting.");
  else if (requires === "refresh")
    popup("#e89b0bff", "Refresh the page to apply this setting.");
};

const appendConfig = (data, configCont) => {
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

const generateConfigs = () => {
  for (const el of data) {
    let configCont;
    if (el.type === "checkbox") {
      configCont = createEl(
        "input",
        { type: "checkbox", ...(el.id ? { id: el.id } : {}) },
        "",
        [],
      );
      configCont.checked = config.get(el.config);
      configCont.addEventListener("change", (e) => {
        config.set(el.config, e.target.checked);
        sendNotification(el.requires);
      });
    } else if (el.type === "select") {
      configCont = createEl("select", {}, "", []);
      configCont.addEventListener("change", (e) => {
        config.set(el.config, e.target.value);
        sendNotification(el.requires);
      });

      if (el.select) {
        for (const i of el.select) {
          const option = createEl("option", { value: i }, "", [i]);
          configCont.appendChild(option);
        }

        configCont.value = config.get(el.config);
      }
    } else {
      configCont = createEl("div", {}, "", []);
    }

    appendConfig(el, configCont);
  }

  // Toggle
  const toggleObject = {
    modalHint: "toggle-menu-modal",
    miniConsole: "toggle-mini-console",
    clientStyles: "toggle-client-styles",
  };
  for (const [id, event] of Object.entries(toggleObject)) {
    document.querySelector(`#${id}`)?.addEventListener("change", (e) => {
      ipcRenderer.send(event, e.target.checked);
    });
  }
};

module.exports = { sendNotification, appendConfig, generateConfigs };
