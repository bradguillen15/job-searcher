import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseBatchScores } from "../../../src/main/matcher/parse.js";

describe("parseBatchScores", () => {
  it("parses valid JSON scores", () => {
    const raw = JSON.stringify({
      scores: [
        { id: 1, score: 82 },
        { id: 2, score: 45 },
      ],
    });

    const { scores, parseFailed } = parseBatchScores(raw, [1, 2]);

    assert.equal(parseFailed, false);
    assert.equal(scores.get(1), 82);
    assert.equal(scores.get(2), 45);
  });

  it("clamps out-of-range scores to 0–100", () => {
    const raw = JSON.stringify({
      scores: [
        { id: 1, score: 150 },
        { id: 2, score: -5 },
      ],
    });

    const { scores, parseFailed } = parseBatchScores(raw, [1, 2]);

    assert.equal(parseFailed, false);
    assert.equal(scores.get(1), 100);
    assert.equal(scores.get(2), 0);
  });

  it("assigns zero for missing ids on parse failure", () => {
    const { scores, parseFailed } = parseBatchScores("not json", [1, 2, 3]);

    assert.equal(parseFailed, true);
    assert.equal(scores.get(1), 0);
    assert.equal(scores.get(2), 0);
    assert.equal(scores.get(3), 0);
  });

  it("fails when score count does not match job ids", () => {
    const raw = JSON.stringify({
      scores: [{ id: 1, score: 80 }],
    });

    const { scores, parseFailed } = parseBatchScores(raw, [1, 2]);

    assert.equal(parseFailed, true);
    assert.equal(scores.get(1), 0);
    assert.equal(scores.get(2), 0);
  });
});
