const { createEl, sessionFetch, getAsset } = require("../../utils/functions.js")

let changelogData
const createChangelogSection = async () => {
    if (changelogData) return

    const _section = document.getElementById("clientUpdates")
    const _text = _section.querySelector("#clientUpdatesText")

    // Load data
    const _spin = createEl("div", {}, "spin")
    const _loading = createEl("div", {}, "loader", [_spin])

    _text.appendChild(_loading)
    changelogData = await sessionFetch(getAsset("voxtulate/voxtulateUpdates.json"))
    _text.removeChild(_loading)

    // Render page
    for (const update of changelogData) {
        const title = createEl("h3", {}, "updatesTitle", [`${update.version} - ${update.date}`])
        const description = createEl("ul")

        for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

        const cont = createEl("div", {}, "updatesCont", [title, description])
        _text.append(cont)

        const _nav = createEl("button", {}, "", [update.version])
        _nav.addEventListener("click", () => cont.scrollIntoView({ behavior: "smooth" }))

        _section.querySelector("#clientUpdatesNavigator").append(_nav)
    }
}

module.exports = createChangelogSection