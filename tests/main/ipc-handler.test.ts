import { describe, it } from "node:test";
import assert from "node:assert/strict";

// electron is mocked via --require tests/main/electron-mock.cjs (see package.json test:main)
import { UnknownChannelError, validateChannel } from "../../src/main/ipc-handler.js";

describe("UnknownChannelError", () => {
  it("has correct name property", () => {
    const err = new UnknownChannelError("foo:bar");
    assert.equal(err.name, "UnknownChannelError");
  });

  it("message includes the channel name", () => {
    const err = new UnknownChannelError("foo:bar");
    assert.match(err.message, /foo:bar/);
  });

  it("is an instance of Error", () => {
    const err = new UnknownChannelError("x");
    assert.ok(err instanceof Error);
  });
});

describe("validateChannel", () => {
  it("accepts db:query", () => {
    assert.equal(validateChannel("db:query"), "db:query");
  });

  it("accepts scraper:run", () => {
    assert.equal(validateChannel("scraper:run"), "scraper:run");
  });

  it("accepts ollama:list", () => {
    assert.equal(validateChannel("ollama:list"), "ollama:list");
  });

  it("accepts fs:openPath", () => {
    assert.equal(validateChannel("fs:openPath"), "fs:openPath");
  });

  it("accepts settings:saveAnthropicKey", () => {
    assert.equal(
      validateChannel("settings:saveAnthropicKey"),
      "settings:saveAnthropicKey"
    );
  });

  it("accepts settings:anthropicKeyStatus", () => {
    assert.equal(
      validateChannel("settings:anthropicKeyStatus"),
      "settings:anthropicKeyStatus"
    );
  });

  it("accepts profiles:activeDbPath", () => {
    assert.equal(
      validateChannel("profiles:activeDbPath"),
      "profiles:activeDbPath"
    );
  });

  it("accepts profiles:list", () => {
    assert.equal(validateChannel("profiles:list"), "profiles:list");
  });

  it("accepts profiles:create", () => {
    assert.equal(validateChannel("profiles:create"), "profiles:create");
  });

  it("accepts profiles:switch", () => {
    assert.equal(validateChannel("profiles:switch"), "profiles:switch");
  });

  it("accepts profiles:delete", () => {
    assert.equal(validateChannel("profiles:delete"), "profiles:delete");
  });

  it("accepts resume:upload", () => {
    assert.equal(validateChannel("resume:upload"), "resume:upload");
  });

  it("accepts scraper:provideSelector", () => {
    assert.equal(validateChannel("scraper:provideSelector"), "scraper:provideSelector");
  });

  it("rejects unknown channel with UnknownChannelError", () => {
    assert.throws(
      () => validateChannel("bad:channel"),
      (err: unknown) => {
        assert.ok(err instanceof UnknownChannelError);
        assert.equal(err.name, "UnknownChannelError");
        assert.match(err.message, /bad:channel/);
        return true;
      }
    );
  });
});
