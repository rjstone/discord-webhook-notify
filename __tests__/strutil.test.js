/**
 * Unit tests for strutil.js
 */
import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const strutil = await import("../src/strutil");

describe("strutil.js", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("truncates long strings to 2000 characters", () => {
    const longStr = "a".repeat(2001);
    expect(strutil.truncateStringIfNeeded(longStr)).toHaveLength(2000);
  });

  it("leaves short strings the same", () => {
    const shortStr = "a".repeat(1000);
    expect(strutil.truncateStringIfNeeded(shortStr)).toMatch(shortStr);
  });

  it("leaves exactly 2000-character strings the same", () => {
    const exactStr = "a".repeat(2000);
    expect(strutil.truncateStringIfNeeded(exactStr)).toMatch(exactStr);
  });

  it("truncates really long strings", () => {
    const veryLongStr = ":)".repeat(2500);
    expect(strutil.truncateStringIfNeeded(veryLongStr)).toHaveLength(2000);
  });

  it("replaces special invalid names with a notice", () => {
    expect(strutil.sanitizeUsername("everyone")).not.toMatch("everyone");
    expect(strutil.sanitizeUsername("here")).not.toMatch("here");
  });

  it("sanitizes usernames with forbidden substrings", () => {
    expect(strutil.sanitizeUsername("@something")).toMatch(/^something$/);
    expect(strutil.sanitizeUsername("```code")).toMatch(/^code$/);
    expect(strutil.sanitizeUsername(":smile:")).toMatch(/^smile$/);
    expect(strutil.sanitizeUsername("#hashtag")).toMatch(/^hashtag$/);
    expect(strutil.sanitizeUsername("Cool Discord Dude")).toMatch(/^Cool {2}Dude$/);
    expect(strutil.sanitizeUsername("@Cool```Discord:::Du###de")).toMatch(/^CoolDude$/);
  });

  it("replaces usernames shorter than 2 characters with notice", () => {
    expect(strutil.sanitizeUsername("x")).toMatch(/Too Short/);
  });

  it("doesn't truncate valid usernames with exactly 32 characters", () => {
    const invalidUsername = "x".repeat(32);
    expect(strutil.sanitizeUsername(invalidUsername)).toHaveLength(32);
  });

  it("leaves valid usernames alone", () => {
    const validUsername = "PerfectlyValid UserName123";
    expect(strutil.sanitizeUsername(validUsername)).toMatch(validUsername);
  });

  it("decodes percent-encoded strings when option set", () => {
    core.getInput.mockImplementation((input) => {
      return {
        processingOptions: " percentDecode ",
      }[input];
    });
    expect(strutil.processIfNeeded("foo%0Abar%20bla")).toMatch("foo\nbar bla");
  });

    it("doesn't decode percent-encoded strings when option NOT set", () => {
    core.getInput.mockImplementation((input) => {
      return {
        processingOptions: "  ",
      }[input];
    });
    const tStr = "foo%20bar%%%breaking%%%%%stuff";
    expect(strutil.processIfNeeded(tStr)).toMatch(tStr);
  });
});
