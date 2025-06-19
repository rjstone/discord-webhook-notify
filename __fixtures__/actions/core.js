/**
 * This file is used to mock the `@actions/core` module in tests.
 */
import { jest } from "@jest/globals";

export const debug = jest.fn();
export const error = jest.fn();
export const warning = jest.fn();
export const notice = jest.fn();
export const info = jest.fn();
export const getInput = jest.fn();
export const setOutput = jest.fn();
export const setFailed = jest.fn();

/**
 * There's no factory function exported, but somewhat oddly an
 * 'import * as x` will result in x being an object we can just
 * return from an arrow factory function.
 *
 * This only works in this sort of simple case where everything is
 * just 'export const'.
 */