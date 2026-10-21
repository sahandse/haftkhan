import { describe, expect, it } from "vitest";
import { isLegalHaftKhabeesMove } from "./haftkhabees";
import type { Card } from "./index";

const card = (suit: Card["suit"], rank: Card["rank"]): Card => ({ id: `${suit}-${rank}`, suit, rank });

describe("HaftKhabees move legality", () => {
  it("allows matching suit or rank", () => {
    expect(isLegalHaftKhabeesMove(card("hearts", 5), card("hearts", 9))).toBe(true);
    expect(isLegalHaftKhabeesMove(card("clubs", 9), card("hearts", 9))).toBe(true);
  });

  it("allows special cards", () => {
    expect(isLegalHaftKhabeesMove(card("clubs", 7), card("hearts", 9))).toBe(true);
    expect(isLegalHaftKhabeesMove(card("clubs", 11), card("hearts", 9))).toBe(true);
  });

  it("uses a declared suit when present", () => {
    expect(isLegalHaftKhabeesMove(card("clubs", 5), card("hearts", 9), "clubs")).toBe(true);
    expect(isLegalHaftKhabeesMove(card("diamonds", 5), card("hearts", 9), "clubs")).toBe(false);
  });
});