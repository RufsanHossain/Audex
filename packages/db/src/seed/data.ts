import {
  UserRole,
  PlanTier,
  AuditStatus,
  DeviceType,
  DimensionId,
  Grade,
  FindingSeverity,
  EngineStatus,
} from "@audex/types";
import { Types } from "mongoose";

// ─── Deterministic IDs for cross-referencing ────────────────────────────────

export const USER_IDS = {
  admin: new Types.ObjectId("a00000000000000000000001"),
  proUser: new Types.ObjectId("a00000000000000000000002"),
  freeUser: new Types.ObjectId("a00000000000000000000003"),
  teamOwner: new Types.ObjectId("a00000000000000000000004"),
  teamMember: new Types.ObjectId("a00000000000000000000005"),
} as const;

export const PROJECT_IDS = {
  mainSite: new Types.ObjectId("b00000000000000000000001"),
  blog: new Types.ObjectId("b00000000000000000000002"),
  dashboard: new Types.ObjectId("b00000000000000000000003"),
} as const;

export const REPORT_IDS = {
  report1: new Types.ObjectId("c00000000000000000000001"),
  report2: new Types.ObjectId("c00000000000000000000002"),
  report3: new Types.ObjectId("c00000000000000000000003"),
  report4: new Types.ObjectId("c00000000000000000000004"),
  report5: new Types.ObjectId("c00000000000000000000005"),
} as const;

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = [
  {
    _id: USER_IDS.admin,
    name: "Audex Admin",
    email: "admin@audex.dev",
    emailVerified: new Date("2025-01-01"),
    role: UserRole.Admin,
    plan: {
      tier: PlanTier.Enterprise,
      stripeCustomerId: "cus_seed_admin",
      currentPeriodEnd: new Date("2027-01-01"),
    },
    auditCount: 150,
    auditLimit: -1, // unlimited
    isActive: true,
    settings: {
      defaultDevice: DeviceType.Desktop,
      notifications: { email: true, inApp: true },
    },
  },
  {
    _id: USER_IDS.proUser,
    name: "Pro User",
    email: "pro@audex.dev",
    emailVerified: new Date("2025-02-01"),
    role: UserRole.Pro,
    plan: {
      tier: PlanTier.Pro,
      stripeCustomerId: "cus_seed_pro",
      stripeSubscriptionId: "sub_seed_pro",
      currentPeriodEnd: new Date("2026-03-01"),
    },
    auditCount: 42,
    auditLimit: 100,
    isActive: true,
    settings: {
      defaultDevice: DeviceType.Mobile,
      notifications: { email: true, inApp: true },
    },
  },
  {
    _id: USER_IDS.freeUser,
    name: "Free User",
    email: "free@audex.dev",
    emailVerified: new Date("2025-03-01"),
    role: UserRole.Free,
    plan: { tier: PlanTier.Free },
    auditCount: 3,
    auditLimit: 5,
    isActive: true,
    settings: {
      defaultDevice: DeviceType.Desktop,
      notifications: { email: false, inApp: true },
    },
  },
  {
    _id: USER_IDS.teamOwner,
    name: "Team Owner",
    email: "team-owner@audex.dev",
    emailVerified: new Date("2025-01-15"),
    role: UserRole.Team,
    plan: {
      tier: PlanTier.Team,
      stripeCustomerId: "cus_seed_team",
      stripeSubscriptionId: "sub_seed_team",
      currentPeriodEnd: new Date("2026-03-15"),
    },
    auditCount: 85,
    auditLimit: 500,
    isActive: true,
    settings: {
      defaultDevice: DeviceType.Desktop,
      notifications: { email: true, inApp: true },
    },
  },
  {
    _id: USER_IDS.teamMember,
    name: "Team Member",
    email: "team-member@audex.dev",
    emailVerified: new Date("2025-02-10"),
    role: UserRole.Team,
    plan: { tier: PlanTier.Team },
    auditCount: 20,
    auditLimit: 500,
    isActive: true,
    settings: {
      defaultDevice: DeviceType.Mobile,
      notifications: { email: true, inApp: false },
    },
  },
];

// ─── Projects ───────────────────────────────────────────────────────────────

export const projects = [
  {
    _id: PROJECT_IDS.mainSite,
    userId: USER_IDS.proUser,
    name: "Acme Marketing Site",
    slug: "acme-marketing",
    url: "https://acme.example.com",
    description: "Main marketing website for Acme Corp",
    settings: {
      dimensions: Object.values(DimensionId),
      device: DeviceType.Desktop,
    },
    reportCount: 12,
    lastScore: 78,
  },
  {
    _id: PROJECT_IDS.blog,
    userId: USER_IDS.proUser,
    name: "Acme Blog",
    slug: "acme-blog",
    url: "https://blog.acme.example.com",
    description: "Engineering blog",
    settings: {
      dimensions: [
        DimensionId.Performance,
        DimensionId.SEO,
        DimensionId.Accessibility,
        DimensionId.Speed,
      ],
      device: DeviceType.Mobile,
    },
    reportCount: 5,
    lastScore: 85,
  },
  {
    _id: PROJECT_IDS.dashboard,
    userId: USER_IDS.teamOwner,
    name: "Internal Dashboard",
    slug: "internal-dashboard",
    url: "https://dashboard.internal.example.com",
    description: "Internal admin dashboard",
    settings: {
      dimensions: Object.values(DimensionId),
      device: DeviceType.Desktop,
    },
    reportCount: 3,
    lastScore: 62,
  },
];

// ─── Sample Dimension Result Generator ──────────────────────────────────────

