import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    rules: {
      "import-x/no-default-export": "off",
    },
  },
  {
    ignores: [".next/"],
  },
];