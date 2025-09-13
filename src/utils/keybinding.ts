import { Config, defaultConfig } from "./config.js";
import { BrowserWindow, ipcMain } from "electron";

const config = new Config();

const keybinding = (mainWindow: BrowserWindow): void => {
  const { webContents } = mainWindow;

  let enabled = (config.get("keybinding.enable") as boolean) ?? true;

  // An object of keybinds
  let k = (
    enabled
      ? (config.get("keybinding.content") as Record<string, string>)
      : defaultConfig.keybinding.content
  ) as {
    CloseModal: string;
    MenuModal: string;
    Reload: string;
    Fullscreen: string;
    DevTools: string;
  };

  const newSet = () =>
    new Set<string>([k.MenuModal, k.Reload, k.Fullscreen, k.DevTools]);

  let keySet = newSet();
  let justChanged = new Set<string>();

  ipcMain.on("change-keybind", (_, key: keyof typeof k, value: string) => {
    k[key] = value;
    keySet = newSet();
    justChanged.add(value);
  });

  ipcMain.on("toggle-keybind-enable", (_, value: boolean) => {
    enabled = value;

    k = (
      enabled
        ? config.get("keybinding.content")
        : defaultConfig.keybinding.content
    ) as typeof k;

    keySet = newSet();
  });

  webContents.on("before-input-event", (e, { code, type }) => {
    if (keySet.has(code)) e.preventDefault();

    if (justChanged.has(code)) {
      if (type === "keyUp") justChanged.delete(code);
      return;
    }

    if (code !== k.CloseModal && code === "Escape" && type === "keyUp")
      return webContents.send("toggle-window", "null");

    switch (code) {
      case k.CloseModal:
        if (type === "keyUp") webContents.send("toggle-window", "null");
        break;
      case k.MenuModal:
        webContents.send("toggle-window", "menuModal");
        break;
      case k.Reload:
        webContents.reload();
        break;
      case k.Fullscreen:
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        break;
      case k.DevTools:
        webContents.toggleDevTools();
        break;
    }
  });
};

export default keybinding;
