# Discord Webhook Notify

This sends a notification to discord using a webhook URL. It is written in
JavaScript (ES) using the `discord.js` NPM package, so *it will work with
Windows, OS X, and Linux execution environments* and anything else that runs
NodeJS.

## Status

![CI Status main SVG](https://raw.githubusercontent.com/rjstone/discord-webhook-notify/refs/heads/badges/.badges/main/ci_status_main.svg) ![CI Status v2 SVG](https://raw.githubusercontent.com/rjstone/discord-webhook-notify/refs/heads/badges/.badges/v2/ci_status_v2.svg) ![Coverage SVG](https://raw.githubusercontent.com/rjstone/discord-webhook-notify/refs/heads/badges/cba/coverage-total.svg)

## Setup Instructions

Using this action involves the following steps, which assume you already have a Discord "server".

### Create a Webhook on Discord

Login to Discord and create a new webhook. Assuming you have admin privileges
for the server/channel, you can do this in **Channel Settings** or **Server
Settings**, in both cases under the **Integrations** section. The webhook URL
will look like a long URL with a big random-looking authentication token
embedded in it. (This is what needs to be kept secret, otherwise anyone
who gets it can endlessly spam the associated Discord channel.)

There is some [Discord documentation about webhooks here](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks).
Note that webhooks *do not* require a Discord developer account. They are a
simple, low-effort means of integration that doesn't require creating a Discord
app or bot.

### Add webhook URL to repository secrets

One you have generated a webhook url, use the GitHub web UI to add it to your
repository.

1. Go into the **Settings** tab of your repo.

1. In the **Settings** tab page for a repository, select **Secrets and
variables->Actions** on the left sidebar.

1. In the lower-right panel, select **New repository secret**. Make sure to use
this and not something else like a repository variable.

1. Add a new Secret with the name `DISCORD_WEBHOOK` (or anything memorable) and
the webhook URL as the value.

For more detail, including how to do this from the `gh` CLI tool, [see the full
documentation](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
on adding repository secrets for GitHub Actions.

### Add the action to workflow YAML

In your workflow YAML, set `webhookUrl` as follows: `webhookUrl:
${{ secrets.DISCORD_WEBHOOK }}`. If you used a different name, just use that
name in place of `DISCORD_WEBHOOK`. (See full YAML examples below.)

You must set webhookUrl this way for each invocation of the action, because
secrets are not passed to anything by default, only as parameters.

## Version Usage Suggestions

- I can't guarantee that any problems with this action will get fixed very quickly if there's an API-breaking change.
- Because of this, consider forking this repo and referring to the action using your fork.
- If you don't want to fork until necessary:
  - Use `rjstone/discord-webhook-notify@v2.x.x` (or another specific tag after the @) if you want to guarantee use of a specific revision.
  - Use `rjstone/discord-webhook-notify@v2` if you want updates but nothing that should be backward-compatabiliy breaking. (If anything breaks compatability it will be in v3+.)
  - **Don't use any `v1.x.x` as these have been broken by various changes over time and will no longer work properly.**

## Inputs

See the `action.yml` file for more exact details, and also see examples below
this, but here's a quick summary.

### `webhookUrl`

The webhook URL to use. This should be in a repository secret and the secret
should be included here using `${{ secrets.DISCORD_WEBHOOK }}` where
`DISCORD_WEBHOOK` is whatever you named the secret.

### `username`

"Username" to display in Discord for this notification. Not required since
there's an identifiable default, but setting this is strongly suggested.

### `avatarUrl`

URL to png of discord avatar to use. A basic default is provided, but setting
this is strongly suggested. See the Discord documentation for image sizes and
restrictions. If Discord doesn't like the image file or the URL for some reason
then this will be silently ignored.

### `text`

String to display as normal chat text after the username and above everything
else. This may contain Discord style markdown and is otherwise the equivalent
of whatever a user types as a normal chat message. There is a 2000 "character"
(which might actually mean bytes, it isn't clear) limit.

### `flags`

A whitespace-separated list of MessageFlags. The only one supported currently
is `SuppressNotifications` which will prevent the message from triggering a
"bleep" or other attention-grabbing attenpt when received by the client.

### Embed

Discord allows an "embed" in messages which looks sort of like an attachment.
It doesn't actually have to contain images or links, but it has some properties
for different elements.

The following settings are optional and are shortcuts for displaying
information as an "embed".

### `severity`

By default, embeds are used to express severity information. This is the
severity level of the notification, either `info`, `warn`, `error`, or `none`.
**If `none` is specified then no embed will be added.**
If another option is specified then it will be used to set the defaults for
fields in the embed. (You can still override these defaults though.)

### `color`

Color of the gutter bar on the left side of the "embed" section, in the form
#rrggbb (hex). Default determined by severity.

### `title`

Title for the embed. Defaults to severity long terminology.

### `description`

The first half of the text body of the embed. This defaults to showing only a
few pieces of information from the context/environment, like the workflow name.
(It used to show more but I got tired of keeping up with the API.)
Override this if you *do not* want the default selection of information here.
Note that this input may also contain Discord style markdown.

### `details`

The second half of the text body of the embed. If you DO want the default
information in `description` then just don't specify a `description`, and then
specify additional details to append to the embed body using this `details`
input. `details` defaults to empty, so if you specify a `description` then this
input can just be ignored. Like `description` it can also contain Discord style
markdown.

### `footer`

String to display in the "footer" section of the embed. This defaults to
showing the severity level.

## "Advanced" Settings

These are usually not needed but could be useful for solving specific issues.

### `processingOptions`

(experimental) Set to "percentDecode" if you want some inputs that are
often multi-line strings to be run through "percent decoding" using
decodeURIComponent(). This can be useful in cases where the output from
another action should contain newlines, but won't be preserved by the
Workflow system if it does. Right now, this is the only optional input
processing.

### `holddownTime`

If a webhook is called too soon after a previous webhook call, Discord's server
API will return a rate limit exceeded error. This doesn't necessarily work
exactly according to Discord's documentation because GitHub runners seem to use
shared IP addresses, and also the rate limit is dynamic. However, a delay
of 2-3 seconds (default) since the last webhook HTTP requests seems to usually
be good enough. If for some reason it isn't you can increase this wait time.

### `lockfileDir`

The directory where the lockfile used for saving last run time is stored.
Default to the current directory but you can change it if it is in the way.

## Example usage

### Simple Usage Example

GitHub Actions are used in GitHub [Workflows](https://docs.github.com/en/actions/writing-workflows/about-workflows) as a type of [Step](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idsteps) inside of a [Job](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobs).

You can create notification for whatever `if:` conditions you want. There's no built-in handling based on reading the environment so you can run the action or skip it using any [`if:` expression](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idif).

The following examples would go under [`jobs.<job_id>.steps`](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idsteps) (which is omitted in the examples to shorten them).

Using lots of defaults (not recommended), but still adding a message in the embed:

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
      text: |
          This is a text-only notification.
          * But it can contain (Discord) Markdown.

```

### Minimal Full Custom Example

Something more fully customized:

```yaml

  - name: Test Custom
    uses: rjstone/discord-webhook-notify@v2
    with:
      webhookUrl: ${{ secrets.DISCORD_WEBHOOK }}
      username: Custom Bot Username
      avatarUrl: https://domain/images/custom.png
      text: Below this normal-looking message is an embed!
      severity: info # only to make sure the embed is added
      color: '#ff00aa'
      title: My Fancy Embed Title
      description: "This is a ***SuPeR custom*** description. I hope it looks good."
      # details: not needed because we overrode default description.
      footer: This embed was brought to you by the letter R and the number 4.

```
