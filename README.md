# Voxtulate Client
Unofficial Voxiom client, for real Voxtulators

### Protocol
Voxtulate Client uses `voxtulate` protocol for opening the app. Example: `voxtulate://#Rfacn` opens the app with page `https://voxiom.io/#Rfacn`

### Client Safety 
All Voxtulate Client source code is publicly available in the [GitHub repository](https://github.com/robertpakalns/VoxtulateClient). If you have concerns about the safety of your private information while using the Voxtulate Client, feel free to inspect the source code. Trust in the client is based on your trust in the developer.

### Default Keybinding
| Keybinding       | Action                 |
|------------------|------------------------|
| `Escape`         | Close Modal Window     |
| `F1`             | Open Settings Window   |
| `F2`             | Open Info Window       |
| `F5`             | Reload Page            |
| `F11`            | Toggle Fullscreen Mode |
| `F12`            | Toggle Developer Tools |

### Current Features
- Adblocker
- Unlimited FPS
- Custom Crosshair
- Resource Swapper
- Info window (`F2`)
- CSS/JS Customization
- Settings window (`F1`)
- Advanced Inventory Sorting
  * Filter by type, rarity, name, ID, rotation
  * Remove Defaults
  * Sort by creation date
  * Apply and Clear buttons
  * Skin ID and creation date for each item in `/loadouts/inventory` 
  * Skin listing time left and price for each item in `/loadouts/market` 
  * Skin listing time left and price for each item in `/loadouts/sales` 
- Chromium Developer Tools (`F12`)
- Client-Side CSS/JS Customization
- Keybinding Option For Client Features
- Minimized Console
  * FPS
  * Coordinates
  * Latency
- Discord Rich Presence

### Development Questions (Electron.js)
- `disabling mouse acceleration is not supported` message from `https://voxiom.io/package/c88d6619469a22a797eb.js` script while clicking on in-game canvas.
- I would like to rewrite the whole client using Tauri. The only problem I get there is FPS uncap. If I resolve this issue, I will definitely move on Tauri.

### Used Technologies
- Electron
  * `electron@10.4.7`
  * `electron-updater@6.3.4`
  * `electron-builder@25.0.5`
- Discord
  * `discord-rpc@4.0.1`

### Credits
- Vanced Voxiom Client (NamekujiLSDs)
  * [Website](https://namekujilsds.github.io/VVC)
  * [Discord](https://discord.com/invite/EcZytWAJkn)
- Voxiom.io (ThriveR)
  * [Website](https://voxiom.io)
  * [Discord](https://discord.com/invite/GBFtRcY)

by robertpakalns
[Community Server](https://discord.gg/yPjrUrvSzv)
Powered by Tricko