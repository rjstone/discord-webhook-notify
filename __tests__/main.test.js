/**
 * Unit tests for the action's main functionality, src/main.js
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { beforeEach, afterEach, jest } from "@jest/globals";

// Mocks should be declared before the module being tested is imported.

// Mock @actions/core setup, which is a little odd
import * as coreMock from "../__fixtures__/actions/core.js"; // import mock "edits"
jest.unstable_mockModule("@actions/core", () => coreMock); // apply them in jest
const core = await import("@actions/core"); // dynamic import actual

// Mock discord.js setup
// Setp 1: This time we just import a whole factory function to return the
//         module.
import { MockWebhookClient } from "../__fixtures__/discord.js";
// Step 2: Apply our mock module factory function in jest's registry.
// jest.unstable_mockModule("discord.js", () => mockModuleBody);
// Step 3: Dynamic import the module (must use 'await import()').
// const discord = await import("discord.js");

// The module being tested should be imported last, dynamically.
// This ensures that the modules mocks are used in place their imports.
const { run, getDebugTestUrl } = await import("../src/main.js");

const regexCorrectWebhookUrl =
  "https://discord.com/api/webhooks/999999999999999999" +
  "/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

describe("main.js", () => {
  beforeEach(() => {});
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("is loaded and has a run() function", () => {
    expect(run).toBeDefined();
    expect(run).toBeInstanceOf(Function);
  });

  it("is loaded and has a function called getDebugTestUrl", () => {
    expect(getDebugTestUrl).toBeInstanceOf(Function);
  });

  describe("run", () => {
    beforeEach(() => {
    });
    afterEach(() => {
      // jest.clearAllMocks();
    });

    it("generates the right error when no webhookUrl is empty", () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: "",
          flags: "SuppressNotifications",
          username: "Silent Bob",
          avatarUrl: "http://my.foot",
          text: "Some text."
        }[input];
      });
      const whc = new MockWebhookClient({ webhookUrl: "" });
      run(whc);
      expect(core.warning).toHaveBeenCalled();
      expect(core.warning.mock.lastCall[0]).toMatch(
        /webhookUrl was not provided/gi
      );
    });

    it("generates the right error when no webhookUrl is provided", () => {
      core.getInput.mockImplementation((input) => {
        return {
          flags: "SuppressNotifications",
          username: "Silent Bob",
          avatarUrl: "http://my.foot",
          text: "Some text."
        }[input];
      });
      const whc = new MockWebhookClient({ webhookUrl: "" });
      expect(() => {
        run(whc);
      }).not.toThrow();
      expect(core.warning).toHaveBeenCalled();
      expect(core.warning.mock.lastCall[0]).toMatch(
        /webhookUrl was not provided/gi
      );
      expect(whc.send).not.toHaveBeenCalled();
    });

    it("works with typical inputs", () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: regexCorrectWebhookUrl,
          flags: "SuppressNotifications",
          username: "Silent Bob",
          avatarUrl: "http://my.foot",
          text: "Some text."
        }[input];
      });
      const whc = new MockWebhookClient({ webhookUrl: regexCorrectWebhookUrl });
      run(whc);
      expect(whc.send_called).toBe(true);
      expect(core.warning).not.toHaveBeenCalled();
      expect(core.notice).not.toHaveBeenCalled();
      const msg = whc.send_arg;
      expect(msg).toBeDefined();
      expect(msg["webhookUrl"]).toMatch(regexCorrectWebhookUrl);
      expect(msg["content"]).toMatch(/\w+/);
      expect(msg["username"]).toMatch(/\w{2,}/);
    });

    it("works after delay if executed with no delay in between two calls", () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: regexCorrectWebhookUrl,
          text: "foo",
          username: "bar"
        }[input];
      });
      const whc = new discord.WebhookClient({ webhookUrl: regexCorrectWebhookUrl });

      const start_time = Date.now();
      run(whc);
      expect(Date.now()).toBeGreaterThanOrEqual(start_time);
      run(whc);
      expect(Date.now()).toBeGreaterThanOrEqual(start_time + 3000);
      expect(Date.now()).toBeLessThan(start_time + 3000 + 200);
    });

    test.todo("works with each individual optional input set");
    test.todo("works with all inputs set");
    test.todo("uses the configured holddownTime delay if set");
  });
});
