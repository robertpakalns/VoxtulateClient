const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const fs = require("fs")
const path = require("path")
const config = new Config
const { el, createEl, creationTime, Voxiom, timeLeft } = require("../functions.js")

let skinSettings, inventoryData, marketData, listedData

const enableStyles = () => {
    const { enable, custom, css, js } = config.get("styles")
    const { console: enableConsole, chatOpacity, inventorySorting } = config.get("interface")
    console.log({ enableConsole, chatOpacity, inventorySorting })

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
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} !important }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomCreate { margin: 20px; position: absolute; font-weight: 900 }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${enableConsole ? "100%" : "0%"} }
    .voxiomBlocks { margin: auto; width: 100%; position: absolute; bottom: 35%; text-align: center; font-size: 10px }
    .voxiomCrosshair { top: 50vh; left: 50vw; position: fixed; transform: translate(-50%, -50%) }
    .voxiomSkinName { width: 100%; position: absolute; bottom: 0; left: 0; text-align: center; font-size: 0.8rem; color: gray }
    ${inventorySorting ? `
    .UOSSK { display: none }
    .hYnMmT { display: none }
    .gem { margin-left: 3px; height: 9px }` : ""}`

    document.head.append(enableScript, enableStyles, clientStyles)

    ipcRenderer.on("change-css", (_, enable, custom, code) => enableStyles.textContent = enable ? custom ? code : customCSS : "")
    ipcRenderer.on("change-js", (_, enable, custom, code) => enable && custom && eval(code))

    const crosshair = document.createElement("img")
    crosshair.src = config.get("crosshair.url")
    crosshair.classList.add("voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyleRule = (selector, property, value) => {
        const { sheet } = clientStyles
        const rule = Array.from(sheet.cssRules).find(el => el.selectorText === selector)
        rule ? rule.style[property] = value : sheet.insertRule(`${selector} { ${property}: ${value}; }`, sheet.cssRules.length)
    }

    ipcRenderer.on("change-opacity", (_, opacity) => updateStyleRule(".lpfJAq, .lpdfTz", "opacity", `${opacity}%`))
    ipcRenderer.on("set-console", (_, enable) => {
        updateStyleRule('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]', "opacity", enable ? "0%" : "100%")
        updateStyleRule(".voxiomConsole", "opacity", enable ? "100%" : "0%")
    })
    ipcRenderer.on("change-crosshair", (_, enable, url) => {
        updateStyleRule(".voxiomCrosshair", "display", enable ? "block" : "none")
        crosshair.src = url
    })
}

const advancedInventory = () => {
    const inventoryPage = fs.readFileSync(path.join(__dirname, "../../src/modals/inventory/index.html"), "utf8")
    const market = JSON.parse(fs.readFileSync(path.join(__dirname, "../market.json"), "utf8"))
    const gemPath = path.join(__dirname, "../../assets/icons/gem.webp")

    const _fetch = window.fetch
    window.fetch = (...args) => _fetch(...args).then(r => r.json().then(data => {
        const [url] = args
        if (url === "/profile/myinv") {
            const { name, id, rotation = "", creation = "", model = "", rarity = "" } = skinSettings
            const newData = {
                ...data,
                data: data.data.map(el => {
                    const skin = market.data[el.type - 1]
                    return { ...el, name: skin.name, rotation: skin.rotation, model: skin.type, rarity: skin.rarity }
                }).filter(el =>
                    (!name || el.name.toLowerCase().includes(name.toLowerCase())) &&
                    (!id || el.type.toString().includes(id)) &&
                    (rotation === "" || el.rotation === (rotation === "true")) &&
                    (model === "" || el.model === model) &&
                    (rarity === "" || el.rarity === rarity)
                ).sort((a, b) => !creation ? 0 : creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)
            }
            inventoryData = newData
            return new Response(JSON.stringify(newData))
        }
        if (url === "/market/public") marketData = data
        if (url === "/market/my_listed_items") listedData = data
        return new Response(JSON.stringify(data))
    }))

    skinSettings = JSON.parse(sessionStorage.getItem("skinSettings")) || {
        name: "", id: "", rotation: "", defaults: true, creation: "", model: "", rarity: ""
    }

    const observer = new MutationObserver(() => {
        const { pathname } = window.location
        const isInventory = ["/loadouts", "/loadouts/inventory"].includes(pathname) && !document.querySelector(".dzKqCZ")
        const isMarket = pathname === "/loadouts/market" || (pathname === "/loadouts" && document.querySelector(".dzKqCZ"))
        const isSales = pathname === "/loadouts/sales"
        if (!isInventory && !isMarket && !isSales) return

        document.querySelectorAll(".kiKVOk").forEach((el, i) => {
            if (el.parentElement.parentElement.querySelector(".voxiomSkinName")) return

            const isDefault = el.textContent === "Default"
            if (skinSettings.defaults === "false" && isDefault) el.closest(".lcogQs").remove()

            const skin = isInventory ? inventoryData.data[i / 2] : isMarket ? marketData.data.market_items[i / 2] : listedData.data.player_market_items[i / 2]
            const _image = isMarket || isSales ? createEl("img", { src: gemPath }, "gem") : ""
            const _name = createEl("div", {
                textContent: isInventory && !isDefault ? `${skin.type} | ${creationTime(skin.creation_time)}` :
                    isSales ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` :
                        isMarket ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` : ""
            }, "voxiomSkinName", [_image])

            el.parentElement.parentElement.appendChild(_name)
        })

        if (document.querySelector(".iRauPR") &&
            ["/loadouts", "/loadouts/inventory"].includes(window.location.pathname) &&
            !document.querySelector("#voxiomInventory")) {

            document.querySelector(".iRauPR").innerHTML = inventoryPage

            document.querySelectorAll(".voxiomSelect").forEach(select => {
                const menu = select.querySelector(".voxiomSelectMenu")
                const selected = select.querySelector(".selected")
                const options = select.querySelectorAll(".option")

                selected?.addEventListener("click", () => menu.classList.toggle("active"))
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

            el("name").event("input", e => skinSettings.name = e.target.value)
            el("id").event("input", e => skinSettings.id = e.target.value)
            el("apply").event("click", () => {
                sessionStorage.setItem("skinSettings", JSON.stringify(skinSettings))
                window.location.reload()
            })
            el("clear").event("click", () => {
                sessionStorage.removeItem("skinSettings")
                window.location.reload()
            })
        }
    })

    observer.observe(document.querySelector("#app"), {
        childList: true,
        subtree: true
    })
}

document.addEventListener("DOMContentLoaded", () => {
    window.trustedTypes?.createPolicy("default", { createHTML: i => i })

    enableStyles()

    new Voxiom("div", "voxiomConsole voxiomCreate", document.body)
        .do(e => {
            const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
            if (t && t.innerHTML !== "") {
                const c = t.innerHTML
                const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
                e.text(`${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`)
            }
            else e.text("")
        }, 50)

    new Voxiom("div", "voxiomBlocks voxiomCreate", document.body)
        .do(e => e.text(document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || ""), 50)

    document.addEventListener("click", e => {
        const el = e.target.closest(".dELrkI")
        if (el) {
            e.preventDefault()
            shell.openPath(el.href)
        }
    })

    if (config.get("interface.inventorySorting")) advancedInventory()
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => fs.writeFileSync(file, localStorage.getItem("persist:root")))