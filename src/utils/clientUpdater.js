const { autoUpdater } = require("electron-updater")
const { message } = require("../functions.js")

const clientUpdater = () => {
    autoUpdater.checkForUpdates()

    autoUpdater.on("update-available", () => message("Update", "A new version is available. It will be downloaded and installed."))

    autoUpdater.on("update-downloaded", () => message("Update", "The update has been downloaded. It will be installed on restart.")
        .then(() => autoUpdater.quitAndInstall()))
}

module.exports = clientUpdater