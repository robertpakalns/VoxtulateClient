const { restartMessage } = require("../../utils/functions.js");
const { Config } = require("../../utils/config.js");
const { ipcRenderer } = require("electron");
const config = new Config();

const createSettingsSection = () => {
  const cont = document.getElementById("settings");

  const restartElementsObject = {
    inventorySorting: "interface.inventorySorting",
  };
  const nonRestartElementsObject = {
    hint: "interface.modalHint",
    console: "interface.console",
    customStyles: "interface.clientStyles",
  };
  for (const [id, key] of Object.entries({
    ...restartElementsObject,
    ...nonRestartElementsObject,
  })) {
    const el = cont.querySelector(`#${id}`);
    el.checked = config.get(key);
    el.addEventListener("change", (e) => config.set(key, e.target.checked));
  }
  for (const [id] of Object.entries(restartElementsObject))
    cont.querySelector(`#${id}`).addEventListener("change", restartMessage);

  const _currentURL = cont.querySelector("#currentURL");
  ipcRenderer.on(
    "update-url",
    (_, url) => (_currentURL.innerText = url || "Unknown URL"),
  );
  ipcRenderer.send("update-url");

  cont
    .querySelector("#joinLink")
    .addEventListener("click", () =>
      ipcRenderer.send("join-game", cont.querySelector("#joinLinkURL").value),
    );

  const _chatOpacity = cont.querySelector("#chatOpacity");
  _chatOpacity.value = config.get("interface.chatOpacity") ?? "100";
  _chatOpacity.addEventListener("change", (e) => {
    config.set("interface.chatOpacity", e.target.value);
    ipcRenderer.send("change-opacity", e.target.value);
  });

  const changeCallbacksObject = {
    console: "set-console",
    customStyles: "change-styles",
  };
  for (const [id, event] of Object.entries(changeCallbacksObject))
    cont
      .querySelector(`#${id}`)
      .addEventListener("change", (e) =>
        ipcRenderer.send(event, e.target.checked),
      );

  const clickCallbacksObject = {
    defaultSettings: "clear-settings",
    clearData: "clear-data",
    restart: "relaunch",
  };
  for (const [id, event] of Object.entries(clickCallbacksObject))
    cont
      .querySelector(`#${id}`)
      .addEventListener("click", () => ipcRenderer.send(event));
};

module.exports = createSettingsSection;
