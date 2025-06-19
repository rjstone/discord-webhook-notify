/**
 * This file is used to mock parts of  the `discord.js` module in tests.
 */
import { jest } from "@jest/globals";

// const discord = await import("discord.js");

// Partially mock the WebhookClient class
/* export const mockWCSend = jest.fn().mockImplementation( async (args) => {
  console.log("mockWCSend() was called with " + args);
  return args;
});
mockWCSend.mockName("mockWCSend");

export const mockWCConstructor = jest.fn().mockImplementation ( (args) => {
  console.log("mockWCConstructor() was called with " + args);
  return args;
})
mockWCConstructor.mockName("WebhookClient.constructor"); */

export const MockWebhookClient = class {
  send_called = false;
  send_arg = null;

  constructor(arg) {
    this.send_called = false;
    this.send_arg = null;
    console.log("MockWebhookClient constructor called with " + arg);
  }
  send(arg) {
    this.send_called = true;
    this.send_arg = arg
    console.log("MockWebhookClient send() called with " + arg);
    return arg;
  }
};

/* MockWebhookClient.prototype.send = mockWCSend;
jest.spyOn(MockWebhookClient.prototype, "constructor").mockImplementation( async (arg) => {
  console.log("MOCK MockWebhookClient constructor() called with " + arg);
  return arg;
});
 */
/* export const mockModuleBody = {
    WebhookClient: MockWebhookClient,
    EmbedBuilder: discord.EmbedBuilder,
    MessageFlagsBitField: discord.MessageFlagsBitField
};

export default mockModuleBody; */