const { createEl, isNum, creationTime, loadAsset } = require("../functions.js")
const { readFileSync, writeFileSync } = require("fs")
const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const path = require("path")
const config = new Config
const MenuModal = require("../modals/menu/script.js")
const advancedInventory = require("./advancedInventory.js")

let accountData, playerData
const { console: enableConsole, chatOpacity, inventorySorting, clientStyles: styles } = config.get("interface")

const enableStyles = () => {

    // Custom client styles
    const fontURL = loadAsset("fonts/Roboto.ttf").replace(/\\/g, "/")
    const textURL = loadAsset("text.webp").replace(/\\/g, "/")
    const bgURL = loadAsset("bg.webp").replace(/\\/g, "/")
    const customCSS = readFileSync(path.join(__dirname, "../../src/ui/clientStylesCustom.css"), "utf8") + `
    @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`

    // Styles for the client features
    const monoFontURL = loadAsset("fonts/RobotoMono.ttf").replace(/\\/g, "/")
    const clientCSS = readFileSync(path.join(__dirname, "../../src/ui/clientStylesMain.css"), "utf8") + `
    @font-face { font-family: "Roboto-Mono"; src: url(${monoFontURL}) format("truetype") }
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${enableConsole ? "100%" : "0%"} }
    .hint { display: ${config.get("client.hint") ? "block" : "none"} }
    .hYnMmT { display: ${inventorySorting ? "none" : "block"} }"`

    const enableStyles = createEl("style", { textContent: styles ? customCSS : "" })
    const clientStyles = createEl("style", { textContent: clientCSS })
    document.head.append(enableStyles, clientStyles)

    const crosshair = createEl("img", { src: config.get("crosshair.url") }, "voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyle = (selector, property, value) => {
        const el = document.querySelector(selector)
        if (el) el.style[property] = value
    }

    ipcRenderer.on("change-styles", (_, enable) => enableStyles.textContent = enable ? customCSS : "")
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

const createModals = () => {
    const modalCSS = readFileSync(path.join(__dirname, "../modals/style.css"), "utf8")
    const modalStyles = createEl("style", { textContent: modalCSS })
    document.head.appendChild(modalStyles)

    const menuModal = new MenuModal
    menuModal.init()
    menuModal.work()

    if (inventorySorting) advancedInventory()
}

document.addEventListener("DOMContentLoaded", () => {
    enableStyles()

    const { MenuModal } = config.get("keybinding.content")
    const consoleCont = createEl("div", { className: "voxiomConsole voxiomCreate" })
    const blocksCont = createEl("div", { className: "voxiomBlocks voxiomCreate" })
    const hintCont = createEl("div", { id: "hintCont" }, "hint", [`Press ${MenuModal} to open menu`])
    document.body.append(consoleCont, blocksCont)

    const _fetch = fetch
    window.fetch = (...args) => _fetch(...args).then(r => r.clone().text().then(data => {
        const [url] = args

        if (url === "/profile/me") accountData = JSON.parse(data)
        if (url.includes("/profile/player")) playerData = JSON.parse(data)

        return r
    }))

    const copyNode = (label, value, id) => {
        if (document.querySelector(`#${id}`)) {
            document.querySelector(`#${id}`).children[1].textContent = value
            return
        }

        const node = document.querySelector(".bejTKB")
        if (!node) return

        const copy = node.cloneNode(true)
        copy.id = id
        node.parentElement.appendChild(copy)

        copy.children[0].innerHTML = label
        copy.children[1].innerHTML = value
    }

    const cloneData = (name, data, path) => {
        if (!data) return

        const validPaths = new Set(["/account", "/account/br", "/account/ctg", `/player/${name}`, `/player/${name}/br`, `/player/${name}/ctg`])
        if (!validPaths.has(path)) return

        const mode = path.endsWith("/br") ? "br" : "ctg"
        copyNode("KPG", isNum(data[mode].total_kills, data[mode].total_games_played), "kpg")
        copyNode("Creation Date", creationTime(data.creation_time), "createdAt")
        copyNode("Gems", data.gems, "gems")
    }

    const observer = new MutationObserver(() => {
        // Hint message
        if (!document.querySelector("#hintCont")) document.querySelector(".ljNuSc")?.appendChild(hintCont)

        // Player data
        const { pathname } = window.location
        if (pathname.startsWith("/account")) cloneData("account", accountData?.data, pathname)
        if (pathname.startsWith("/player/")) cloneData(pathname.split("/")[2], playerData?.data, pathname)
    })
    observer.observe(document.querySelector("#app"), { childList: true, subtree: true })

    setInterval(() => {
        // Mini console
        const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
        if (t && t.innerHTML !== "") {
            const c = t.innerHTML
            const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
            consoleCont.innerHTML = `${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`
        }
        else consoleCont.innerHTML = ""

        // Blocks
        blocksCont.innerHTML = document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || ""
    }, 50)

    document.addEventListener("click", e => {
        const el = e.target.closest(".dELrkI")
        if (!el) return
        e.preventDefault()
        shell.openPath(el.href)
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