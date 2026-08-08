/**
 * Unit tests for defaults.js
 */
import { jest } from "@jest/globals";
import * as core from "../__fixtures__/actions/core.js";

jest.unstable_mockModule("@actions/core", () => core);

const defaults = await import("../src/defaults");

describe("defaults.js", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("contains lockfile name", () => {
    expect(defaults.lockfileName).toBeDefined();
  });

  it("contains holddownTime", () => {
    expect(defaults.holddownTime).toBeDefined();
    expect(defaults.holddownTime).toBeGreaterThan(1000);
  });

  it("has a getDefaultDescription() that returns a description", async () => {
    let str = await defaults.getDefaultDescription();
    expect(defaults.getDefaultDescription).not.toThrow();
    expect(str).toBeDefined();
    expect(str).toMatch(/.{20,}/g);
  });

  it("uses GitHub Actions env for repository and actor when set", async () => {
    const prev = {
      GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
      GITHUB_TRIGGERING_ACTOR: process.env.GITHUB_TRIGGERING_ACTOR,
      GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW,
      GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME
    };
    process.env.GITHUB_REPOSITORY = "owner/example-repo";
    process.env.GITHUB_TRIGGERING_ACTOR = "octocat";
    process.env.GITHUB_WORKFLOW = "CI";
    process.env.GITHUB_EVENT_NAME = "push";
    try {
      // Context is constructed at module load; re-import is heavy. Just check
      // env-backed fields we read directly from process.env.
      const str = await defaults.getDefaultDescription();
      expect(str).toMatch(/owner\/example-repo/);
      expect(str).toMatch(/octocat/);
      expect(str).not.toMatch(/\[undefined\]\(undefined\)/);
    } finally {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
