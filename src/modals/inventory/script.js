const { openDB, getData, setData, creationTime } = require("../../functions.js")
const { el, createEl, sessionFetch } = require("../../functions.js")
const { readFileSync } = require("fs")
const Modal = require("../modal.js")
const path = require("path")

class InventoryModal extends Modal {
    constructor() {
        super()
        this.modalHTML = readFileSync(path.join(__dirname, "./index.html"), "utf8")
        this.settings = null
        this.data = null
        this.marketData = null
        this.currentPage = 0
        this.itemsPerPage = 18
    }

    async init() {
        super.init()
        this.modal.id = "inventoryModal"
        this.marketData = await sessionFetch("https://tricko.pro/assets/voxiom/voxiomMarket.json")
    }

    setData(data) {
        this.data = data
    }

    async getURL(data) {
        const store = "skins"
        const db = await openDB(store)
        const items = await getData(db, store)

        const cache = new Map(items.map(el => [el.key, el.value]))
        const newEntries = []
        const result = {}

        for (const el of data) {
            const key = `${el.type}_${el.seed}`
            const cached = cache.get(key)

            if (cached) result[key] = cached
            else {
                let url
                if (this.marketData.data.find(({ id }) => id === el.type)?.type === "SPRAY") url = `https://tricko.pro/assets/voxiom/preview/${el.type}.webp`
                else {
                    const generator = window.renderSkin([{ type: el.type, seed: el.seed }], {})
                    const img = await generator.next(await generator.next().value).value
                    url = Object.values(img)[0]
                }
                newEntries.push({ key, value: url })
                result[key] = url
            }
        }

        if (newEntries.length > 0) await setData(db, newEntries, store)
        return result
    }

    renderPage() {
        const cont = document.querySelector(".cont")

        const rarities = {
            Common: "255, 255, 255",
            Noteworthy: "128, 156, 255",
            Precious: "180, 99, 255",
            Magnificent: "255, 84, 224",
            Extraordinary: "230, 126, 34",
            Covert: "255, 66, 101",
            Artifact: "255, 224, 99"
        }

        const setImage = (el, src) => {
            const r = rarities[el.rarity]
            const _img = createEl("img", { src }, "img")
            const _line = createEl("hr", { style: `background: linear-gradient(90deg, rgba(${r}, 0.5) 0%, rgb(${r}) 50%, rgba(${r}, 0.5) 100%)` }, "line")
            const _name = createEl("div", {}, "name", [el.name])
            const _id = createEl("div", {}, "id", [el.type])
            const _equipped = createEl("div", { style: `background: ${el.slot ? "yellow" : "transparent"}` }, "equipped")
            const _creation = createEl("div", {}, "creation", [creationTime(el.creation_time)])
            const _imgCont = createEl("div", {}, "imgCont", [_name, _img, _id, _equipped, _creation, _line])
            const _imgBlock = createEl("div", {}, "imgBlock", [_imgCont])
            cont.appendChild(_imgBlock)
        }

        const renderURL = async data => {
            const urls = await this.getURL(data)
            for (const el of data) setImage(el, urls[`${el.type}_${el.seed}`])
        }

        const render = async () => {
            const s = this.settings
            cont.innerHTML = ""

            const start = this.currentPage * this.itemsPerPage
            const end = start + this.itemsPerPage
            const limitedData = [...this.data.data]
                .filter(el =>
                    (!s.name || el.name.toLowerCase().includes(s.name.toLowerCase())) &&
                    (!s.id || el.type.toString().includes(s.id)) &&
                    (s.rotation === "" || el.rotation === (s.rotation === "true")) &&
                    (s.model === "" || el.model === s.model) &&
                    (s.rarity === "" || el.rarity === s.rarity) &&
                    (s.equipped === "" || el.slot !== null === (s.equipped === "true"))
                )
                .sort((a, b) => !s.creation ? 0 : s.creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)

            const slicedData = [...limitedData].slice(start, end)

            const totalPages = Math.ceil(limitedData.length / this.itemsPerPage)
            document.querySelector(".count").innerText = `Page: ${this.currentPage + 1}/${totalPages}\n Filtered: ${limitedData.length}\nTotal: ${this.data.data.length}`

            el("left").class("disabled", this.currentPage === 0)
            el("right").class("disabled", this.currentPage + 1 >= totalPages)

            await renderURL(slicedData)
        }

        render()
    }

