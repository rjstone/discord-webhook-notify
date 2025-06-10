const core = await import('@actions/core');
const github = await import('@actions/github');

import { EmbedBuilder, WebhookClient } from 'discord.js';

const lockFile = await import('lockfile');
const os = await import('os');
const path = await import('path');


const default_holddownTime = 2000; // ms
const default_avatarUrl = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
const default_username = "GitHub";
const default_colors = {
    info: '#00ff00',
    warn: '#ff9900',
    error: '#ff0000'
}
const long_severity = {
    info: "Informational",
    warn: "Warning",
    error: "Error"
}

async function getDefaultDescription() {
    // This default is very minimal and its much better to construct one yourself.
    // See https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/accessing-contextual-information-about-workflow-runs#github-context
    const context = github.context;

    // There are now a lot more event types than there were originally.
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

// For local debugging. Lack of error checking here not such a big deal.
// Normally doesn't get executed so all these imports don't happen.
async function getDebugTestUrl() {
    const fs = await import('node:fs');
    return fs.readFileSync(path.join(os.homedir(),'github_webhookUrl.txt'),'utf8');
}

export async function run() {
    try {
        var webhookUrl = core.getInput('webhookUrl').replace("/github", "");
        if (webhookUrl === 'useTestURL') {
            webhookUrl = await getDebugTestUrl();
        } else if (!webhookUrl) {
            core.warning("The webhookUrl was not provided. For security reasons the secret URL must be provided "
                           + "in the action yaml using a context expression and can not be read as a default.");
                           return;
        }

        // goes in message
        const username = core.getInput('username')  || default_username;
        const avatarUrl = core.getInput('avatarUrl')  || default_avatarUrl;
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
        core.debug(`The event github.context: ${obstr}`);

        const webhookClient = new WebhookClient({url: webhookUrl}, {rest: {globalRequestsPerSecond: 10}});

        const embed = new EmbedBuilder()
            .setTitle(title || long_severity[severity])
            .setColor(color || default_colors[severity])
            .setDescription((description || await getDefaultDescription()) + "\n" + details)
            .setFooter({text: footer || ("Severity: " + long_severity[severity])})
            .setTimestamp();

        const msg = {
            username: username,
            avatarURL: avatarUrl,
            content: text,
            embeds: [ embed ]
        };

        const holddownTime = Number.parseInt(core.getInput('holddownTime'), 10) || default_holddownTime;
        const lockfile_name = path.join(os.tmpdir(), 'discord-webhook-notify-rate-limiting.lock');

        var promise;
        lockFile.lock(lockfile_name, { stale: holddownTime, wait: ( holddownTime * 1.5 ) }, function (err) {
            if (err) {
                throw new Error("Somehow failed to acquire lock file. holddownTime = ${holddownTime}");
            } else {
                promise = webhookClient.send(msg);
            }
        });
        await promise;
        // We intentionally don't unlock because we want any new calls to have to wait until stale.
        // lockFile.unlock(lockfile_name, function (err) { })

    } catch (error) {
        // core.setFailed(error.message);
        core.notice(error.message);
    }
}

run();