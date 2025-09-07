import { createEl, getHost } from "../utils/functions.js";

// Go back to Voxiom from Auth page
const authDomains = new Set<string>([
  "www.facebook.com",
  "accounts.google.com",
  "discord.com",
]);

export const backToVoxiom = (): void => {
  if (authDomains.has(window.location.host)) {
    const _back = createEl("div", {}, "backToVoxiom", ["Back to Voxiom"]);
    _back.addEventListener(
      "click",
      () => (window.location.href = `https://${getHost()}`),
    );
    document.body.appendChild(_back);
  }
};