    work() {
        this.settings = JSON.parse(sessionStorage.getItem("skinSettings")) || {
            name: "", id: "", rotation: "", creation: "", model: "", rarity: "", equipped: "", equipped_date: ""
        }

        document.querySelectorAll(".voxiomSelect").forEach(select => {
            const menu = select.querySelector(".voxiomSelectMenu")
            const selected = select.querySelector(".selected")
            const options = select.querySelectorAll(".option")

            selected?.addEventListener("click", () => menu.classList.toggle("active"))
            options.forEach(option => {
                if (option.dataset.value === this.settings[select.id]) selected.textContent = option.textContent
                option.addEventListener("click", async () => {
                    this.currentPage = 0
                    selected.textContent = option.textContent
                    this.settings[select.id] = option.dataset.value
                    menu.classList.remove("active")
                    this.renderPage()
                })
            })
        })

        document.addEventListener("click", e => document.querySelectorAll(".voxiomSelectMenu.active").forEach(menu => {
            if (!menu.parentNode.contains(e.target)) menu.classList.remove("active")
        }))

        el("name").event("input", async e => {
            this.currentPage = 0
            this.settings.name = e.target.value
            this.renderPage()
        })
        el("id").event("input", async e => {
            this.currentPage = 0
            this.settings.id = e.target.value
            this.renderPage()
        })
        el("apply").event("click", () => {
            sessionStorage.setItem("skinSettings", JSON.stringify(this.settings))
            window.location.reload()
        })
        el("clear").event("click", async () => {
            sessionStorage.removeItem("skinSettings")
            window.location.reload()
        })

        el("left").event("click", async () => {
            if (this.currentPage > 0) {
                this.currentPage--
                this.renderPage()
            }
        })

        el("right").event("click", async () => {
            if ((this.currentPage + 1) * this.itemsPerPage < this.data.data.length) {
                this.currentPage++
                this.renderPage()
            }
        })

        const exportSkins = async settings => {
            const data = await this.getURL(this.data.data)

            const exportedData = [...this.data.data]
                .filter(el =>
                    (!settings.name || el.name.toLowerCase().includes(settings.name.toLowerCase())) &&
                    (!settings.id || el.type.toString().includes(settings.id)) &&
                    (settings.rotation === "" || el.rotation === (settings.rotation === "true")) &&
                    (settings.model === "" || el.model === settings.model) &&
                    (settings.rarity === "" || el.rarity === settings.rarity) &&
                    (settings.equipped === "" || el.slot !== null === (settings.equipped === "true"))
                )
                .sort((a, b) => !settings.creation ? 0 : settings.creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)

            const size = 256
            const columns = Math.ceil(Math.sqrt(exportedData.length))
            const rows = Math.ceil(exportedData.length / columns)

            const canvas = createEl("canvas", { width: size * columns, height: size * rows })
            const ctx = canvas.getContext("2d")

            await Promise.all(exportedData.map(async (el, i) => {
                const img = new Image()
                img.src = data[`${el.type}_${el.seed}`]
                await img.decode()
                const scale = Math.min(size / img.width, size / img.height)
                ctx.drawImage(img,
                    (i % columns) * size + (size - img.width * scale) / 2,
                    Math.floor(i / columns) * size + (size - img.height * scale) / 2,
                    img.width * scale, img.height * scale)
            }))

            const iconSize = 15
            const padding = 3
            const icon = new Image()
            icon.crossOrigin = "Anonymous"
            icon.src = "https://tricko.pro/assets/icon.webp"

            icon.onload = () => {
                ctx.globalAlpha = 0.2
                ctx.drawImage(icon, canvas.width - iconSize - padding, canvas.height - iconSize - padding, iconSize, iconSize)
                ctx.font = "12px Arial"
                ctx.textAlign = "right"
                ctx.fillText("Powered by Tricko", canvas.width - iconSize - padding * 2, canvas.height - padding * 2)
                ctx.globalAlpha = 1
                canvas.toBlob(blob => {
                    if (!blob) return
                    const url = URL.createObjectURL(blob)
                    createEl("a", { href: url, download: `voxtulate_${Date.now()}.png` }).click()
                    URL.revokeObjectURL(url)
                }, "image/png")
            }
        }

        el("export").event("click", () => exportSkins(this.settings))
    }
}

module.exports = InventoryModal