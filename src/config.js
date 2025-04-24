const { existsSync, mkdirSync, writeFileSync, readFileSync } = require("fs")
const { homedir } = require("os")
const path = require("path")

const defaultConfig = {
    client: {
        firstJoin: true,
        adblocker: true,
        fpsUncap: true,
        fullscreen: false,
        swapper: null,
        hint: true,
        proxyDomain: false
    },
    discord: {
        joinButton: true,
        notification: true
    },
    interface: {
        inventorySorting: true,
        console: true,
        chatOpacity: "100",
        clientStyles: true
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
    static configInstance = null
    static file = configPath

    constructor() {
        if (Config.configInstance) this.config = Config.configInstance
        else {
            this.config = JSON.parse(readFileSync(Config.file, "utf8"))
            this.fillConfig()
            this.cleanConfig()
            Config.configInstance = this.config
        }
    }

    get(key) {
        let result = this.config
        for (const el of key.split(".")) {
            if (result === null || typeof result !== "object") return undefined
            result = result[el]
        }
        return result
    }

    set(key, value) {
        const keys = key.split(".")
        const lastKey = keys.pop()

        let result = this.config
        for (const k of keys) {
            if (typeof result[k] !== "object" || result[k] === null) result[k] = {}
            result = result[k]
        }
        result[lastKey] = value

        writeFileSync(Config.file, JSON.stringify(this.config, null, 2))
    }

    default() {
        this.config = defaultConfig
        writeFileSync(Config.file, JSON.stringify(this.config, null, 2))
    }

    // Fills the config with default values if missing
    fillConfig(source = defaultConfig, target = this.config) {
        for (const key in source) {
            const s = source[key]
            const t = target[key]

            if (typeof s === "object" && s !== null) {
                if (typeof t !== "object" || t === null) target[key] = {}
                this.fillConfig(s, target[key])
            }
            else if (t === undefined) target[key] = s
        }

        writeFileSync(Config.file, JSON.stringify(this.config, null, 2))
    }

    // Cleans the config from unregistered values
    cleanConfig(source = defaultConfig, target = this.config) {
        for (const key in target) {
            if (!(key in source)) delete target[key]
            else if (typeof source[key] === "object" && source[key] !== null) this.cleanConfig(source[key], target[key])
        }
        writeFileSync(Config.file, JSON.stringify(this.config, null, 2));
    }
}

module.exports = { Config, configPath, defaultConfig, configDir }