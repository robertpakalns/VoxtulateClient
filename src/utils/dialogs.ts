import { getIcon } from "./functions.js";
import { dialog } from "electron";

export const confirmAction = async (
  message: string,
  callback: () => void,
): Promise<void> => {
  const result = await dialog.showMessageBox({
    type: "question",
    buttons: ["Yes", "No"],
    defaultId: 1,
    icon: getIcon(),
    title: "Voxtulate Client | Confirm",
    message,
  });
  if (result.response === 0) callback();
};
