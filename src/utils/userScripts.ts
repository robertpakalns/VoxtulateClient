import {
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  writeFileSync,
} from "fs";
import { configDir } from "./config.js";
import { WebContents } from "electron";
import path from "path";

const defaultConfig = {
  enable: true,
  scripts: {},
  styles: {},
};

const handleObject = (obj: Record<string, boolean>, array: string[]) => {
  // Fill the object if missing keys
  for (const key of array) if (!(key in obj)) obj[key] = true;

  // Clear unexpected keys
  const keySet = new Set<string>(array);
  for (const key in obj) if (!keySet.has(key)) delete obj[key];
};

const userScriptsPath = path.join(configDir, "userscripts.json");
if (!existsSync(userScriptsPath))
  writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
const userScriptsDir = path.join(configDir, "scripts");
if (!existsSync(userScriptsDir)) mkdirSync(userScriptsDir, { recursive: true });
const userStylesDir = path.join(configDir, "styles");
if (!existsSync(userStylesDir)) mkdirSync(userStylesDir, { recursive: true });

let userScripts: string[] = [];
let userStyles: string[] = [];

const getUserScriptsFiles = () => {
  let data;
  try {
    data = JSON.parse(readFileSync(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, scripts, styles } = data;
  const originalEnable = enable;
  const originalScripts = JSON.stringify(scripts);
  const originalStyles = JSON.stringify(styles);

  userScripts = readdirSync(userScriptsDir).filter((script) =>
    script.endsWith(".js"),
  );
  userStyles = readdirSync(userStylesDir).filter((style) =>
    style.endsWith(".css"),
  );

  handleObject(scripts, userScripts);
  handleObject(styles, userStyles);

  if (
    originalEnable !== enable ||
    originalScripts !== JSON.stringify(scripts) ||
    originalStyles !== JSON.stringify(styles)
  ) {
    writeFileSync(
      userScriptsPath,
      JSON.stringify({ enable, scripts, styles }, null, 2),
    );
  }
};

const setUserScripts = (webContents: WebContents): void => {
  let data;
  try {
    data = JSON.parse(readFileSync(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, scripts } = data;

  for (const el of userScripts) {
    if (scripts[el] === false) continue;

    const scriptPath = path.join(userScriptsDir, el);
    if (enable && existsSync(scriptPath)) {
      const scriptContent = readFileSync(scriptPath, "utf8");
      webContents.executeJavaScript(scriptContent);
    }
  }
};

const injectUserStyles = (webContents: WebContents): void => {
  let data;
  try {
    data = JSON.parse(readFileSync(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, styles } = data;

  for (const el of userStyles) {
    if (styles[el] === false) continue;
    const stylePath = path.join(userStylesDir, el);
    if (enable && existsSync(stylePath)) {
      const styleContent = readFileSync(stylePath, "utf8");
      webContents.insertCSS(styleContent);
    }
  }
};

export const userscripts = (webContents: WebContents): void => {
  getUserScriptsFiles();
  setUserScripts(webContents);

  webContents.on("did-start-navigation", (_, __, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) {
      getUserScriptsFiles();
      setUserScripts(webContents);
    }
  });

  webContents.on("did-finish-load", () => injectUserStyles(webContents));
};
