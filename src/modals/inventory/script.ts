import {
  creationTime,
  getAsset,
  inventoryFilter,
  inventorySort,
  IInventoryElement,
  IInventorySettings,
  createEl,
  sessionFetch,
} from "../../preload/preloadFunctions.js";
import inventoryModalString from "../../../assets/html/inventory.html?raw";
import Modal from "../modal.js";

const openDB = (store: string): Promise<IDBDatabase> =>
  new Promise((res, rej) => {
    const req = indexedDB.open("SkinCacheDB", 1);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath: "key" }).createIndex(
          "by_type",
          "type",
        );
      }
    };
    req.onsuccess = (e) => res((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => rej((e.target as IDBOpenDBRequest).error);
  });

const getDBData = <T>(db: IDBDatabase, store: string): Promise<T[]> =>
  new Promise((res, rej) => {
    const request = db
      .transaction(store, "readonly")
      .objectStore(store)
      .getAll();
    request.onsuccess = (e) => {
      res((e.target as IDBRequest).result as T[]);
    };
    request.onerror = (e) => {
      rej((e.target as IDBRequest).error);
    };
  });

const setDBData = <T>(
  db: IDBDatabase,
  array: T[],
  store: string,
): Promise<void> =>
  new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    const objectStore = tx.objectStore(store);

    for (const el of array) {
      const request = objectStore.put(el);
      request.onerror = (e) => rej((e.target as IDBRequest).error);
    }

    tx.oncomplete = () => res();
    tx.onerror = (e) => rej(tx.error);
  });

class InventoryModal extends Modal {
  modalHTMLString = inventoryModalString;
  settings: IInventorySettings | null = null;
  data: any = null;
  marketData: IInventoryElement[] | null = null;
  currentPage = 0;
  itemsPerPage = 18;

  constructor() {
    super();
  }

  async init(): Promise<any> {
    super.init();
    this.modal!.id = "inventoryModal";
  }

  setData<T>(data: T): void {
    this.data = data;
  }

  async getURL(data: any) {
    const store = "skins";
    const db = await openDB(store);
    const items = await getDBData(db, store);

    const cache = new Map(items.map((el: any) => [el.key, el.value]));
    const newEntries: Record<string, string>[] = [];
    const result: Record<string, string> = {};

    for (const element of Array.from(data)) {
      const el = element as any;
      const item = this.marketData!.find(({ id }) => id === el.type);
      const key = `${el.type}_${el.seed}`;
      const cached = cache.get(key);

      if (cached) result[key] = cached;
      else {
        let url: string;
        if (item?.type === "SPRAY")
          url = getAsset(`voxiom/preview/${el.type}.webp`);
        else {
          const generator = window.renderSkin(
            [{ type: el.type, seed: el.seed }],
            {},
          );
          const img = await generator.next(await generator.next().value).value;
          url = Object.values(img)[0] as string;
        }
        newEntries.push({ key, value: url });
        result[key] = url;
      }
    }

    if (newEntries.length > 0) await setDBData(db, newEntries, store);
    return result;
  }

  async renderPage() {
    if (typeof window.renderSkin !== "function") return;

    const _count = document.getElementById("count") as HTMLElement;
    const cont = document.getElementById("inventoryCont") as HTMLElement;
    cont.innerHTML = "";

    if (!this.marketData)
      this.marketData = await sessionFetch(
        getAsset("voxiom/voxiomMarket.json"),
      );

    const rarities: Record<string, string> = {
      Common: "255, 255, 255",
      Noteworthy: "128, 156, 255",
      Precious: "180, 99, 255",
      Magnificent: "255, 84, 224",
      Extraordinary: "230, 126, 34",
      Covert: "255, 66, 101",
      Artifact: "255, 224, 99",
    };

    const setImage = (el: IInventoryElement, src: string): void => {
      const r = rarities[el.rarity];
      const _img = createEl("img", { src }, "img");
      const _line = createEl(
        "hr",
        {
          style: `background: linear-gradient(90deg, rgba(${r}, 0.5) 0%, rgb(${r}) 50%, rgba(${r}, 0.5) 100%)`,
        },
        "line",
      );
      const _name = createEl("div", {}, "name", [el.name]);
      const _id = createEl("div", {}, "id", [el.type]);
      const _equipped = createEl(
        "div",
        { style: `background: ${el.slot ? "yellow" : "transparent"}` },
        "equipped",
      );
      const _creation = createEl("div", {}, "creation", [
        creationTime(el.creation_time),
      ]);
      const _imgCont = createEl("div", {}, "imgCont", [
        _name,
        _img,
        _id,
        _equipped,
        _creation,
        _line,
      ]);
      const _imgBlock = createEl("div", {}, "imgBlock", [_imgCont]);
      if (!el.seed) {
        _imgBlock.classList.add("skin-exclusive");
        _imgBlock.setAttribute(
          "title",
          "This unique item was not obtained from crates; it was personally given by ThriveR, the developer of Voxiom, to the first player.",
        );
      }
      cont.appendChild(_imgBlock);
    };

    const renderURL = async (data: IInventoryElement[]): Promise<void> => {
      const urls = await this.getURL(data);
      for (const el of data) setImage(el, urls[`${el.type}_${el.seed}`]);
    };

    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const limitedData = [...this.data.data]
      .filter((el) => inventoryFilter(el, this.settings as IInventorySettings))
      .sort((a, b) => inventorySort(a, b, this.settings as IInventorySettings));

    const slicedData = [...limitedData].slice(start, end);

    const totalPages = Math.ceil(limitedData.length / this.itemsPerPage);
    _count.innerText = `Page: ${this.currentPage + 1}/${totalPages}\n Filtered: ${limitedData.length}\nTotal: ${this.data.data.length}`;

    document
      .getElementById("left")!
      .classList.toggle("disabled", this.currentPage === 0);
    document
      .getElementById("right")!
      .classList.toggle("disabled", this.currentPage + 1 >= totalPages);

    await renderURL(slicedData);
  }

