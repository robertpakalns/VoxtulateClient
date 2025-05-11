const { createEl, isNum, creationTime } = require("../utils/functions.js")
const advancedInventory = require("./advancedInventory.js")
const MenuModal = require("../modals/menu/script.js")
const { readFileSync, writeFileSync } = require("fs")
const { ipcRenderer, shell } = require("electron")
const enableStyles = require("./enableStyles.js")
const { Config } = require("../utils/config.js")
const path = require("path")
const config = new Config

let accountData, playerData
const { inventorySorting } = config.get("interface")

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

    // Disable code execution if wrong domain
    if (!["voxiom.io", "historynotes.club"].includes(location.hostname)) return

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
        if (url.startsWith("/profile/player")) playerData = JSON.parse(data)

        return r
    }))

    const copyNode = (label, value, id) => {
        const nodeId = `node_${id}`

        if (document.getElementById(nodeId)) {
            document.getElementById(nodeId).children[1].textContent = value
            return
        }

        const node = document.querySelector(".bejTKB")
        if (!node) return

        const copy = node.cloneNode(true)
        copy.id = nodeId
        node.parentElement.appendChild(copy)

        copy.children[0].textContent = label
        copy.children[1].textContent = value
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
        if (!document.getElementById("hintCont")) document.querySelector(".ljNuSc")?.appendChild(hintCont)

        // Player data
        const { pathname } = window.location
        if (pathname.startsWith("/account")) cloneData("account", accountData?.data, pathname)
        if (pathname.startsWith("/player/")) cloneData(pathname.split("/")[2], playerData?.data, pathname)
    })
    observer.observe(document.getElementById("app"), { childList: true, subtree: true })

    setInterval(() => {
        // Mini console
        const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
        if (t && t.textContent !== "") {
            const c = t.innerHTML
            const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
            consoleCont.innerHTML = `${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`
        }
        else consoleCont.textContent = ""

        // Blocks
        blocksCont.textContent = document.querySelector(".biWqsQ")?.textContent.match(/Current mode: (\w+)/)[1] || ""
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
ipcRenderer.on("toggle-window", (_, modal) => { // Toggles modals on keybinds
    const openedModal = document.querySelector(".wrapper.open")

    if (document.querySelector(".bNczYf")) {
        openedModal?.classList.toggle("open")
        if (openedModal?.id !== modal) document.getElementById(modal)?.classList.toggle("open")
        return
    }

    if (modal === "null") document.querySelector(".enmYtp") ? document.querySelector("canvas").requestPointerLock() : document.exitPointerLock()
    if (openedModal) {
        openedModal.classList.toggle("open")
        if (modal === "null" || openedModal.id === modal) document.querySelector("canvas").requestPointerLock()
        else document.getElementById(modal).classList.toggle("open")
    }
    else if (modal !== "null") {
        document.getElementById(modal).classList.toggle("open")
        document.exitPointerLock()
    }
})