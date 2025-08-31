import { Config, defaultConfig } from "./config.js";
import { BrowserWindow } from "electron";

const config = new Config();

const keybinding = (mainWindow: BrowserWindow): void => {
  const { webContents } = mainWindow;
  const keybindings = config.get("keybinding.enable")
    ? config.get("keybinding.content")
    : defaultConfig.keybinding.content;
  const { CloseModal, MenuModal, Reload, Fullscreen, DevTools } =
    keybindings as {
      CloseModal: string;
      MenuModal: string;
      Reload: string;
      Fullscreen: string;
      DevTools: string;
    };

  const keySet = new Set<string>([MenuModal, Reload, Fullscreen, DevTools]);

  webContents.on("before-input-event", (e, { code, type }) => {
    if (keySet.has(code)) e.preventDefault();

    // Fix of the in-game pause button due to older Electron version
    // if (code !== CloseModal && code === "Escape" && type === "keyUp")
    //   return webContents.send("toggle-window", "null");

    switch (code) {
      case CloseModal:
        if (type === "keyUp") webContents.send("toggle-window", "null");
        break;
      case MenuModal:
        webContents.send("toggle-window", "menuModal");
        break;
      case Reload:
        webContents.reload();
        break;
      case Fullscreen:
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        break;
      case DevTools:
        // The webContents.toggleDevTools() method is buggy on electron@21.0.0
        // The panel will be opened in a separate window to avoid client freeze
        if (webContents.isDevToolsOpened()) {
          webContents.closeDevTools();
        } else {
          webContents.openDevTools({ mode: "detach" });
        }
        break;
      default:
        break;
    }
  });
};

export default keybinding;
