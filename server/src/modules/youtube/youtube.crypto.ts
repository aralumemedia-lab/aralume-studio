import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { EncryptedToken } from "./youtube.types.js";

export function hashState(state: string, secret: string): string {
  return createHmac("sha256", secret).update(state).digest("hex");
}

export function createState(secret: string): { state: string; hash: string } {
  const state = randomBytes(32).toString("base64url");
  return { state, hash: hashState(state, secret) };
}

export function verifyState(state: string, expectedHash: string, secret: string): boolean {
  const actual = Buffer.from(hashState(state, secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function key(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(value: string, secret: string): EncryptedToken {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

export function decryptToken(value: EncryptedToken, secret: string): string {
  const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(value.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
