const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const fs = require("fs")
const path = require("path")
const config = new Config()
const { createEl, creationTime, Voxiom, createVoxiomSelect } = require("../functions.js")

let skinSettings, inventoryData

const enableStyles = () => {
    const { enable, custom, css, js } = config.get("styles")

    const enableScript = document.createElement("script")
    enableScript.textContent = enable && custom ? js : ""

    const bgURL = path.join(__dirname, "../../assets/bg.webp").replace(/\\/g, "/")
    const fontURL = path.join(__dirname, "../../assets/fonts/Roboto.ttf").replace(/\\/g, "/")
    const textURL = path.join(__dirname, "../../assets/text.webp").replace(/\\/g, "/")

    const customCSS = fs.readFileSync(path.join(__dirname, "../../src/ui/style.css"), "utf8") + `
    @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`

    const enableStyles = document.createElement("style")
    enableStyles.textContent = enable ? custom ? css : customCSS : ""

    const clientStyles = document.createElement("style")
    clientStyles.textContent = `
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${config.get("console") ? "0%" : "100%"} !important }
    .lpfJAq, .lpdfTz { opacity: ${config.get("chatOpacity")}% }
    .voxiomCreate { margin: 20px; position: absolute; font-weight: 900 }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${config.get("console") ? "100%" : "0%"} }
    .voxiomBlocks { margin: auto; width: 100%; position: absolute; bottom: 35%; text-align: center; font-size: 10px }
    .voxiomCrosshair { top: 50vh; left: 50vw; position: fixed; transform: translate(-50%, -50%) }
    .voxiomSkins { background: #646464; padding: 0 10px; line-height: 38px; cursor: pointer }
    .voxiomInput { height: 100%; color: white; background: #646464; border: none; outline: none; }
    .voxiomInput::placeholder { color: rgba(255, 255, 255, 0.5) }
    .iRauPR { flex-wrap: wrap; gap: 10px }
    .iRauPR > * { height: 38px }
    .voxiomSkinName { width: 100%; position: absolute; bottom: 0; left: 0; text-align:center; font-size: 12px; color: gray }
    .voxiomSkinID { position: absolute; top: 0; right: 0; font-size: 12px; color: gray }
    
    .voxiomSelectMenu.active { display: block }
    .active { display: block }
    .voxiomSelect { padding: 0 10px; background: #646464; color: white; line-height: 38px; position: relative; cursor: pointer; z-index: 1000 }
    .voxiomSelectMenu { display: none; cursor: pointer; width: calc(100% + 20px); margin-left: -10px; text-align: center; z-index: 1001 }
    .option { background: #323232 }
    .option:hover { background: #646464 }
    .UOSSK { display: none }`

    document.head.append(enableScript, enableStyles, clientStyles)

    ipcRenderer.on("change-css", (_, enable, custom, code) => enableStyles.textContent = enable ? custom ? code : customCSS : "")
    ipcRenderer.on("change-js", (_, enable, custom, code) => enable && custom && eval(code))

    const crosshair = document.createElement("img")
    crosshair.src = config.get("crosshair.url")
    crosshair.classList.add("voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyleRule = (sheet, selector, property, value) => {
        const rule = Array.from(sheet.cssRules).find(el => el.selectorText === selector)
        rule ? rule.style[property] = value : sheet.insertRule(`${selector} { ${property}: ${value}; }`, sheet.cssRules.length)
    }

    ipcRenderer.on("change-opacity", (_, opacity) => updateStyleRule(clientStyles.sheet, ".lpfJAq, .lpdfTz", "opacity", `${opacity}%`))
    ipcRenderer.on("set-console", (_, enable) => {
        updateStyleRule(clientStyles.sheet, 'body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]', "opacity", enable ? "0%" : "100%")
        updateStyleRule(clientStyles.sheet, ".voxiomConsole", "opacity", enable ? "100%" : "0%")
    })
    ipcRenderer.on("change-crosshair", (_, enable, url) => {
        updateStyleRule(clientStyles.sheet, ".voxiomCrosshair", "display", enable ? "block" : "none")
        crosshair.src = url
    })
}

