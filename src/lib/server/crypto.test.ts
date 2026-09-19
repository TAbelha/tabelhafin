import { describe, expect, it } from "vitest";
import { encryptSecret, decryptSecret } from "./crypto";

describe("crypto envelope encryption", () => {
  const masterKey = "test-master-key-for-unit-tests-32b!";
  const context = { purpose: "test", userId: "user-123" };

  it("encrypts and decrypts roundtrip", async () => {
    const plaintext = "my-super-secret-token";
    const encrypted = await encryptSecret(masterKey, plaintext, context);
    const decrypted = await decryptSecret(masterKey, encrypted, context);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext each time (random IV)", async () => {
    const e1 = await encryptSecret(masterKey, "same", context);
    const e2 = await encryptSecret(masterKey, "same", context);
    expect(e1.ciphertext).not.toBe(e2.ciphertext);
    expect(e1.nonce).not.toBe(e2.nonce);
  });

  it("decrypt fails with wrong master key", async () => {
    const encrypted = await encryptSecret(masterKey, "secret", context);
    await expect(
      decryptSecret("wrong-key", encrypted, context),
    ).rejects.toThrow();
  });

  it("decrypt fails with wrong context", async () => {
    const encrypted = await encryptSecret(masterKey, "secret", context);
    const wrongCtx = { purpose: "other", userId: "user-456" };
    await expect(
      decryptSecret(masterKey, encrypted, wrongCtx),
    ).rejects.toThrow();
  });
});
