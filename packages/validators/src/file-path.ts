// ─── @audex/validators — File Path Validator ────────────────────────────────
// Validates file paths in code audit uploads.
// Prevents path traversal, absolute paths, and dangerous file types.

import path from "node:path";

import { z } from "zod";

// ── Allowed Extensions (code files only) ────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".svg",
  ".md",
  ".mdx",
  ".txt",
  ".env",
  ".env.example",
  ".gitignore",
  ".eslintrc",
  ".prettierrc",
  ".editorconfig",
  ".vue",
  ".svelte",
  ".astro",
  ".php",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".c",
  ".cpp",
  ".h",
  ".cs",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".dockerfile",
  ".toml",
  ".ini",
  ".conf",
  ".nginx",
  ".htaccess",
  ".graphql",
  ".gql",
  ".prisma",
  ".sql",
  ".wasm",
]);

// ── Blocked Filenames ───────────────────────────────────────────────────────

const BLOCKED_FILENAMES = new Set([
  ".env.local",
  ".env.production",
  ".env.development",
  "id_rsa",
  "id_rsa.pub",
  "id_ed25519",
  ".npmrc",
  ".pypirc",
  "credentials.json",
  "serviceAccountKey.json",
  "secrets.json",
  "shadow",
  "passwd",
]);

// ── Schema ──────────────────────────────────────────────────────────────────

export const filePathSchema = z
  .string()
  .min(1, "File path is required")
  .max(500, "File path too long")
  .refine((p) => !p.includes(".."), { message: "Path traversal (..) is not allowed" })
  .refine((p) => !path.isAbsolute(p), { message: "Absolute paths are not allowed" })
  .refine(
    (p) => {
      const hasSpecial = /[<>:"|?*]/.test(p);
      const hasControl = p.split("").some((c) => c.charCodeAt(0) <= 0x1f);
      return !hasSpecial && !hasControl;
    },
    { message: "Path contains invalid characters" },
  )
  .refine(
    (p) => {
      const normalized = path.normalize(p);
      return !normalized.startsWith("..");
    },
    { message: "Path escapes the working directory" },
  )
  .refine(
    (p) => {
      const basename = path.basename(p);
      return !BLOCKED_FILENAMES.has(basename);
    },
    { message: "This filename is blocked for security reasons" },
  );

/** Validates that a file extension is in the allowed set */
export const codeFilePathSchema = filePathSchema.refine(
  (p) => {
    const ext = path.extname(p).toLowerCase();
    // Allow extensionless config files (Dockerfile, Makefile, etc.)
    if (!ext) {
      const basename = path.basename(p).toLowerCase();
      return ["dockerfile", "makefile", "procfile", "gemfile", "rakefile"].includes(basename);
    }
    return ALLOWED_EXTENSIONS.has(ext);
  },
  { message: "File type is not supported for code audits" },
);

/** Schema for an individual file in a code upload */
export const codeFileSchema = z.object({
  path: codeFilePathSchema,
  content: z.string().max(1_000_000, "File content exceeds 1MB limit"),
  language: z.string().max(30).optional(),
});

/** Schema for the full code upload payload */
export const codeUploadSchema = z.object({
  files: z
    .array(codeFileSchema)
    .min(1, "At least one file is required")
    .max(200, "Maximum 200 files per code audit"),
  entryPoint: filePathSchema.optional(),
  framework: z
    .enum(["nextjs", "react", "vue", "svelte", "astro", "angular", "express", "fastify", "other"])
    .optional(),
});
