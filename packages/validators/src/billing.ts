// ─── @audex/validators — Billing Schemas ────────────────────────────────────

import { z } from "zod";

// ── Checkout ────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  plan: z.enum(["pro", "team", "enterprise"]),
  interval: z.enum(["monthly", "annual"]).default("monthly"),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CheckoutInput = z.infer<typeof checkoutSchema>;
