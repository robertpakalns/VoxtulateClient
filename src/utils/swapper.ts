import swapperList from "../../assets/swapperList.json";
import { protocol, WebContents } from "electron";
import { Config, configDir } from "./config.js";
import { fromRoot } from "./functions.js";
import { promises as fs } from "fs";
import { join } from "path";

const config = new Config();

const swapper = async (webContents: WebContents): Promise<void> => {
  const reject = new Set<string>([
    "api.adinplay.com",
    "www.google-analytics.com",
    "www.googletagmanager.com",
    "matomo.voxiom.io",
    "api.gameanalytics.com",
  ]);

  const { adblocker, swapper } = config.get("client") as {
    adblocker: string;
    swapper: string;
  };

  const swapperFolder = join(configDir, "swapper");

  await fs.mkdir(swapperFolder, { recursive: true });
  const swapperFiles = new Set<string>(await fs.readdir(swapperFolder));

  protocol.registerFileProtocol("voxtulate", (request, callback): void => {
    const u = new URL(request.url);

    const assetName = u.searchParams.get("asset");
    const relPath = u.searchParams.get("path");

    let localPath: string | null;
    if (relPath) {
      localPath = fromRoot(relPath);
    } else if (assetName) {
      localPath = join(configDir, "swapper", assetName);
    }

    if (localPath) {
      callback({ path: localPath });
    } else {
      callback({ error: -6 }); // FILE_NOT_FOUND
    }
  });

  const swapFile = async (name: string): Promise<string | null> => {
    // Resource detection based on the file name and extension
    if (!swapperFiles.has(name)) return null;
    const localFilePath = join(swapperFolder, name);

    try {
      await fs.access(localFilePath);
      return `file://${localFilePath}`;
    } catch {
      return null;
    }
  };

  webContents.session.webRequest.onBeforeRequest(async ({ url }, callback) => {
    const { protocol: reqp, host, pathname } = new URL(url);

    if (reqp === "file:") return callback({});

    // Block ads and other scripts which are not voxiom related
    if (adblocker && reject.has(host)) return callback({ cancel: true });

    if (host === "voxiom.io" || host === "historynotes.club") {
      // Blocks sockets
      if (adblocker && pathname.startsWith("/socket.io"))
        return callback({ cancel: true });

      // Swapper
      if (swapper === "Simple" || swapper === "Extended") {
        const fileName =
          swapper === "Extended"
            ? pathname.split("/").pop()
            : swapperList[pathname];
        if (await swapFile(fileName))
          return callback({
            redirectURL: `voxtulate://local?asset=${encodeURIComponent(fileName)}`,
          });
      }
    }

    return callback({});
  });
};

export default swapper;
