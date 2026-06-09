import "dotenv/config";
import { app, BrowserWindow } from "electron";
import path from "path";
import { registerIpcHandlers } from "./ipc-handler";
import { loadActiveProfile } from "./profiles";
import { setMainWindow } from "./main-window";
import { loadUserEnv } from "./settings-env";

loadUserEnv();

export { getMainWindow } from "./main-window";

const VITE_DEV_URL = "http://localhost:5173";

function createWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, "preload.js");

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: "Job Scout",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env["NODE_ENV"] === "development") {
    win.loadURL(VITE_DEV_URL);
  } else {
    const indexPath = path.join(__dirname, "../renderer/index.html");
    win.loadFile(indexPath);
  }

  setMainWindow(win);
  win.on("closed", () => {
    setMainWindow(null);
  });

  return win;
}

app.whenReady().then(() => {
  loadActiveProfile();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
