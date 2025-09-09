import { nativeImage, NativeImage } from "electron";
import { Config } from "./config.js";
import { join } from "path";

const config = new Config();

// Voxiom.io Domains
export const domains = new Set<string>(["voxiom.io", "historynotes.club"]);

const host = config.get("client.domain") as string;
export const getHost = () => (domains.has(host) ? host : "voxiom.io");

// Project root path
const __root = join(__dirname, "../../../");
export const fromRoot = (path: string): string => join(__root, path);

// Dialog windows
const extObj: Record<string, string> = {
  win32: "ico",
  darwin: "icns",
  linux: "png",
};

let cachedIcon: NativeImage | undefined;
export const getIcon = (): NativeImage | undefined => {
  if (cachedIcon) return cachedIcon;

  const ext: string = extObj[process.platform];
  if (!ext) return undefined;

  cachedIcon = nativeImage.createFromPath(fromRoot(`assets/icons/icon.${ext}`));

  return cachedIcon;
};
