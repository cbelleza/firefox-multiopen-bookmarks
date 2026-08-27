import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "build/**", "web-ext-artifacts/**", "node_modules/**", "*.xpi", "*.zip"]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
        browser: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn"
    }
  },
  {
    files: ["test/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
