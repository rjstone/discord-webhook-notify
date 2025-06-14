/**
 * A GitHub Action to notify a channel on Discord using Discord webhooks.
 * See action.yml for the details on the inputs.
 *
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as core from "@actions/core";
import * as github from "@actions/github";

import { EmbedBuilder, WebhookClient } from "discord.js";

import * as defaults from "./defaults";
import { ensureDurationSinceLastRun, updateLockFileTime } from "./timelock";


/**
 * For local workstation debugging only.
 * Will get the webhook URL from ~/github_webhookUrl.txt
 * This should be a path where it can't get accidentally committed to the repo.
 *
 * @returns { String } with the Webhook URL, or whatever is in the txt file
 */
async function getDebugTestUrl() {
  return fs.readFileSync(
    path.join(os.homedir(), "github_webhookUrl.txt"), "utf8");
}

/**
 * This is the main code for the GitHub Action
 *
 * @returns { undefined }
 */
export async function run() {
  try {
    var webhookUrl = core.getInput("webhookUrl").replace("/github", "");
    if (webhookUrl === "useTestURL") {
      webhookUrl = await getDebugTestUrl();
      core.debug("Using local debug webhook in " + webhookUrl);
    } else if (!webhookUrl) {
      core.warning(
        "The webhookUrl was not provided. For security reasons the secret URL must be provided " +
          "in the action yaml using a context expression and can not be read as a default."
      );
      return;
    }

    // goes in message
    const username = core.getInput("username") || defaults.username;
    const avatarUrl = core.getInput("avatarUrl") || defaults.avatarUrl;
    const text = core.getInput("text") || "";

    // goes in embed in message
    const severity = core.getInput("severity") || "info";
    const title = core.getInput("title") || "";
    const description = core.getInput("description") || "";
    const details = core.getInput("details") || "";
    const footer = core.getInput("footer") || "";
    const color = core.getInput("color");

    const context = github.context;
    const obstr = JSON.stringify(context, undefined, 2);
    // core.debug(`The event github.context: ${obstr}`)

    const webhookClient = new WebhookClient(
      { url: webhookUrl },
      { rest: { globalRequestsPerSecond: 10 } }
    );

    const embed = new EmbedBuilder()
      .setTitle(title || defaults.longSeverity[severity])
      .setColor(color || defaults.colors[severity])
      .setDescription((description || (await defaults.getDefaultDescription())) + "\n" + details)
      .setFooter({ text: footer || "Severity: " + defaults.longSeverity[severity] })
      .setTimestamp();

    const msg = {
      username: username,
      avatarURL: avatarUrl,
      content: text,
      embeds: [embed],
    };

    core.debug("Before: " + Date());
    const holddownTime =
      Number.parseInt(core.getInput("holddownTime"), 10) || defaults.holddownTime;
    await ensureDurationSinceLastRun(holddownTime);
    core.debug("After: " + Date());

    await webhookClient.send(msg);
  } catch (error) {
    core.notice(error.message);
    return;
  }

  await updateLockFileTime();
}