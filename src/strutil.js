/**
 * String utilities module, as you might guess from the stereotypical name.
 */

import { truncateBytes } from "multibyte";

import * as core from "@actions/core";

/*
    From Discord docs:
      Embed titles are limited to 256 characters
      Embed descriptions are limited to 4096 characters
      There can be up to 25 fields
      A field's name is limited to 256 characters and its value to 1024 characters
      The footer text is limited to 2048 characters
      The author name is limited to 256 characters
      The sum of all characters from all embed structures in a message must not exceed 6000 characters
      10 embeds can be sent per message
    I'm of the opinion that discord.js should be where these lengths are checked.
*/

// These are not used right now.
export const sizeLimits = {
  username: 32, // characters or bytes?
  avatarUrl: 256, // No idea what Discord's actual limit is
  text: 2000, // Discord limit
  title: 256,
  description: 4096,
  footer: 2048,
  embed: 6000
};

/**
 *
 * @param { String } jStr - JS String to truncate if needed.
 * @returns { String } - The string which has been truncated if necessary.
 */

export function truncateStringIfNeeded(jStr) {
  if (!jStr) {
    return jStr;
  }
  return truncateBytes(jStr, 2000);
}

/**
 * Discord says:
    "Usernames cannot contain the following substrings: @, #, :, ```, discord"
    "Usernames cannot be: everyone, here"
    "Usernames must be between 2 and 32 characters long"
 */

/**
 * Sanitize usernames.
 * @param { String } username - unsanitized username
 * @returns { String } - sanitized username
 */
export function sanitizeUsername(username) {
  if (username.length < 2) {
    return "Too Short Username";
  }
  if ( username.match(/^(everyone|here)$/i) ) {
    return "Illegal Username: Fix It!";
  }
  return username.replace(/(@|#|:|```|discord)*/ig, "").slice(0,32);
}

/**
 * Apply processing to some strings.
 * @param { String } sStr - string to process
 * @returns { String } - processed string, or jStr
 */
export function processIfNeeded(jStr) {
  const processingOptions = core.getInput("processingOptions");
  if (/percentDecode/.test(processingOptions)) {
    return decodeURIComponent(jStr);
  } else {
    return jStr;
  }
}