const advancedInventory = () => {
    const market = JSON.parse(fs.readFileSync(path.join(__dirname, "../market.json"), "utf8"))

    const _fetch = window.fetch
    window.fetch = (...args) => _fetch(...args).then(r => {
        if (args[0] === "/profile/myinv") return r.json().then(data => {

            const { name, id, rotation = "all", creation = "default", model = "all", rarity = "all" } = skinSettings

            const newContent = data
            newContent.data = newContent.data
                .map(el => {
                    const skin = market.data[el.type - 1]
                    return { ...el, name: skin.name, rotation: skin.rotation, model: skin.type, rarity: skin.rarity }
                })
                .filter(el =>
                    (name ? el.name.toLowerCase().includes(name.toLowerCase()) : true) &&
                    (id ? el.type.toString().includes(id) : true) &&
                    (rotation === "all" || (el.rotation === (rotation === "true"))) &&
                    (model === "all" || el.model === model) &&
                    (rarity === "all" || el.rarity === rarity)
                )
                .sort((a, b) => creation === "newest" ? b.creation_time - a.creation_time : creation === "oldest" ? a.creation_time - b.creation_time : null)

            inventoryData = newContent
            console.log(newContent)

            return new Response(JSON.stringify(newContent))
        })
        return r
    })

    setInterval(() => {
        if (document.querySelector(".iRauPR") && !document.querySelector("#voxiomFilter")) {

            skinSettings = JSON.parse(sessionStorage.getItem("skinSettings")) || {
                name: "", id: "", rotation: "all", defaults: true, creation: "default", model: "all", rarity: "all"
            }

            setInterval(() => {
                document.querySelectorAll(".kiKVOk").forEach((el, index) => {
                    const isDefault = el.textContent === "Common" || el.textContent === "Default"
                    const location = window.location.pathname === "/loadouts" || window.location.pathname === "/loadouts/inventory"

                    if (skinSettings.defaults === false && isDefault) el.parentElement.parentElement.parentElement.parentElement.remove()
                    if (!el.parentElement.parentElement.querySelector(".voxiomSkinName")) {
                        const _name = createEl("div", { textContent: location && !isDefault ? creationTime(inventoryData.data[index / 2].creation_time) : "" }, "voxiomSkinName")
                        const _id = createEl("div", { textContent: location && !isDefault ? inventoryData.data[index / 2].type : "" }, "voxiomSkinID")

                        el.parentElement.parentElement.append(_name, _id)
                    }
                })
            }, 50)

            const modelOptions = [
                { value: "all", text: "All Items" },
                { value: "CAR", text: "Combat Assault Rifle" },
                { value: "TAR", text: "Tactical Assault Rifle" },
                { value: "SAR", text: "Surge Assault Rifle" },
                { value: "EAR", text: "Elite Assault Rifle" },
                { value: "BSG", text: "Burst Shotgun" },
                { value: "LSMG", text: "Light Submachine Gun" },
                { value: "CSMG", text: "Compact Submachine Gun" },
                { value: "LSR", text: "Light Sniper Rifle" },
                { value: "HSR", text: "Heavy Sniper Rifle" },
                { value: "SP", text: "Strike Pistol" },
                { value: "MP", text: "Magnum Pistol" },
                { value: "S", text: "Shovel" },
                { value: "SPRAY", text: "Spray" }
            ]
            const _model = createVoxiomSelect(modelOptions, skinSettings, modelOptions.find(el => el.value === skinSettings.model).text, "model")

            const rarityOptions = [
                { value: "all", text: "All Rarities" },
                { value: "Common", text: "Common" },
                { value: "Noteworthy", text: "Noteworthy" },
                { value: "Precious", text: "Precious" },
                { value: "Magnificent", text: "Magnificent" },
                { value: "Extraordinary", text: "Extraordinary" },
                { value: "Covert", text: "Covert" },
                { value: "Artifact", text: "Artifact" }
            ]
            const _rarity = createVoxiomSelect(rarityOptions, skinSettings, rarityOptions.find(el => el.value === skinSettings.rarity).text, "rarity")

            const _name = createEl("div", { id: "voxiomFilter" }, "voxiomSkins", [
                createEl("input", { placeholder: "Filter by name", value: skinSettings.name }, "voxiomInput")
            ])
            _name.querySelector("input").addEventListener("input", e => skinSettings.name = e.target.value)

            const _id = createEl("div", {}, "voxiomSkins", [
                createEl("input", { placeholder: "Filter by ID", type: "number", value: skinSettings.id }, "voxiomInput")
            ])
            _id.querySelector("input").addEventListener("input", e => skinSettings.id = e.target.value)

            const rotationOptions = [
                { value: "all", text: "Rotation: all" },
                { value: true, text: "Rotation: true" },
                { value: false, text: "Rotation: false" }
            ]
            const _rotation = createVoxiomSelect(rotationOptions, skinSettings, `Rotation: ${skinSettings.rotation}`, "rotation")

            const defaultsOptions = [
                { value: true, text: "Defaults: true" },
                { value: false, text: "Defaults: false" }
            ]
            const _defaults = createVoxiomSelect(defaultsOptions, skinSettings, `Defaults: ${skinSettings.defaults}`, "defaults")

            const creationOptions = [
                { value: "default", text: "Creation date: default" },
                { value: "newest", text: "Creation date: newest" },
                { value: "oldest", text: "Creation date: oldest" }
            ]
            const _creation = createVoxiomSelect(creationOptions, skinSettings, `Creation date: ${skinSettings.creation}`, "creation")

            const _apply = createEl("div", { textContent: "Apply" }, "voxiomSkins")
            _apply.addEventListener("click", () => {
                sessionStorage.setItem("skinSettings", JSON.stringify(skinSettings))
                window.location.reload()
            })

            const _clear = createEl("div", { textContent: "Clear" }, "voxiomSkins")
            _clear.addEventListener("click", () => {
                skinSettings = null
                sessionStorage.removeItem("skinSettings")
                window.location.reload()
            })

            document.querySelector(".iRauPR").append(_model, _rarity, _name, _id, _rotation, _defaults, _creation, _apply, _clear)
        }
    }, 50)
}

