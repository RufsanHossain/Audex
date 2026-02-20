// ─── @audex/validators ──────────────────────────────────────────────────────
// Zod schemas for all API request/response bodies, shared validation logic,
// and standardized error handling.
//
// Depends on: @audex/types (dev), zod (runtime)
// Consumed by: apps/web, workers/analysis

// ── Enum Schemas ────────────────────────────────────────────────────────────
export {
  apiScopeSchema,
  auditInputTypeSchema,
  auditSourceSchema,
  auditStatusSchema,
  authProviderSchema,
  deviceTypeSchema,
  dimensionIdSchema,
  engineStatusSchema,
  errorCodeSchema,
  exportFormatSchema,
  findingSeveritySchema,
  gradeSchema,
  impactMultiplierSchema,
  notificationChannelSchema,
  planTierSchema,
  subscriptionStatusSchema,
  userRoleSchema,
  webhookEventSchema,
} from "./enums.js";

// ── Common Schemas ──────────────────────────────────────────────────────────
export {
  apiErrorResponseSchema,
  apiSuccessSchema,
  baseDocumentSchema,
  cursorPaginationSchema,
  emailSchema,
  isoDateSchema,
  objectIdSchema,
  paginationMetaSchema,
  paginationSchema,
  safeStringSchema,
  slugSchema,
  sortOrderSchema,
  timestampsSchema,
} from "./common.js";

// ── URL Sanitizer ───────────────────────────────────────────────────────────
export { auditUrlSchema, isPrivateIp, resolveAndValidateUrl } from "./url-sanitizer.js";
export type { UrlValidationResult } from "./url-sanitizer.js";

// ── File Path Validator ─────────────────────────────────────────────────────
export {
  codeFilePathSchema,
  codeFileSchema,
  codeUploadSchema,
  filePathSchema,
} from "./file-path.js";

// ── Audit Schemas ───────────────────────────────────────────────────────────
export {
  cancelAuditSchema,
  compareAuditsSchema,
  createAuditSchema,
  createCodeAuditSchema,
  createUrlAuditSchema,
  exportReportSchema,
  getAuditParamsSchema,
  listAuditsSchema,
  retryAuditSchema,
} from "./audit.js";
export type {
  CancelAuditInput,
  CompareAuditsInput,
  CreateAuditInput,
  CreateCodeAuditInput,
  CreateUrlAuditInput,
  ExportReportInput,
  GetAuditParams,
  ListAuditsInput,
  RetryAuditInput,
} from "./audit.js";

// ── Project Schemas ─────────────────────────────────────────────────────────
export {
  createProjectSchema,
  listProjectsSchema,
  projectParamsSchema,
  updateProjectSchema,
} from "./project.js";
export type {
  CreateProjectInput,
  ListProjectsInput,
  ProjectParams,
  UpdateProjectInput,
} from "./project.js";

// ── User Schemas ────────────────────────────────────────────────────────────
export {
  adminListUsersSchema,
  adminUpdateUserRoleSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "./user.js";
export type {
  AdminListUsersInput,
  AdminUpdateUserRoleInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
  UpdateProfileInput,
  UpdateSettingsInput,
} from "./user.js";

// ── API Key Schemas ─────────────────────────────────────────────────────────
export {
  createApiKeySchema,
  listApiKeysSchema,
  revokeApiKeySchema,
  updateApiKeySchema,
} from "./api-key.js";
export type {
  CreateApiKeyInput,
  ListApiKeysInput,
  RevokeApiKeyInput,
  UpdateApiKeyInput,
} from "./api-key.js";

// ── Webhook Schemas ─────────────────────────────────────────────────────────
export {
  createWebhookSchema,
  deleteWebhookSchema,
  listWebhooksSchema,
  testWebhookSchema,
  updateWebhookSchema,
} from "./webhook.js";
export type {
  CreateWebhookInput,
  DeleteWebhookInput,
  ListWebhooksInput,
  TestWebhookInput,
  UpdateWebhookInput,
} from "./webhook.js";

// ── ApiError Class ──────────────────────────────────────────────────────────
export { ApiError, ERROR_CODES } from "./api-error.js";
export type { ErrorCode } from "./api-error.js";
