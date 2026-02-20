import { migration as initialIndexes } from "./scripts/20260219_initial_indexes.js";

import type { Migration } from "./types.js";

/**
 * All migrations in chronological order.
 * Add new migrations here as they're created.
 */
export const migrations: Migration[] = [initialIndexes];

export { MigrationRunner } from "./runner.js";
export type { Migration, MigrationRecord, MigrationCommand } from "./types.js";
