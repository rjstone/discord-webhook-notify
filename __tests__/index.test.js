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
const index = await import("../src/index.js");

describe("index.js", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("index.js will import", async () => {
    expect(index).toBeDefined();
  });
});
