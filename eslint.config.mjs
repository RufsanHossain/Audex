import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.config.{js,mjs,cjs}",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "commitlint.config.ts",
            "packages/*/vitest.config.ts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "import-x": importPlugin,
    },
    rules: {
      // TypeScript strict overrides
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],

      // Import ordering
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
      "import-x/no-duplicates": "error",
    },
  },
  {
    files: ["commitlint.config.ts", "packages/*/vitest.config.ts"],
    ...tseslint.configs.disableTypeChecked,
  }
);