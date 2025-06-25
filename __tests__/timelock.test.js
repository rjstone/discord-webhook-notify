/**
 *  Unit tests for src/timelock.js
 */
import timersPromises from "node:timers/promises"
import fs from "node:fs";
import path from "node:path";

import { jest } from "@jest/globals";

import * as core from "../__fixtures__/actions/core.js";
import * as defaults from "../src/defaults";
import { getSystemErrorMap } from "node:util";

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core);

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const timelock = await import("../src/timelock");

const lockfileDir = core.getInput("lockfileDir") || ".";
const lockfilePath = path.join(lockfileDir, defaults.lockfileName);

describe("timelock.js", () => {
  beforeEach(() => {
    try {
      fs.unlinkSync(lockfilePath);
    } catch (e) {
      if ( e.code !== "ENOENT" ) {
        throw e;
      }
    }

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

  it("doesn't delay when the lockfile is old enough", async () => {
    await timelock.updateLockFileTime();
    await timersPromises.scheduler.wait(500);
    const start_time = Date.now();
    await timelock.ensureDurationSinceLastRun(100);
    expect(Date.now() - start_time).toBeLessThan(50);
  })

  it("creates lockfile and doesn't delay when there's no lockfile", async () => {
    const start_time = Date.now();
    // make sure lockfile was deleted
    expect(() => { fs.statSync(lockfilePath) }).toThrow();
    // lockfile should be created with no wait
    await timelock.ensureDurationSinceLastRun(3000);
    expect(() => { fs.statSync(lockfilePath) }).not.toThrow();
    expect(Date.now() - start_time).toBeLessThan(50);
  });

  test.todo("Works properly if getInput('lockfile_dir') returns undefined");
  test.todo("Works properly using the lockfile from the input lockfile_dir");

});
