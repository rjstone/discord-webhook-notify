/**
 *  Unit tests for src/timelock.js
 */

import { jest } from "@jest/globals";

import * as core from "../__fixtures__/actions/core.js";

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core);

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const timelock = await import("../src/timelock");

describe("timelock.js", () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation((input) => {
      return {
        lockfile_dir: "",
      }[input];
    });
    core.info.mockImplementation((msg) => {
        return msg;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Delays executing again for 1000ms but not longer than 1500ms", async () => {
    const start_time = Date.now();
    const interval = 1000;
    const slack = 500;

    await timelock.updateLockFileTime(); // run time is "now"
    await timelock.ensureDurationSinceLastRun(interval); // should wait at least 1000ms

    expect(Date.now()).toBeGreaterThanOrEqual(start_time + interval);
    expect(Date.now()).toBeLessThan(start_time + interval + slack);
  });

  it("Delays executing again for 2000ms but not longer than 2250ms", async () => {
    const start_time = Date.now();
    const interval = 2000;
    const slack = 250;

    await timelock.updateLockFileTime(); // run time is "now"
    await timelock.ensureDurationSinceLastRun(interval); // should wait at least 1000ms

    expect(Date.now()).toBeGreaterThanOrEqual(start_time + interval);
    expect(Date.now()).toBeLessThan(start_time + interval + slack);
  });

  it("Uses core.info to log how long it delayed", async () => {
    await timelock.updateLockFileTime();
    await timelock.ensureDurationSinceLastRun(1000);

    expect(core.info).toHaveBeenCalled();
    expect(core.info.mock.lastCall[0]).toMatch(/[Ww]aiting: \d+ms/);
  });

  test.todo("Works properly if getInput('lockfile_dir') returns undefined");
  test.todo("Works properly using the lockfile from the input lockfile_dir");

});
