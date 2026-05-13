import js from "@eslint/js";
import tseslint from "typescript-eslint";

const typedFiles = ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts", "docs/.vitepress/config.mts"];
const scriptGlobals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  setTimeout: "readonly"
};
const cjsGlobals = {
  ...scriptGlobals,
  require: "readonly",
  __dirname: "readonly",
  module: "readonly"
};

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      ".reporacer/**",
      ".reporacer-demo-site/**",
      "docs/.vitepress/dist/**",
      "docs/api/**",
      "examples/buggy-todo-app/generated/**",
      "examples/rust-demo/target/**",
      "examples/**/__pycache__/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: typedFiles })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({ ...config, files: typedFiles })),
  {
    files: typedFiles,
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowBoolean: true,
          allowNumber: true,
          allowNullish: true
        }
      ]
    }
  },
  {
    files: ["scripts/**/*.js", "eslint.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: scriptGlobals
    }
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: cjsGlobals
    }
  }
);
