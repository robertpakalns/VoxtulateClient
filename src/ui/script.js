const { ipcRenderer, shell } = require("electron")
const { Config } = require("../config.js")
const fs = require("fs")
const path = require("path")
const config = new Config
const { el, createEl, creationTime, Voxiom, timeLeft, openDB, getData, setData } = require("../functions.js")

let skinSettings, inventoryData, marketData, listedData
const { console: enableConsole, chatOpacity, inventorySorting } = config.get("interface")

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
    body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"] { opacity: ${enableConsole ? "0%" : "100%"} !important }
    .lpfJAq, .lpdfTz { opacity: ${chatOpacity}% }
    .voxiomCreate { margin: 20px; position: absolute; font-weight: 900 }
    .voxiomConsole { font-family: "Consolas", monospace; top: 0; left: 0; font-size: 10px; opacity: ${enableConsole ? "100%" : "0%"} }
    .voxiomBlocks { margin: auto; width: 100%; position: absolute; bottom: 35%; text-align: center; font-size: 10px }
    .voxiomCrosshair { top: 50vh; left: 50vw; position: fixed; transform: translate(-50%, -50%) }
    .voxiomSkinName { width: 100%; position: absolute; bottom: 0; left: 0; text-align: center; font-size: 0.8rem; color: gray }
    .voxiomSkinsButton { width: 130px; background: #646464; display: flex; align-items: center; padding-left: 10px; cursor: pointer }
    .gem { margin-left: 3px; height: 9px }
    .skinModal { width: 100%; height: 100%; z-index: 9999; display: none }
    .open { display: block }
    ${inventorySorting ? ".hYnMmT { display: none }" : ""}`

    document.head.append(enableScript, enableStyles, clientStyles)

    ipcRenderer.on("change-css", (_, enable, custom, code) => enableStyles.textContent = enable ? custom ? code : customCSS : "")
    ipcRenderer.on("change-js", (_, enable, custom, code) => enable && custom && eval(code))

    const crosshair = document.createElement("img")
    crosshair.src = config.get("crosshair.url")
    crosshair.classList.add("voxiomCrosshair")
    document.body.prepend(crosshair)

    const updateStyleRule = (selector, property, value) => {
        const { sheet } = clientStyles
        const rule = Array.from(sheet.cssRules).find(el => el.selectorText === selector)
        rule ? rule.style[property] = value : sheet.insertRule(`${selector} { ${property}: ${value}; }`, sheet.cssRules.length)
    }

    ipcRenderer.on("change-opacity", (_, opacity) => updateStyleRule(".lpfJAq, .lpdfTz", "opacity", `${opacity}%`))
    ipcRenderer.on("set-console", (_, enable) => {
        updateStyleRule('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]', "opacity", enable ? "0%" : "100%")
        updateStyleRule(".voxiomConsole", "opacity", enable ? "100%" : "0%")
    })
    ipcRenderer.on("change-crosshair", (_, enable, url) => {
        updateStyleRule(".voxiomCrosshair", "display", enable ? "block" : "none")
        crosshair.src = url
    })
}

const advancedInventory = () => {
    const inventoryPage = fs.readFileSync(path.join(__dirname, "../../src/modals/inventory/index.html"), "utf8")
    const market = JSON.parse(fs.readFileSync(path.join(__dirname, "../market.json"), "utf8"))
    const gemPath = path.join(__dirname, "../../assets/icons/gem.webp")

    const _fetch = fetch
    window.fetch = (...args) => _fetch(...args).then(r => r.clone().text().then(data => {
        const [url] = args
        if (url === "/profile/myinv") {
            const { name, id, rotation = "", creation = "", model = "", rarity = "" } = skinSettings
            const parsedData = JSON.parse(data)
            const newData = {
                ...parsedData,
                data: parsedData.data.map(el => {
                    const skin = market.data[el.type - 1]
                    return { ...el, name: skin.name, rotation: skin.rotation, model: skin.type, rarity: skin.rarity }
                }).filter(el =>
                    (!name || el.name.toLowerCase().includes(name.toLowerCase())) &&
                    (!id || el.type.toString().includes(id)) &&
                    (rotation === "" || el.rotation === (rotation === "true")) &&
                    (model === "" || el.model === model) &&
                    (rarity === "" || el.rarity === rarity)
                ).sort((a, b) => !creation ? 0 : creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)
            }

            inventoryData = newData
            return new Response(JSON.stringify(newData), r)
        }

        if (url === "/market/public") marketData = JSON.parse(data)
        if (url === "/market/my_listed_items") listedData = JSON.parse(data)

        return r
    }))

    const modal = createEl("div", { innerHTML: inventoryPage }, "skinModal")

    document.body.querySelector("#app").appendChild(modal)

    skinSettings = JSON.parse(sessionStorage.getItem("skinSettings")) || {
        name: "", id: "", rotation: "", creation: "", model: "", rarity: ""
    }

    document.querySelectorAll(".voxiomSelect").forEach(select => {
        const menu = select.querySelector(".voxiomSelectMenu")
        const selected = select.querySelector(".selected")
        const options = select.querySelectorAll(".option")

        selected?.addEventListener("click", () => menu.classList.toggle("active"))
        options.forEach(option => {
            if (option.dataset.value === skinSettings[select.id]) selected.textContent = option.textContent
            option.addEventListener("click", async () => {
                selected.textContent = option.textContent
                skinSettings[select.id] = option.dataset.value
                menu.classList.remove("active")
                await renderPage()
            })
        })
    })

    document.addEventListener("click", e => document.querySelectorAll(".voxiomSelectMenu.active").forEach(menu => {
        if (!menu.parentNode.contains(e.target)) menu.classList.remove("active")
    }))

    el("name").event("input", async e => {
        skinSettings.name = e.target.value
        await renderPage()
    })
    el("id").event("input", async e => {
        skinSettings.id = e.target.value
        await renderPage()
    })
    el("apply").event("click", () => {
        sessionStorage.setItem("skinSettings", JSON.stringify(skinSettings))
        window.location.reload()
    })
    el("clear").event("click", async () => {
        sessionStorage.removeItem("skinSettings")
        window.location.reload()
    })

    const rarities = {
        Common: "255, 255, 255",
        Noteworthy: "128, 156, 255",
        Precious: "180, 99, 255",
        Magnificent: "255, 84, 224",
        Extraordinary: "230, 126, 34",
        Covert: "255, 66, 101",
        Artifact: "255, 224, 99"
    }

    const renderURL = async data => {
        const store = "skins"
        const db = await openDB(store)
        const items = await getData(db, store)

        const cache = new Map(items.map(el => [el.key, el.value]))
        const newEntries = []

        const setImage = (el, src) => {
            const r = rarities[el.rarity]
            const _img = createEl("img", { src }, "img")
            const _line = createEl("hr", { style: `background: linear-gradient(90deg, rgba(${r}, 0.5) 0%, rgb(${r}) 50%, rgba(${r}, 0.5) 100%)` }, "line")
            const _name = createEl("div", {}, "name", [el.name])
            const _id = createEl("div", {}, "id", [el.type])
            const _creation = createEl("div", {}, "creation", [creationTime(el.creation_time)])
            const _imgCont = createEl("div", {}, "imgCont", [_name, _img, _id, _creation, _line])
            const _imgBlock = createEl("div", {}, "imgBlock", [_imgCont])
            cont.appendChild(_imgBlock)
        }

        for (const el of data) {
            const key = `${el.type}_${el.seed}`
            const cached = cache.get(key)

            if (cached) setImage(el, cached)
            else {
                let url
                if (market.data.find(({ id }) => id === el.type)?.type === "SPRAY") url = `https://tricko.pro/assets/voxiom/preview/${el.type}.webp`
                else {
                    const generator = window.renderSkin([{ type: el.type, seed: el.seed }], {})
                    const img = await generator.next(await generator.next().value).value
                    url = Object.values(img)[0]
                }
                newEntries.push({ key, value: url })
                setImage(el, url)
            }
        }

        if (newEntries.length > 0) await setData(db, newEntries, store)
    }

    let currentPage = 0
    const itemsPerPage = 18

    const _button = createEl("div", { id: "voxiomSkinsButton" }, "voxiomSkinsButton", ["Advanced Sorting"])
    _button.addEventListener("click", async () => {
        document.querySelector(".skinModal").classList.toggle("open")
        await new Promise(res => setTimeout(res, 1))
        currentPage = 0
        await renderPage()
    })
    setInterval(() => {
        if (
            inventoryData?.data &&
            !document.querySelector("#voxiomSkinsButton") &&
            ["/loadouts", "/loadouts/inventory"].includes(window.location.pathname)
        ) document.querySelector(".iRauPR")?.appendChild(_button, 50)
    })

    const cont = document.querySelector(".cont")

    const renderPage = async () => {
        cont.innerHTML = ""
        const start = currentPage * itemsPerPage
        const end = start + itemsPerPage
        const limitedData = [...inventoryData.data]
            .filter(el =>
                (!skinSettings.name || el.name.toLowerCase().includes(skinSettings.name.toLowerCase())) &&
                (!skinSettings.id || el.type.toString().includes(skinSettings.id)) &&
                (skinSettings.rotation === "" || el.rotation === (skinSettings.rotation === "true")) &&
                (skinSettings.model === "" || el.model === skinSettings.model) &&
                (skinSettings.rarity === "" || el.rarity === skinSettings.rarity)
            ).sort((a, b) => !skinSettings.creation ? 0 : skinSettings.creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)
        const slicedData = [...limitedData].slice(start, end)

        const totalPages = Math.ceil(limitedData.length / itemsPerPage)
        document.querySelector(".count").innerText = `Page: ${currentPage + 1}/${totalPages}\n Filtered: ${limitedData.length}\nTotal: ${inventoryData.data.length}`

        el("left").class("disabled", currentPage === 0)
        el("right").class("disabled", end >= inventoryData.data.length)

        await renderURL(slicedData)
    }

    document.querySelector("#left").addEventListener("click", async () => {
        if (currentPage > 0) {
            currentPage--
            await renderPage()
        }
    })

    document.querySelector("#right").addEventListener("click", async () => {
        if ((currentPage + 1) * itemsPerPage < inventoryData.data.length) {
            currentPage++
            await renderPage()
        }
    })

    document.querySelector(".close").addEventListener("click", () => document.querySelector(".skinModal").classList.toggle("open"))
    document.querySelector(".overlay").addEventListener("click", () => document.querySelector(".skinModal").classList.toggle("open"))

    const observer = new MutationObserver(() => {
        const { pathname } = window.location
        const isMarket = pathname === "/loadouts/market" || (pathname === "/loadouts" && document.querySelector(".dzKqCZ"))
        const isSales = pathname === "/loadouts/sales"
        if (!isMarket && !isSales) return

        document.querySelectorAll(".kiKVOk").forEach((el, i) => {
            if (el.parentElement.parentElement.querySelector(".voxiomSkinName")) return

            const skin = isMarket ? marketData.data.market_items[i / 2] : listedData.data.player_market_items[i / 2]
            const _image = isMarket || isSales ? createEl("img", { src: gemPath }, "gem") : ""
            const _name = createEl("div", {
                textContent:
                    isSales ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` :
                        isMarket ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` : ""
            }, "voxiomSkinName", [_image])

            el.parentElement.parentElement.appendChild(_name)
        })
    })

    observer.observe(document.querySelector("#app"), {
        childList: true,
        subtree: true
    })

    const exportSkins = async settings => {
        const store = "skins"
        const db = await openDB(store)
        const data = await getData(db, store)

        const exportedData = [...inventoryData.data]
            .filter(el =>
                (!settings.name || el.name.toLowerCase().includes(settings.name.toLowerCase())) &&
                (!settings.id || el.type.toString().includes(settings.id)) &&
                (settings.rotation === "" || el.rotation === (settings.rotation === "true")) &&
                (settings.model === "" || el.model === settings.model) &&
                (settings.rarity === "" || el.rarity === settings.rarity)
            )
            .sort((a, b) => !settings.creation ? 0 : settings.creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)

        const size = 256
        const columns = Math.ceil(Math.sqrt(exportedData.length))
        const rows = Math.ceil(exportedData.length / columns)

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = size * columns
        canvas.height = size * rows

        await Promise.all(exportedData.map(async (el, i) => {
            const img = new Image()
            img.src = data.find(({ key }) => key === `${el.type}_${el.seed}`).value
            await img.decode()
            const scale = Math.min(size / img.width, size / img.height)
            ctx.drawImage(img,
                (i % columns) * size + (size - img.width * scale) / 2,
                Math.floor(i / columns) * size + (size - img.height * scale) / 2,
                img.width * scale, img.height * scale)
        }))

        return new Promise(res => canvas.toBlob(blob => res(blob), "image/png"))
    }

    const saveImageLocally = async settings => {
        const blob = await exportSkins(settings)
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = `voxtulate_render_${new Date().toISOString().replace(/[:.-]/g, "_")}.png`
        link.click()
        URL.revokeObjectURL(url)
    }

    el("export").event("click", () => saveImageLocally(skinSettings))
}

