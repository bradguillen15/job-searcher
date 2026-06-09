/** @type {import('electron-builder').Configuration} */
const config = {
  appId: "com.jobscout.app",
  productName: "Job Scout",
  directories: {
    buildResources: "build",
    output: "dist/packages",
  },
  files: ["dist/main/**/*", "dist/renderer/**/*", "package.json"],
  mac: {
    target: [
      {
        target: "dmg",
        arch: ["arm64", "x64"],
      },
    ],
    category: "public.app-category.productivity",
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
};

module.exports = config;
