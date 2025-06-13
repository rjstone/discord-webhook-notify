// A GitHub Action to notify a channel on Discord using Discord webhooks.

//const core = await import('@actions/core');
//const github = await import('@actions/github');

const core = await import('@actions/core');
const github = await import('@actions/github');

import { EmbedBuilder, WebhookClient } from 'discord.js';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import timersPromises from 'node:timers/promises';


// Various Defaults
const lockfileName = 'discord-webhook-lastrun-time.lock';
const defaultHolddownTime = 3000; // ms
const defaultAvatarUrl = "https://cdn.jsdelivr.net/gh/rjstone/discord-webhook-notify@main/img/default_avatar.png";
const defaultUsername = "Notification (GitHub)";
const defaultColors = {
    info: '#00ff00',
    warn: '#ff9900',
    error: '#ff0000'
}
const longSeverity = {
    info: "Informational",
    warn: "Warning",
    error: "Error"
}

// This default is very minimal and its much better to create one yourself.
// See https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs#github-context
async function getDefaultDescription() {
    const context = github.context;

    // There are now a lot more event types than there were long ago.
    // See https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
    switch(context.eventName) {
    case 'push':
        return `- **Event:** ${context.eventName}\n`
            + `- **Repo:** ${context.repo}\n`
            + `- **Ref:** ${context.ref}\n`
            + `- **Workflow:** ${context.workflow}\n`
            ;
    case 'release':
        return `- **Event:** ${context.eventName}\n`
            + `- **Repo:** ${context.repo}\n`
            ;
    case 'schedule':
        return `- **Event:** ${context.eventName}\n`
            + `- **Ref**: ${context.ref}\n`
            + `- **Workflow**: ${context.workflow}\n`
            + `- **Commit SHA**: ${context.sha}\n`
            ;
    default:
        return `- **Event:** ${context.eventName}\n`
            + `- **Repo:** ${context.repo}\n`
            ;
    }
}

// Ensure some number of ms has passed since our last run, which should also be
// the last time a Discord API request was sent. We use the modification time
// of a "lock" file named in input lockfile_dir to determine when the last run was.
async function ensureDurationSinceLastRun(minIntervalSinceLastRunMs) {
    const lockfileDir = core.getInput('lockfile_dir') || '.';
    const lockfilePath = path.join(lockfileDir, lockfileName);
    const nowDateObj = new Date();

    // TMP DEBUG
    core.debug("ensureDuration lockfilePath: " + lockfilePath);

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
    if ( sinceLastRunMs < minIntervalSinceLastRunMs) {
        if (sinceLastRunMs < 0) { sinceLastRunMs = 0; } // just in case
        const waitTimeMs = minIntervalSinceLastRunMs - (sinceLastRunMs * 0.9);
        core.debug("Waiting " + waitTimeMs + "ms");
        return timersPromises.scheduler.wait(waitTimeMs);
    }
}

// update the lockfile after a successful run
async function updateLockFileTime() {
    const lockfileDir = core.getInput('lockfile_dir') || './';
    const lockfilePath = path.join(lockfileDir, lockfileName);
    const nowDateObj = new Date();
    return fs.writeFileSync(lockfilePath, nowDateObj.toISOString());
}

// For local debugging. Lack of error checking here not such a big deal.
async function getDebugTestUrl() {
    return fs.readFileSync(path.join(os.homedir(),'github_webhookUrl.txt'),'utf8');
}

export async function run() {
    try {
        var webhookUrl = core.getInput('webhookUrl').replace("/github", "");
        if (webhookUrl === 'useTestURL') {
            webhookUrl = await getDebugTestUrl();
            core.debug("Using local debug webhook in " + webhookUrl);
        } else if (!webhookUrl) {
            core.warning("The webhookUrl was not provided. For security reasons the secret URL must be provided "
                           + "in the action yaml using a context expression and can not be read as a default.");
                           return;
        }

        // goes in message
        const username = core.getInput('username')  || defaultUsername;
        const avatarUrl = core.getInput('avatarUrl')  || defaultAvatarUrl;
        const text = core.getInput('text') || '';

        // goes in embed in message
        const severity = core.getInput('severity') || 'info';
        const title = core.getInput('title') || '';
        const description = core.getInput('description') || '';
        const details = core.getInput('details') || '';
        const footer = core.getInput('footer') || '';
        const color = core.getInput('color');

        const context = github.context;
        const obstr = JSON.stringify(context, undefined, 2);
        // core.debug(`The event github.context: ${obstr}`);

        const webhookClient = new WebhookClient({url: webhookUrl}, {rest: {globalRequestsPerSecond: 10}});

        const embed = new EmbedBuilder()
            .setTitle(title || longSeverity[severity])
            .setColor(color || defaultColors[severity])
            .setDescription((description || await getDefaultDescription()) + "\n" + details)
            .setFooter({text: footer || ("Severity: " + longSeverity[severity])})
            .setTimestamp();

        const msg = {
            username: username,
            avatarURL: avatarUrl,
            content: text,
            embeds: [ embed ]
        };

        core.debug("Before: " + Date());
        const holddownTime = Number.parseInt(core.getInput('holddownTime'), 10) || defaultHolddownTime;
        await ensureDurationSinceLastRun(holddownTime);
        core.debug("After: " + Date());

        await webhookClient.send(msg);

    } catch (error) {
        core.notice(error.message);
        return;
    }

    await updateLockFileTime();
}

await run();