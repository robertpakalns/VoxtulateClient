const { createEl, timeLeft, sessionFetch, getAsset, inventoryFilter, inventorySort, loadAsset } = require("../utils/functions.js")
const InventoryModal = require("../modals/inventory/script.js")

const advancedInventory = async () => {
    let inventoryData, listedData, marketData

    const gemPath = loadAsset("icons/gem.webp")

    const inmenu = new InventoryModal

    const _fetch = fetch
    window.fetch = (...args) => _fetch(...args).then(r => r.clone().text().then(async data => {
        const [url] = args
        if (url === "/profile/myinv") {
            marketData = await sessionFetch(getAsset("voxiom/voxiomMarket.json"))
            const parsedData = JSON.parse(data)
            const newData = {
                ...parsedData,
                data: parsedData.data
                    .map(el => {
                        const skin = marketData.data[el.type - 1]
                        return { ...el, name: skin.name, rotation: skin.rotation, model: skin.type, rarity: skin.rarity }
                    })
                    .filter(el => inventoryFilter(el, inmenu.settings))
                    .sort((a, b) => inventorySort(a, b, inmenu.settings))
            }
            inmenu.setData(newData)
            return new Response(JSON.stringify(newData), r)
        }

        if (url === "/market/public") inventoryData = JSON.parse(data)
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

        if (document.querySelector(".voxiomSkinName")) return
        for (const [i, el] of document.querySelectorAll(".cJoQGw").entries()) {
            const skin = isMarket ? inventoryData.data.market_items[i] : listedData.data.player_market_items[i]
            const _image = isMarket || isSales ? createEl("img", { src: gemPath }, "gem") : ""
            const text = isSales || isMarket ? `${timeLeft(skin.listed_time + 1209600000)} | ${skin.price}` : ""
            const _name = createEl("div", { textContent: text }, "voxiomSkinName", [_image])
            el.appendChild(_name)
        }
    })
    observer.observe(document.querySelector("#app"), { childList: true, subtree: true })
}

module.exports = advancedInventory