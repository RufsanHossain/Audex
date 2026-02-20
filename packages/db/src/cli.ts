import mongoose from "mongoose";

import { MigrationRunner, migrations } from "./migrations/index.js";

// ─── Env Loading ────────────────────────────────────────────────────────────
// CLI runs standalone — load env directly instead of through @audex/env
// to avoid requiring ALL env vars when only MONGODB_URI is needed
function getMongoUri(): string {
  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    console.error("✗ MONGODB_URI environment variable is required");
    process.exit(1);
  }
  return uri;
}

// ─── Seed Imports ───────────────────────────────────────────────────────────
async function runSeed(): Promise<void> {
  const uri = getMongoUri();
  await mongoose.connect(uri);
  console.log("⚡ Connected to MongoDB\n");

  const { seed } = await import("./seed/index.js");
  await seed();

  await mongoose.disconnect();
  console.log("\n✓ Disconnected from MongoDB");
}

// ─── Migration Commands ─────────────────────────────────────────────────────
async function runMigration(command: string): Promise<void> {
  const uri = getMongoUri();
  const { MongoClient } = mongoose.mongo;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    console.log(`⚡ Connected to: ${db.databaseName}\n`);

    const runner = new MigrationRunner(db, migrations);

    switch (command) {
      case "up": {
        const countArg = process.argv[4];
        const count = countArg ? parseInt(countArg, 10) : undefined;
        await runner.up(count);
        break;
      }
      case "down": {
        const countArg = process.argv[4];
        const count = countArg ? parseInt(countArg, 10) : 1;
        await runner.down(count);
        break;
      }
      case "status": {
        await runner.status();
        break;
      }
      default:
        console.error(`✗ Unknown migration command: ${command}`);
        console.log("  Available: up [count], down [count], status");
        process.exit(1);
    }
  } finally {
    await client.close();
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "migrate":
      await runMigration(process.argv[3] ?? "status");
      break;
    case "seed":
      await runSeed();
      break;
    default:
      console.log(`
  @audex/db CLI

  Usage:
    pnpm db:migrate:up [count]     Apply pending migrations (all or N)
    pnpm db:migrate:down [count]   Revert last N migrations (default: 1)
    pnpm db:migrate:status         Show migration status
    pnpm db:seed                   Seed database with staging data
      `);
      process.exit(command ? 1 : 0);
  }
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
