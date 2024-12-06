const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const fs = require("fs")
const path = require("path")
const config = new Config
const { createEl, Voxiom, timeLeft } = require("../functions.js")
const SettingsModal = require("../modals/settings/script.js")
const InfoModal = require("../modals/info/script.js")
const InventoryModal = require("../modals/inventory/script.js")

let marketData, listedData
const { console: enableConsole, chatOpacity, inventorySorting } = config.get("interface")

const enableStyles = () => {
    const { enable, custom, css, js } = config.get("styles")

    const bgURL = path.join(__dirname, "../../assets/bg.webp").replace(/\\/g, "/")
    const fontURL = path.join(__dirname, "../../assets/fonts/Roboto.ttf").replace(/\\/g, "/")
    const textURL = path.join(__dirname, "../../assets/text.webp").replace(/\\/g, "/")

    const customCSS = fs.readFileSync(path.join(__dirname, "../../src/ui/style.css"), "utf8") + `
    @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`

    const clientCSS = `
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} !important }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomCreate { margin: 20px; position: absolute; font-weight: 900 }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${enableConsole ? "100%" : "0%"} }
    .voxiomBlocks { margin: auto; width: 100%; position: absolute; bottom: 35%; text-align: center; font-size: 10px }
    .voxiomCrosshair { top: 50vh; left: 50vw; position: fixed; transform: translate(-50%, -50%) }
    .voxiomSkinName { width: 100%; position: absolute; bottom: 0; left: 0; text-align: center; font-size: 0.8rem; color: gray }
    .voxiomSkinsButton { width: 130px; background: #646464; display: flex; align-items: center; padding-left: 10px; cursor: pointer }
    .gem { margin-left: 3px; height: 9px }
    .skinModal { width: 100%; height: 100%; z-index: 9999; display: none }
    .open { display: block !important }
    ${inventorySorting ? ".hYnMmT { display: none }" : ""}`

    const enableScript = createEl("script", { textContent: enable && custom ? js : "" })
    const enableStyles = createEl("style", { textContent: enable ? custom ? css : customCSS : "" })
    const clientStyles = createEl("style", { textContent: clientCSS })
    document.head.append(enableScript, enableStyles, clientStyles)

    ipcRenderer.on("change-css", (_, enable, custom, code) => enableStyles.textContent = enable ? custom ? code : customCSS : "")
    ipcRenderer.on("change-js", (_, enable, custom, code) => enable && custom && eval(code))

    const crosshair = createEl("img", { src: config.get("crosshair.url") }, "voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyle = (selector, property, value) => {
        const { sheet } = clientStyles
        const rule = Array.from(sheet.cssRules).find(el => el.selectorText === selector)
        rule ? rule.style[property] = value : sheet.insertRule(`${selector} { ${property}: ${value}; }`, sheet.cssRules.length)
    }

    ipcRenderer.on("change-opacity", (_, opacity) => updateStyle(".lpfJAq, .lpdfTz", "opacity", `${opacity}%`))
    ipcRenderer.on("set-console", (_, enable) => {
        updateStyle('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]', "opacity", enable ? "0%" : "100%")
        updateStyle(".voxiomConsole", "opacity", enable ? "100%" : "0%")
    })
    ipcRenderer.on("change-crosshair", (_, enable, url) => {
        updateStyle(".voxiomCrosshair", "display", enable ? "block" : "none")
        crosshair.src = url
    })
}

const advancedInventory = () => {
    const market = JSON.parse(fs.readFileSync(path.join(__dirname, "../market.json"), "utf8"))
    const gemPath = path.join(__dirname, "../../assets/icons/gem.webp")

    const inmenu = new InventoryModal

    const _fetch = fetch
    window.fetch = (...args) => _fetch(...args).then(r => r.clone().text().then(data => {
        const [url] = args
        if (url === "/profile/myinv") {
            const { name = "", id = "", rotation = "", creation = "", model = "", rarity = "", equipped = "" } = inmenu.settings
            const parsedData = JSON.parse(data)
            const newData = {
                ...parsedData,
                data: parsedData.data.map(el => {
                    const skin = market.data[el.type - 1]
                    return { ...el, name: skin.name, rotation: skin.rotation, model: skin.type, rarity: skin.rarity }
                }).filter(el =>
                    (!name || el.name.toLowerCase().includes(name.toLowerCase())) &&
                    (!id || el.type.toString().includes(id)) &&
                    (rotation === "" || el.rotation === (rotation === "true")) &&
                    (model === "" || el.model === model) &&
                    (rarity === "" || el.rarity === rarity) &&
                    (equipped === "" || el.slot !== null === (equipped === "true"))
                ).sort((a, b) => !creation ? 0 : creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)
            }
            inmenu.setData(newData)
            return new Response(JSON.stringify(newData), r)
        }

        if (url === "/market/public") marketData = JSON.parse(data)
        if (url === "/market/my_listed_items") listedData = JSON.parse(data)

        return r
    }))

    inmenu.init()
    inmenu.work()

    const _button = createEl("div", { id: "voxiomSkinsButton" }, "voxiomSkinsButton", ["Advanced Sorting"])
    _button.addEventListener("click", async () => {
        document.querySelector("#inventoryModal").classList.toggle("open")
        inmenu.currentPage = 0
        inmenu.renderPage()
    })

    const observer = new MutationObserver(() => {
        const { pathname } = window.location
        const isMarket = pathname === "/loadouts/market" || (pathname === "/loadouts" && document.querySelector(".dzKqCZ"))
        const isSales = pathname === "/loadouts/sales"

        if (inmenu.data?.data?.length > 0 &&
            !document.querySelector("#voxiomSkinsButton") &&
            ["/loadouts", "/loadouts/inventory"].includes(pathname)
        ) document.querySelector(".iRauPR")?.appendChild(_button)
        if (!isMarket && !isSales) return

        document.querySelectorAll(".kiKVOk").forEach((el, i) => {
            if (el.parentElement.parentElement.querySelector(".voxiomSkinName")) return
            const skin = isMarket ? marketData.data.market_items[i / 2] : listedData.data.player_market_items[i / 2]
            const _image = isMarket || isSales ? createEl("img", { src: gemPath }, "gem") : ""
            const _name = createEl("div", { textContent: isSales || isMarket ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` : "" }, "voxiomSkinName", [_image])
            el.parentElement.parentElement.appendChild(_name)
        })
    })
    observer.observe(document.querySelector("#app"), { childList: true, subtree: true })
}

document.addEventListener("DOMContentLoaded", () => {
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

    if (inventorySorting) advancedInventory()

    const smenu = new SettingsModal
    smenu.init()
    smenu.work()

    const imenu = new InfoModal
    imenu.init()
    imenu.work()
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => fs.writeFileSync(file, localStorage.getItem("persist:root")))