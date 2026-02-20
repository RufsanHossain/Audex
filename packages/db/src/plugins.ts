// ─── @audex/db — Global Mongoose Plugins ────────────────────────────────────
// Registers global toJSON and toObject transforms that:
//   1. Remap _id → id (string)
//   2. Remove __v
//   3. Remove any field with select: false from toJSON output

import mongoose from "mongoose";

function toJSONTransform(_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> {
  // Remap _id to id as a string
  if (ret["_id"]) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    ret["id"] = String(ret["_id"]);
    delete ret["_id"];
  }

  // Remove version key
  delete ret["__v"];

  return ret;
}

// Register globally — applies to every schema created after this call
mongoose.plugin((schema: mongoose.Schema) => {
  schema.set("toJSON", {
    virtuals: true,
    transform: toJSONTransform,
  });

  schema.set("toObject", {
    virtuals: true,
    transform: toJSONTransform,
  });
});

export { toJSONTransform };