function makeDimensionResult(dimension: DimensionId, score: number, findingCount: number) {
  const grade =
    score >= 90
      ? Grade.A
      : score >= 75
        ? Grade.B
        : score >= 50
          ? Grade.C
          : score >= 25
            ? Grade.D
            : Grade.F;

  const severities = [
    FindingSeverity.Info,
    FindingSeverity.Low,
    FindingSeverity.Medium,
    FindingSeverity.High,
    FindingSeverity.Critical,
  ];

  const findings = Array.from({ length: findingCount }, (_, i) => ({
    ruleId: `${dimension}-rule-${String(i + 1).padStart(3, "0")}`,
    severity: severities[i % severities.length],
    title: `${dimension} finding #${i + 1}`,
    description: `Seed finding for ${dimension} dimension — issue ${i + 1}`,
    recommendation: `Fix the ${dimension} issue by addressing the flagged element.`,
    impact: (i % 3) + 1,
  }));

  return {
    dimension,
    score,
    grade,
    findings,
    metrics: {},
    executionTime: 800 + Math.floor(Math.random() * 2000),
    status: EngineStatus.Complete,
  };
}

// ─── Reports ────────────────────────────────────────────────────────────────

const allDimensions = Object.values(DimensionId);

function buildDimensions(baseScore: number) {
  const results = new Map<string, ReturnType<typeof makeDimensionResult>>();
  for (const dim of allDimensions) {
    // Vary score ±15 around base
    const variance = Math.floor(Math.random() * 30) - 15;
    const score = Math.max(0, Math.min(100, baseScore + variance));
    const findingCount = Math.max(0, Math.floor((100 - score) / 10));
    results.set(dim, makeDimensionResult(dim, score, findingCount));
  }
  return results;
}

export const reports = [
  {
    _id: REPORT_IDS.report1,
    userId: USER_IDS.proUser,
    projectId: PROJECT_IDS.mainSite,
    inputType: "url" as const,
    inputValue: "https://acme.example.com",
    status: AuditStatus.Completed,
    device: DeviceType.Desktop,
    totalScore: 78,
    dimensions: buildDimensions(78),
    metadata: {
      url: "https://acme.example.com",
      statusCode: 200,
      redirectChain: [],
      responseTime: 1250,
      screenshotUrls: [],
    },
    completedAt: new Date("2026-02-18T10:30:00Z"),
    duration: 45000,
  },
  {
    _id: REPORT_IDS.report2,
    userId: USER_IDS.proUser,
    projectId: PROJECT_IDS.mainSite,
    inputType: "url" as const,
    inputValue: "https://acme.example.com",
    status: AuditStatus.Completed,
    device: DeviceType.Mobile,
    totalScore: 72,
    dimensions: buildDimensions(72),
    metadata: {
      url: "https://acme.example.com",
      statusCode: 200,
      redirectChain: [],
      responseTime: 1800,
      screenshotUrls: [],
    },
    completedAt: new Date("2026-02-17T14:00:00Z"),
    duration: 52000,
  },
  {
    _id: REPORT_IDS.report3,
    userId: USER_IDS.proUser,
    projectId: PROJECT_IDS.blog,
    inputType: "url" as const,
    inputValue: "https://blog.acme.example.com",
    status: AuditStatus.Completed,
    device: DeviceType.Mobile,
    totalScore: 85,
    dimensions: buildDimensions(85),
    metadata: {
      url: "https://blog.acme.example.com",
      statusCode: 200,
      redirectChain: [],
      responseTime: 950,
      screenshotUrls: [],
    },
    completedAt: new Date("2026-02-16T09:15:00Z"),
    duration: 38000,
  },
  {
    _id: REPORT_IDS.report4,
    userId: USER_IDS.freeUser,
    inputType: "url" as const,
    inputValue: "https://my-portfolio.example.com",
    status: AuditStatus.Completed,
    device: DeviceType.Desktop,
    totalScore: 55,
    dimensions: buildDimensions(55),
    metadata: {
      url: "https://my-portfolio.example.com",
      statusCode: 200,
      redirectChain: [],
      responseTime: 3200,
      screenshotUrls: [],
    },
    completedAt: new Date("2026-02-15T18:45:00Z"),
    duration: 60000,
  },
  {
    _id: REPORT_IDS.report5,
    userId: USER_IDS.teamOwner,
    projectId: PROJECT_IDS.dashboard,
    inputType: "url" as const,
    inputValue: "https://dashboard.internal.example.com",
    status: AuditStatus.Completed,
    device: DeviceType.Desktop,
    totalScore: 62,
    dimensions: buildDimensions(62),
    metadata: {
      url: "https://dashboard.internal.example.com",
      statusCode: 200,
      redirectChain: [],
      responseTime: 2100,
      screenshotUrls: [],
    },
    completedAt: new Date("2026-02-14T11:00:00Z"),
    duration: 48000,
  },
];

// ─── Subscriptions ──────────────────────────────────────────────────────────

export const subscriptions = [
  {
    userId: USER_IDS.proUser,
    stripeCustomerId: "cus_seed_pro",
    stripeSubscriptionId: "sub_seed_pro",
    stripePriceId: "price_pro_monthly",
    status: "active" as const,
    currentPeriodStart: new Date("2026-02-01"),
    currentPeriodEnd: new Date("2026-03-01"),
    cancelAtPeriodEnd: false,
    auditUsage: { used: 42, limit: 100, resetDate: new Date("2026-03-01") },
  },
  {
    userId: USER_IDS.teamOwner,
    stripeCustomerId: "cus_seed_team",
    stripeSubscriptionId: "sub_seed_team",
    stripePriceId: "price_team_monthly",
    status: "active" as const,
    currentPeriodStart: new Date("2026-02-15"),
    currentPeriodEnd: new Date("2026-03-15"),
    cancelAtPeriodEnd: false,
    auditUsage: { used: 85, limit: 500, resetDate: new Date("2026-03-15") },
  },
];
