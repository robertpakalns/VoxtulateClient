const path = require("path")

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
    const elem = document.createElement(tag)
    if (className) elem.classList.add(className)
    Object.keys(attrs).forEach(attr => elem[attr] = attrs[attr])
    elem.append(...append)
    return elem
}

const output = (v, e) => `${v} ${v != 1 ? e + "s" : e}`
const creationTime = date => new Date(date).toLocaleDateString("en-US")
const timeLeft = date => {
    let ms = new Date(date).getTime() - Date.now()
    return Object.entries({ d: 86400000, h: 3600000, min: 60000, s: 1000 }).map(([unit, value]) => {
        const uv = Math.floor(ms / value)
        ms %= value
        return uv > 0 ? `${uv}${unit}` : null
    }).filter(Boolean).slice(0, 2).join("") + " left"
}

const popup = (color, text) => {
    document.querySelector(".popup")?.remove()

    const styles = `
        .popup {
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: fixed;
            bottom: 10px;
            left: 10px;
            font-size: 10px;
            border-radius: 10px;
            background: ${color};
            cursor: pointer;
            user-select: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .popup img {
            height: 15px;
            margin-right: 7px;
        }

        .popup:hover {
            transform: scale(1.05);
        }
    `

    if (!document.querySelector("#popupStyles")) {
        const style = document.createElement("style")
        style.id = "popupStyles"
        style.innerText = styles
        document.head.appendChild(style)
    }

    const _popup = createEl("div", {}, "popup", [createEl("img", { src: path.join(__dirname, "../assets/icons/bell.png") }), text])

    const audio = new Audio(path.join(__dirname, "../assets/sounds/pop.mp3"))
    audio.volume = 0.5
    audio.play()

    const closePopup = () => {
        _popup.style.opacity = "0"
        setTimeout(() => _popup.remove(), 200)
    }

    _popup.addEventListener("click", closePopup)
    setTimeout(closePopup, 5000)

    document.body.appendChild(_popup)
}

const openDB = store => new Promise(res => {
    const req = indexedDB.open("SkinCacheDB", 1)
    req.onupgradeneeded = e => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "key" }).createIndex("by_type", "type")
    }
    req.onsuccess = e => res(e.target.result)
})

const getData = (db, store) => new Promise(res => db.transaction(store, "readonly").objectStore(store).getAll().onsuccess = e => res(e.target.result))

const setData = (db, array, store) => new Promise(res => {
    const tx = db.transaction(store, "readwrite")
    for (const el of array) tx.objectStore(store).put(el)
    tx.oncomplete = res
})

const isNum = (a, b) => isNaN(a / b) ? 0 : (a / b).toFixed(2) || "No Data"

const copyNode = (label, value, id) => {
    if (document.querySelector(`#${id}`)) {
        document.querySelector(`#${id}`).children[1].textContent = value
        return
    }

    const node = document.querySelector(".bejTKB")
    const copy = node.cloneNode(true)
    copy.id = id
    node.parentElement.appendChild(copy)

    copy.children[0].innerHTML = label
    copy.children[1].innerHTML = value
}

const sessionFetch = url => JSON.parse(sessionStorage.getItem(url)) || fetch(url)
    .then(r => r.json())
    .then(data => {
        sessionStorage.setItem(url, JSON.stringify(data))
        return data
    })

module.exports = { el, createEl, creationTime, timeLeft, output, popup, openDB, getData, setData, isNum, copyNode, sessionFetch }