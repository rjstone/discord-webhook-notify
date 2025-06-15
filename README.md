# Discord Webhook Notify

This sends a notification to discord using a webhook URL. It is written in JavaScript so *it will work with windows, osx, and linux execution environments*.

## Status
Unit Tests: ![Coverage SVG](./badges/coverage.svg)

## Setup Instructions

Using this action involves the following steps, which assume you already have a Discord server.

### Create a webhook on Discord

Get on Discord and create a new webhook. You can do this in **Channel Settings** or **Server Settings**, in both cases under the **Integrations** section. The webhook URL will look like a long URL with a big random-looking authentication token embedded in it. (This is what needs to be kept secret, otherwise anyone can spam the associated Discord channel.)

### Add webhook URL to repository secrets

Then get on GitHub, go into the **Settings** tab of your repo, and add a new Secret called `DISCORD_WEBHOOK`.

In the **Settings** tab page for a repository, this is under **Secrets and variables->Actions** on the left sidebar.

Then in the lower-right panel, there's a button titled **New repository secret**. Make sure to use this and NOT a repository variable. Also, ideally you should use a "Repository secret" and not an "Environment secret" because the repository secrets can be selectively exposed to one action without exposing them to other actions or processes unnecessarily.

For more detail, including how to do this from the `gh` CLI tool, [see the full documentation](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) on adding secrets for GitHub Actions.

### Add the action to workflow YAML

In your workflow YAML, set `webhookUrl` as follows: `webhookUrl: ${{ secrets.DISCORD_WEBHOOK }}`. You must set webhookUrl this way for each invocation of the action, because secrets are not passed to anything by default, only as parameters.

See below for more documentation and detailed examples.

## Version Usage Suggestions

- Consider forking this repo and referring to the action using your fork. This is because Discord or GitHub may change something that will break, and performing your own fix will probably be the fastest way to get it working again. I can't guarantee that any problems with this action will get fixed very quickly.
- If you don't want to fork this repo unless something causes you to need to:
  - Use `rjstone/discord-webhook-notify@v2` if you want bugfixes but nothing backward-compatability breaking. (If anything breaks compatability it will be in v3+.)
  - Use `rjstone/discord-webhook-notify@v2.x.x` (or another specific tag after the @) if you want to guarantee use of a specific revision.
  - **Don't use any `v1.x.x` as these have been broken by various changes over time and will no longer work properly.**

## Inputs

See the `action.yml` file for more exact detail, but here's a quick summary.

### `webhookUrl`

The webhook URL to use. This should be in a repository secret and the secret should be included here using `${{ secrets.DISCORD_WEBHOOK }}` where `DISCORD_WEBHOOK` is whatever you named the secret. For security reasons it is not possible to just grab a secret using a default name, so it must be supplied in every action invocation.

### `holddownTime`

If a webhook is called too soon after a previous webhook call, Discord's server API will return a rate limit exceeded error. This work exactly according to Discord's documentation because runners seem to use shared IP addresses and the rate limiting is dynamic. However, a delay of 2-3 seconds since the last webhook HTTP requests seems to be good enough. If for some reason it isn't and you have some need to send consecutive notifications, you can increase this value to block execution of another webhook request until the given number of miliseconds has passed since the last one was made.

### `username`

Username to display in Discord for this notification. Not required since there's an identifiable default, but setting this is strongly suggested.

### `avatarUrl`

URL to png of discord avatar to use. A basic default is provided, but setting this is strongly suggested. See the Discord documentation for image sizes and restrictions. If Discord doesn't like the image file or the URL for some reason then this silently fail to be used by Discord.

### `text`

String to display as normal chat text above the "embed" section. This may contain Discord style markdown and is otherwise the equivalent of whatever a user types as a normal chat message.

### Embed

Discord allows an "embed" in messages which looks sort of like an attachment. It doesn't actually have to contain images or links though, and the API has fields for including them.

The following settings are optional and relate to displaying information as an "embed".

### `severity`

By default, embeds are used to express severity information. This is the severity level of the notification, either `info`, `warn`, `error`, or `none`. Default is `none`, which means no embed will be added. If severity is specified then it will be used to set the defaults for some other fields in the embed. (You can still override these defaults though.) If all of the other inputs for embed fields are overridden then this field only needs to contain something other than `none`.

### `color`

Color of the bar on the left side of the "embed" section in the form #rrggbb (hex). Default determined by severity.

### `title`

Title for the embed. Defaults to severity long terminology.

### `description`

The first half of the text body of the embed. This defaults to showing only a few pieces of information from the context/environment, like the workflow name. Override this if you *do not* want the default selection of information here. Note that this input may also contain Discord style markdown.

### `details`

The second half of the text body of the embed. If you do want the default information in `description` then just don't specify a `description`, and then specify additional details to append to the embed body using this `details` input. `details` defaults to empty, so if you specify a `description` then this input can just be ignored. Like `description` it can also contain Discord style markdown.

### `footer`

String to display in the "footer" section of the embed. This defaults to showing the severity level.

## Example usage

### Simple Usage Example

Set up notification for whatever conditions you want. There's no built-in handling based on reading the environment so you can notify on any `if:` expression.

Using lots of defaults, but still adding a message in the embed:

```yaml

- name: Test Success
    uses: rjstone/discord-webhook-notify@v2
    if: success()
    with:
        webhookUrl: ${{ secrets.DISCORD_WEBHOOK }}
        severity: info
        details: All tests passed!

```

Without any embed:

```yaml

- name: Text Notify
    uses: rjstone/discord-webhook-notify@v2
    with:
        webhookUrl: ${{ secrets.DISCORD_WEBHOOK }}
        username: AwesomeSauce GitHub Repo Build Process
        avatarUrl: https://<some awesome domain/<some awesome>.png
        text: >
            This is a text only notification.
            * But it can contain (Discord) Markdown.

```

### Minimal Full Custom Example

Something fully customized:

```yaml

- name: Test Custom
    uses: rjstone/discord-webhook-notify@v2
    with:
        webhookUrl: ${{ secrets.DISCORD_WEBHOOK }}
        username: CustomBotUsername
        avatarUrl: https://domain/images/custom.png
        text: Below this normal-looking message is an embed!
        severity: info # only to make sure the embed is added
        color: '#ff00aa'
        title: My Fancy Embed Title
        description: This is a ***custom*** description. I hope it looks good.
        # details: not needed because we overrode default description.
        footer: This embed was brought to you by the letter R and the number 4.

```
