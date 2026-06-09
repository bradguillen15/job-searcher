import { app } from "electron";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { closeDatabase, openDatabase } from "./db";

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface ProfilesIndex {
  activeProfileId: string;
  profiles: Profile[];
}

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileError";
  }
}

const PROFILES_INDEX_FILENAME = "profiles.json";

function nowIso(): string {
  return new Date().toISOString();
}

function getUserDataPath(): string {
  return app.getPath("userData");
}

function getProfilesIndexPath(): string {
  return path.join(getUserDataPath(), PROFILES_INDEX_FILENAME);
}

function getProfileDbPath(profileId: string): string {
  return path.join(getUserDataPath(), "profiles", profileId, "jobscout.db");
}

function readIndex(): ProfilesIndex {
  const indexPath = getProfilesIndexPath();
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw) as ProfilesIndex;
}

function writeIndex(index: ProfilesIndex): void {
  const indexPath = getProfilesIndexPath();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

function ensureProfileDirectory(profileId: string): string {
  const profileDir = path.dirname(getProfileDbPath(profileId));
  fs.mkdirSync(profileDir, { recursive: true });
  return getProfileDbPath(profileId);
}

export function getActiveProfileDbPath(): string {
  const index = readIndex();
  return getProfileDbPath(index.activeProfileId);
}

export function listProfiles(): Profile[] {
  return readIndex().profiles;
}

export function createProfile(name: string): Profile {
  const index = readIndex();
  const timestamp = nowIso();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    createdAt: timestamp,
    lastUsedAt: timestamp,
  };

  ensureProfileDirectory(profile.id);
  index.profiles.push(profile);
  writeIndex(index);
  return profile;
}

export function switchProfile(profileId: string): void {
  const index = readIndex();
  const profile = index.profiles.find((p) => p.id === profileId);
  if (!profile) {
    throw new ProfileError(`Profile not found: ${profileId}`);
  }

  closeDatabase();
  index.activeProfileId = profileId;
  profile.lastUsedAt = nowIso();
  writeIndex(index);
  openDatabase(ensureProfileDirectory(profileId));
}

export function deleteProfile(profileId: string): void {
  const index = readIndex();
  if (index.activeProfileId === profileId) {
    throw new ProfileError("Cannot delete the active profile");
  }

  const profileIndex = index.profiles.findIndex((p) => p.id === profileId);
  if (profileIndex === -1) {
    throw new ProfileError(`Profile not found: ${profileId}`);
  }

  const profileDir = path.dirname(getProfileDbPath(profileId));
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  index.profiles.splice(profileIndex, 1);
  writeIndex(index);
}

export function loadActiveProfile(): void {
  const indexPath = getProfilesIndexPath();

  if (!fs.existsSync(indexPath)) {
    const timestamp = nowIso();
    const defaultProfile: Profile = {
      id: crypto.randomUUID(),
      name: "Default",
      createdAt: timestamp,
      lastUsedAt: timestamp,
    };
    const index: ProfilesIndex = {
      activeProfileId: defaultProfile.id,
      profiles: [defaultProfile],
    };
    fs.mkdirSync(getUserDataPath(), { recursive: true });
    writeIndex(index);
    openDatabase(ensureProfileDirectory(defaultProfile.id));
    return;
  }

  const index = readIndex();
  const active = index.profiles.find((p) => p.id === index.activeProfileId);
  if (!active) {
    throw new ProfileError(`Active profile not found: ${index.activeProfileId}`);
  }

  active.lastUsedAt = nowIso();
  writeIndex(index);
  openDatabase(ensureProfileDirectory(index.activeProfileId));
}
