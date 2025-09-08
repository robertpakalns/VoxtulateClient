import clientStylesCustom from "../../assets/css/clientStylesCustom.css?raw";
import clientStylesMain from "../../assets/css/clientStylesMain.css?raw";
import { createEl } from "../utils/functions.js";
import { Config } from "../utils/config.js";
import { ipcRenderer } from "electron";

const config = new Config();

const {
  console: enableConsole,
  chatOpacity,
  inventorySorting,
  clientStyles: styles,
} = config.get("interface") as {
  console: boolean;
  chatOpacity: number;
  inventorySorting: boolean;
  clientStyles: boolean;
};

const enableStyles = (): void => {
  // Custom client styles
  const fontURL = "voxtulate://?path=assets/fonts/Roboto.ttf";
  const textURL = "voxtulate://?path=assets/text.webp";
  const bgURL = "voxtulate://?path=assets/bg.webp";
  const customCSS =
    clientStylesCustom +
    `
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`;

  // Styles for the client features
  const clientCSS =
    clientStylesMain +
    `
    @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomConsole { opacity: ${enableConsole ? "100%" : "0%"} }
    .hint { display: ${config.get("interface.modalHint") ? "block" : "none"} }
    .hYnMmT { display: ${inventorySorting ? "none" : "block"} }"`;

  const enableStyles = createEl("style", {
    textContent: styles ? customCSS : "",
  });
  const clientStyles = createEl("style", { textContent: clientCSS });
  document.head.append(enableStyles, clientStyles);

  const { enable: crosshairEnable, url } = config.get("crosshair") as {
    enable: boolean;
    url: string;
  };
  const crosshair = createEl(
    "img",
    { src: crosshairEnable ? url : "" },
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
