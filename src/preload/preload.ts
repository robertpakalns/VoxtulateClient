import {
  createEl,
  isNum,
  creationTime,
  domains,
} from "../preload/preloadFunctions.js";
import { config, setupFastCSS, handleDiscordLink } from "./preloadUtils.js";
import advancedInventory from "./advancedInventory.js";
import MenuModal from "../modals/menu/script.js";
import { backToVoxiom } from "./preloadUtils.js";
import { ipcRenderer, shell } from "electron";
import enableStyles from "./enableStyles.js";

let accountData: any, playerData: any;

declare global {
  interface Window {
    renderSkin: Function;
  }
}

const createModals = async (): Promise<void> => {
  const modalStyles = createEl("link", {
    rel: "stylesheet",
    href: "voxtulate://?path=assets/css/modalStyles.css",
  });
  document.head.appendChild(modalStyles);

  const menuModal = new MenuModal();
  menuModal.init();
  menuModal.work();

  const { inventorySorting } = (await config.get("interface")) as {
    inventorySorting: boolean;
  };
  if (inventorySorting) advancedInventory();
};

document.addEventListener("DOMContentLoaded", async (): Promise<void> => {
  backToVoxiom();
  await enableStyles();

  if (!domains.has(window.location.host)) return;

  const { MenuModal } = (await config.get("keybinding.content")) as {
    MenuModal: string;
  };
  const consoleCont = createEl("div", {
    className: "voxiomConsole voxiomCreate",
  });
  const blocksCont = createEl("div", {
    className: "voxiomBlocks voxiomCreate",
  });
  const hintCont = createEl("div", { id: "hintCont" }, "hint", [
    `Press ${MenuModal} to open menu`,
  ]);
  document.body.append(consoleCont, blocksCont);

  const _fetch = fetch;
  window.fetch = (...args) =>
    _fetch(...args).then((r) =>
      r
        .clone()
        .text()
        .then((data) => {
          const [url] = args;

          if ((url as string) === "/profile/me") accountData = JSON.parse(data);
          if ((url as string).startsWith("/profile/player"))
            playerData = JSON.parse(data);

          return r;
        }),
    );

  const copyNode = (label: string, value: string, id: string): void => {
    const nodeId: string = `node_${id}`;

    if (document.getElementById(nodeId)) {
      document.getElementById(nodeId)!.children[1].textContent = value;
      return;
    }

    const node = document.querySelector(".bejTKB") as HTMLElement;
    if (!node) return;

    const copy = node.cloneNode(true) as HTMLElement;
    copy.id = nodeId;
    node!.parentElement!.appendChild(copy);

    copy.children[0].textContent = label;
    copy.children[1].textContent = value;
  };

  const cloneData = (name: string, data: any, path: string): void => {
    if (!data) return;

    const validPaths = new Set<string>([
      "/account",
      "/account/br",
      "/account/ctg",
      `/player/${name}`,
      `/player/${name}/br`,
      `/player/${name}/ctg`,
    ]);
    if (!validPaths.has(path)) return;

    const mode = path.endsWith("/br") ? "br" : "ctg";
    copyNode(
      "KPG",
      isNum(data[mode].total_kills, data[mode].total_games_played),
      "kpg",
    );
    copyNode("Creation Date", creationTime(data.creation_time), "createdAt");
    copyNode("Gems", data.gems, "gems");
  };

  const observer = new MutationObserver(() => {
    // Hint message
    if (!document.getElementById("hintCont"))
      document.querySelector(".ljNuSc")?.appendChild(hintCont);

    // Discord link
    const discordLink = document.querySelector(
      'img[src="/./package/3ad1db34f5eb135eaf13.png"]',
    ) as HTMLElement;
    if (discordLink) handleDiscordLink(discordLink);

    // Player data
    const { pathname } = window.location;
    if (pathname.startsWith("/account"))
      cloneData("account", accountData?.data, pathname);
    if (pathname.startsWith("/player/"))
      cloneData(pathname.split("/")[2], playerData?.data, pathname);
  });
  observer.observe(document.getElementById("app")!, {
    childList: true,
    subtree: true,
  });

  setInterval(() => {
    // Mini console
    const t = document.querySelector(
      'body > div[style*="background-color: rgba(0, 0, 0, 0.8); display: block"]',
    );
    if (t && t.textContent !== "") {
      const c = t.innerHTML;
      const match = c.match(
        /Player Block Position:<br>\s*x: ([^<]+) y: ([^<]+) z: ([^<]+)/,
      );
      if (!match) return;

      const [_, x, y, z] = match;
      consoleCont.innerHTML = `${parseInt(c.match(/FPS: ([\d]+)/)![1])} FPS<br>${x} ${y} ${z}<br>${c.match(/Latency: ([\d]+ms)/)![1]}`;
    } else consoleCont.textContent = "";

    // Blocks
    blocksCont.textContent =
      document
        .querySelector(".biWqsQ")
        ?.textContent.match(/Current mode: (\w+)/)![1] || "";
  }, 50);

  document.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLAnchorElement>(".dELrkI");
    if (!el) return;
    e.preventDefault();
    shell.openPath(el.href);
  });

  setupFastCSS();
  createModals();
});

ipcRenderer.on("set-game-settings", (_, data) =>
  localStorage.setItem("persist:root", JSON.parse(data)),
);
ipcRenderer.on("get-game-settings", (_, file) =>
  ipcRenderer.invoke(
    "write-game-settings",
    file,
    localStorage.getItem("persist:root")!,
  ),
);
ipcRenderer.on("toggle-window", (_, modal) => {
  // Toggles modals on keybinds
  const openedModal = document.querySelector(".modalWrapper.open");

  if (document.querySelector(".bNczYf")) {
    openedModal?.classList.toggle("open");
    if (openedModal?.id !== modal)
      document.getElementById(modal)?.classList.toggle("open");
    return;
  }

  if (modal === "null")
    document.querySelector(".enmYtp")
      ? document.querySelector("canvas")!.requestPointerLock()
      : document.exitPointerLock();
  if (openedModal) {
    openedModal.classList.toggle("open");
    if (modal === "null" || openedModal.id === modal)
      document.querySelector("canvas")!.requestPointerLock();
    else document.getElementById(modal)!.classList.toggle("open");
  } else if (modal !== "null") {
    document.getElementById(modal)!.classList.toggle("open");
    document.exitPointerLock();
  }
});
