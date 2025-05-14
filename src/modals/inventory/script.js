const { creationTime, getAsset, loadAsset, inventoryFilter, inventorySort } = require("../../utils/functions.js")
const { createEl, sessionFetch } = require("../../utils/functions.js")
const Modal = require("../modal.js")

const openDB = store => new Promise(res => {
    const req = indexedDB.open("SkinCacheDB", 1)
    req.onupgradeneeded = e => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "key" }).createIndex("by_type", "type")
    }
    req.onsuccess = e => res(e.target.result)
})

const getDBData = (db, store) => new Promise(res => db.transaction(store, "readonly").objectStore(store).getAll().onsuccess = e => res(e.target.result))

const setDBData = (db, array, store) => new Promise(res => {
    const tx = db.transaction(store, "readwrite")
    for (const el of array) tx.objectStore(store).put(el)
    tx.oncomplete = res
})

class InventoryModal extends Modal {
    constructor() {
        super()
        this.modalHTMLPath = "./inventory/index.html"
        this.settings = null
        this.data = null
        this.marketData = null
        this.currentPage = 0
        this.itemsPerPage = 18
    }

    async init() {
        super.init()
        this.modal.id = "inventoryModal"
    }

    setData(data) {
        this.data = data
    }

    async getURL(data) {
        const store = "skins"
        const db = await openDB(store)
        const items = await getDBData(db, store)

        const cache = new Map(items.map(el => [el.key, el.value]))
        const newEntries = []
        const result = {}

        for (const el of data) {
            const item = this.marketData.data.find(({ id }) => id === el.type)
            const key = `${el.type}_${el.seed}`
            const cached = cache.get(key)

            if (cached) result[key] = cached
            else {
                let url
                if (item?.type === "SPRAY") url = getAsset(`voxiom/preview/${el.type}.webp`)
                else {
                    const generator = window.renderSkin([{ type: el.type, seed: el.seed }], {})
                    const img = await generator.next(await generator.next().value).value
                    url = Object.values(img)[0]
                }
                newEntries.push({ key, value: url })
                result[key] = url
            }
        }

        if (newEntries.length > 0) await setDBData(db, newEntries, store)
        return result
    }

    async renderPage() {
        if (typeof window.renderSkin !== "function") return

        const _count = document.getElementById("count")
        const cont = document.getElementById("inventoryCont")
        cont.innerHTML = ""

        if (!this.marketData) this.marketData = await sessionFetch(getAsset("voxiom/voxiomMarket.json"))

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

        const start = this.currentPage * this.itemsPerPage
        const end = start + this.itemsPerPage
        const limitedData = [...this.data.data]
            .filter(el => inventoryFilter(el, this.settings))
            .sort((a, b) => inventorySort(a, b, this.settings))

        const slicedData = [...limitedData].slice(start, end)

        const totalPages = Math.ceil(limitedData.length / this.itemsPerPage)
        _count.innerText = `Page: ${this.currentPage + 1}/${totalPages}\n Filtered: ${limitedData.length}\nTotal: ${this.data.data.length}`

        document.getElementById("left").classList.toggle("disabled", this.currentPage === 0)
        document.getElementById("right").classList.toggle("disabled", this.currentPage + 1 >= totalPages)

        await renderURL(slicedData)
    }

    work() {
        this.settings = JSON.parse(sessionStorage.getItem("skinSettings")) || {
            name: "", id: "", rotation: "", creation: "", model: "", rarity: "", equipped: "", equipped_date: ""
        }

        const inventorySelect = document.getElementById("inventorySelectMenu")

        if (typeof window.renderSkin !== "function") {
            inventorySelect.innerHTML = "window.renderSkin function not found. If you see this message, please report it to the developer."
            return
        }

        for (const select of inventorySelect.querySelectorAll(".voxiomSelect")) {
            const menu = select.querySelector(".voxiomSelectMenu")
            const selected = select.querySelector(".selected")
            const options = select.querySelectorAll(".option")

            selected?.addEventListener("click", () => menu.classList.toggle("active"))
            for (const option of options) {
                if (option.dataset.value === this.settings[select.id]) selected.textContent = option.textContent
                option.addEventListener("click", async () => {
                    this.currentPage = 0
                    selected.textContent = option.textContent
                    this.settings[select.id] = option.dataset.value
                    menu.classList.remove("active")
                    await this.renderPage()
                })
            }
        }

        document.addEventListener("click", e => {
            for (const el of inventorySelect.querySelectorAll(".voxiomSelectMenu.active"))
                if (!el.parentNode.contains(e.target)) el.classList.remove("active")
        })

        inventorySelect.querySelector("#name").addEventListener("input", async e => {
            this.currentPage = 0
            this.settings.name = e.target.value
            await this.renderPage()
        })
        inventorySelect.querySelector("#id").addEventListener("input", async e => {
            this.currentPage = 0
            this.settings.id = e.target.value
            await this.renderPage()
        })
        inventorySelect.querySelector("#apply").addEventListener("click", () => {
            sessionStorage.setItem("skinSettings", JSON.stringify(this.settings))
            window.location.reload()
        })
        inventorySelect.querySelector("#clear").addEventListener("click", async () => {
            sessionStorage.removeItem("skinSettings")
            window.location.reload()
        })
        inventorySelect.querySelector("#left").addEventListener("click", async () => {
            if (this.currentPage == 0) return
            this.currentPage--
            await this.renderPage()
        })
        inventorySelect.querySelector("#right").addEventListener("click", async () => {
            if ((this.currentPage + 1) * this.itemsPerPage >= this.data.data.length) return
            this.currentPage++
            await this.renderPage()
        })

        const exportSkins = async settings => {
            const data = await this.getURL(this.data.data)

            const exportedData = [...this.data.data]
                .filter(el => inventoryFilter(el, settings))
                .sort((a, b) => inventorySort(a, b, settings))

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
            icon.src = loadAsset("icons/tricko-32.png")

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

        inventorySelect.querySelector("#export").addEventListener("click", () => exportSkins(this.settings))
    }
}

module.exports = InventoryModal