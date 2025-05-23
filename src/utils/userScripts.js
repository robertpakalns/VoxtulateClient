const { readFileSync, mkdirSync, existsSync, readdirSync, writeFileSync } = require("fs")
const { configDir } = require("./config.js")
const path = require("path")

const defaultConfig = {
    enable: true,
    scripts: {},
    styles: {}
}

const handleObject = (obj, array) => {

    // Fill the object if missing keys
    for (const key of array) if (!(key in obj)) obj[key] = true

    // Clear unexpected keys
    const keySet = new Set(array)
    for (const key in obj) if (!keySet.has(key)) delete obj[key]
}

const userScriptsPath = path.join(configDir, "userscripts.json")
if (!existsSync(userScriptsPath)) writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2))
const userScriptsDir = path.join(configDir, "scripts")
if (!existsSync(userScriptsDir)) mkdirSync(userScriptsDir, { recursive: true })
const userStylesDir = path.join(configDir, "styles")
if (!existsSync(userStylesDir)) mkdirSync(userStylesDir, { recursive: true })

let userScripts
let userStyles

const getUserScriptsFiles = () => {
    const originalData = JSON.parse(readFileSync(userScriptsPath, "utf8"))
    const { enable, scripts, styles } = originalData

    const originalEnable = enable
    const originalScripts = JSON.stringify(scripts)
    const originalStyles = JSON.stringify(styles)

    userScripts = readdirSync(userScriptsDir).filter(script => script.endsWith(".js"))
    userStyles = readdirSync(userStylesDir).filter(style => style.endsWith(".css"))

    handleObject(scripts, userScripts)
    handleObject(styles, userStyles)

    if (
        originalEnable !== enable ||
        originalScripts !== JSON.stringify(scripts) ||
        originalStyles !== JSON.stringify(styles)
    ) writeFileSync(userScriptsPath, JSON.stringify({ enable, scripts, styles }, null, 2))
}

const setUserScripts = webContents => {

    const { enable, scripts, styles } = JSON.parse(readFileSync(userScriptsPath, "utf8"))

    // User scripts
    // .js files only
    for (const el of userScripts) {
        if (scripts[el] === false) continue
        const script = path.join(userScriptsDir, el)
        if (enable && existsSync(script)) webContents.executeJavaScript(readFileSync(script, "utf8"))
    }

    // User styles
    // .css files only
    for (const el of userStyles) {
        if (styles[el] === false) continue
        const style = path.join(userStylesDir, el)
        if (enable && existsSync(style)) webContents.insertCSS(readFileSync(style, "utf8"))
    }
}

module.exports = { setUserScripts, getUserScriptsFiles, userScriptsPath }