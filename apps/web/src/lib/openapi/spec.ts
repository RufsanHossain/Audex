import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import {
  adminDisableUserSchema,
  adminListUsersSchema,
  adminUpdateRoleBodySchema,
  cancelAuditSchema,
  changePasswordSchema,
  checkoutSchema,
  compareAuditsSchema,
  createApiKeySchema,
  createAuditSchema,
  createProjectSchema,
  createWebhookSchema,
  dlqJobActionSchema,
  exportReportSchema,
  listApiKeysSchema,
  listAuditsSchema,
  listDlqJobsSchema,
  listNotificationsSchema,
  listProjectsSchema,
  listWebhooksSchema,
  shareReportSchema,
  updateMeSchema,
  updateProjectSchema,
  updateWebhookSchema,
} from "@audex/validators";
import { z } from "zod";

// Augment Zod with `.openapi()` chainable metadata. Calling once at module
// load is sufficient for the lifetime of the process.
extendZodWithOpenApi(z);

// ─── Common Response Shapes ────────────────────────────────────────────────

const successEnvelope = (dataSchema: z.ZodType): z.ZodType =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

const paginationMeta = z
  .object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  })
  .openapi("PaginationMeta");

const paginatedEnvelope = (itemSchema: z.ZodType): z.ZodType =>
  successEnvelope(
    z.object({
      items: z.array(itemSchema),
      pagination: paginationMeta,
    }),
  );

const errorBody = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.array(z.string())).optional(),
    }),
  })
  .openapi("ErrorResponse");

// ─── Registry ──────────────────────────────────────────────────────────────

const registry = new OpenAPIRegistry();

// Reusable error schema
registry.register("ErrorResponse", errorBody);

// Security schemes
registry.registerComponent("securitySchemes", "sessionAuth", {
  type: "apiKey",
  in: "cookie",
  name: "next-auth.session-token",
  description: "NextAuth session cookie. Issued by /api/auth/signin.",
});
registry.registerComponent("securitySchemes", "apiKey", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "audex_sk_*",
  description:
    "API key issued via POST /api/v1/api-keys. Pass as `Authorization: Bearer audex_sk_…`. Team or higher plan required.",
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const RATE_LIMIT_HEADERS = {
  "X-RateLimit-Limit": {
    description: "Tier rate limit (requests per minute).",
    schema: { type: "integer" as const },
  },
  "X-RateLimit-Remaining": {
    description: "Remaining requests in the current window.",
    schema: { type: "integer" as const },
  },
  "X-RateLimit-Reset": {
    description: "Unix timestamp (seconds) when the window resets.",
    schema: { type: "integer" as const },
  },
  "X-Request-Id": {
    description: "Unique request identifier for log correlation.",
    schema: { type: "string" as const },
  },
};

const STANDARD_ERRORS = {
  400: { description: "Validation failed.", content: jsonContent(errorBody) },
  401: { description: "Authentication required.", content: jsonContent(errorBody) },
  403: { description: "Forbidden.", content: jsonContent(errorBody) },
  404: { description: "Not found.", content: jsonContent(errorBody) },
  409: { description: "Conflict.", content: jsonContent(errorBody) },
  429: {
    description: "Rate limit exceeded.",
    content: jsonContent(errorBody),
    headers: { "Retry-After": { schema: { type: "integer" as const } } },
  },
};

function jsonContent(schema: z.ZodType): Record<string, { schema: z.ZodType }> {
  return { "application/json": { schema } };
}

function ok(schema: z.ZodType, description = "Success") {
  return {
    description,
    content: jsonContent(successEnvelope(schema)),
    headers: RATE_LIMIT_HEADERS,
  };
}

function paginated(itemSchema: z.ZodType, description = "Paginated list") {
  return {
    description,
    content: jsonContent(paginatedEnvelope(itemSchema)),
    headers: RATE_LIMIT_HEADERS,
  };
}

function created(schema: z.ZodType, description = "Created") {
  return {
    description,
    content: jsonContent(successEnvelope(schema)),
    headers: RATE_LIMIT_HEADERS,
  };
}

function accepted(schema: z.ZodType, description = "Queued") {
  return {
    description,
    content: jsonContent(successEnvelope(schema)),
    headers: RATE_LIMIT_HEADERS,
  };
}

// Generic placeholders for response item shapes — most domain models are
// returned as untyped JSON for now to avoid churn. Step 48 adds contract
// tests that pin these down.
const anyObject = z.record(z.unknown());

// ─── Authenticated Routes ──────────────────────────────────────────────────

const securedSession: Record<string, string[]>[] = [{ sessionAuth: [] }, { apiKey: [] }];

// ── Audits ──────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/audits",
  tags: ["Audits"],
  summary: "Create an audit",
  security: securedSession,
  request: { body: { content: jsonContent(createAuditSchema) } },
  responses: { 202: accepted(anyObject, "Audit queued"), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/audits",
  tags: ["Audits"],
  summary: "List audits",
  security: securedSession,
  request: { query: listAuditsSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/audits/{id}",
  tags: ["Audits"],
  summary: "Get audit",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/audits/{id}/cancel",
  tags: ["Audits"],
  summary: "Cancel a queued or processing audit",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(cancelAuditSchema) },
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/audits/{id}/progress",
  tags: ["Audits"],
  summary: "Stream audit progress (Server-Sent Events)",
  description:
    "Emits SSE events as the audit moves through queued → processing → engine progress → complete. " +
    "Reconnect-friendly: late joiners get the current state replayed from the audit document.",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "text/event-stream of audit events.",
      content: { "text/event-stream": { schema: { type: "string" as const } } },
    },
    ...STANDARD_ERRORS,
  },
});

