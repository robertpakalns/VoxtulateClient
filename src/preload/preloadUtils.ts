import { createEl, domains } from "../utils/functions.js";
import { ipcRenderer } from "electron";

export const config = {
  get: (key: string) => ipcRenderer.invoke("config-get", key),
  set: (key: string, value: string | boolean) =>
    ipcRenderer.invoke("config-set", key, value),
};

export const getUserscriptsPath = (): Promise<string> =>
  ipcRenderer.invoke("get-userscripts-path");

// Go back to Voxiom from Auth page
const authDomains = new Set<string>([
  "www.facebook.com",
  "accounts.google.com",
  "discord.com",
]);

const getHostRenderer = async (): Promise<string> => {
  const host = (await config.get("client.domain")) as string;
  return domains.has(host) ? host : "voxiom.io";
};

export const backToVoxiom = (): void => {
  if (authDomains.has(window.location.host)) {
    const _back = createEl("div", {}, "backToVoxiom", ["Back to Voxiom"]);
    _back.addEventListener(
      "click",
      () => (window.location.href = `https://${getHostRenderer()}`),
    );
    document.body.appendChild(_back);
  }
};
