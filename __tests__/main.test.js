/**
 * Unit tests for the action's main functionality, src/main.js
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { beforeEach, jest } from "@jest/globals";

// Mocks should be declared before the module being tested is imported.

// Mock @actions/core setup, which is a little odd
import * as coreMock from "../__fixtures__/actions/core.js"; // import mock "edits"
jest.unstable_mockModule("@actions/core", () => coreMock); // apply them in jest
const core = await import("@actions/core"); // dynamic import actual

// Mock discord.js setup
// const actualDiscord = await import("discord.js");
import { discordMockFactory } from "../__fixtures__/discord.js";
jest.unstable_mockModule("discord.js", discordMockFactory);
const discord = await import("discord.js");

// The module being tested should be imported last, dynamically.
// This ensures that the mocks are used in place of any actual dependencies.
const { run, getDebugTestUrl } = await import("../src/main.js");

const mockWebhookUrl = "https://discord.com/api/webhooks/999999999999999999" +
        "/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";


describe("mocking of", () => {
  beforeEach( () => {
      core.getInput.mockImplementation((input) => {
        console.log("getInput("+input+")");
        return "";
      });
  });

  describe("core.getInput()", () => {
    it("has been replaced with jester mock", () => {
      const mockOutput = core.getInput("x");
      expect(core.getInput.mock).toBeDefined();
      expect(mockOutput).toMatch(/^$/);
    });
    it("gets called with argument and returns empty string by default", () => {
      const nonExistantInput = "somethingThatDoesntExist";
      const mockOutput = core.getInput(nonExistantInput);
      expect(core.getInput).toHaveBeenCalledWith(nonExistantInput);
      expect(mockOutput).toMatch("");
    });
    it("returns a mocked output value", () => {
      const ignoredArg = "this arg doesn't matter but should be identifiable";
      const theOnlyAcceptableReturn = "return should only be this exact object."
      core.getInput.mockImplementation((input) => {
        console.log("getInput("+input+")");
        return theOnlyAcceptableReturn;
      });
      const mockOutput = core.getInput(ignoredArg);
      expect(core.getInput).toHaveBeenCalledWith(ignoredArg);
      expect(Object.is(mockOutput, theOnlyAcceptableReturn)).toBe(true);
      expect(core.getInput.mock.lastCall[0]).toBe(ignoredArg);
      expect(Object.is(core.getInput.mock.lastCall[0],ignoredArg)).toBe(true);
    });
  });

  describe("discord", () => {
    it("replaces WebhookClient constructor with mock", () => {
      const mwc = new discord.WebhookClient();
      expect(mwc.constructor.mock).toBeDefined();
    });
    it("replaced WebhookClient.send with mock", () => {
      const mwc = new discord.WebhookClient();
      expect(mwc.send.mock).toBeDefined();
    });
    it("works with 'new WebhookClient()'", () => {
      const whc = new discord.WebhookClient();
      expect(whc).toBeInstanceOf(Object);
    });
    it("works with send() call on WebhookClient instance", () => {
      const whc = new discord.WebhookClient();
      whc.send({ text: "foo" });
      expect(whc.send).toHaveBeenCalled();
    });
    it("has un-mocked EmbedBuilder class", () => {
      const eb = new discord.EmbedBuilder();
      eb.setTitle("foo")
        .setColor("#000000")
        .setDescription("bar");
      expect(eb.setTitle.mock).not.toBeDefined();
      expect(eb.constructor.mock).not.toBeDefined();
      expect(eb.length).toBeDefined();
      expect(eb).toBeInstanceOf(discord.EmbedBuilder);
    });
    it("has un-mocked MessageFlagsBitField class", () => {
      expect(discord.MessageFlagsBitField.mock).not.toBeDefined();
    });
  });
});

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
