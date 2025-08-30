const { createEl, loadAsset } = require("../utils/functions.js");
const { Config } = require("../utils/config.js");
const { ipcRenderer } = require("electron");
const { readFileSync } = require("fs");
const path = require("path");
const config = new Config();

const {
  console: enableConsole,
  chatOpacity,
  inventorySorting,
  clientStyles: styles,
} = config.get("interface");

const enableStyles = () => {
  // Custom client styles
  const fontURL = loadAsset("fonts/Roboto.ttf").replace(/\\/g, "/");
  const textURL = loadAsset("text.webp").replace(/\\/g, "/");
  const bgURL = loadAsset("bg.webp").replace(/\\/g, "/");
  const customCSS =
    readFileSync(path.join(__dirname, "./clientStylesCustom.css"), "utf8") +
    `
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`;

  // Styles for the client features
  const clientCSS =
    readFileSync(path.join(__dirname, "./clientStylesMain.css"), "utf8") +
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

  const { enable: crosshairEnable, url } = config.get("crosshair");
  const crosshair = createEl(
    "img",
    { src: crosshairEnable ? url : "" },
    "voxiomCrosshair",
  );
  document.body.prepend(crosshair);

  const updateStyle = (selector, property, value) => {
    const el = document.querySelector(selector);
    if (el) el.style[property] = value;
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

module.exports = enableStyles;
