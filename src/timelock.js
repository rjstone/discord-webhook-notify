/**
 * Functions to block execution if the time since the last successful execution
 * is not at least some minimum diration.
 */

import fs from "node:fs";
import path from "node:path";
import timersPromises from "node:timers/promises";

import * as core from "@actions/core";

import * as defaults from "./defaults";

/**
 * Ensure some number of ms has passed since our last run, which should also be
 * the last time a Discord API request was sent. We use the modification time
 * of a "lock" file named in input lockfile_dir to determine when the last run
 * was.
 *
 * @param { minIntervalSinceLastRunMs } - minimum number of ms since last run
 * @returns { undefined | Promise } from node:timers/promises scheduler.wait()
 */
export async function ensureDurationSinceLastRun(minIntervalSinceLastRunMs) {
  const lockfileDir = core.getInput("lockfile_dir") || ".";
  const lockfilePath = path.join(lockfileDir, defaults.lockfileName);
  const nowDateObj = new Date();

  // If there's no file then we haven't run in "forever"
  // so just create the file and return.
  if (!fs.existsSync(lockfilePath)) {
    fs.writeFileSync(lockfilePath, nowDateObj.toISOString());
    return;
  }

  // Otherwise, figure out how long since we last ran.
  const lockFileStat = fs.statSync(lockfilePath);
  const nowMs = nowDateObj.getTime();
  var sinceLastRunMs = nowMs - lockFileStat.mtimeMs;

  // If we need to wait any longer to make sure the minimum time period has
  // passed since we last ran, calculate how long we need to wait and wait
  // slightly longer just to make sure.
  if (sinceLastRunMs < minIntervalSinceLastRunMs) {
    if (sinceLastRunMs < 0) {
      sinceLastRunMs = 0;
    } // just in case
    const waitTimeMs = minIntervalSinceLastRunMs - sinceLastRunMs * 0.9;
    core.info(
      "Calling Discord Webhook API too frequently. Waiting: " +
        waitTimeMs.toFixed(0) +
        "ms"
    );
    return timersPromises.scheduler.wait(waitTimeMs);
  }
}

/**
 * Update the lockfile with the current time after a successful run.
 * @returns { undefined }
 */
export async function updateLockFileTime() {
  const lockfileDir = core.getInput("lockfile_dir") || ".";
  const lockfilePath = path.join(lockfileDir, defaults.lockfileName);
  const nowDateObj = new Date();
  return fs.writeFileSync(lockfilePath, nowDateObj.toISOString());
}
