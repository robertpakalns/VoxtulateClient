import { configDir } from "./config.js";
import { WebContents } from "electron";
import { promises as fs } from "fs";
import { join } from "path";

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

const userScriptsPath = join(configDir, "userscripts.json");
const userScriptsDir = join(configDir, "scripts");
const userStylesDir = join(configDir, "styles");

let userScripts: string[] = [];
let userStyles: string[] = [];

const prepareAssets = async () => {
  await fs.mkdir(configDir, { recursive: true });
  await fs.mkdir(userScriptsDir, { recursive: true });
  await fs.mkdir(userStylesDir, { recursive: true });

  try {
    await fs.access(userScriptsPath);
  } catch {
    await fs.writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }
};

const getUserScriptsFiles = async (): Promise<void> => {
  await prepareAssets();

  let data;
  try {
    data = JSON.parse(await fs.readFile(userScriptsPath, "utf8"));
  } catch {
    data = { ...defaultConfig };
    await fs.writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, scripts, styles } = data;
  const originalEnable = enable;
  const originalScripts = JSON.stringify(scripts);
  const originalStyles = JSON.stringify(styles);

  const scriptsFiles = await fs.readdir(userScriptsDir);
  const stylesFiles = await fs.readdir(userStylesDir);

  userScripts = scriptsFiles.filter((f) => f.endsWith(".js"));
  userStyles = stylesFiles.filter((f) => f.endsWith(".css"));

  handleObject(scripts, userScripts);
  handleObject(styles, userStyles);

  if (
    originalEnable !== enable ||
    originalScripts !== JSON.stringify(scripts) ||
    originalStyles !== JSON.stringify(styles)
  ) {
    await fs.writeFile(
      userScriptsPath,
      JSON.stringify({ enable, scripts, styles }, null, 2),
    );
  }
};

const setUserScripts = async (webContents: WebContents): Promise<void> => {
  let data;
  try {
    data = JSON.parse(await fs.readFile(userScriptsPath, "utf8"));
  } catch {
    data = { ...defaultConfig };
    await fs.writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, scripts } = data;

  for (const el of userScripts) {
    if (scripts[el] === false) continue;

    const scriptPath = join(userScriptsDir, el);
    try {
      if (enable) {
        const scriptContent = await fs.readFile(scriptPath, "utf8");
        await webContents.executeJavaScript(scriptContent);
      }
    } catch {}
  }
};

const injectUserStyles = async (webContents: WebContents): Promise<void> => {
  let data;
  try {
    data = JSON.parse(await fs.readFile(userScriptsPath, "utf8"));
  } catch {
    data = { ...defaultConfig };
    await fs.writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, styles } = data;

  for (const el of userStyles) {
    if (styles[el] === false) continue;

    const stylePath = join(userStylesDir, el);
    try {
      if (enable) {
        const styleContent = await fs.readFile(stylePath, "utf8");
        await webContents.insertCSS(styleContent);
      }
    } catch {}
  }
};

export const userscripts = async (webContents: WebContents): Promise<void> => {
  await getUserScriptsFiles();
  await setUserScripts(webContents);
  await injectUserStyles(webContents);

  webContents.on(
    "did-start-navigation",
    async (_, __, isInPlace, isMainFrame) => {
      if (isMainFrame && !isInPlace) {
        await getUserScriptsFiles();
        await setUserScripts(webContents);
      }
    },
  );

  webContents.on("did-finish-load", () => injectUserStyles(webContents));
};