document.addEventListener("DOMContentLoaded", () => {
    enableStyles()

    new Voxiom("div", "voxiomConsole voxiomCreate", document.body)
        .do(e => {
            const t = document.querySelector('body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]')
            if (t && t.innerHTML !== "") {
                const c = t.innerHTML
                const [_, x, y, z] = c.match(/Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/)
                e.text(`${parseInt(c.match(/FPS: ([\d]+)/)[1])} FPS<br>${x} ${y} ${z}<br>${(c.match(/Latency: ([\d]+ms)/)[1])}`)
            }
            else e.text("")
        }, 50)

    new Voxiom("div", "voxiomBlocks voxiomCreate", document.body)
        .do(e => e.text(document.querySelector(".biWqsQ")?.innerText.match(/Current mode: (\w+)/)[1] || ""), 50)

    document.addEventListener("click", e => {
        const el = e.target.closest(".dELrkI")
        if (el) {
            e.preventDefault()
            shell.openPath(el.href)
        }
    })

    if (inventorySorting) advancedInventory()
})

ipcRenderer.on("set-game-settings", (_, data) => localStorage.setItem("persist:root", JSON.parse(data)))
ipcRenderer.on("get-game-settings", (_, file) => fs.writeFileSync(file, localStorage.getItem("persist:root")))