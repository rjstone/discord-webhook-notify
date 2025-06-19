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
// This time it's just a custom mock class so we can avoid
// using jest.unstable_mockModule()
import { MockWebhookClient } from "../__fixtures__/discord.js";

import * as defaults from "../src/defaults.js";

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

/*
    let resolvers = [];
    let promises = Array.from({ length: 3}, () => {
      return new Promise( (resolve) => { resolvers.push(resolve) } );
    });
 */
    it("generates the right error when webhookUrl is empty", async () => {
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
      await run(whc);
      expect(core.warning).toHaveBeenCalled();
      expect(core.warning.mock.lastCall[0]).toMatch(
        /webhookUrl was not provided/gi
      );
      //resolvers[0]("test0 done");
    });

    it("generates the right error when no webhookUrl is provided", async () => {
      core.getInput.mockImplementation((input) => {
        return {
          flags: "SuppressNotifications",
          username: "Silent Bob",
          avatarUrl: "http://my.foot",
          text: "Some text."
        }[input];
      });
      const whc = new MockWebhookClient({ webhookUrl: "" });
      expect(async () => {
        await run(whc);
      }).not.toThrow();
      expect(core.warning).toHaveBeenCalled();
      expect(core.warning.mock.lastCall[0]).toMatch(
        /webhookUrl was not provided/gi
      );
      expect(whc.send_called).toBe(false);
      //resolvers[1]("test1 done");
    });

    it("works with typical inputs", async () => {
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: regexCorrectWebhookUrl,
          flags: "SuppressNotifications",
          username: "Silent Bob",
          avatarUrl: "http://my.foot",
          text: "Some text."
        }[input];
      });
      let whc = new MockWebhookClient({ webhookUrl: regexCorrectWebhookUrl });
      await run(whc);
      expect(whc.send_called).toBe(true);
      expect(core.warning).not.toHaveBeenCalled();
      expect(core.notice).not.toHaveBeenCalled();
      const msg = whc.send_arg;
      expect(msg).toBeDefined();
      console.log(msg);
      expect(msg["content"]).toMatch(/\w+/);
      expect(msg["username"]).toMatch(/\w{2,}/);
      //resolvers[2]("test2 done");
    });

    it("works after delay if executed with no delay in between two calls", async () => {
      // console.log(await Promise.all(promises));
      core.getInput.mockImplementation((input) => {
        return {
          webhookUrl: regexCorrectWebhookUrl,
          text: "foo",
          username: "bar"
        }[input];
      });
      let whc = new MockWebhookClient({ webhookUrl: regexCorrectWebhookUrl });

      const start_time = Date.now();
      await run(whc);
      expect(Date.now()).toBeGreaterThanOrEqual(start_time);
      await run(whc);
      const duration = Date.now() - start_time;
      expect(duration).toBeGreaterThanOrEqual(defaults.holddownTime);
    }, 10000);

    test.todo("works with each individual optional input set");
    test.todo("works with all inputs set");
    test.todo("uses the configured holddownTime delay if set");
  });
});
