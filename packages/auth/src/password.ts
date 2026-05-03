import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

/** Hash a plaintext password with bcrypt (cost factor 12). */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Verify a plaintext password against a stored bcrypt hash. */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
