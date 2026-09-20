import { describe, expect, it } from "vitest";
import { computeDedupeHash } from "./dedupe";

describe("computeDedupeHash", () => {
  it("produces consistent hash for same inputs", () => {
    const date = new Date("2025-01-15T12:00:00Z");
    const h1 = computeDedupeHash("acc1", -5000, date);
    const h2 = computeDedupeHash("acc1", -5000, date);
    expect(h1).toBe(h2);
  });

  it("produces different hash for different amounts", () => {
    const date = new Date("2025-01-15T12:00:00Z");
    const h1 = computeDedupeHash("acc1", -5000, date);
    const h2 = computeDedupeHash("acc1", -6000, date);
    expect(h1).not.toBe(h2);
  });

  it("produces different hash for different dates", () => {
    const h1 = computeDedupeHash(
      "acc1",
      -5000,
      new Date("2025-01-15T12:00:00Z"),
    );
    const h2 = computeDedupeHash(
      "acc1",
      -5000,
      new Date("2025-01-16T12:00:00Z"),
    );
    expect(h1).not.toBe(h2);
  });

  it("returns 8-char hex string", () => {
    const hash = computeDedupeHash("acc1", -5000, new Date("2025-01-15"));
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });
});
