const os = require("os")
const fs = require("fs")
const path = require("path")

const defaultConfig = {
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
    console: true,
    chatOpacity: "100",
    fullscreen: false,
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
    },
    swapper: {
        enable: false,
        content: {
            CAR_MP3: null,
            TAR_MP3: null,
            SAR_MP3: null,
            EAR_MP3: null,
            HSR_MP3: null,
            LSR_MP3: null,
            LSMG_MP3: null,
            CSMG_MP3: null,
            BSG_MP3: null,
            SP_MP3: null,
            MP_MP3: null,
            RELOAD_1_MP3: null,
            RELOAD_2_MP3: null,
            KILL_MP3: null,
            HIT_MP3: null,
            HEADSHOT_MP3: null,
            LAVA_1_MP3: null,
            LAVA_2_MP3: null,
            COUNTDOWN_MP3: null,
            DAMAGE_MP3: null,
            GRASS_MP3: null,
            SAND_MP3: null,
            LEAF_MP3: null,
            WOOD_MP3: null,
            DIRT_MP3: null,
            BRICK_MP3: null,
            STONE_MP3: null,
            WATER_1_MP3: null,
            WATER_2_MP3: null,
            CRATE_MP3: null,
            GAME_END_MP3: null,
            DENIED_MP3: null,
            SPRAY_MP3: null,
            TNT_FIRE_MP3: null,
            TNT_BOOM_MP3: null,
            DROP_COLLECT_MP3: null,
            GREEN_SOLDIER_PNG: null,
            RED_SOLDIER_PNG: null,
            BLUE_SOLDIER_PNG: null,
            INDICATOR_PNG: null,
            SPRAY_PNG: path.join(__dirname, "../assets/spray.png"),
            TEXTURE_PNG: null
        }
    }
}

const configDir = path.join(os.homedir(), "AppData/Roaming/voxtulate-client")
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