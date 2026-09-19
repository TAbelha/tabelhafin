import { describe, expect, it } from "vitest";
import { toReais, toCents, parseCents } from "./money";

describe("money", () => {
  it("toReais divides cents by 100", () => {
    expect(toReais(1500)).toBe(15);
    expect(toReais(0)).toBe(0);
    expect(toReais(-99)).toBe(-0.99);
  });

  it("toCents multiplies by 100 and rounds", () => {
    expect(toCents(15)).toBe(1500);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(0.999)).toBe(100);
  });

  it("parseCents handles pt-BR comma format", () => {
    expect(parseCents("1.500,50")).toBe(150050);
    expect(parseCents("99,90")).toBe(9990);
    expect(parseCents("0,01")).toBe(1);
  });

  it("parseCents handles dot format", () => {
    expect(parseCents("1500.50")).toBe(150050);
    expect(parseCents("99.90")).toBe(9990);
  });

  it("parseCents returns null for empty/invalid", () => {
    expect(parseCents("")).toBeNull();
    expect(parseCents(null)).toBeNull();
    expect(parseCents("abc")).toBeNull();
  });

  it("parseCents handles negative values", () => {
    expect(parseCents("-50,00")).toBe(-5000);
    expect(parseCents("-1.234,56")).toBe(-123456);
  });
});
