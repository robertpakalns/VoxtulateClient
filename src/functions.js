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

const creationTime = date => new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) || "eee"

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

function createVoxiomSelect(options, settings, title, value) {
    const _text = createEl("div", { textContent: title })

    const _cont = createEl("div", {}, "voxiomSelect", [_text, createEl("div", {}, "voxiomSelectMenu")])

    options.forEach(option => {
        const optionDiv = createEl("div", { textContent: option.text }, "option")
        optionDiv.dataset.value = option.value

        optionDiv.addEventListener("click", e => {
            e.stopPropagation()
            _text.textContent = option.text
            settings[value] = option.value
            _cont.querySelector(".voxiomSelectMenu").classList.remove("active")
        })

        _cont.querySelector(".voxiomSelectMenu").appendChild(optionDiv)
    })

    _cont.addEventListener("click", e => {
        e.stopPropagation()
        _cont.querySelector(".voxiomSelectMenu").classList.toggle("active")
    })

    document.addEventListener("click", e => {
        if (!_cont.contains(e.target)) _cont.querySelector(".voxiomSelectMenu").classList.remove("active")
    })

    return _cont
}

module.exports = { el, createEl, creationTime, Voxiom, createVoxiomSelect }