const core = require('@actions/core');
const github = require('@actions/github');

const webhook = require("webhook-discord");

const default_avatarUrl = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
const default_username = "GitHub";
const default_colors = {
    info: '#00ff00',
    warn: '#ff9900',
    error: '#ff0000'
}

async function run() {
    try {
        const webhookUrl = core.getInput('webhookUrl').replace("/github", "");
        const severity = core.getInput('severity');
        const message = core.getInput('message');
        const username = core.getInput('username');
        const color = core.getInput('color');
        const avatarUrl = core.getInput('avatarUrl');
        
        const context = github.context;
        const secrets = github.secrets;
        const payload = JSON.stringify(context, undefined, 2)
        core.info(`The event github.context: ${payload}`);

        core.info(`Sending: ${message}`);

        const hook = new webhook.Webhook(webhookUrl || secrets.DISCORD_WEBHOOK.replace("/github", ""));

        const msg = new webhook.MessageBuilder()
                        .setName(username || default_username)
                        .setColor(color || default_colors[severity])
                        .addField("Severity", severity)
                        .setText(message)
                        .setImage(avatarUrl || default_avatarUrl)
                        .setTime();

        hook.send(msg);

    } catch (error) {
    core.setFailed(error.message);
    }
}

run();