  work() {
    this.settings = JSON.parse(
      sessionStorage.getItem("skinSettings") as string,
    ) || {
      name: "",
      id: "",
      rotation: "",
      creation: "",
      model: "",
      rarity: "",
      equipped: "",
      equipped_date: "",
    };

    const inventorySelect = document.getElementById(
      "inventorySelectMenu",
    ) as HTMLElement;

    if (typeof window.renderSkin !== "function") {
      inventorySelect.innerHTML =
        "window.renderSkin function not found. If you see this message, please report it to the developer.";
      return;
    }

    for (const select of Array.from(
      inventorySelect.querySelectorAll(".voxiomSelect"),
    )) {
      const menu = select.querySelector(".voxiomSelectMenu") as HTMLElement;
      const selected = select.querySelector(".selected") as HTMLSelectElement;
      const options = select.querySelectorAll<HTMLOptionElement>(".option");

      selected?.addEventListener("click", () =>
        menu.classList.toggle("active"),
      );
      for (const option of Array.from(options)) {
        if (
          option.dataset.value ===
          this.settings![select.id as keyof IInventorySettings]
        )
          selected.textContent = option.textContent;
        option.addEventListener("click", async () => {
          this.currentPage = 0;
          selected.textContent = option.textContent;
          this.settings![select.id as keyof IInventorySettings] = option.dataset
            .value! as IInventorySettings["sort"];
          menu.classList.remove("active");
          await this.renderPage();
        });
      }
    }

    document.addEventListener("click", (e) => {
      for (const el of Array.from(
        inventorySelect.querySelectorAll(".voxiomSelectMenu.active"),
      ))
        if (!el.parentNode!.contains(e.target as HTMLElement))
          el.classList.remove("active");
    });

    inventorySelect
      .querySelector("#name")!
      .addEventListener("input", async (e) => {
        this.currentPage = 0;
        this.settings!.name = (e.target as HTMLInputElement).value;
        await this.renderPage();
      });
    inventorySelect
      .querySelector("#id")!
      .addEventListener("input", async (e) => {
        this.currentPage = 0;
        this.settings!.id = (e.target as HTMLInputElement).value;
        await this.renderPage();
      });
    inventorySelect.querySelector("#apply")!.addEventListener("click", () => {
      sessionStorage.setItem("skinSettings", JSON.stringify(this.settings));
      window.location.reload();
    });
    inventorySelect
      .querySelector("#clear")!
      .addEventListener("click", async () => {
        sessionStorage.removeItem("skinSettings");
        window.location.reload();
      });
    inventorySelect
      .querySelector("#left")!
      .addEventListener("click", async () => {
        if (this.currentPage == 0) return;
        this.currentPage--;
        await this.renderPage();
      });
    inventorySelect
      .querySelector("#right")!
      .addEventListener("click", async () => {
        if ((this.currentPage + 1) * this.itemsPerPage >= this.data.data.length)
          return;
        this.currentPage++;
        await this.renderPage();
      });

    const exportSkins = async (settings: IInventorySettings) => {
      const data = await this.getURL(this.data.data);

      const exportedData = [...this.data.data]
        .filter((el) => inventoryFilter(el, settings))
        .sort((a, b) => inventorySort(a, b, settings));

      const size: number = 256;
      const columns = Math.ceil(Math.sqrt(exportedData.length));
      const rows = Math.ceil(exportedData.length / columns);

      const canvas = createEl("canvas", {
        width: (size * columns).toString(),
        height: (size * rows).toString(),
      }) as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await Promise.all(
        exportedData.map(async (el, i) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = data[`${el.type}_${el.seed}`];
          await img.decode();
          const scale = Math.min(size / img.width, size / img.height);
          ctx.drawImage(
            img,
            (i % columns) * size + (size - img.width * scale) / 2,
            Math.floor(i / columns) * size + (size - img.height * scale) / 2,
            img.width * scale,
            img.height * scale,
          );
        }),
      );

      const iconSize = 15;
      const padding = 3;
      const icon = new Image();
      icon.crossOrigin = "anonymous";
      icon.src = "voxtulate://?path=assets/icons/tricko-32.png";

      icon.onload = () => {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(
          icon,
          canvas.width - iconSize - padding,
          canvas.height - iconSize - padding,
          iconSize,
          iconSize,
        );
        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
          "Powered by Tricko",
          canvas.width - iconSize - padding * 2,
          canvas.height - padding * 2,
        );
        ctx.globalAlpha = 1;
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          createEl("a", {
            href: url,
            download: `voxtulate_${Date.now()}.png`,
          }).click();
          URL.revokeObjectURL(url);
        }, "image/png");
      };
    };

    inventorySelect
      .querySelector("#export")!
      .addEventListener("click", () =>
        exportSkins(this.settings as IInventorySettings),
      );
  }
}

export default InventoryModal;
