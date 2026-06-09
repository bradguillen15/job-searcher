import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

export interface BrowserSession {
  goto(url: string): Promise<void>;
  getPage(): Page;
  screenshotPng(): Promise<Buffer>;
  close(): Promise<void>;
}

class PlaywrightBrowserSession implements BrowserSession {
  private browser: Browser;
  private context: BrowserContext;
  private page: Page;

  private constructor(browser: Browser, context: BrowserContext, page: Page) {
    this.browser = browser;
    this.context = context;
    this.page = page;
  }

  static async launch(): Promise<PlaywrightBrowserSession> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    return new PlaywrightBrowserSession(browser, context, page);
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { timeout: 30000, waitUntil: "domcontentloaded" });
  }

  getPage(): Page {
    return this.page;
  }

  async screenshotPng(): Promise<Buffer> {
    return this.page.screenshot({ type: "png" });
  }

  async close(): Promise<void> {
    await this.context.close();
    await this.browser.close();
  }
}

export async function launchBrowser(): Promise<BrowserSession> {
  return PlaywrightBrowserSession.launch();
}
