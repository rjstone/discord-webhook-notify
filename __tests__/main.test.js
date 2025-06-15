/**
 * Unit tests for the action's main functionality, src/main.js
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from "@jest/globals";
import * as core from "../__fixtures__/core.js";

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule("@actions/core", () => core);

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import("../src/main.js");
const { EmbedBuilder, WebhookClient } = await import("discord.js");

describe("main.js", () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation((input) => {
      return {
        lockfile_dir: ".",
      }[input];
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("run is loaded and is a function", async () => {
    expect(run).toBeDefined();
    expect(run).toBeInstanceOf(Function);
  });

  test.todo("run generates the right error when no webhookUrl is provided");
  test.todo("run works with all default inputs");
  test.todo("run works after delay if executed with no delay in between two calls");
  test.todo("run works with each individual optional input set");
  test.todo("run works with all inputs set");
  test.todo("run uses the configured holddownTime delay if set");

});
