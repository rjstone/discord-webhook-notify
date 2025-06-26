/**
 * A GitHub Action to notify a channel on Discord using Discord webhooks.
 * See action.yml for the details on the inputs.
 *
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as core from "@actions/core";

import { EmbedBuilder, WebhookClient, MessageFlagsBitField } from "discord.js";
import YAML from 'yaml';

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
    // I'm unsure why this wasn't always called content.
    // API change? Bad naming in previous module?
    if (core.getInput("content") && core.getInput("text")) {
      core.warning("both 'content' and 'text' are set. 'text' will be ignored.");
    }
    const textOrContent = core.getInput("content") || core.getInput("text") || "";
    const content = truncateStringIfNeeded(processIfNeeded(textOrContent));

    const flags = core.getInput("flags") || "";

    // The "easy" embed fields.
    const severity = core.getInput("severity") || "none";
    const title = core.getInput("title") || "";
    const description = core.getInput("description") || "";
    const details = core.getInput("details") || "";
    const footer = core.getInput("footer") || "";
    const color = core.getInput("color");
    const thumbnailUrl = core.getInput("thumbnailUrl");
    const imageUrl = core.getInput("imageUrl");

    // full pass-through for JSON/YAML embeds.
    // The input should be a string containing a JSON or YAML array.
    let embedsMaybeJSONYAML = core.getInput("embeds");
    let embeds = [];
    if (embedsMaybeJSONYAML) {
      let failed = false;
      try {
        embeds = JSON.parse(embedsMaybeJSONYAML);
      } catch {
        failed = true;
      }
      if (failed) {
        failed = false;
        try {
          embeds = YAML.parse(embedsMaybeJSONYAML);
        } catch {
          failed = true;
        }
      }
      if (failed) {
        core.warning("embeds is non-empty but couldn't be parsed as JSON or YAML");
      }
    }

    /**
     * Build the "easy embed" if needed.
     */
    if (severity !== "none") {
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
      if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
      }
      if (imageUrl) {
        embed.setImage(imageUrl);
      }
      // the "easy embed" will get prepended to the list if it exists.
      embeds = [ embed ].concat(embeds);
    }

    if (embeds.length > 10) {
      core.warning("embeds array is longer than allowed limit 10. Truncating to 10.");
      embeds = embeds.slice(0,10);
    }

    /**
     * Compose Message
     */
    const msg = {
        username: username,
        avatarURL: avatarUrl
      };
    if (content) msg['content'] = content;
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
    // Add embeds if there are any.
    if (embeds) {
      msg['embeds'] = embeds;
    }

    let webhookClient;
    /* istanbul ignore next */
    if (mockedWebhookClient) {
      console.log("WARNING: Using mockedWebhookClient (unit testing only)");
      webhookClient = mockedWebhookClient;
    } else {
      webhookClient = new WebhookClient({ url: webhookUrl });
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
