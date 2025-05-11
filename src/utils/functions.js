const { pathToFileURL } = require("url")
const { dialog, nativeImage } = require("electron")
const path = require("path")

// Display values
const output = (v, e) => `${v} ${v != 1 ? e + "s" : e}`

const creationTime = date => new Date(date).toLocaleDateString("en-US")

const timeUnits = { d: 86400000, h: 3600000, min: 60000, s: 1000 }
const timeLeft = date => {
    let ms = new Date(date).getTime() - Date.now()
    return Object.entries(timeUnits).map(([unit, value]) => {
        const uv = Math.floor(ms / value)
        ms %= value
        return uv > 0 ? `${uv}${unit}` : null
    }).filter(Boolean).slice(0, 2).join("") + " left"
}

const isNum = (a, b) => isNaN(a / b) ? 0 : (a / b).toFixed(2) || "No Data"

// DOM elements
const el = id => ({
    get element() { return document.getElementById(id) },
    get checked() { return this.element.checked },
    set checked(value) { this.element.checked = value },
    get value() { return this.element.value },
    set value(val) { this.element.value = val },
    event(type, callback) { this.element.addEventListener(type, callback) },
    class(name, toggle) { this.element.classList.toggle(name, toggle) }
})

const createEl = (tag, attrs = {}, className = "", append = []) => {
    const element = document.createElement(tag)
    if (className) element.classList.add(className)
    for (const attr of Object.keys(attrs)) element[attr] = attrs[attr]
    element.append(...append)
    return element
}

const popup = (color, text) => {
    document.querySelector(".popup")?.remove()

    const _popup = createEl("div", {}, "popup", [createEl("img", { src: loadAsset("icons/bell.svg") }), text])
    _popup.style.background = color

    const audio = new Audio(loadAsset("sounds/pop.mp3"))
    audio.volume = 0.3
    audio.play()

    const closePopup = () => {
        _popup.style.opacity = "0"
        setTimeout(() => _popup.remove(), 200)
    }

    _popup.addEventListener("click", closePopup)
    setTimeout(closePopup, 5000)

    document.body.appendChild(_popup)
}

const restartMessage = () => popup("rgb(231, 76, 60)", "Restart the client to apply this setting.")

// Dialog windows
const obj = {
    win32: "ico",
    darwin: "icns",
    linux: "png"
}

const getIcon = () => {
    const ext = obj[process.platform] || null
    return ext ? nativeImage.createFromPath(path.join(__dirname, `../assets/icon.${ext}`)) : undefined
}

const message = (title, message) => dialog.showMessageBox({ icon: getIcon(), title: `Voxtulate Client | ${title}`, message })

const confirmAction = (message, callback) => {
    const result = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        icon: getIcon(),
        title: "Voxtulate Client | Confirm",
        message
    })
    if (result === 0) callback()
}

// Assets
const assetsPath = path.resolve(__dirname, "../../assets")
const loadAsset = relativePath => pathToFileURL(path.join(assetsPath, relativePath)).href

const getAsset = path => `https://raw.githubusercontent.com/robertpakalns/tricko-assets/main/${path}`

const sessionFetch = url => JSON.parse(sessionStorage.getItem(url)) || fetch(url)
    .then(r => r.json())
    .then(data => {
        sessionStorage.setItem(url, JSON.stringify(data))
        return data
    })

// Inventory
const inventoryFilter = (element, settings) =>
    (!settings.name || element.name.toLowerCase().includes(settings.name.toLowerCase())) &&
    (!settings.id || element.type.toString().includes(settings.id)) &&
    (settings.rotation === "" || element.rotation === (settings.rotation === "true")) &&
    (settings.model === "" || element.model === settings.model) &&
    (settings.rarity === "" || element.rarity === settings.rarity) &&
    (settings.equipped === "" || element.slot !== null === (settings.equipped === "true"))

const inventorySort = (a, b, settings) =>
    !settings.creation ?
        0 : settings.creation === "true" ?
            b.creation_time - a.creation_time :
            a.creation_time - b.creation_time

module.exports = {
    output, creationTime, timeLeft, isNum,
    el, createEl, popup, restartMessage,
    getIcon, message, confirmAction,
    loadAsset, getAsset, sessionFetch,
    inventorySort, inventoryFilter
}