import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import {
  ProfileError,
  createProfile,
  deleteProfile,
  getActiveProfileDbPath,
  listProfiles,
  loadActiveProfile,
  switchProfile,
} from "../src/main/profiles.js";
import { db } from "../src/main/db.js";

let tempUserData: string;

beforeEach(() => {
  tempUserData = fs.mkdtempSync(path.join(os.tmpdir(), "jobscout-profiles-"));
  process.env.JOBSCOUT_TEST_USER_DATA = tempUserData;
});

afterEach(() => {
  delete process.env.JOBSCOUT_TEST_USER_DATA;
  if (fs.existsSync(tempUserData)) {
    fs.rmSync(tempUserData, { recursive: true, force: true });
  }
});

describe("profiles", () => {
  it("creates a default profile on first launch", () => {
    loadActiveProfile();

    const indexPath = path.join(tempUserData, "profiles.json");
    assert.ok(fs.existsSync(indexPath));

    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as {
      activeProfileId: string;
      profiles: Array<{ id: string; name: string }>;
    };

    assert.equal(index.profiles.length, 1);
    assert.equal(index.profiles[0]?.name, "Default");
    assert.equal(index.activeProfileId, index.profiles[0]?.id);

    const dbPath = path.join(
      tempUserData,
      "profiles",
      index.activeProfileId,
      "jobscout.db"
    );
    assert.ok(fs.existsSync(dbPath));
  });

  it("creates a second profile and switches to it", () => {
    loadActiveProfile();
    const firstProfileId = JSON.parse(
      fs.readFileSync(path.join(tempUserData, "profiles.json"), "utf-8")
    ).activeProfileId as string;

    const second = createProfile("Work");
    assert.equal(second.name, "Work");

    switchProfile(second.id);

    const index = JSON.parse(
      fs.readFileSync(path.join(tempUserData, "profiles.json"), "utf-8")
    ) as { activeProfileId: string; profiles: Array<{ id: string; lastUsedAt: string }> };

    assert.equal(index.activeProfileId, second.id);
    assert.notEqual(index.activeProfileId, firstProfileId);

    const active = index.profiles.find((profile) => profile.id === second.id);
    assert.ok(active?.lastUsedAt);
  });

  it("throws ProfileError when deleting the active profile", () => {
    loadActiveProfile();
    const activeId = JSON.parse(
      fs.readFileSync(path.join(tempUserData, "profiles.json"), "utf-8")
    ).activeProfileId as string;

    assert.throws(
      () => deleteProfile(activeId),
      (err: unknown) => {
        assert.ok(err instanceof ProfileError);
        assert.match((err as Error).message, /active profile/i);
        return true;
      }
    );
  });

  it("getActiveProfileDbPath returns absolute path to active profile jobscout.db", () => {
    loadActiveProfile();

    const index = JSON.parse(
      fs.readFileSync(path.join(tempUserData, "profiles.json"), "utf-8")
    ) as { activeProfileId: string };

    const dbPath = getActiveProfileDbPath();
    const expected = path.join(
      tempUserData,
      "profiles",
      index.activeProfileId,
      "jobscout.db"
    );

    assert.equal(dbPath, expected);
    assert.ok(path.isAbsolute(dbPath));
  });

  it("keeps each profile database isolated", () => {
    loadActiveProfile();

    db.prepare("INSERT INTO boards (name, url) VALUES (?, ?)").run(
      "Default Board",
      "https://default.example/board"
    );

    const second = createProfile("Isolated");
    switchProfile(second.id);

    const rows = db
      .prepare("SELECT COUNT(*) AS count FROM boards")
      .get() as { count: number };
    assert.equal(rows.count, 0);

    const firstProfileId = listProfiles().find((profile) => profile.name === "Default")?.id;
    assert.ok(firstProfileId);
    switchProfile(firstProfileId);

    const defaultRows = db
      .prepare("SELECT COUNT(*) AS count FROM boards")
      .get() as { count: number };
    assert.equal(defaultRows.count, 1);
  });
});