document.addEventListener("DOMContentLoaded", () => {
    window.trustedTypes?.createPolicy("default", { createHTML: i => i })

    enableStyles()

    if (config.get("client.adblocker")) setInterval(() => document.querySelectorAll("[id^='voxiom-io']").forEach(e => e.remove()), 50)

    new Voxiom("div", "voxiomConsole voxiomCreate", document.body)
        .do(function () {
            const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
            if (t && t.innerHTML != "") {
                const c = t.innerHTML
                const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
                this.text(`${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`)
            }
            else this.text("")
        }, 50)

    new Voxiom("div", "voxiomBlocks voxiomCreate", document.body)
        .do(function () { this.text(document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || "") }, 50)

    setInterval(() => document.querySelectorAll(".cJoQGw").forEach(el => {
        const [r, g, b] = getComputedStyle(el).borderColor.match(/\d+/g).map(Number)
        el.style.background = `radial-gradient(circle, rgba(${r}, ${g}, ${b}, 0.3), rgba(${r}, ${g}, ${b}, 0.1))`
    }), 50)

    document.addEventListener("click", e => {
        const el = e.target.closest(".dELrkI")
        if (el) {
            e.preventDefault()
            shell.openPath(el.href)
        }
    })

    if (config.get("inventorySorting")) advancedInventory()
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => fs.writeFileSync(file, localStorage.getItem("persist:root")))