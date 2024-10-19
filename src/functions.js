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

const creationTime = date => new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

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

module.exports = { el, createEl, creationTime, Voxiom }