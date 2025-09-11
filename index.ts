import {
  app,
  BrowserWindow,
  ClearStorageDataOptions,
  ipcMain,
  dialog,
  protocol,
  session,
} from "electron";
import { Config, configPath, configDir } from "./src/utils/config.js";
import { message, confirmAction } from "./src/utils/dialogs.js";
import { getIcon, getHost } from "./src/utils/functions.js";
import { userscripts } from "./src/utils/userScripts.js";
import keybinding from "./src/utils/keybinding.js";
import DiscordRPC from "./src/utils/discord.js";
import { autoUpdater } from "electron-updater";
import swapper from "./src/utils/swapper.js";
import { join, normalize } from "path";
import { promises as fs } from "fs";

const rpc = new DiscordRPC();
const config = new Config();

let mainWindow: BrowserWindow | null = null;
const domain: string = `https://${getHost()}`;

ipcMain.handle("config-get", (_, key: string) => config.get(key));
ipcMain.handle("config-set", (_, key: string, value: boolean) => {
  config.set(key, value);
  return true;
});
ipcMain.handle("get-userscripts-path", () =>
  join(configDir, "userscripts.json"),
);
ipcMain.handle(
  "write-game-settings",
  async (_, file: string, content: string): Promise<boolean> => {
    await fs.writeFile(file, content);
    return true;
  },
);
ipcMain.handle(
  "read-userscripts-config",
  async (_): Promise<string> =>
    await fs.readFile(join(configDir, "userscripts.json"), "utf8"),
);
ipcMain.handle(
  "write-userscripts-config",
  async (_, content: string): Promise<boolean> => {
    await fs.writeFile(join(configDir, "userscripts.json"), content);
    return true;
  },
);

const createMain = (): void => {
  mainWindow = new BrowserWindow({
    title: "Voxtulate Client",
    icon: getIcon(),
    show: false,
    webPreferences: {
      preload: join(__dirname, "../js-dist/preload.js"),
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  mainWindow.maximize();
  mainWindow.setMenu(null);
  mainWindow.loadURL(domain);
  mainWindow.setFullScreen(config.get("client.fullscreen") as boolean);
  mainWindow.on("page-title-updated", (e) => e.preventDefault());

  mainWindow.once("ready-to-show", async () => {
    if (process.platform === "win32") {
      // @ts-ignore
      // Windows only
      const { default: enject } = await import("@juice-client/node-enject");

      const handleBuffer = mainWindow!.getNativeWindowHandle();
      let hwnd;

      if (process.arch === "x64" || process.arch === "arm64")
        hwnd = Number(handleBuffer.readBigUInt64LE(0));
      else hwnd = handleBuffer.readUInt32LE(0);

      enject.startHook(hwnd);
    }

    mainWindow!.show();
  });

  keybinding(mainWindow);

  const { webContents } = mainWindow;

  webContents.on("will-prevent-unload", (e) => e.preventDefault());
  ipcMain.on("update-url", (e) => e.reply("update-url", webContents.getURL()));
  webContents.on("did-navigate-in-page", () => {
    const url = webContents.getURL();
    webContents.send("update-url", url);
    rpc.setJoinURL(url.replace(domain, ""));
  });
  webContents.on("did-finish-load", () => {
    const url = webContents.getURL();
    webContents.send("update-url", url);
    rpc.setJoinURL(url.replace(domain, ""));
  });

  userscripts(webContents);

  webContents.on("new-window", (e, url) => {
    e.preventDefault();
    mainWindow!.loadURL(url);
  });

  swapper(webContents);
};

if (config.get("client.fpsUncap"))
  app.commandLine.appendSwitch("disable-frame-rate-limit");
for (const el of [
  "in-process-gpu",
  "enable-quic",
  "enable-gpu-rasterization",
  "disable-gpu-vsync",
])
  app.commandLine.appendSwitch(el);

if (!app.requestSingleInstanceLock()) app.quit();

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on("ready", () => {
  app.setAsDefaultProtocolClient("voxtulate");
  protocol.registerFileProtocol("file", ({ url }, c) =>
    c({ path: normalize(decodeURIComponent(new URL(url).pathname)) }),
  );
  createMain();

  // Deeplink
  const deeplink = process.argv.find((arg) => arg.startsWith("voxtulate:"));
  if (deeplink) {
    const { searchParams, hash } = new URL(deeplink);
    const queryPath = searchParams.get("url");
    const cleanPath = queryPath
      ? queryPath.replace(/^\/+/, "").replace(/\/+$/, "")
      : "";
    const finalURL = `${domain}/${cleanPath}${hash}`;
    if (queryPath) mainWindow!.loadURL(finalURL);
  }

  if (config.get("client.firstJoin")) {
    setTimeout(
      () =>
        message(
          "Welcome",
          "Welcome to Voxtulate Client! Press F1 to open menu. Have a good game!",
        ),
      3000,
    );
    config.set("client.firstJoin", false);
  }

  ipcMain.on("join-game", (_, url) => mainWindow!.loadURL(url));

  const webContents = mainWindow!.webContents;

  autoUpdater.checkForUpdates();
  autoUpdater.on("update-available", () =>
    webContents.send("client-update", null),
  );
  autoUpdater.on("download-progress", (value) =>
    webContents.send("client-update", value),
  );
  autoUpdater.on("update-downloaded", () =>
    webContents.send("client-update", true),
  );
  ipcMain.on("client-update", (_, data) => {
    if (data === "update") autoUpdater.quitAndInstall();
  });

  const f = { filters: [{ name: "JSON Files", extensions: ["json"] }] };
  ipcMain.on("import-client-settings", () =>
    dialog.showOpenDialog(f).then(async ({ canceled, filePaths }) => {
      if (!canceled && filePaths.length > 0)
        await fs.writeFile(
          Config.file,
          await fs.readFile(filePaths[0], "utf8"),
        );
    }),
  );
  ipcMain.on("export-client-settings", () =>
    dialog.showSaveDialog(f).then(async ({ canceled, filePath }) => {
      if (!canceled && filePath)
        await fs.writeFile(filePath, await fs.readFile(configPath));
    }),
  );
  ipcMain.on("import-game-settings", () =>
    dialog.showOpenDialog(f).then(async ({ canceled, filePaths }) => {
      if (!canceled && filePaths.length > 0)
        webContents.send(
          "set-game-settings",
          JSON.stringify(await fs.readFile(filePaths[0], "utf8")),
        );
    }),
  );
  ipcMain.on("export-game-settings", () =>
    dialog.showSaveDialog(f).then(({ canceled, filePath }) => {
      if (!canceled && filePath)
        webContents.send("get-game-settings", filePath);
    }),
  );

  for (const e of [
    "change-crosshair",
    "change-opacity",
    "toggle-mini-console",
    "toggle-menu-modal",
    "toggle-client-styles",
    "client-update",
  ])
    ipcMain.on(e, (_, ...a) => webContents.send(e, ...a));

  ipcMain.on("clear-settings", () =>
    confirmAction("Are you sure you want to clear client settings?", () => {
      config.default();
      app.relaunch();
      app.exit();
    }),
  );
  ipcMain.on("clear-data", () =>
    confirmAction("Are you sure you want to clear all stored data?", () => {
      session.defaultSession.clearStorageData([] as ClearStorageDataOptions);
      app.relaunch();
      app.exit();
    }),
  );
  ipcMain.on("relaunch", () =>
    confirmAction("Are you sure you want to restart the application?", () => {
      app.relaunch();
      app.exit();
    }),
  );
});
