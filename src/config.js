const { homedir } = require("os")
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require("fs")
const path = require("path")

const defaultConfig = {
    client: {
        firstJoin: true,
        adblocker: true,
        fpsUncap: true,
        fullscreen: false,
        rpc: true,
        swapper: false,
        hint: true
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
            Updates: "F3",
            Reload: "F5",
            Fullscreen: "F11",
            DevTools: "F12"
        }
    }
}

const configDir = path.join(homedir(), "Documents/VoxtulateClient")
const configPath = path.join(configDir, "config.json")
if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true })
if (!existsSync(configPath)) writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

class Config {
    constructor() {
        this.file = configPath
        this.config = JSON.parse(readFileSync(this.file, "utf8"))
        this.fillConfig()
        this.cleanConfig()
    }

    get(key) {
        return key.split(".").reduce((acc, el) => acc && acc[el], this.config)
    }

    set(key, value) {
        key.split(".").reduce((obj, k, i, keys) => obj[k] = i === keys.length - 1 ? value : obj[k] || {}, this.config)
        writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }

    default() {
        this.config = defaultConfig
        writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }

    fillConfig(source = defaultConfig, target = this.config) {
        for (const key in source) if (source.hasOwnProperty(key)) {
            if (target[key] === undefined) target[key] = source[key]
            else if (typeof source[key] === "object" && source[key] !== null) {
                if (typeof target[key] !== "object" || target[key] === null) target[key] = {}
                this.fillConfig(source[key], target[key])
            }
        }
        writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }

    cleanConfig(source = defaultConfig, target = this.config) {
        for (const key in target) {
            if (!source.hasOwnProperty(key)) delete target[key]
            else if (typeof source[key] === "object" && source[key] !== null && typeof target[key] === "object") this.cleanConfig(source[key], target[key])
        }
        writeFileSync(this.file, JSON.stringify(this.config, null, 2))
    }
}

module.exports = { Config, configPath, defaultConfig }