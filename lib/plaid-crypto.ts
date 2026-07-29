import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getEncryptionKey() {
  const encodedKey = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) throw new Error("PLAID_TOKEN_ENCRYPTION_KEY is missing.");

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) throw new Error("PLAID_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export function encryptAccessToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptAccessToken({ ciphertext, iv, authTag }: { ciphertext: string; iv: string; authTag: string }) {
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}
