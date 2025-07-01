![Downloads](https://img.shields.io/github/downloads/robertpakalns/VoxtulateClient/total)
![License](https://img.shields.io/github/license/robertpakalns/VoxtulateClient)
![GitHub stars](https://img.shields.io/github/stars/robertpakalns/VoxtulateClient)
![GitHub forks](https://img.shields.io/github/forks/robertpakalns/VoxtulateClient)
![GitHub last commit](https://img.shields.io/github/last-commit/robertpakalns/VoxtulateClient)
![Languages](https://img.shields.io/github/languages/top/robertpakalns/VoxtulateClient)

<h1 style="font-size: 2em; display: flex; align-items: center">
    <img src="https://raw.githubusercontent.com/robertpakalns/VoxtulateClient/main/assets/icon.png" style="height: 1em">
    <span>Voxtulate Client</span>
</h1>
Unofficial Voxiom client, for real Voxtulators  

# Client Safety 
This project is open-source. All Voxtulate Client source code is publicly available in the [GitHub repository](https://github.com/robertpakalns/VoxtulateClient). All builds are executed via GitHub Actions. If you have concerns about the safety of your private information while using Voxtulate Client, feel free to inspect the source code. Trust in the client is based on trust in the developer.

# Deeplink
Voxtulate Client uses `voxtulate:` protocol to open the client. For example, `voxtulate://?url=path/to/page` opens the client with the page `https://voxiom.io/path/to/page`. [More information](https://github.com/robertpakalns/VoxtulateClient/wiki/Deeplinks).

# Data Folder
Voxtulate Client stores its data, including user information, tokens, and cache, in `%APPDATA%\voxtulate-client`. Meanwhile, user customization data, such as `config.json`, user scripts and the swapper folder, is kept in `%USERPROFILE%\Documents\VoxtulateClient`.

# Resource Swapper
Resource Swapper allows users to replace game resources such as images, models, sounds, and more. [More information](https://github.com/robertpakalns/VoxtulateClient/wiki/Resource-Swapper).

# Default Keybinding
| Key        | Action                 |
|------------|------------------------|
| `Escape`   | Close Modal Window     |
| `F1`       | Open Menu Window       |
| `F5`       | Reload Page            |
| `F11`      | Toggle Fullscreen Mode |
| `F12`      | Toggle Developer Tools |

# Features
- Adblocker
- Advanced Inventory Sorting
  * Filter by type, rarity, name, ID, rotation
  * Sort by creation date
  * Apply, Clear, and Export buttons
  * Skins listing price and time left
- Client-Side Styles
- CSS/JS Customization
- Custom Crosshair
- Developer Tools (`F12`)
- Deeplinks (`voxtulate:` protocol)
- Discord RPC Support
- Keybinding Option for Client Features
- Menu Modal
- Minimized Console (FPS, coordinates, and latency)
- Resource Swapper (Simple and Extended)
- Unlimited FPS

# Dependencies
Voxtulate Client is based on `Electron.js` framework (`Node.js`) with version `10.4.7`. For more information, check the [`package.json`](https://github.com/robertpakalns/VoxtulateClient/blob/main/package.json) file.

# Credits
- VVC (NamekujiLSDs) - [Website](https://namekujilsds.github.io/VVC) | [Discord](https://discord.com/invite/EcZytWAJkn)
- Voxiom.io (ThriveR) - [Website](https://voxiom.io) | [Discord](https://discord.com/invite/GBFtRcY)
- Juice Client (irrvlo) - [Website](https://juice.irrvlo.xyz) | [Discord](https://discord.gg/FjzAAdSjng)

by robertpakalns | [Community Server](https://discord.gg/SEExvCQeNc) | Powered by Tricko