import { dialog, MessageBoxReturnValue } from "electron";
import { getIcon } from "./functions.js";

export const message = (
  title: string,
  message: string,
): Promise<MessageBoxReturnValue> =>
  dialog.showMessageBox({
    icon: getIcon(),
    title: `Voxtulate Client | ${title}`,
    message,
  });

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
