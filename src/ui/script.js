const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const { readFileSync, writeFileSync } = require("fs")
const path = require("path")
const config = new Config
const { createEl, timeLeft, isNum, copyNode, creationTime, sessionFetch, el } = require("../functions.js")
const SettingsModal = require("../modals/settings/script.js")
const InfoModal = require("../modals/info/script.js")
const InventoryModal = require("../modals/inventory/script.js")
const UpdatesModal = require("../modals/updates/script.js")

let marketData, listedData, accountData, playerData
const { console: enableConsole, chatOpacity, inventorySorting } = config.get("interface")

const enableStyles = () => {
    const { enable, custom, css, js } = config.get("styles")

    const bgURL = path.join(__dirname, "../../assets/bg.webp").replace(/\\/g, "/")
    const fontURL = path.join(__dirname, "../../assets/fonts/Roboto.ttf").replace(/\\/g, "/")
    const monoFontURL = path.join(__dirname, "../../assets/fonts/RobotoMono.ttf").replace(/\\/g, "/")
    const textURL = path.join(__dirname, "../../assets/text.webp").replace(/\\/g, "/")

    const customCSS = readFileSync(path.join(__dirname, "../../src/ui/style.css"), "utf8") + `
    @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`

    const clientCSS = `
    @font-face { font-family: "Roboto-Mono"; src: url(${monoFontURL}) format("truetype") }
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} !important }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomCreate { margin: 20px; position: absolute; font-weight: 900 }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${enableConsole ? "100%" : "0%"} }
    .voxiomBlocks { margin: auto; width: 100%; position: absolute; bottom: 35%; text-align: center; font-size: 10px }
    .voxiomCrosshair { top: 50vh; left: 50vw; position: fixed; transform: translate(-50%, -50%) }
    .voxiomSkinName { width: 100%; position: absolute; bottom: 0; left: 0; text-align: center; font-size: 0.8rem; color: gray }
    .voxiomSkinsButton { background: #646464; display: flex; align-items: center; padding: 10px; margin-right: 20px; cursor: pointer }
    .gem { margin-left: 3px; height: 9px }
    .skinModal { width: 100%; height: 100%; z-index: 9999; display: none }
    .hint { display: ${config.get("client.hint") ? "block" : "none"}; position: absolute; bottom: -25px; left: 15px }
    ${inventorySorting ? ".hYnMmT { display: none }" : ""}`

    const enableScript = createEl("script", { textContent: enable && custom ? js : "" })
    const enableStyles = createEl("style", { textContent: enable ? custom ? css : customCSS : "" })
    const clientStyles = createEl("style", { textContent: clientCSS })
    document.head.append(enableScript, enableStyles, clientStyles)

    const crosshair = createEl("img", { src: config.get("crosshair.url") }, "voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyle = (selector, property, value) => {
        const { sheet } = clientStyles
        const rule = Array.from(sheet.cssRules).find(el => el.selectorText === selector)
        rule ? rule.style[property] = value : sheet.insertRule(`${selector} { ${property}: ${value}; }`, sheet.cssRules.length)
    }

    ipcRenderer.on("change-css", (_, enable, custom, code) => enableStyles.textContent = enable ? custom ? code : customCSS : "")
    ipcRenderer.on("change-js", (_, enable, custom, code) => enable && custom && eval(code))
    ipcRenderer.on("toggle-hint", (_, enable) => updateStyle(".hint", "display", enable ? "block" : "none"))
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

const advancedInventory = async () => {
    const market = await sessionFetch("https://tricko.pro/assets/voxiom/voxiomMarket.json")
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
        if (url === "/profile/me") accountData = JSON.parse(data)
        if (url.includes("/profile/player")) playerData = JSON.parse(data)

        return r
    }))

    inmenu.init()
    inmenu.work()

    const _inventoryButton = createEl("div", {}, "voxiomSkinsButton", ["Advanced Sorting"])
    _inventoryButton.addEventListener("click", async () => {
        document.querySelector("#inventoryModal").classList.toggle("open")
        inmenu.currentPage = 0
        inmenu.renderPage()
    })

    // const _previewButton = createEl("div", {}, "voxiomSkinsButton", ["Preview"])

    const observer = new MutationObserver(() => {
        const { pathname } = window.location
        const isMarket = pathname === "/loadouts/market" || (pathname === "/loadouts" && document.querySelector(".dzKqCZ"))
        const isSales = pathname === "/loadouts/sales"

        if (inmenu.data?.data?.length > 0 &&
            !document.querySelector(".voxiomSkinsButton") &&
            ["/loadouts", "/loadouts/inventory"].includes(pathname)
            // ) document.querySelector(".iRauPR")?.append(_inventoryButton, _previewButton)
        ) document.querySelector(".iRauPR")?.append(_inventoryButton)
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

const createModals = () => {
    const modalCSS = readFileSync(path.join(__dirname, "../modals/style.css"), "utf8")
    const modalStyles = createEl("style", { textContent: modalCSS })
    document.head.appendChild(modalStyles)

    const smenu = new SettingsModal
    smenu.init()
    smenu.work()

    const imenu = new InfoModal
    imenu.init()
    imenu.work()

    const umenu = new UpdatesModal
    umenu.init()
    umenu.work()

    if (inventorySorting) advancedInventory()
}

document.addEventListener("DOMContentLoaded", () => {
    enableStyles()

    const { Settings, Info } = config.get("keybinding.content")
    const consoleCont = createEl("div", { className: "voxiomConsole voxiomCreate" })
    const blocksCont = createEl("div", { className: "voxiomBlocks voxiomCreate" })
    const hintCont = createEl("div", { id: "hintCont" }, "hint", [`Press ${Settings} to open settings, ${Info} to open info window`])
    document.body.append(consoleCont, blocksCont)

    const cloneData = (type, data) => {
        const { pathname } = window.location
        if (["/account", `/player/${type}`].includes(pathname) || pathname.endsWith("/ctg")) copyNode("KPG", isNum(data.ctg.total_kills, data.ctg.total_games_played), "kpg")
        if (pathname === `/account/br` || pathname.endsWith("/br")) copyNode("KPG", isNum(data.br.total_kills, data.br.total_games_played), "kpg")
        if (["/account", `/player/${type}`].includes(pathname)) {
            copyNode("Creation Date", creationTime(data.creation_time), "createdAt")
            copyNode("Gems", data.gems, "gems")
        }
    }
    setInterval(() => {
        //hint
        if (!document.querySelector("#hintCont")) document.querySelector(".ljNuSc")?.appendChild(hintCont)

        //console
        const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
        if (t && t.innerHTML !== "") {
            const c = t.innerHTML
            const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
            consoleCont.innerHTML = `${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`
        }
        else consoleCont.innerHTML = ""

        //blocks
        blocksCont.innerHTML = document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || ""

        //player data
        const { pathname } = window.location
        if (pathname.startsWith("/account")) cloneData("account", accountData.data)
        if (pathname.startsWith("/player/")) cloneData(pathname.split("/")[2], playerData.data)
    }, 50)

    document.addEventListener("click", e => {
        const el = e.target.closest(".dELrkI")
        if (el) {
            e.preventDefault()
            shell.openPath(el.href)
        }
    })

    createModals()
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => writeFileSync(file, localStorage.getItem("persist:root")))
ipcRenderer.on("toggle-window", (_, modal) => {
    const openedModal = document.querySelector(".wrapper.open")

    if (document.querySelector(".bNczYf")) {
        openedModal?.classList.toggle("open")
        if (openedModal?.id !== modal) document.querySelector(`#${modal}`)?.classList.toggle("open")
        return
    }

    if (modal === "null") document.querySelector(".enmYtp") ? document.querySelector("canvas").requestPointerLock() : document.exitPointerLock()
    if (openedModal) {
        openedModal.classList.toggle("open")
        if (modal === "null" || openedModal.id === modal) document.querySelector("canvas").requestPointerLock()
        else document.querySelector(`#${modal}`).classList.toggle("open")
    }
    else if (modal !== "null") {
        document.querySelector(`#${modal}`).classList.toggle("open")
        document.exitPointerLock()
    }
})