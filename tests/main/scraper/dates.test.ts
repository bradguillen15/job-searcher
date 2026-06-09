import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  dateRangeToCutoff,
  isBeforeCutoff,
  parsePostedDate,
  shouldStopPagination,
} from "../../../src/main/scraper/dates.js";

const NOW = new Date("2026-06-08T12:00:00.000Z");

describe("dateRangeToCutoff", () => {
  it("maps 24h to 24 hours before now", () => {
    const cutoff = dateRangeToCutoff("24h", NOW);
    assert.equal(cutoff.toISOString(), "2026-06-07T12:00:00.000Z");
  });

  it("maps 7d to 168 hours before now", () => {
    const cutoff = dateRangeToCutoff("7d", NOW);
    assert.equal(cutoff.toISOString(), "2026-06-01T12:00:00.000Z");
  });

  it("maps 30d to 720 hours before now", () => {
    const cutoff = dateRangeToCutoff("30d", NOW);
    assert.equal(cutoff.toISOString(), "2026-05-09T12:00:00.000Z");
  });

  it("maps 60d to 1440 hours before now", () => {
    const cutoff = dateRangeToCutoff("60d", NOW);
    assert.equal(cutoff.toISOString(), "2026-04-09T12:00:00.000Z");
  });

  it("maps 90d to 2160 hours before now", () => {
    const cutoff = dateRangeToCutoff("90d", NOW);
    assert.equal(cutoff.toISOString(), "2026-03-10T12:00:00.000Z");
  });
});

describe("parsePostedDate", () => {
  it("parses ISO-8601 strings", () => {
    const parsed = parsePostedDate("2026-06-01T08:00:00.000Z");
    assert.equal(parsed?.toISOString(), "2026-06-01T08:00:00.000Z");
  });

  it('parses "today"', () => {
    const parsed = parsePostedDate("today");
    assert.ok(parsed);
    const now = new Date();
    assert.equal(parsed.getFullYear(), now.getFullYear());
    assert.equal(parsed.getMonth(), now.getMonth());
    assert.equal(parsed.getDate(), now.getDate());
  });

  it('parses "yesterday"', () => {
    const parsed = parsePostedDate("yesterday");
    assert.ok(parsed);
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    assert.equal(parsed.getDate(), expected.getDate());
  });

  it('parses "N days ago"', () => {
    const parsed = parsePostedDate("3 days ago");
    assert.ok(parsed);
    const expected = new Date();
    expected.setDate(expected.getDate() - 3);
    assert.equal(parsed.getDate(), expected.getDate());
  });

  it('parses "N hours ago"', () => {
    const before = Date.now();
    const parsed = parsePostedDate("2 hours ago");
    assert.ok(parsed);
    assert.ok(parsed.getTime() <= before);
  });

  it("returns null for unparseable strings", () => {
    assert.equal(parsePostedDate("soonish"), null);
    assert.equal(parsePostedDate(""), null);
  });
});

describe("pagination cutoff helpers", () => {
  it("isBeforeCutoff returns true when posted date is before cutoff", () => {
    const cutoff = dateRangeToCutoff("7d", NOW);
    assert.equal(isBeforeCutoff("2026-01-01T00:00:00.000Z", cutoff), true);
  });

  it("shouldStopPagination stops when any parseable date is before cutoff", () => {
    const cutoff = dateRangeToCutoff("7d", NOW);
    const stop = shouldStopPagination(
      [
        { postedDate: "2026-06-08T00:00:00.000Z" },
        { postedDate: "2026-01-01T00:00:00.000Z" },
      ],
      cutoff
    );
    assert.equal(stop, true);
  });

  it("shouldStopPagination ignores unparseable dates", () => {
    const cutoff = dateRangeToCutoff("7d", NOW);
    const stop = shouldStopPagination(
      [{ postedDate: null }, { postedDate: "not a date" }],
      cutoff
    );
    assert.equal(stop, false);
  });
});
