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

class Voxiom {
    constructor(t, c, p) {
        this.element = document.createElement(t)
        this.element.className = c
        p.appendChild(this.element)
    }

    do(c, i) {
        setInterval(() => c(this), i)
        return this
    }

    text(i) {
        this.element.innerHTML = i
        return this
    }
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

module.exports = { el, createEl, creationTime, Voxiom, timeLeft, output, popup }