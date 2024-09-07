import globals from "globals";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import nodePlugin from "eslint-plugin-node";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      import: importPlugin,
      promise: promisePlugin,
      node: nodePlugin
    },
    rules: {
      'no-unused-vars': ['error', { 'varsIgnorePattern': '^_' }],
      'import/no-unresolved': 'error',
    },
  }
];