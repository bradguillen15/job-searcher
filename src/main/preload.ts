import { contextBridge, ipcRenderer } from "electron";

export type ApiChannel =
  | "db:query"
  | "scraper:run"
  | "ollama:list"
  | "fs:openPath"
  | "profiles:list"
  | "profiles:create"
  | "profiles:switch"
  | "profiles:delete";
export type ProgressChannel = "scraper:progress";

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: ApiChannel, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),

  on: (channel: ProgressChannel, callback: (...args: unknown[]) => void): (() => void) => {
    const sub = (_: Electron.IpcRendererEvent, ...a: unknown[]) => callback(...a);
    ipcRenderer.on(channel, sub);
    return () => ipcRenderer.removeListener(channel, sub);
  },
});
