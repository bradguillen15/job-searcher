#!/usr/bin/env node
/**
 * Validates feature_list.json and spec folder presence.
 * Used by init.sh — no Python required.
 */
import fs from "fs";
import path from "path";

const VALID_STATUS = new Set([
  "pending",
  "spec_ready",
  "in_progress",
  "done",
  "blocked",
]);
const REQUIRES_SPEC = new Set(["spec_ready", "in_progress", "done"]);
const SPEC_FILES = ["requirements.md", "design.md", "tasks.md"];

function fail(message) {
  console.error(`[FAIL]  ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`[OK]    ${message}`);
}

let data;
try {
  const raw = fs.readFileSync("feature_list.json", "utf-8");
  data = JSON.parse(raw);
} catch (err) {
  fail(`feature_list.json invalid: ${err.message}`);
}

if (!Array.isArray(data.features)) {
  fail("feature_list.json must have a features array");
}

const inProgress = data.features.filter((f) => f.status === "in_progress");
if (inProgress.length > 1) {
  fail(`${inProgress.length} features in in_progress (maximum 1)`);
}

const specErrors = [];
for (const feature of data.features) {
  if (!VALID_STATUS.has(feature.status)) {
    fail(`Invalid status for feature ${feature.name ?? "?"}: ${feature.status}`);
  }

  if (feature.sdd && REQUIRES_SPEC.has(feature.status)) {
    const specDir = path.join("specs", feature.name);
    for (const fname of SPEC_FILES) {
      if (!fs.existsSync(path.join(specDir, fname))) {
        specErrors.push(
          `feature ${feature.name} in ${feature.status} missing ${specDir}/${fname}`
        );
      }
    }
  }
}

if (specErrors.length > 0) {
  for (const err of specErrors) {
    console.error(`[FAIL]  ${err}`);
  }
  process.exit(1);
}

ok(`feature_list.json valid (${data.features.length} features)`);
ok("Specs present for non-pending sdd features");
