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
const creationTime = date => new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
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
        setInterval(c.bind(this), i)
        return this
    }

    text(i) {
        this.element.innerHTML = i
        return this
    }
}

module.exports = { el, createEl, creationTime, Voxiom, timeLeft, output }