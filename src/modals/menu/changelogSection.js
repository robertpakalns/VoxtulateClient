const { createEl, el, sessionFetch, getAsset } = require("../../utils/functions.js")

let changelogData
const createChangelogSection = async () => {

    // Load data
    const _spin = createEl("div", {}, "spin")
    const _loading = createEl("div", {}, "loader", [_spin])

    el("clientUpdatesText").element.appendChild(_loading)

    changelogData = await sessionFetch(getAsset("tricko/voxtulateUpdates.json"))
    el("clientUpdatesText").element.removeChild(_loading)

    // Render page
    for (const update of changelogData) {
        const title = createEl("h3", {}, "updatesTitle", [`${update.version} - ${update.date}`])
        const description = createEl("ul")

        for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

        const cont = createEl("div", {}, "updatesCont", [title, description])
        el("clientUpdatesText").element.append(cont)

        const _nav = createEl("button", {}, "", [update.version])
        _nav.addEventListener("click", () => cont.scrollIntoView({ behavior: "smooth" }))

        el("clientUpdatesNavigator").element.append(_nav)
    }
}

module.exports = createChangelogSection