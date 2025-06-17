/**
 * This file is used to mock parts of  the `discord.js` module in tests.
 */
import { jest } from "@jest/globals";

const discord = await import('discord.js');

// Partially mock the WebhookClient class
export const mockSend = jest.fn();
export const mockConstructor = jest.fn();
export const mockWebhookClient = jest.fn().mockImplementation( () => {
  return {
    ...Object.getOwnPropertyDescriptors(discord.WebhookClient.prototype),
    constructor: mockConstructor,
    send: mockSend
  };
});

// A mock-returning factory method for
// jest.unstable_mockModule(modulename, factoryFunc);
export const discordMockFactory = () => {
  return {
    ...discord, // insert whole discord.js module
    WebhookClient: mockWebhookClient // redefine only this
  }; // return the whole adulterated discord.js module
};

export default discordMockFactory;