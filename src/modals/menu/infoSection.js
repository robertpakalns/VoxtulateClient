const { createEl } = require("../../utils/functions.js")
const { configDir } = require("../../utils/config.js")
const { shell } = require("electron")
const path = require("path")

const createInfoSection = () => {
    const dirObj = {
        "Client User Data": "/",
        "Config File": "config.json",
        "Swapper Folder": "swapper",
        "Scripts Folder": "scripts",
        "Styles Folder": "styles",
        "Userscripts Config": "userscripts.json"
    }

    for (const el in dirObj) {
        const _name = createEl("td", { textContent: el })
        const _button = createEl("button", {}, "", "Open")
        _button.addEventListener("click", () => shell.openPath(path.join(configDir, dirObj[el])))
        const _buttonTd = createEl("td", {}, "", [_button])
        const _tr = createEl("tr", {}, "", [_name, _buttonTd])

        document.getElementById("dirBody").appendChild(_tr)
    }
}

module.exports = createInfoSection