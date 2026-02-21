import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "api",
        "workers",
        "report",
        "billing",
        "ui",
        "db",
        "types",
        "env",
        "validators",
        "realtime",
        "analysis",
        "ci",
        "deps",
        "release",
        "web",
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "body-max-line-length": [0, "always", Infinity],
  },
};

export default config;
