![Downloads](https://img.shields.io/github/downloads/robertpakalns/VoxtulateClient/total)
![License](https://img.shields.io/github/license/robertpakalns/VoxtulateClient)
![GitHub stars](https://img.shields.io/github/stars/robertpakalns/VoxtulateClient)
![GitHub forks](https://img.shields.io/github/forks/robertpakalns/VoxtulateClient)
![GitHub last commit](https://img.shields.io/github/last-commit/robertpakalns/VoxtulateClient)
![Languages](https://img.shields.io/github/languages/top/robertpakalns/VoxtulateClient)

<h1 style="font-size: 2em; display: flex; align-items: center">
    <img src="https://raw.githubusercontent.com/robertpakalns/VoxtulateClient/main/assets/icon.png" style="height: 1em; margin-right: 5px">
    <span>Voxtulate Client</span>
</h1>
Unofficial Electron client for Voxiom.io, for real Voxtulators
<br><br>

<p align="center">
  <a href="https://github.com/robertpakalns/VoxtulateClient/releases/latest">
    <img src="https://img.shields.io/badge/Download-GitHub_Releases-blue?style=for-the-badge&logo=github&logoColor=white" />
  </a>

  <a href="https://discord.gg/SEExvCQeNc">
    <img src="https://img.shields.io/badge/Join-Discord-5661F5?style=for-the-badge&logo=discord&logoColor=white" />
  </a>

  <a href="https://tricko.pro/voxtulate">
    <img src="https://img.shields.io/badge/Visit-Tricko.pro-black?style=for-the-badge&logo=Google-Chrome&logoColor=white" />
  </a>
</p>

## 📥 Download Client
1. Visit the [GitHub releases](https://github.com/robertpakalns/VoxtulateClient/releases/latest)
2. Download the installer for your operating system:
   - Windows: `.exe`
   - macOS: `.dmg`
   - Linux: `.AppImage` or `.tar.gz`
3. Run the installer

## ⚙️ Engine
Voxtulate Client is based on `Electron.js` framework (`Node.js`) with version `21.0.0`. The client also uses the [`@juice-client/node-enject`](https://www.npmjs.com/package/@juice-client/node-enject) workaround on Windows to prevent the bug that freezes any active WebSocket connection when run with the `--disable-frame-rate-limit` flag. More information in [`package.json`](https://github.com/robertpakalns/VoxtulateClient/blob/main/package.json).

## 🛡️ Client Safety
This project is open-source. All Voxtulate Client source code is publicly available in the [GitHub repository](https://github.com/robertpakalns/VoxtulateClient). All builds are executed via GitHub Actions. If you have concerns about the safety of your private information while using Voxtulate Client, feel free to inspect the source code. Trust in the client is based on trust in the developer.

## 🔗 Deeplink
Voxtulate Client uses `voxtulate:` protocol to open the client. For example, `voxtulate://?url=path/to/page` opens the client with the page `https://voxiom.io/path/to/page`. [More information](https://github.com/robertpakalns/VoxtulateClient/wiki/Deeplinks).

## 🔧 Default Keybinding
| Key        | Action                 |
|------------|------------------------|
| `Escape`   | Close Modal Window     |
| `F1`       | Open Menu Window       |
| `F5`       | Reload Page            |
| `F11`      | Toggle Fullscreen Mode |
| `F12`      | Toggle Developer Tools |

## 🚀 Features
* Advanced Inventory Sorting
  * Apply, Clear, and Export buttons
  * Filter by Type, Rarity, Name, ID, and Rotation
  * Skins Listing Price and Time Left
  * Sort by Creation Date
* Changelog
* Client
  * Adblocker
  * Deeplinks (`voxtulate:` Protocol)
  * Discord Rich Presence
  * FPS Uncap
  * Import/Export Client and In-Game Settings
  * Proxy Domain Support
* Customizations
   * Custom Keybinding
   * Userscripts
   * Userstyles
   * Resource Swapper
* User Inteface
  * Client-Side Styles
  * Custom Crosshair
  * Minimized Console

## 🖼️ Menu Modal
To open the menu modal, press `F1`. You can change the key in the Menu Modal.

## 🔄 Resource Swapper
Resource Swapper allows users to replace game resources such as images, models, sounds, and more. [More information](https://github.com/robertpakalns/VoxtulateClient/wiki/Resource-Swapper).

## 🧑‍💻 Credits
  * ThriveR for Voxiom.io
  * Vanced Voxiom Client (NamekujiLSDs) for core features
  * Juice Client (irrvlo) for additional features
  * Redline Client (robertpakalns) for UI design
  * EDEX for the client assets
  * slavcp for enject

by robertpakalns
