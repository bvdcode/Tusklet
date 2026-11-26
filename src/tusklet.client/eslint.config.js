import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", ".vs"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      "no-console": "error",
      curly: "error",
      "no-restricted-globals": [
        "error",
        { name: "localStorage", message: "Use application state instead." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: 'Identifier[name="console"]',
          message: "Avoid console output in client code.",
        },
        {
          selector: 'MemberExpression[property.value="console"]',
          message: "Avoid console output in client code.",
        },
        {
          selector: "TSUnknownKeyword",
          message: "Use a specific type and validate data at its boundary.",
        },
        {
          selector: 'MemberExpression[property.name="localStorage"]',
          message: "Use application state instead of localStorage.",
        },
        {
          selector: 'MemberExpression[property.value="localStorage"]',
          message: "Use application state instead of localStorage.",
        },
        {
          selector: "TSAsExpression > TSAsExpression",
          message: "Nested type assertions are not allowed.",
        },
      ],
    },
  },
]);
