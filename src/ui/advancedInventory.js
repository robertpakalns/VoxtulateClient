const { createEl, timeLeft, sessionFetch, getAsset } = require("../functions.js")
const path = require("path")
const InventoryModal = require("../modals/inventory/script.js")

const advancedInventory = async () => {
    let marketData, listedData

    const market = await sessionFetch(getAsset("voxiom/voxiomMarket.json"))
    const gemPath = path.join(__dirname, "../../assets/icons/gem.webp")

    const inmenu = new InventoryModal

    const _fetch = fetch
    window.fetch = (...args) => _fetch(...args).then(r => r.clone().text().then(data => {
        const [url] = args
        if (url === "/profile/myinv") {
            const { name = "", id = "", rotation = "", creation = "", model = "", rarity = "", equipped = "" } = inmenu.settings
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
                    (rarity === "" || el.rarity === rarity) &&
                    (equipped === "" || el.slot !== null === (equipped === "true"))
                ).sort((a, b) => !creation ? 0 : creation === "true" ? b.creation_time - a.creation_time : a.creation_time - b.creation_time)
            }
            inmenu.setData(newData)
            return new Response(JSON.stringify(newData), r)
        }

        if (url === "/market/public") marketData = JSON.parse(data)
        if (url === "/market/my_listed_items") listedData = JSON.parse(data)

        return r
    }))

    inmenu.init()
    inmenu.work()

    const _inventoryButton = createEl("div", {}, "voxiomSkinsButton", ["Advanced Sorting"])
    _inventoryButton.addEventListener("click", () => {
        document.querySelector("#inventoryModal").classList.toggle("open")
        inmenu.currentPage = 0
        inmenu.renderPage()
    })

    // const _previewButton = createEl("div", {}, "voxiomSkinsButton", ["Preview"])

    const observer = new MutationObserver(() => {
        const { pathname } = window.location
        const isMarket = pathname === "/loadouts/market" || (pathname === "/loadouts" && document.querySelector(".dzKqCZ"))
        const isSales = pathname === "/loadouts/sales"

        if (inmenu.data?.data?.length > 0 &&
            !document.querySelector(".voxiomSkinsButton") &&
            ["/loadouts", "/loadouts/inventory"].includes(pathname)
            // ) document.querySelector(".iRauPR")?.append(_inventoryButton, _previewButton)
        ) document.querySelector(".iRauPR")?.append(_inventoryButton)
        if (!isMarket && !isSales) return

        document.querySelectorAll(".kiKVOk").forEach((el, i) => {
            if (el.parentElement.parentElement.querySelector(".voxiomSkinName")) return
            const skin = isMarket ? marketData.data.market_items[i / 2] : listedData.data.player_market_items[i / 2]
            const _image = isMarket || isSales ? createEl("img", { src: gemPath }, "gem") : ""
            const _name = createEl("div", { textContent: isSales || isMarket ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` : "" }, "voxiomSkinName", [_image])
            el.parentElement.parentElement.appendChild(_name)
        })
    })
    observer.observe(document.querySelector("#app"), { childList: true, subtree: true })
}

module.exports = advancedInventory