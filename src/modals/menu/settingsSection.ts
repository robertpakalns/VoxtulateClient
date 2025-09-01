import { Config } from "../../utils/config.js";
import { ipcRenderer } from "electron";

const config = new Config();

const createSettingsSection = () => {
  const cont = document.getElementById("settings") as HTMLElement;

  const _currentURL = cont.querySelector("#currentURL") as HTMLElement;
  ipcRenderer.on(
    "update-url",
    (_, url) => (_currentURL.innerText = url || "Unknown URL"),
  );
  ipcRenderer.send("update-url");

  cont
    .querySelector("#joinLink")!
    .addEventListener("click", () =>
      ipcRenderer.send(
        "join-game",
        (cont.querySelector("#joinLinkURL") as HTMLInputElement).value,
      ),
    );

  const _chatOpacity = cont.querySelector("#chatOpacity") as HTMLInputElement;
  _chatOpacity.value = (config.get("interface.chatOpacity") as string) ?? "100";
  _chatOpacity.addEventListener("change", (e) => {
    config.set("interface.chatOpacity", (e.target as HTMLInputElement).value);
    ipcRenderer.send("change-opacity", (e.target as HTMLInputElement).value);
  });

  const clickCallbacksObject = {
    defaultSettings: "clear-settings",
    clearData: "clear-data",
    restart: "relaunch",
  };
  for (const [id, event] of Object.entries(clickCallbacksObject))
    cont
      .querySelector(`#${id}`)!
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
      .querySelector(`#${id}`)!
      .addEventListener("click", () => ipcRenderer.send(event));
};

export default createSettingsSection;
