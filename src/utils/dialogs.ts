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

export const confirmAction = (message: string, callback: () => void): void => {
  const result = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["Yes", "No"],
    defaultId: 1,
    icon: getIcon(),
    title: "Voxtulate Client | Confirm",
    message,
  });
  if (result === 0) callback();
};
