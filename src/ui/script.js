const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const fs = require("fs")
const path = require("path")
const config = new Config
const { createEl, creationTime, Voxiom } = require("../functions.js")

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
    .UOSSK { display: ${config.get("inventorySorting") ? "none" : "block"} }`

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

            const { name, id, rotation = "", creation = "", model = "", rarity = "" } = skinSettings

            const newContent = data
            newContent.data = newContent.data
                .map(el => {
                    const skin = market.data[el.type - 1]
                    return { ...el, name: skin.name, rotation: skin.rotation, model: skin.type, rarity: skin.rarity }
                })
                .filter(el =>
                    (!name || el.name.toLowerCase().includes(name.toLowerCase())) &&
                    (!id || el.type.toString().includes(id)) &&
                    (rotation === "" || el.rotation === (rotation === "true")) &&
                    (model === "" || el.model === model) &&
                    (rarity === "" || el.rarity === rarity)
                )
                .sort((a, b) => creation === "" ? 0 : creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)

            inventoryData = newContent

            return new Response(JSON.stringify(newContent))
        })
        return r
    })

    setInterval(() => {
        if (document.querySelector(".iRauPR") && !document.querySelector("#voxiomInventory")) {

            skinSettings = JSON.parse(sessionStorage.getItem("skinSettings")) || {
                name: "", id: "", rotation: "", defaults: true, creation: "", model: "", rarity: ""
            }

            setInterval(() => {
                document.querySelectorAll(".kiKVOk").forEach((el, index) => {
                    const isDefault = el.textContent === "Common" || el.textContent === "Default"
                    const location = window.location.pathname === "/loadouts" || window.location.pathname === "/loadouts/inventory"

                    if (skinSettings.defaults === "false" && isDefault) el.parentElement.parentElement.parentElement.parentElement.remove()
                    if (!el.parentElement.parentElement.querySelector(".voxiomSkinName")) {
                        const skin = inventoryData.data[index / 2]
                        const _name = createEl("div", { textContent: location && !isDefault ? `${skin.type} | ${creationTime(skin.creation_time)}` : "" }, "voxiomSkinName")
                        el.parentElement.parentElement.appendChild(_name)
                    }
                })
            }, 50)

            document.querySelector(".iRauPR").innerHTML = fs.readFileSync(path.join(__dirname, "../../src/modals/inventory/index.html"), "utf8")

            document.querySelectorAll(".voxiomSelect").forEach(select => {
                const menu = select.querySelector(".voxiomSelectMenu")
                const selected = select.querySelector(".selected")
                const options = select.querySelectorAll(".option")

                selected?.addEventListener("click", () => menu?.classList.toggle("active"))
                options.forEach(option => {
                    if (option.dataset.value === skinSettings[select.id]) selected.textContent = option.textContent
                    option.addEventListener("click", () => {
                        selected.textContent = option.textContent
                        skinSettings[select.id] = option.dataset.value
                        menu.classList.remove("active")
                    })
                })
            })

            document.addEventListener("click", e => document.querySelectorAll(".voxiomSelectMenu.active").forEach(menu => {
                if (!menu.parentNode.contains(e.target)) menu.classList.remove("active")
            }))

            document.querySelector("#name").addEventListener("input", e => skinSettings.name = e.target.value)
            document.querySelector("#id").addEventListener("input", e => skinSettings.id = e.target.value)

            document.querySelector("#apply").addEventListener("click", () => {
                sessionStorage.setItem("skinSettings", JSON.stringify(skinSettings))
                window.location.reload()
            })
            document.querySelector("#clear").addEventListener("click", () => {
                sessionStorage.removeItem("skinSettings")
                window.location.reload()
            })
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
                this.text(`${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS < br > ${x} ${y} ${z} <br>${(c.match(/Latency: ([\d]+ms)/)[1])}`)
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