const { restartMessage } = require("../../utils/functions.js");
const { Config } = require("../../utils/config.js");
const { ipcRenderer } = require("electron");
const config = new Config();

const createSettingsSection = () => {
  const cont = document.getElementById("settings");

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

  const clickCallbacksObject = {
    defaultSettings: "clear-settings",
    clearData: "clear-data",
    restart: "relaunch",
  };
  for (const [id, event] of Object.entries(clickCallbacksObject))
    cont
      .querySelector(`#${id}`)
      .addEventListener("click", () => ipcRenderer.send(event));

  // Import/export data
  const settingsObject = {
    importClientSettings: "import-client-settings",
    exportClientSettings: "export-client-settings",
    importGameSettings: "import-game-settings",
    exportGameSettings: "export-game-settings",
  };
  for (const [id, event] of Object.entries(settingsObject))
    cont
      .querySelector(`#${id}`)
      .addEventListener("click", () => ipcRenderer.send(event));
};

module.exports = createSettingsSection;
