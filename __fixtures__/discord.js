/**
 * This file is used to mock the `discord.js` module in tests.
 */
import { jest } from "@jest/globals";

export const mockSend = jest.fn();

const mock = jest.fn().mockImplementation( () => {
  return { send: mockSend };
});

export default mock;