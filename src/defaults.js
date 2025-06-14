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
 * @returns { undefined }
 * This default is very minimal and its much better to create one yourself.
 * See https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs#github-context
 */
export async function getDefaultDescription() {
  const context = github.context;

  // There are now a lot more event types than there were long ago.
  // See https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
  switch (context.eventName) {
    case "push":
      return (
        `- **Event:** ${context.eventName}\n` +
        `- **Repo:** ${context.repo}\n` +
        `- **Ref:** ${context.ref}\n` +
        `- **Workflow:** ${context.workflow}\n`
      );

    case "release":
      return (
        `- **Event:** ${context.eventName}\n` + `- **Repo:** ${context.repo}\n`
      );

    case "schedule":
      return (
        `- **Event:** ${context.eventName}\n` +
        `- **Ref**: ${context.ref}\n` +
        `- **Workflow**: ${context.workflow}\n` +
        `- **Commit SHA**: ${context.sha}\n`
      );

    default:
      return (
        `- **Event:** ${context.eventName}\n` + `- **Repo:** ${context.repo}\n`
      );
  }
}