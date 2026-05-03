import { PlanTier, UserRole } from "@audex/types";

/**
 * Map a user's role to their effective plan tier.
 * Admin gets enterprise-level limits.
 *
 * Note: this is a temporary mapping until plan tier is attached to the JWT.
 * The User document has `plan.tier` which is the source of truth — this is
 * a fallback derived from role membership.
 */
export function roleToPlanTier(role: UserRole): PlanTier {
  switch (role) {
    case UserRole.Admin:
    case UserRole.Enterprise:
      return PlanTier.Enterprise;
    case UserRole.Team:
      return PlanTier.Team;
    case UserRole.Pro:
      return PlanTier.Pro;
    case UserRole.Free:
    default:
      return PlanTier.Free;
  }
}

const PLAN_ORDER: Record<PlanTier, number> = {
  [PlanTier.Free]: 0,
  [PlanTier.Pro]: 1,
  [PlanTier.Team]: 2,
  [PlanTier.Enterprise]: 3,
};

/** True if `actual` is at least the `minimum` plan tier. */
export function isMinPlan(actual: PlanTier, minimum: PlanTier): boolean {
  return PLAN_ORDER[actual] >= PLAN_ORDER[minimum];
}
