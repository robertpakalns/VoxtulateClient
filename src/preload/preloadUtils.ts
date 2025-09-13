import { createEl, domains } from "../preload/preloadFunctions.js";
import { ipcRenderer, shell } from "electron";

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
      async () => (window.location.href = `https://${await getHostRenderer()}`),
    );
    document.body.appendChild(_back);
  }
};

export const setupFastCSS = (): void => {
  const fastCSSStyles = document.getElementById("fastCSSStyles") as HTMLElement;
  let fastCSSLink = document.getElementById(
    "fastCSSLink",
  ) as HTMLLinkElement | null;

  ipcRenderer.on("change-fast-css", (_, enable, url, value) => {
    if (!enable) {
      fastCSSStyles.innerHTML = "";
      if (fastCSSLink) {
        fastCSSLink.remove();
        fastCSSLink = null;
      }
      return;
    }

    fastCSSStyles.innerHTML = value;

    if (url) {
      if (!fastCSSLink) {
        fastCSSLink = createEl("link", {
          id: "fastCSSLink",
          rel: "stylesheet",
        }) as HTMLLinkElement;
        document.head.appendChild(fastCSSLink!);
      }
      if (fastCSSLink) fastCSSLink.href = url;
    } else if (fastCSSLink) {
      fastCSSLink.remove();
      fastCSSLink = null;
    }
  });
};

export const handleDiscordLink = (cont: HTMLElement): void => {
  cont.onclick = (e) => {
    e.preventDefault();
    shell.openExternal("https://discord.gg/SEExvCQeNc");
  };
};
