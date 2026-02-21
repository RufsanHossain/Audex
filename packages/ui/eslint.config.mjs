import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    rules: {
      // shadcn components use default exports and spread patterns
      "import-x/no-default-export": "off",
      // shadcn components sometimes use empty interfaces for extensibility
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];