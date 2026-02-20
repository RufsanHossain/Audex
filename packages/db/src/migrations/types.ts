import type { mongo } from "mongoose";

type Db = mongo.Db;

export interface Migration {
  version: string;
  description: string;
  up(db: Db): Promise<void>;
  down(db: Db): Promise<void>;
}

export interface MigrationRecord {
  version: string;
  description: string;
  appliedAt: Date;
  executionTimeMs: number;
}

export type MigrationCommand = "up" | "down" | "status" | "create";
