import type { Migration, MigrationRecord } from "./types.js";
import type { mongo } from "mongoose";
type Db = mongo.Db;

const MIGRATION_COLLECTION = "_migrations";

export class MigrationRunner {
  private readonly db: Db;
  private readonly migrations: Migration[];

  constructor(db: Db, migrations: Migration[]) {
    this.db = db;
    // Sort migrations chronologically by version
    this.migrations = [...migrations].sort((a, b) => a.version.localeCompare(b.version));
  }

  /** Get all migrations that have been applied */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    return this.db
      .collection<MigrationRecord>(MIGRATION_COLLECTION)
      .find({})
      .sort({ version: 1 })
      .toArray();
  }

  /** Get migrations that haven't been applied yet */
  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));
    return this.migrations.filter((m) => !appliedVersions.has(m.version));
  }

  /** Apply all pending migrations (or up to `count`) */
  async up(count?: number): Promise<MigrationRecord[]> {
    const pending = await this.getPendingMigrations();
    const toApply = count !== undefined ? pending.slice(0, count) : pending;
    const results: MigrationRecord[] = [];

    for (const migration of toApply) {
      const start = performance.now();
      console.log(`⬆  Applying: [${migration.version}] ${migration.description}`);

      try {
        await migration.up(this.db);
        const executionTimeMs = Math.round(performance.now() - start);

        const record: MigrationRecord = {
          version: migration.version,
          description: migration.description,
          appliedAt: new Date(),
          executionTimeMs,
        };

        await this.db.collection<MigrationRecord>(MIGRATION_COLLECTION).insertOne(record);

        results.push(record);
        console.log(`   ✓ Applied in ${executionTimeMs}ms`);
      } catch (error) {
        console.error(`   ✗ Failed: [${migration.version}]`, error);
        throw error;
      }
    }

    if (toApply.length === 0) {
      console.log("✓ No pending migrations.");
    }

    return results;
  }

  /** Revert the last `count` applied migrations (default: 1) */
  async down(count = 1): Promise<string[]> {
    const applied = await this.getAppliedMigrations();
    // Reverse to revert most recent first
    const toRevert = applied.slice(-count).reverse();
    const reverted: string[] = [];

    for (const record of toRevert) {
      const migration = this.migrations.find((m) => m.version === record.version);

      if (!migration) {
        console.warn(`⚠ Migration [${record.version}] not found in codebase — skipping revert`);
        continue;
      }

      console.log(`⬇  Reverting: [${migration.version}] ${migration.description}`);

      try {
        const start = performance.now();
        await migration.down(this.db);
        const elapsed = Math.round(performance.now() - start);

        await this.db.collection(MIGRATION_COLLECTION).deleteOne({ version: migration.version });

        reverted.push(migration.version);
        console.log(`   ✓ Reverted in ${elapsed}ms`);
      } catch (error) {
        console.error(`   ✗ Revert failed: [${migration.version}]`, error);
        throw error;
      }
    }

    if (toRevert.length === 0) {
      console.log("✓ No migrations to revert.");
    }

    return reverted;
  }

  /** Print migration status table */
  async status(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const appliedMap = new Map(applied.map((m) => [m.version, m]));

    console.log("\n Migration Status");
    console.log("─".repeat(80));
    console.log(
      `${"Version".padEnd(18)} ${"Description".padEnd(38)} ${"Status".padEnd(12)} Applied At`,
    );
    console.log("─".repeat(80));

    for (const migration of this.migrations) {
      const record = appliedMap.get(migration.version);
      const status = record ? "✓ Applied" : "◯ Pending";
      const appliedAt = record
        ? record.appliedAt.toISOString().replace("T", " ").slice(0, 19)
        : "—";

      console.log(
        `${migration.version.padEnd(18)} ${migration.description.slice(0, 36).padEnd(38)} ${status.padEnd(12)} ${appliedAt}`,
      );
    }

    const pendingCount = this.migrations.length - applied.length;
    console.log("─".repeat(80));
    console.log(
      `Total: ${this.migrations.length} | Applied: ${applied.length} | Pending: ${pendingCount}\n`,
    );
  }
}
