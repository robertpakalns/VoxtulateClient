const os = require("os")
const fs = require("fs")
const path = require("path")

const defaultConfig = {
    client: {
        firstJoin: true,
        adblocker: true,
        fpsUncap: true,
        fullscreen: false,
        rpc: true,
        swapper: false
    },
    interface: {
        inventorySorting: true,
        console: true,
        chatOpacity: "100"
    },
    styles: {
        enable: true,
        custom: false,
        js: "",
        css: ""
    },
    crosshair: {
        enable: false,
        url: ""
    },
    keybinding: {
        enable: false,
        content: {
            Close_Modal: "Escape",
            Settings: "F1",
            Info: "F2",
            Reload: "F5",
            Fullscreen: "F11",
            DevTools: "F12"
        }
    }
}

const configDir = path.join(os.homedir(), "Documents/VoxtulateClient")
const configPath = path.join(configDir, "config.json")
if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

class Config {
    constructor() {
        this.file = configPath
        this.config = JSON.parse(fs.readFileSync(this.file, "utf8"))
        this.fillDefaults()
    }

    get(key) {
        return key.split(".").reduce((acc, el) => acc && acc[el], this.config)
    }

    set(key, value) {
        key.split(".").reduce((obj, k, i, keys) => obj[k] = i === keys.length - 1 ? value : obj[k] || {}, this.config)
        fs.writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }

    default() {
        this.config = defaultConfig
        fs.writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }

    fillDefaults(source = defaultConfig, target = this.config) {
        for (const key in source) if (source.hasOwnProperty(key)) {
            if (target[key] === undefined) target[key] = source[key]
            else if (typeof source[key] === "object" && source[key] !== null) {
                if (typeof target[key] !== "object" || target[key] === null) target[key] = {}
                this.fillDefaults(source[key], target[key])
            }
        }
        fs.writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }
}

module.exports = { Config, configPath, defaultConfig }