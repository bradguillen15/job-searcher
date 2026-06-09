/// <reference types="vite/client" />

import type { ApiChannel } from "../main/preload";

declare global {
  interface Window {
    api: {
      invoke: (channel: ApiChannel, ...args: unknown[]) => Promise<unknown>;
      on: (
        channel: "scraper:progress",
        callback: (...args: unknown[]) => void
      ) => () => void;
    };
  }
}

export {};
