const { message } = require("./functions.js")
const { Client } = require("discord-rpc")
const { Config } = require("./config.js")
const config = new Config

const links = {
    "/": "Viewing main lobby",
    "/experimental": "Viewing main lobby",
    "/account": () => "Viewing their account",
    "/player": name => `Viewing player: ${name}`,
    "/leaderboard": type => `Viewing leaderboard: ${type}`,
    "/loadouts": "Viewing their inventory",
    "/loadouts/inventory": "Viewing their inventory",
    "/loadouts/market": "Viewing market",
    "/loadouts/sales": "Viewing their sales",
    "/loadouts/history": "Viewing their sales history",
    "/shop": () => "Viewing shop",
    "/changelog": "Viewing changelog",
    "/settings": "Viewing settings",
    "/friends": "Viewing their friends",
    "/friends/list": "Viewing their friends",
    "/friends/requests": "Viewing their friend requests",
    "/clans": "Viewing their clan",
    "/clans/active": "Viewing their clan",
    "/clans/search": "Searching clans",
    "/clans/view": name => `Viewing clan: ${name}`
}

const { joinButton, notification } = config.get("discord")

class DiscordRPC {
    constructor() {
        this.clientId = "1294677913131810916"
        this.client = new Client({ transport: "ipc" })
        this.joinURL = "voxtulate://" // Default join URL
        this.state = "Playing Voxiom.io"
        this.time = Date.now()
        this.connected = false

        this.client.on("ready", () => {
            this.connected = true
            this.setActivity()
        })
        setInterval(() => this.connected && this.setActivity(), 15000) // Updates every 15 seconds, regardless of page change

        this.client
            .login({ clientId: this.clientId })
            .catch(() => {
                this.connected = false
                setTimeout(() => notification && message("Discord RPC", "Failed to connect to Discord RPC."), 1000)
            })
    }

    setActivity() {
        if (!this.connected) return

        const buttons = [{ label: "Download Client", url: "https://github.com/robertpakalns/VoxtulateClient/releases/latest" }]
        if (joinButton) buttons.unshift({ label: "Join Game", url: this.joinURL })

        this.client.setActivity({
            state: this.state,
            startTimestamp: this.time,
            largeImageKey: "voxtulate",
            buttons: buttons
        })
    }

    setJoinURL(url) {
        if (!this.connected) return

        const path = url.replace("voxtulate://", "/")
        const match = Object.keys(links).find(key => typeof links[key] === "function" ? path.startsWith(key) : path === key)

        const result = url.includes("#") ? "Playing a match" : match ?
            (typeof links[match] === "function" ? links[match](match ? path.replace(`${match}/`, "").split("?")[0] : path) : links[match]) :
            "Playing Voxiom.io"

        this.state = result
        this.joinURL = url
    }
}

module.exports = DiscordRPC