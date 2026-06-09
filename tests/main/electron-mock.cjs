// Preloader: registers a minimal electron mock in the require cache
// so that src/main modules can be imported in a plain Node test.
"use strict";

const Module = require("module");
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "electron") {
    return {
      ipcMain: {
        handle: () => {},
      },
      app: {
        getPath: (name) => {
          if (name === "userData") {
            if (!process.env.JOBSCOUT_TEST_USER_DATA) {
              throw new Error("JOBSCOUT_TEST_USER_DATA must be set for profile tests");
            }
            return process.env.JOBSCOUT_TEST_USER_DATA;
          }
          return "/tmp";
        },
      },
      BrowserWindow: class {},
    };
  }
  return originalLoad.apply(this, arguments);
};
