const rpc = require("discord-rpc")

class DiscordRPC {
    constructor() {
        this.clientId = "1294677913131810916"
        this.client = new rpc.Client({ transport: "ipc" })
        this.joinURL = "voxtulate://"

        rpc.register(this.clientId)
        this.client.on("ready", () => this.setActivity())
        this.client.login({ clientId: this.clientId }).catch(() => { })
    }

    setJoinURL(url) {
        this.joinURL = url
        this.setActivity()
    }

    setActivity() {
        this.client.setActivity({
            state: "Voxtulating",
            startTimestamp: Date.now(),
            largeImageKey: "voxtulate",
            buttons: [
                { label: "Join Game", url: this.joinURL },
                { label: "Download Client", url: "https://github.com/robertpakalns/VoxtulateClient/releases/latest" }
            ]
        })
    }
}

module.exports = DiscordRPC