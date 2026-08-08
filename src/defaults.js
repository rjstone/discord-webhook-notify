/**
 * File containing all the defaults
 */

import * as github from "@actions/github";


export const lockfileName = "discord-webhook-lastrun-time.lock";
export const holddownTime = 3000; // ms
export const avatarUrl =
  "https://cdn.jsdelivr.net/gh/rjstone/discord-webhook-notify@main/img/default_avatar.png";
export const username = "Notification (GitHub)";
export const colors = {
  info: "#00ff00",
  warn: "#ff9900",
  error: "#ff0000",
};
export const longSeverity = {
  info: "Informational",
  warn: "Warning",
  error: "Error",
};

/**
 * @returns { Promise<string> }
 * This default is very minimal and its much better to create one yourself.
 * See https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs#github-context
 *
 * Uses @actions/github context + env (not non-existent top-level github.repository /
 * github.triggering_actor fields — those never existed on the package and produced
 * "undefined" in notifications, see issue #34).
 */
export async function getDefaultDescription() {
  const context = github.context;
  const repository =
    process.env.GITHUB_REPOSITORY ||
    context.payload?.repository?.full_name ||
    "";
  const repositoryUrl = repository
    ? `${context.serverUrl}/${repository}`
    : "";
  // Prefer the actor that triggered the run when available (e.g. re-runs).
  const actor =
    process.env.GITHUB_TRIGGERING_ACTOR || context.actor || "";

  return (
    `- **Repository:** [${repository}](${repositoryUrl})\n` +
    `- **Workflow:** ${context.workflow}\n` +
    `- **Event:** ${context.eventName}\n` +
    `- **Triggering Actor:** ${actor}\n`
  );
}
