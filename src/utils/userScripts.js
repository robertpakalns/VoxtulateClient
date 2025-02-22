const { readFileSync, mkdirSync, existsSync, readdirSync } = require("fs")
const { configDir } = require("../config.js")
const path = require("path")

const userScripts = webContents => {

    // User scripts
    // .js files only
    const userScriptsDir = path.join(configDir, "scripts")
    if (!existsSync(userScriptsDir)) mkdirSync(userScriptsDir, { recursive: true })
    const userScripts = readdirSync(userScriptsDir).filter(script => script.endsWith(".js"))
    userScripts.forEach(script => webContents.executeJavaScript(readFileSync(path.join(userScriptsDir, script), "utf8")))

    // User styles
    // .css files only
    const userStylesDir = path.join(configDir, "styles")
    if (!existsSync(userStylesDir)) mkdirSync(userStylesDir, { recursive: true })
    const userStyles = readdirSync(userStylesDir).filter(style => style.endsWith(".css"))
    userStyles.forEach(style => webContents.insertCSS(readFileSync(path.join(userStylesDir, style), "utf8")))
}

module.exports = userScripts