// ── Projects ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/projects",
  tags: ["Projects"],
  summary: "Create a project",
  security: securedSession,
  request: { body: { content: jsonContent(createProjectSchema) } },
  responses: { 201: created(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/projects",
  tags: ["Projects"],
  summary: "List projects",
  security: securedSession,
  request: { query: listProjectsSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/projects/{id}",
  tags: ["Projects"],
  summary: "Get project",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/projects/{id}",
  tags: ["Projects"],
  summary: "Update project",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(updateProjectSchema.omit({ id: true })) },
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/projects/{id}",
  tags: ["Projects"],
  summary: "Delete project (use ?force=true to orphan linked reports)",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ force: z.enum(["true", "false"]).optional() }),
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ── Users (self) ────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/users/me",
  tags: ["Users"],
  summary: "Get current user profile",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/users/me",
  tags: ["Users"],
  summary: "Update current user profile + settings",
  security: securedSession,
  request: { body: { content: jsonContent(updateMeSchema) } },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/users/me/password",
  tags: ["Users"],
  summary: "Change password (revokes all sessions)",
  security: securedSession,
  request: { body: { content: jsonContent(changePasswordSchema) } },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ── API Keys ────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/api-keys",
  tags: ["API Keys"],
  summary: "Create API key (raw key returned once)",
  security: securedSession,
  request: { body: { content: jsonContent(createApiKeySchema) } },
  responses: { 201: created(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/api-keys",
  tags: ["API Keys"],
  summary: "List API keys (masked)",
  security: securedSession,
  request: { query: listApiKeysSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/api-keys/{id}",
  tags: ["API Keys"],
  summary: "Revoke API key",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ── Webhooks (Team+) ────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/webhooks",
  tags: ["Webhooks"],
  summary: "Create webhook (Team+; secret returned once)",
  security: securedSession,
  request: { body: { content: jsonContent(createWebhookSchema) } },
  responses: { 201: created(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/webhooks",
  tags: ["Webhooks"],
  summary: "List webhooks (Team+)",
  security: securedSession,
  request: { query: listWebhooksSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/webhooks/{id}",
  tags: ["Webhooks"],
  summary: "Update webhook (Team+)",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(updateWebhookSchema.omit({ id: true })) },
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/webhooks/{id}",
  tags: ["Webhooks"],
  summary: "Delete webhook (Team+)",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/webhooks/{id}/test",
  tags: ["Webhooks"],
  summary: "Send a test payload (Team+)",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ── Notifications ───────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/notifications",
  tags: ["Notifications"],
  summary: "List notifications",
  security: securedSession,
  request: { query: listNotificationsSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/notifications/{id}/read",
  tags: ["Notifications"],
  summary: "Mark a notification as read",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/notifications/read-all",
  tags: ["Notifications"],
  summary: "Mark every unread notification as read",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/notifications/unread-count",
  tags: ["Notifications"],
  summary: "Unread notification count",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ── Reports ─────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/reports/{id}",
  tags: ["Reports"],
  summary: "Get full report",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/reports/{id}/export",
  tags: ["Reports"],
  summary: "Trigger report export (PDF/JSON/CSV/HTML)",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(exportReportSchema.omit({ id: true })) },
  },
  responses: { 202: accepted(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/reports/{id}/share",
  tags: ["Reports"],
  summary: "Enable or change sharing (Pro+)",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(shareReportSchema) },
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/reports/{id}/share",
  tags: ["Reports"],
  summary: "Revoke sharing (Pro+)",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/reports/compare",
  tags: ["Reports"],
  summary: "Compare two reports (Pro+)",
  security: securedSession,
  request: { body: { content: jsonContent(compareAuditsSchema) } },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/reports/shared/{slug}",
  tags: ["Reports"],
  summary: "Public shared report (no auth)",
  request: { params: z.object({ slug: z.string() }) },
  responses: {
    200: { description: "Public shared report.", content: jsonContent(successEnvelope(anyObject)) },
    404: STANDARD_ERRORS[404],
  },
});

// ── Billing ─────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/billing/subscription",
  tags: ["Billing"],
  summary: "Current subscription state + usage",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/billing/checkout",
  tags: ["Billing"],
  summary: "Create Stripe checkout session (mocked until step 212)",
  security: securedSession,
  request: { body: { content: jsonContent(checkoutSchema) } },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/billing/portal",
  tags: ["Billing"],
  summary: "Create Stripe billing portal session (mocked until step 214)",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ── Admin ───────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/users",
  tags: ["Admin"],
  summary: "List users",
  security: securedSession,
  request: { query: adminListUsersSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/users/{id}",
  tags: ["Admin"],
  summary: "User detail",
  security: securedSession,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/users/{id}/role",
  tags: ["Admin"],
  summary: "Change user role",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(adminUpdateRoleBodySchema) },
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/users/{id}/disable",
  tags: ["Admin"],
  summary: "Disable / re-enable a user",
  security: securedSession,
  request: {
    params: z.object({ id: z.string() }),
    body: { content: jsonContent(adminDisableUserSchema) },
  },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/system/stats",
  tags: ["Admin"],
  summary: "System-wide aggregate counts",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/system/health",
  tags: ["Admin"],
  summary: "Deep health check (db + redis + queues)",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/system/queues",
  tags: ["Admin"],
  summary: "Per-queue counters",
  security: securedSession,
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/dlq",
  tags: ["Admin"],
  summary: "List dead-letter jobs for one queue",
  security: securedSession,
  request: { query: listDlqJobsSchema },
  responses: { 200: paginated(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/dlq/requeue",
  tags: ["Admin"],
  summary: "Requeue a failed job",
  security: securedSession,
  request: { body: { content: jsonContent(dlqJobActionSchema) } },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/dlq/discard",
  tags: ["Admin"],
  summary: "Permanently discard a failed job",
  security: securedSession,
  request: { body: { content: jsonContent(dlqJobActionSchema) } },
  responses: { 200: ok(anyObject), ...STANDARD_ERRORS },
});

// ─── Public Doc ────────────────────────────────────────────────────────────

export function buildOpenApiDoc(appUrl: string): unknown {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Audex API",
      version: "0.1.0",
      description:
        "REST API for the Audex code-quality and web-analysis platform. " +
        "Authenticate with either a NextAuth session cookie (UI) or an API key bearer token (server-to-server).",
    },
    servers: [{ url: appUrl }],
    tags: [
      { name: "Audits" },
      { name: "Projects" },
      { name: "Users" },
      { name: "API Keys" },
      { name: "Webhooks" },
      { name: "Notifications" },
      { name: "Reports" },
      { name: "Billing" },
      { name: "Admin" },
    ],
  });
}
