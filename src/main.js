/**
 * A GitHub Action to notify a channel on Discord using Discord webhooks.
 * See action.yml for the details on the inputs.
 *
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as core from "@actions/core";
// import * as github from "@actions/github";

import { EmbedBuilder, WebhookClient, MessageFlagsBitField } from "discord.js";

import * as defaults from "./defaults";
import { ensureDurationSinceLastRun, updateLockFileTime } from "./timelock";
import {
  truncateStringIfNeeded,
  sanitizeUsername,
  processIfNeeded
} from "./strutil";

/**
 * For local workstation debugging only.
 * Will get the webhook URL from ~/github_webhookUrl.txt
 * This should be a path where it can't get accidentally committed to the repo.
 *
 * @returns { String } with the Webhook URL, or whatever is in the txt file
 */
export async function getDebugTestUrl() {
  return fs.readFileSync(
    path.join(os.homedir(), "github_webhookUrl.txt"),
    "utf8"
  );
}

/**
 * This is the main code for the GitHub Action
 *
 * @returns { undefined }
 */
export async function run(mockedWebhookClient = null) {
  try {
    let webhookUrl = core.getInput("webhookUrl");
    if (typeof webhookUrl === "undefined" || !webhookUrl) {
      core.warning(
        "The webhookUrl was not provided. For security reasons the secret URL must be provided " +
          "in the action yaml using a context expression and can not be read as a default.\n" +
          "DISCORD NOTIFICATION NOT SENT"
      );
      return;
    } else if (webhookUrl === "useTestURL") {
      webhookUrl = await getDebugTestUrl();
      core.debug("Using local debug webhook in " + webhookUrl);
    }
    webhookUrl = webhookUrl.replace("/github", "");

    // goes in message
    const username = sanitizeUsername(
      core.getInput("username") || defaults.username
    );
    const avatarUrl =
      truncateStringIfNeeded(core.getInput("avatarUrl")) || defaults.avatarUrl;
    const text =
      truncateStringIfNeeded(processIfNeeded(core.getInput("text") || "" )) ;
    const flags = core.getInput("flags") || "";

    // goes in embed in message
    const severity = core.getInput("severity") || "none";
    const title = core.getInput("title") || "";
    const description = core.getInput("description") || "";
    const details = core.getInput("details") || "";
    const footer = core.getInput("footer") || "";
    const color = core.getInput("color");

    let webhookClient;
    /* istanbul ignore next */
    if (mockedWebhookClient) {
      console.log("WARNING: Using mockedWebhookClient (unit testing only)");
      webhookClient = mockedWebhookClient;
    } else {
      webhookClient = new WebhookClient({ url: webhookUrl });
    }

    let msg;
    if (severity === "none") {
      msg = {
        username: username,
        avatarURL: avatarUrl
      };
    } else {
      const embed = new EmbedBuilder()
        .setTitle(
          truncateStringIfNeeded(title) || defaults.longSeverity[severity]
        )
        .setColor(color || defaults.colors[severity])
        .setDescription(
          truncateStringIfNeeded(
            processIfNeeded(
              (description || (await defaults.getDefaultDescription())) +
                "\n" +
                details
            )
          )
        )
        .setFooter({
          text:
            truncateStringIfNeeded(processIfNeeded(footer)) ||
            "Severity: " + defaults.longSeverity[severity]
        })
        .setTimestamp();
      msg = {
        username: username,
        avatarURL: avatarUrl,
        embeds: [embed]
      };
    }

    if (text) msg['content'] = text;

    if (flags !== "") {
      msg["flags"] = 0;
      if (/SuppressNotifications/.test(flags)) {
        msg["flags"] |= MessageFlagsBitField.Flags.SuppressNotifications;
      }
      if (/SuppressEmbeds/.test(flags)) {
        msg["flags"] |= MessageFlagsBitField.Flags.SuppressEmbeds;
      }
      if (/IsComponentsV2/.test(flags)) {
        msg["flags"] |= MessageFlagsBitField.Flags.IsComponentsV2;
      }
    }

    const holddownTime =
      Number.parseInt(core.getInput("holddownTime"), 10) ||
      defaults.holddownTime;

    await ensureDurationSinceLastRun(holddownTime);


    await webhookClient.send(msg);

  } catch (error) {
    // not so sure the workflow should show an error just because the notification failed
    core.notice(error.message);
    return;
  }

  await updateLockFileTime();
  return;
}
