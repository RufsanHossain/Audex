import mongoose from "mongoose";

import { users, projects, reports, subscriptions } from "./data.js";

export async function seed(): Promise<void> {
  const collections = ["users", "projects", "reports", "subscriptions"];

  // Clear existing seed data
  console.log("🗑  Clearing existing data...");
  for (const name of collections) {
    const collection = mongoose.connection.collection(name);
    await collection.deleteMany({});
    console.log(`   Cleared: ${name}`);
  }

  // Insert seed data
  console.log("\n🌱 Seeding data...");

  const userResult = await mongoose.connection.collection("users").insertMany(users);
  console.log(`   Users: ${userResult.insertedCount} inserted`);

  const projectResult = await mongoose.connection.collection("projects").insertMany(projects);
  console.log(`   Projects: ${projectResult.insertedCount} inserted`);

  // Convert Map to plain object for MongoDB insertion
  const reportsForDb = reports.map((r) => ({
    ...r,
    dimensions: Object.fromEntries(r.dimensions),
  }));
  const reportResult = await mongoose.connection.collection("reports").insertMany(reportsForDb);
  console.log(`   Reports: ${reportResult.insertedCount} inserted`);

  const subResult = await mongoose.connection.collection("subscriptions").insertMany(subscriptions);
  console.log(`   Subscriptions: ${subResult.insertedCount} inserted`);

  console.log("\n✓ Seed complete!");
  console.log(`  ${userResult.insertedCount} users (admin, pro, free, team-owner, team-member)`);
  console.log(`  ${projectResult.insertedCount} projects`);
  console.log(`  ${reportResult.insertedCount} reports with full dimension data`);
  console.log(`  ${subResult.insertedCount} subscriptions`);
}
