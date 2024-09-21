const { ipcRenderer } = require("electron")
const { Config } = require("../config.js")
const fs = require("fs")
const path = require("path")
const config = new Config()

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

document.addEventListener("DOMContentLoaded", () => {

    const bgURL = path.join(__dirname, "../../assets/bg.webp").replace(/\\/g, "/")
    const fontURL = path.join(__dirname, "../../assets/fonts/Roboto.ttf").replace(/\\/g, "/")

    if (config.get("styles.enable") && !config.get("styles.custom")) {
        const css = document.createElement("style")
        css.id = "clientStyles"
        const cssText = fs.readFileSync(path.join(__dirname, "../../src/ui/style.css"), "utf8") + `
            @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
            * { font-family: "Roboto", sans-serif }
            .bNczYf { background: url(${bgURL}) }
            body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { display: ${config.get("console") ? "none" : "block"} !important }`
        css.textContent = cssText
        document.head.appendChild(css)

        new Voxiom("div", "voxiomBlocks voxiomCreate", document.body)
            .do(function () { this.text(document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || "") }, 50)

        setInterval(() => document.querySelectorAll(".cJoQGw").forEach(el => {
            const [r, g, b] = getComputedStyle(el).borderColor.match(/\d+/g).map(Number)
            el.style.background = `radial-gradient(circle, rgba(${r}, ${g}, ${b}, 0.3), rgba(${r}, ${g}, ${b}, 0.1))`
        }), 50)
    }

    else if (config.get("styles.enable") && config.get("styles.custom")) {
        const css = document.createElement("style")
        css.id = "customStyles"
        css.textContent = config.get("styles.css")
        document.head.appendChild(css)
    }

    if (config.get("crosshair.enable")) {
        const img = document.createElement("img")
        img.src = config.get("crosshair.url")
        Object.assign(img.style, {
            left: "50vw",
            top: "50vh",
            position: "fixed",
            transform: "translate(-50%, -50%)"
        })
        document.body.prepend(img)
    }

    if (config.get("client.adblocker")) setInterval(() => document.querySelectorAll("[id^='voxiom-io']").forEach(e => e.remove()), 50)

    if (config.get("console")) new Voxiom("div", "voxiomConsole voxiomCreate", document.body)
        .do(function () {
            const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
            if (t && t.innerHTML != "") {
                const c = t.innerHTML
                const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
                this.text(`${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`)
            }
            else this.text("")
        }, 50)
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => fs.writeFileSync(file, localStorage.getItem("persist:root")))
