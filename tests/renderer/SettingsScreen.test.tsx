import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import SettingsScreen from "../../src/renderer/screens/SettingsScreen";
import { SETTING_KEYS } from "../../src/renderer/lib/settings-db";
import { SCOUT_DEFAULT_DATE_RANGE_KEY } from "../../src/renderer/lib/scout-settings";

const mockInvoke = vi.fn();

const UPSERT_SQL = `
INSERT INTO settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value
`;

const LOAD_SQL = "SELECT value FROM settings WHERE key = ?";

function handleDbQuery(payload: {
  sql: string;
  params?: unknown[];
}): Promise<unknown> {
  const key = payload.params?.[0];

  if (payload.sql.includes("ON CONFLICT(key) DO UPDATE")) {
    return Promise.resolve({ changes: 1, lastInsertRowid: 1 });
  }

  if (payload.sql === LOAD_SQL) {
    if (key === SETTING_KEYS.aiBackend) {
      return Promise.resolve([{ value: "ollama" }]);
    }
    if (key === SETTING_KEYS.ollamaBaseUrl) {
      return Promise.resolve([{ value: "http://localhost:11434" }]);
    }
    if (key === SETTING_KEYS.ollamaModel) {
      return Promise.resolve([{ value: "llama3.2" }]);
    }
    if (key === SCOUT_DEFAULT_DATE_RANGE_KEY) {
      return Promise.resolve([{ value: "30d" }]);
    }
    return Promise.resolve([]);
  }

  return Promise.reject(new Error(`unexpected sql: ${payload.sql}`));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "dark";
  mockInvoke.mockReset();

  mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
    if (channel === "db:query") {
      return handleDbQuery(payload as { sql: string; params?: unknown[] });
    }
    if (channel === "settings:anthropicKeyStatus") {
      return Promise.resolve({ configured: false });
    }
    if (channel === "profiles:activeDbPath") {
      return Promise.resolve("/tmp/jobscout/profiles/p1/jobscout.db");
    }
    if (channel === "ollama:list") {
      return Promise.resolve({ models: ["llama3.2", "mistral"] });
    }
    if (channel === "settings:saveAnthropicKey") {
      return Promise.resolve({ ok: true });
    }
    if (channel === "fs:openPath") {
      return Promise.resolve({ ok: true });
    }
    return Promise.reject(new Error(`unexpected invoke: ${channel}`));
  });

  Object.defineProperty(window, "api", {
    configurable: true,
    value: { invoke: mockInvoke, on: vi.fn(() => () => undefined) },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SettingsScreen", () => {
  it("renders Settings heading and all sections", async () => {
    render(<SettingsScreen />);

    expect(
      await screen.findByRole("heading", { name: "Settings" })
    ).toBeTruthy();
    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(screen.getByText("Scout defaults")).toBeTruthy();
    expect(screen.getByText("AI matching")).toBeTruthy();
    expect(screen.getByText("Data")).toBeTruthy();
  });

  it("shows Ollama fields when backend is ollama", async () => {
    render(<SettingsScreen />);

    expect(await screen.findByLabelText("Ollama base URL")).toBeTruthy();
    expect(screen.getByLabelText("Model")).toBeTruthy();
    expect(screen.queryByLabelText("Anthropic API key")).toBeNull();
  });

  it("hides Ollama fields when backend is anthropic", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    await screen.findByLabelText("Ollama base URL");
    await user.click(screen.getByRole("radio", { name: "Anthropic" }));

    expect(screen.queryByLabelText("Ollama base URL")).toBeNull();
    expect(screen.queryByLabelText("Model")).toBeNull();
    expect(screen.getByLabelText("Anthropic API key")).toBeTruthy();
    expect(screen.getByText("Not configured")).toBeTruthy();
  });

  it("calls ollama:list with trimmed base URL", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const urlInput = await screen.findByLabelText("Ollama base URL");
    await user.click(urlInput);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("  http://ollama.local:11434  ");

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("ollama:list", {
        baseUrl: "http://ollama.local:11434",
      });
    });
  });

  it("shows ollama list error inline", async () => {
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "ollama:list") {
        return Promise.resolve({ error: "connection refused" });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      if (channel === "settings:anthropicKeyStatus") {
        return Promise.resolve({ configured: false });
      }
      if (channel === "profiles:activeDbPath") {
        return Promise.resolve("/tmp/jobscout.db");
      }
      return Promise.reject(new Error(`unexpected invoke: ${channel}`));
    });

    render(<SettingsScreen />);

    expect(
      await screen.findByRole("alert", { name: "" })
    ).toBeTruthy();
    expect(screen.getByText("connection refused")).toBeTruthy();
    expect(screen.getByLabelText("Model")).toBeTruthy();
  });

  it("blocks Save AI settings for empty Ollama URL", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const urlInput = await screen.findByLabelText("Ollama base URL");
    await user.click(urlInput);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("{Backspace}");
    await user.click(screen.getByRole("button", { name: "Save AI settings" }));

    expect(screen.getByText("Ollama base URL is required")).toBeTruthy();
  });

  it("blocks Save AI settings for invalid Ollama URL scheme", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const urlInput = await screen.findByLabelText("Ollama base URL");
    await user.click(urlInput);
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("ftp://localhost");
    await user.click(screen.getByRole("button", { name: "Save AI settings" }));

    expect(
      screen.getByText("Ollama base URL must start with http:// or https://")
    ).toBeTruthy();
  });

  it("saves AI settings via db upsert", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    await screen.findByLabelText("Ollama base URL");
    await user.click(screen.getByRole("button", { name: "Save AI settings" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: UPSERT_SQL,
        params: [SETTING_KEYS.aiBackend, "ollama"],
      });
      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: UPSERT_SQL,
        params: [SETTING_KEYS.ollamaBaseUrl, "http://localhost:11434"],
      });
      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: UPSERT_SQL,
        params: [SETTING_KEYS.ollamaModel, "llama3.2"],
      });
    });
    expect(screen.getByText("AI settings saved.")).toBeTruthy();
  });

  it("shows Configured when anthropic key status is configured", async () => {
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "settings:anthropicKeyStatus") {
        return Promise.resolve({ configured: true });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      if (channel === "profiles:activeDbPath") {
        return Promise.resolve("/tmp/jobscout.db");
      }
      if (channel === "ollama:list") {
        return Promise.resolve({ models: ["llama3.2"] });
      }
      return Promise.reject(new Error(`unexpected invoke: ${channel}`));
    });

    const user = userEvent.setup();
    render(<SettingsScreen />);

    await screen.findByLabelText("Ollama base URL");
    await user.click(screen.getByRole("radio", { name: "Anthropic" }));

    expect(screen.getByText("Configured")).toBeTruthy();
  });

  it("invokes settings:saveAnthropicKey on Save API key", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    await screen.findByLabelText("Ollama base URL");
    await user.click(screen.getByRole("radio", { name: "Anthropic" }));

    const keyInput = screen.getByLabelText("Anthropic API key");
    await user.type(keyInput, "sk-ant-secret");
    await user.click(screen.getByRole("button", { name: "Save API key" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("settings:saveAnthropicKey", {
        apiKey: "sk-ant-secret",
      });
    });
    expect(screen.getByText("API key saved.")).toBeTruthy();
    expect((keyInput as HTMLInputElement).value).toBe("");
  });

  it("shows anthropic save error inline", async () => {
    const user = userEvent.setup();
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "settings:saveAnthropicKey") {
        return Promise.resolve({ error: "API key is required" });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      if (channel === "settings:anthropicKeyStatus") {
        return Promise.resolve({ configured: false });
      }
      if (channel === "profiles:activeDbPath") {
        return Promise.resolve("/tmp/jobscout.db");
      }
      if (channel === "ollama:list") {
        return Promise.resolve({ models: ["llama3.2"] });
      }
      return Promise.reject(new Error(`unexpected invoke: ${channel}`));
    });

    render(<SettingsScreen />);

    await screen.findByLabelText("Ollama base URL");
    await user.click(screen.getByRole("radio", { name: "Anthropic" }));
    await user.type(screen.getByLabelText("Anthropic API key"), "bad");
    await user.click(screen.getByRole("button", { name: "Save API key" }));

    expect(await screen.findByText("API key is required")).toBeTruthy();
  });

  it("toggles theme via Appearance section", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const toggle = await screen.findByRole("button", {
      name: "Switch to light theme",
    });
    await user.click(toggle);

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("displays database path and opens in Finder", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const pathInput = await screen.findByLabelText("Database path");
    await waitFor(() => {
      expect((pathInput as HTMLInputElement).value).toBe(
        "/tmp/jobscout/profiles/p1/jobscout.db"
      );
    });
    expect(pathInput.className).toContain("font-mono");

    await user.click(screen.getByRole("button", { name: "Open in Finder" }));

    expect(mockInvoke).toHaveBeenCalledWith(
      "fs:openPath",
      "/tmp/jobscout/profiles/p1/jobscout.db"
    );
  });

  it("shows fs:openPath error adjacent to database controls", async () => {
    const user = userEvent.setup();
    mockInvoke.mockImplementation((channel: string, payload?: unknown) => {
      if (channel === "fs:openPath") {
        return Promise.resolve({ error: "Path does not exist" });
      }
      if (channel === "db:query") {
        return handleDbQuery(payload as { sql: string; params?: unknown[] });
      }
      if (channel === "settings:anthropicKeyStatus") {
        return Promise.resolve({ configured: false });
      }
      if (channel === "profiles:activeDbPath") {
        return Promise.resolve("/tmp/missing.db");
      }
      if (channel === "ollama:list") {
        return Promise.resolve({ models: ["llama3.2"] });
      }
      return Promise.reject(new Error(`unexpected invoke: ${channel}`));
    });

    render(<SettingsScreen />);

    await user.click(
      await screen.findByRole("button", { name: "Open in Finder" })
    );

    expect(await screen.findByText("Path does not exist")).toBeTruthy();
  });

  it("renders five date range options in Scout defaults", async () => {
    render(<SettingsScreen />);

    const scoutSection = await screen.findByText("Scout defaults");
    const card = scoutSection.closest("[data-slot='card']");
    expect(card).toBeTruthy();

    for (const label of ["24 hours", "7 days", "30 days", "60 days", "90 days"]) {
      expect(
        within(card as HTMLElement).getByRole("button", { name: label })
      ).toBeTruthy();
    }
  });

  it("persists default date range immediately on change", async () => {
    const user = userEvent.setup();
    render(<SettingsScreen />);

    const scoutSection = await screen.findByText("Scout defaults");
    const card = scoutSection.closest("[data-slot='card']");
    expect(card).toBeTruthy();

    const sevenDay = within(card as HTMLElement).getByRole("button", {
      name: "7 days",
    });
    await user.click(sevenDay);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("db:query", {
        sql: UPSERT_SQL,
        params: [SCOUT_DEFAULT_DATE_RANGE_KEY, "7d"],
      });
    });
  });
});
