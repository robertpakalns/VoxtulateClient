import clientStylesCustom from "../../assets/css/clientStylesCustom.css?raw";
import clientStylesMain from "../../assets/css/clientStylesMain.css?raw";
import { config } from "../preload/preloadUtils.js";
import { createEl } from "../preload/preloadFunctions.js";
import { ipcRenderer } from "electron";

const enableStyles = async (): Promise<void> => {
  const {
    console: enableConsole,
    chatOpacity,
    inventorySorting,
    clientStyles: styles,
  } = (await config.get("interface")) as {
    console: boolean;
    chatOpacity: number;
    inventorySorting: boolean;
    clientStyles: boolean;
  };

  // Custom client styles
  const customCSS = clientStylesCustom;

  // Styles for the client features
  const clientCSS =
    clientStylesMain +
    `body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomConsole { opacity: ${enableConsole ? "100%" : "0%"} }
    .hint { display: ${(await config.get("interface.modalHint")) ? "block" : "none"} }
    .hYnMmT { display: ${inventorySorting ? "none" : "block"} }"`;

  const enableStyles = createEl("style", {
    textContent: styles ? customCSS : "",
  });
  const clientStyles = createEl("style", { textContent: clientCSS });

  // FastCSS
  const fastCSSStyles = createEl("style", { id: "fastCSSStyles" });
  const fastCSSLink = createEl("link", {
    id: "fastCSSLink",
    rel: "stylesheet",
  }) as HTMLAnchorElement;

  const {
    enable,
    url: fastCSSURL,
    value,
  } = (await config.get("fastCSS")) as {
    enable: boolean;
    url: string;
    value: string;
  };

  if (enable) {
    fastCSSStyles.innerHTML = value;
    fastCSSLink.href = fastCSSURL;
    document.head.appendChild(fastCSSLink);
  }

  document.head.append(enableStyles, clientStyles, fastCSSStyles);

  const { enable: crosshairEnable, url: crosshairURL } = (await config.get(
    "crosshair",
  )) as {
    enable: boolean;
    url: string;
  };
  const crosshair = createEl(
    "img",
    { src: crosshairEnable ? crosshairURL : "" },
    "voxiomCrosshair",
  ) as HTMLImageElement;
  document.body.prepend(crosshair);

  const updateStyle = (
    selector: string,
    property: keyof CSSStyleDeclaration,
    value: string,
  ): void => {
    const el = document.querySelector(selector) as HTMLElement;
    if (el) (el.style[property] as string) = value;
  };

  ipcRenderer.on(
    "toggle-client-styles",
    (_, enable) => (enableStyles.textContent = enable ? customCSS : ""),
  );
  ipcRenderer.on("toggle-menu-modal", (_, enable) =>
    updateStyle(".hint", "display", enable ? "block" : "none"),
  );
  ipcRenderer.on("change-opacity", (_, opacity) =>
    updateStyle(".lpfJAq, .lpdfTz", "opacity", `${opacity}%`),
  );
  ipcRenderer.on("toggle-mini-console", (_, enable) => {
    updateStyle(
      'body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]',
      "opacity",
      enable ? "0%" : "100%",
    );
    updateStyle(".voxiomConsole", "opacity", enable ? "100%" : "0%");
  });
  ipcRenderer.on("change-crosshair", (_, enable, url) => {
    updateStyle(".voxiomCrosshair", "display", enable ? "block" : "none");
    crosshair.src = url;
  });
};

export default enableStyles;
