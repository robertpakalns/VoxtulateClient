# <img src="https://raw.githubusercontent.com/robertpakalns/VoxtulateClient/main/assets/icon.png" style="height: 1em"> Voxtulate Client
Unofficial Voxiom client, for real Voxtulators  

### Client Safety 
This project is open-source. All Voxtulate Client source code is publicly available in the [GitHub repository](https://github.com/robertpakalns/VoxtulateClient). All builds are executed via GitHub Actions. If you have concerns about the safety of your private information while using the Voxtulate Client, feel free to inspect the source code. Trust in the client is based on your trust in the developer.

### Protocol
Voxtulate Client uses `voxtulate://` protocol for opening the app. Example: `voxtulate://#Rfacn` opens the app with page `https://voxiom.io/#Rfacn`

### Data Folder
The Voxtulate Client stores its data, including user information, tokens, and cache, in `%appdata%/voxtulate-client`. Meanwhile, user customization data, such as `config.json`, user scripts and the swapper folder, is kept in `%USERPROFILE%\Documents\VoxtulateClient`.

### Swapper Usage
1. In Developer Tools `Network` section, find the file you want to swap. Save the file name (e.g., `a5afd201eb5c5abf621b.mp3`)
2. Go to `%USERPROFILE%\Documents\VoxtulateClient\swapper`
3. Import the file there with the saved name
4. Be careful: swapper works only with file name and extension, no paths in swapped file name

### Default Keybinding
| Keybinding       | Action                 |
|------------------|------------------------|
| `Escape`         | Close Modal Window     |
| `F1`             | Open Settings Window   |
| `F2`             | Open Info Window       |
| `F3`             | Open Updates Window    |
| `F5`             | Reload Page            |
| `F11`            | Toggle Fullscreen Mode |
| `F12`            | Toggle Developer Tools |

### Features
- Adblocker
- Unlimited FPS
- Custom Crosshair
- Resource Swapper
- Settings, Info, Upates Windows
- CSS/JS Customization
- Developer Tools (`F12`)
- Advanced Inventory Sorting
  * Filter by type, rarity, name, ID, rotation
  * Sort by creation date
  * Apply, Clear, and Export buttons
  * Skin listing time left and price for each item in `market` and `sales` pages
- Client-Side CSS/JS Customization
- Keybinding Option For Client Features
- Minimized Console
  * FPS
  * Coordinates
  * Latency
- Discord RPC Support

### Dependencies
- `electron@10.4.7`
- `electron-updater@6.3.9`
- `electron-builder@25.1.8`
- `discord-rpc@4.0.1`

### Credits
- VVC (NamekujiLSDs) - [Website](https://namekujilsds.github.io/VVC) | [Discord](https://discord.com/invite/EcZytWAJkn)
- Voxiom.io (ThriveR) - [Website](https://voxiom.io) | [Discord](https://discord.com/invite/GBFtRcY)
- Juice Client (irrvlo) - [Website](https://juice.irrvlo.xyz) | [Discord](https://discord.gg/FjzAAdSjng)

by robertpakalns | [Community Server](https://discord.gg/yPjrUrvSzv) | Powered by Tricko