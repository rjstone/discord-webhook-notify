# Discord Webhook Notify

This sends a notification to discord using a webhook URL. It is written in JavaScript so it will work with both windows and linux execution environments.

## Inputs

### `webhookUrl`

The webhook URL to use. This should be in a repository secret and the secret should be included here using `${{ secrets.DISCORD_WEBHOOK }}`. The default is actually `${{ secrets.DISCORD_WEBHOOK }}` so as long as you name your secret `DISCORD_WEBHOOK` and put the webhook URL in that it should work.

### `severity`

The severity level of the notification, either `info`, `warn`, or `error`. Default is `error`.

### `message`

Notification message. Use context expressions and environment variables to provide information.

### `username`

Username to display in Discord for this notification. Default is GitHub.

### `color`

Notification color in the form \#rrggbb (hex). Default determined by severity.

### `avatarUrl`

URL to png of discord avatar to use. The default is the GitHub monochrome octocat logo.

## Example usage

```
uses: rjstone/discord-webhook-notify@v1
on: success()
with:
  severity: info
  message: Build succeeded!
uses: rjstone/discord-webhook-notify@v1
on: failure()
with:
  severity: error
  message: Build failed!
```