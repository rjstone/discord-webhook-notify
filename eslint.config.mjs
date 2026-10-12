// See: https://eslint.org/docs/latest/use/configure/configuration-files

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["**/coverage", "**/dist", "**/linter", "**/node_modules"]
  },
  js.configs.recommended,
  jest.configs["flat/recommended"],
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
      },

      ecmaVersion: 2023,
      sourceType: "module"
    },

    rules: {
      camelcase: "off",
      "no-console": "off",
      "no-shadow": "off",
      "no-unused-vars": "warn",
      "jest/no-conditional-expect": "warn"
    }
  }
]);
