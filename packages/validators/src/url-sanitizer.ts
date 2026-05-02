// ─── @audex/validators — URL Sanitizer ──────────────────────────────────────
// Validates and sanitizes audit target URLs with SSRF protection.
// Two exports:
//   - auditUrlSchema       → synchronous Zod schema (format + blocklist)
//   - resolveAndValidateUrl → async function (DNS resolution + private IP check)

import { z } from "zod";

// ── Private IP Detection ────────────────────────────────────────────────────

const PRIVATE_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // Link-local
  /^0\./, // Current network
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./, // Carrier-grade NAT
  /^198\.1[89]\./, // Benchmarking
  /^::1$/, // IPv6 loopback
  /^fe80:/i, // IPv6 link-local
  /^fc00:/i, // IPv6 ULA
  /^fd/i, // IPv6 ULA
];

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some((range) => range.test(ip));
}

// ── Blocked Hostnames ───────────────────────────────────────────────────────

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::]",
  "[::1]",
  "169.254.169.254", // AWS EC2 metadata
  "metadata.google.internal", // GCP metadata
  "metadata.internal", // Generic cloud metadata
]);

// ── Blocked Ports (internal service ports) ──────────────────────────────────

const BLOCKED_PORTS = new Set([
  "6379", // Redis
  "27017", // MongoDB
  "5432", // PostgreSQL
  "3306", // MySQL
  "9200", // Elasticsearch
  "8500", // Consul
  "2379", // etcd
  "11211", // Memcached
]);

// ── Synchronous URL Schema ──────────────────────────────────────────────────

export const auditUrlSchema = z
  .string()
  .min(1, "URL is required")
  .max(2048, "URL must be 2048 characters or fewer")
  .url("Invalid URL format")
  .transform((url) => {
    const parsed = new URL(url);
    // Normalize: strip fragment, ensure consistent trailing slash handling
    parsed.hash = "";
    return parsed.toString();
  })
  .refine(
    (url) => {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    },
    { message: "Only HTTP and HTTPS protocols are allowed" },
  )
  .refine(
    (url) => {
      const parsed = new URL(url);
      return !BLOCKED_HOSTNAMES.has(parsed.hostname);
    },
    { message: "Private or internal URLs are not allowed" },
  )
  .refine(
    (url) => {
      const parsed = new URL(url);
      return !parsed.hostname.endsWith(".internal") && !parsed.hostname.endsWith(".local");
    },
    { message: "Internal network hostnames are not allowed" },
  )
  .refine(
    (url) => {
      const parsed = new URL(url);
      return !parsed.port || !BLOCKED_PORTS.has(parsed.port);
    },
    { message: "Port is not allowed for audit targets" },
  )
  .refine(
    (url) => {
      const parsed = new URL(url);
      // Block bare IPs that look private
      const ipv4Match = /^(\d{1,3}\.){3}\d{1,3}$/.exec(parsed.hostname);
      if (ipv4Match) {
        return !isPrivateIp(parsed.hostname);
      }
      return true;
    },
    { message: "Private IP addresses are not allowed" },
  );

/**
 * Generic SSRF-safe external URL schema.
 * Same rules as auditUrlSchema — exported under a generic name so non-audit
 * callers (webhooks, redirect URIs, etc.) read clearly at the call site.
 */
export const safeExternalUrlSchema = auditUrlSchema;

// ── Async DNS Resolution (call after Zod validation passes) ─────────────────

export interface UrlValidationResult {
  readonly url: string;
  readonly resolvedIps: readonly string[];
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * Resolves the hostname via DNS and checks for private IPs.
 * Prevents DNS rebinding attacks.
 * Call this AFTER the synchronous `auditUrlSchema` passes.
 */
export async function resolveAndValidateUrl(url: string): Promise<UrlValidationResult> {
  const { hostname } = new URL(url);

  // Dynamic import to keep the module usable in edge environments
  const dns = await import("node:dns/promises");

  try {
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
    const v6Addresses = await dns.resolve6(hostname).catch(() => [] as string[]);
    const allIps = [...addresses, ...v6Addresses];

    if (allIps.length === 0) {
      return { url, resolvedIps: [], isValid: false, reason: "Could not resolve hostname" };
    }

    const privateIp = allIps.find((ip) => isPrivateIp(ip));
    if (privateIp) {
      return {
        url,
        resolvedIps: allIps,
        isValid: false,
        reason: `Hostname resolves to private IP: ${privateIp}`,
      };
    }

    return { url, resolvedIps: allIps, isValid: true };
  } catch {
    return { url, resolvedIps: [], isValid: false, reason: "DNS resolution failed" };
  }
}
