const { ipcRenderer, shell } = require("electron")
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

const enableStyles = () => {
    const { enable, custom, css, js } = config.get("styles")

    const enableScript = document.createElement("script")
    enableScript.textContent = enable && custom ? js : ""

    const bgURL = path.join(__dirname, "../../assets/bg.webp").replace(/\\/g, "/")
    const fontURL = path.join(__dirname, "../../assets/fonts/Roboto.ttf").replace(/\\/g, "/")
    const textURL = path.join(__dirname, "../../assets/text.webp").replace(/\\/g, "/")

    const customCSS = fs.readFileSync(path.join(__dirname, "../../src/ui/style.css"), "utf8") + `
    @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
    * { font-family: "Roboto", sans-serif }
    .bNczYf { background: url(${bgURL}) }
    img[src="/./package/ea55824826de52b7ccc3.png"] { content: url(${textURL}) }`

    const enableStyles = document.createElement("style")
    enableStyles.textContent = enable ? custom ? css : customCSS : ""

    const clientStyles = document.createElement("style")
    clientStyles.textContent = `
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${config.get("console") ? "0%" : "100%"} !important }
    .lpfJAq, .lpdfTz { opacity: ${config.get("chatOpacity")}% }
    .voxiomCreate { margin: 20px; position: absolute; font-weight: 900 }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${config.get("console") ? "100%" : "0%"} }
    .voxiomBlocks { margin: auto; width: 100%; position: absolute; bottom: 35%; text-align: center; font-size: 10px }
    .voxiomCrosshair { top: 50vh; left: 50vw; position: fixed; transform: translate(-50%, -50%) }`

    document.head.append(enableScript, enableStyles, clientStyles)

    ipcRenderer.on("change-css", (_, enable, custom, code) => enableStyles.textContent = enable ? custom ? code : customCSS : "")
    ipcRenderer.on("change-js", (_, enable, custom, code) => enable && custom && eval(code))

    const crosshair = document.createElement("img")
    crosshair.src = config.get("crosshair.url")
    crosshair.classList.add("voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyleRule = (sheet, selector, property, value) => {
        const rule = Array.from(sheet.cssRules).find(el => el.selectorText === selector)
        rule ? rule.style[property] = value : sheet.insertRule(`${selector} { ${property}: ${value}; }`, sheet.cssRules.length)
    }

    ipcRenderer.on("change-opacity", (_, opacity) => updateStyleRule(clientStyles.sheet, ".lpfJAq, .lpdfTz", "opacity", `${opacity}%`))
    ipcRenderer.on("set-console", (_, enable) => {
        updateStyleRule(clientStyles.sheet, 'body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]', "opacity", enable ? "0%" : "100%")
        updateStyleRule(clientStyles.sheet, ".voxiomConsole", "opacity", enable ? "100%" : "0%")
    })
    ipcRenderer.on("change-crosshair", (_, enable, url) => {
        updateStyleRule(clientStyles.sheet, ".voxiomCrosshair", "display", enable ? "block" : "none")
        crosshair.src = url
    })
}

document.addEventListener("DOMContentLoaded", () => {
    window.trustedTypes?.createPolicy("default", { createHTML: i => i })

    enableStyles()

    if (config.get("client.adblocker")) setInterval(() => document.querySelectorAll("[id^='voxiom-io']").forEach(e => e.remove()), 50)

    new Voxiom("div", "voxiomConsole voxiomCreate", document.body)
        .do(function () {
            const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
            if (t && t.innerHTML != "") {
                const c = t.innerHTML
                const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
                this.text(`${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`)
            }
            else this.text("")
        }, 50)

    new Voxiom("div", "voxiomBlocks voxiomCreate", document.body)
        .do(function () { this.text(document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || "") }, 50)

    document.addEventListener("click", e => {
        const el = e.target.closest(".dELrkI")
        if (el) {
            e.preventDefault()
            shell.openPath(el.href)
        }
    })
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => fs.writeFileSync(file, localStorage.getItem("persist:root")))