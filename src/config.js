const fs = require("fs")
const path = require("path")
const os = require("os")

const example = {
    client: {
        adblocker: true,
        fpsUncap: true
    },
    crosshair: {
        url: "",
        enable: false
    },
    styles: {
        enable: true,
        custom: false,
        js: "",
        css: ""
    },
    console: true
}

const appDataPath = path.join(os.homedir(), "AppData/Roaming/voxtulate-client")
if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath, { recursive: true })
const configPath = path.join(appDataPath, "config.json")
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify(example, null, 2))
fs.writeFileSync(configPath, JSON.stringify(JSON.parse(fs.readFileSync(configPath, "utf8")), null, 2))

class Config {
    constructor() {
        this.file = configPath
        this.config = JSON.parse(fs.readFileSync(this.file, "utf8"))
    }

    get(key) {
        return key.split(".").reduce((acc, el) => acc && acc[el], this.config)
    }

    set(key, value) {
        key.split(".").reduce((obj, k, i, keys) => obj[k] = i === keys.length - 1 ? value : obj[k] || {}, this.config)
        fs.writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }

    clear() {
        this.config = example
        fs.writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }
}

module.exports = { Config, appDataPath }