const rpc = require("discord-rpc")
const { Config } = require("./config.js")
const config = new Config
class DiscordRPC {
    constructor() {
        this.clientId = "1294677913131810916"
        this.client = new rpc.Client({ transport: "ipc" })
        this.joinURL = "voxtulate://"
        this.time = Date.now()

        this.client.on("ready", () => this.setActivity())
        setInterval(() => this.setActivity(), 15000)

        this.client.login({ clientId: this.clientId }).catch(console.error)
    }

    setActivity() {
        const buttons = [{ label: "Download Client", url: "https://github.com/robertpakalns/VoxtulateClient/releases/latest" }]
        if (config.get("client.rpc")) buttons.unshift({ label: "Join Game", url: this.joinURL })

        this.client.setActivity({
            state: "Voxtulating",
            startTimestamp: this.time,
            largeImageKey: "voxtulate",
            buttons: buttons
        }).catch(console.error)
    }

    setJoinURL(url) {
        this.joinURL = url
    }
}

module.exports = DiscordRPC