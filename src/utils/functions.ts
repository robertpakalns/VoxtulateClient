import { nativeImage, NativeImage } from "electron";
import { Config } from "./config.js";
import { join, resolve } from "path";
import { pathToFileURL } from "url";

const config = new Config();

// Voxiom.io Domains
export const domains = new Set<string>(["voxiom.io", "historynotes.club"]);

const host = config.get("client.domain") as string;
export const getHost = () => (domains.has(host) ? host : "voxiom.io");

// Project root path
const __root = join(__dirname, "../../../");
export const fromRoot = (path: string): string => join(__root, path);

// Display values
export const output = (v: number, e: string) => `${v} ${v != 1 ? e + "s" : e}`;

export const creationTime = (date: number) =>
  new Date(date).toLocaleDateString("en-US");

const timeUnits = { d: 86400000, h: 3600000, min: 60000, s: 1000 };
export const timeLeft = (date: number) => {
  let ms = new Date(date).getTime() - Date.now();
  return (
    Object.entries(timeUnits)
      .map(([unit, value]) => {
        const uv = Math.floor(ms / value);
        ms %= value;
        return uv > 0 ? `${uv}${unit}` : null;
      })
      .filter(Boolean)
      .slice(0, 2)
      .join("") + " left"
  );
};

export const isNum = (a: number, b: number): string =>
  isNaN(a / b) ? "" : (a / b).toFixed(2) || "No Data";

// DOM elements
export const createEl = (
  tag: string,
  attrs: Record<string, string | boolean> = {},
  className: string = "",
  append: (HTMLElement | string)[] = [],
): HTMLElement => {
  const element: HTMLElement = document.createElement(tag);
  if (className) element.classList.add(className);
  for (const attr of Object.keys(attrs)) (element as any)[attr] = attrs[attr];
  element.append(...append);
  return element;
};

export const popup = (color: string, text: string): void => {
  document.getElementById("clientPopup")?.remove();

  const _bell: HTMLElement = createEl("img", {
    src: "redline://?path=assets/icons/bell.svg",
  });
  const _popup: HTMLElement = createEl("div", { id: "clientPopup" }, "", [
    _bell,
    text,
  ]);
  _popup.style.background = color;

  const audio = new Audio("redline://?path=assets/sounds/pop.mp3");
  audio.volume = 0.3;
  audio.play();

  const closePopup = (): void => {
    _popup.style.opacity = "0";
    setTimeout(() => _popup.remove(), 200);
  };

  _popup.addEventListener("click", closePopup);
  setTimeout(closePopup, 5000);

  document.body.appendChild(_popup);
};

export const restartMessage = (): void =>
  popup("rgb(231, 76, 60)", "Restart the client to apply this setting.");

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

  cachedIcon = nativeImage.createFromPath(
    join(__dirname, `../../assets/icon.${ext}`),
  );

  return cachedIcon;
};

// Assets
const assetsPath = fromRoot("assets");
export const loadAsset = (relativePath: string): string =>
  pathToFileURL(join(assetsPath, relativePath)).href;

export const getAsset = (path: string): string =>
  `https://raw.githubusercontent.com/robertpakalns/tricko-assets/main/${path}`;

export const sessionFetch = async (url: string): Promise<any> => {
  const cached = sessionStorage.getItem(url);
  if (cached) return JSON.parse(cached);

  const response = await fetch(url);
  const data = await response.json();
  sessionStorage.setItem(url, JSON.stringify(data));
  return data;
};

// Inventory
export interface IInventoryElement {
  name: string;
  id: string;
  type: string;
  rotation: string | boolean;
  model: string;
  rarity: string;
  equipped: string;
  seed: number;
  creation_time: number;
  slot: string | null;
}

export interface IInventorySettings {
  name: string;
  id: string;
  rotation: string | boolean;
  model: string;
  rarity: string;
  equipped: string;
  slot: string | null;
  creation: string | null;
}

export const inventoryFilter = (
  element: IInventoryElement,
  settings: IInventorySettings,
) =>
  (!settings.name ||
    element.name.toLowerCase().includes(settings.name.toLowerCase())) &&
  (!settings.id || element.type.toString().includes(settings.id)) &&
  (settings.rotation === "" ||
    element.rotation === (settings.rotation === "true")) &&
  (settings.model === "" || element.model === settings.model) &&
  (settings.rarity === "" || element.rarity === settings.rarity) &&
  (settings.equipped === "" ||
    (element.slot !== null) === (settings.equipped === "true"));

export const inventorySort = (
  a: { creation_time: number },
  b: { creation_time: number },
  settings: IInventorySettings,
): number =>
  !settings.creation
    ? 0
    : settings.creation === "true"
      ? b.creation_time - a.creation_time
      : a.creation_time - b.creation_time;
