/**
 * Unit tests for the mocks in the __fixtures__ directory.
 *
 * To mock dependencies in ES modules, you can create fixtures that export mock
 * functions and objects.
 *
 * Unfortunately though, right now, some of the automatic support for this in
 * jest doesn't work with ES modules, so it can be a little more unstable and
 * tricky to figure out than usual.
 *
 * So here, the mocks are tested to see if they're doing what's needed.
 *
 * This also serves as an example of how to load them.
 *
 */
import { beforeEach, afterEach, jest } from "@jest/globals";

// Mocks should be declared before the module being tested is imported.

// Mock @actions/core setup
// Step 1: Import the mock "edits", which could be partial mocking of a module.
import * as coreMock from "../__fixtures__/actions/core.js";
// Step 2: Apply our mock module factory function to the jest import registry.
//         NOTE! In this case the default export is the module, so our factory
//         function is an arrow func returning the module,
jest.unstable_mockModule("@actions/core", () => coreMock);
// Step 3: Dynamic (must use 'await import()') import the module.
const core = await import("@actions/core"); // dynamic import actual module

// Mock discord.js setup
// This time it's just a custom mock class so we can avoid
// using jest.unstable_mockModule()
import { MockWebhookClient } from "../__fixtures__/discord.js";

// The module being tested should be imported last, dynamically.
// This ensures that the mocks are used in place of any actual dependencies.
// (In this case though we're testing all of our mocks and not a real module.
// so there's nothing more to import.)

describe("mocking of", () => {
  beforeEach(() => {
    core.getInput.mockImplementation(() => {
      // by default, getInput() will just return empty string all the time.
      return "";
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
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
      const theOnlyAcceptableReturn =
        "return should only be this exact object.";
      core.getInput.mockImplementation((input) => {
        console.log("getInput(" + input + ")");
        return theOnlyAcceptableReturn;
      });
      const mockOutput = core.getInput(ignoredArg);
      expect(core.getInput).toHaveBeenCalledWith(ignoredArg);
      expect(Object.is(mockOutput, theOnlyAcceptableReturn)).toBe(true);
      expect(core.getInput.mock.lastCall[0]).toBe(ignoredArg);
      expect(Object.is(core.getInput.mock.lastCall[0], ignoredArg)).toBe(true);
    });
  });

  describe("discord", () => {
    it("replaces WebhookClient constructor with mock", () => {
      const whc = new MockWebhookClient();
      expect(whc.send_called).toBeDefined();
    });
    it("replaced WebhookClient.send with mock", () => {
      const whc = new MockWebhookClient();
      expect(whc.send_called).toBeDefined();
    });
    it("works with 'new WebhookClient()'", () => {
      const whc = new MockWebhookClient();
      expect(whc).toBeInstanceOf(MockWebhookClient);
    });
    it("works with await send() call on WebhookClient instance", async () => {
      const whc = new MockWebhookClient({webhookUrl: "foo"});
      await whc.send({ text: "foo" });
      expect(whc.send_called).toBe(true);
    });
  });
});
