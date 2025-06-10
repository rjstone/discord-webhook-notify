const core = require('@actions/core');
const github = require('@actions/github');

const { EmbedBuilder, WebhookClient } = require('discord.js');

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
    const context = github.context;
    const payload = context.payload;

    switch(github.context.eventName) {
    case 'push':
        return `- **Event:** ${context.eventName}\n`
            + `- **Repo:** ${payload.repository.full_name}\n`
            + `- **Ref:** ${payload.ref}\n`
            + `- **Workflow:** ${context.workflow}\n`
            + `- **Author:** ${payload.head_commit.author.name}\n`
            + `- **Committer:** ${payload.head_commit.committer.name}\n`
            + `- **Pusher:** ${payload.pusher.name}\n`
            + `- **Commit URL:** ${payload.head_commit.url}\n`
            + `- **Commit Message:** ${payload.head_commit.message}\n`
            ;
    case 'release':
        return `- **Event:** ${context.eventName}\n`
            + `- **Repo:** ${payload.repository.full_name}\n`
            + `- **Action:** ${payload.action}\n`
            + `- **Name**: ${payload.release.name}\n`
            + `- **Author:** ${payload.release.author.login}\n`
            + `- **Tag:** ${payload.release.tag_name}`
            + payload.release.prerelease ? ' (pre-release)' : ''
            + '\n'
            + `- **Url:** ${payload.release.url}`
            ;
    case 'schedule':
        return `- **Event:** ${context.eventName}\n`
            + `- **Ref**: ${context.ref}\n`
            + `- **Workflow**: ${context.workflow}\n`
            + `- **Commit SHA**: ${context.sha}\n`
            ;
    default:
        return `- **Event:** ${context.eventName}\n`
            + `- **Repo:** ${payload.repository.full_name}\n`
            ;
    }
}

export async function run() {
    try {
        const webhookUrl = core.getInput('webhookUrl').replace("/github", "");
        if (!webhookUrl) {
            core.setFailed("The webhookUrl was not provided. For security reasons the secret URL must be provided "
                           + "in the action yaml using a context expression and can not be read as a default.");
            return;
        }

        // goes in message
        const username = core.getInput('username');
        const avatarUrl = core.getInput('avatarUrl');
        const text = core.getInput('text');

        // goes in embed in message
        const severity = core.getInput('severity');
        const description = core.getInput('description');
        const details = core.getInput('details');
        const footer = core.getInput('footer');
        const color = core.getInput('color');

        const context = github.context;
        const obstr = JSON.stringify(context, undefined, 2);

        core.debug(`The event github.context: ${obstr}`);

        const webhookClient = new WebhookClient({url: webhookUrl}, {rest: {globalRequestsPerSecond: 10}});

        core.info(`${username} ${avatarUrl} ${color} ${description} ${details} ${footer} ${text}`);

        const embed = new EmbedBuilder()
            .setTitle("Title Placeholder")
            .setColor(color || default_colors[severity])
            .setDescription((description || await getDefaultDescription()) + "\n" + details)
            .setFooter(footer || ("Severity: " + long_severity[severity]))
            .setTimestamp();

        const msg = {
            username: username || default_username,
            avatarURL: avatarUrl || default_avatarUrl,
            content: text,
            embeds: [ embed ]
        };

        webhookClient.send(msg);

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();