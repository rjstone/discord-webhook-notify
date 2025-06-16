/**
 * Unit tests for the action's main functionality, src/main.js
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from "@jest/globals";

import * as core from "../__fixtures__/core";

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule("@actions/core", () => core);

const discord = await import("discord.js");
// import { mockSend } from "../__fixtures__/discord.js";
jest.unstable_mockModule("discord.js", () => discord);

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run, getDebugTestUrl } = await import("../src/main.js");

describe("main.js", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("is loaded and has a run() function", async () => {
    expect(run).toBeDefined();
    expect(run).toBeInstanceOf(Function);
  });

  it("is loaded and has a function called getDebugTestUrl", () => {
    expect(getDebugTestUrl).toBeInstanceOf(Function);
  });

  describe("run", () => {
    const mockWebhookUrl =
        "https://discord.com/api/webhooks/999999999999999999/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("generates the right error when no webhookUrl is empty", async () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: "",
          flags: "SuppressNotifications",
          username: "Silent Bob",
          avatarUrl: "http://my.foot",
          text: "Some text."
        }[input];
      });
      run();
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
      expect(() => {
        run();
      }).not.toThrow();
      expect(core.warning).toHaveBeenCalled();
      expect(core.warning.mock.lastCall[0]).toMatch(
        /webhookUrl was not provided/gi
      );
    });

    it("works with all default inputs", async () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: mockWebhookUrl
        }[input];
      });

      expect(() => {
        run();
      }).not.toThrow();

      expect(core.warning).not.toHaveBeenCalled();
      expect(core.notice).not.toHaveBeenCalled();
      // expect(mockSend).toHaveBeenCalled();
      // const msg = mockSend.lastCall[0];
      // expect(msg).toBeDefined();
      // expect(msg["webhookUrl"]).toMatch(mockWebhookUrl);
      // expect(msg["content"]).toMatch(/\w+/);
      // expect(msg["username"]).toMatch(/\w{2,}/);
    });

/*     it("works after delay if executed with no delay in between two calls", () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: mockWebhookUrl,
          text: "foo",
          username: "bar"
        }[input];
      });
      const start_time = Date.now();
      run();
      expect(Date.now()).toBeGreaterThanOrEqual(start_time);
      run();
      expect(Date.now()).toBeGreaterThanOrEqual(start_time + 3000);
      expect(Date.now()).toBeLessThan(start_time + 3000 + 200);
    });
 */
    test.todo("works with each individual optional input set");
    test.todo("works with all inputs set");
    test.todo("uses the configured holddownTime delay if set");
  });
});
