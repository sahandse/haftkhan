import { describe, expect, it } from "vitest";
import {
  createHaftKhabeesRules,
  DEFAULT_HAFTKHABEES_RULES,
  isLegalHaftKhabeesMove
} from "./haftkhabees";
import type { Card } from "./index";

const card = (suit: Card["suit"], rank: Card["rank"]): Card => ({ id: `${suit}-${rank}`, suit, rank });

describe("HaftKhabees move legality", () => {
  it("allows matching active suit or top rank", () => {
    expect(isLegalHaftKhabeesMove(card("hearts", 5), card("hearts", 9))).toBe(true);
    expect(isLegalHaftKhabeesMove(card("clubs", 9), card("hearts", 9))).toBe(true);
    expect(isLegalHaftKhabeesMove(card("clubs", 5), card("hearts", 9))).toBe(false);
  });

  it("allows enabled special cards", () => {
    for (const rank of [7, 8, 11, 14] as const) {
      expect(isLegalHaftKhabeesMove(card("clubs", rank), card("hearts", 9))).toBe(true);
    }
  });

  it("treats disabled special cards as ordinary cards", () => {
    const rules = createHaftKhabeesRules({
      allowSevenStacking: false,
      allowEightSkip: false,
      allowElevenSuitChange: false,
      allowAceReverse: false
    });
    expect(isLegalHaftKhabeesMove(card("clubs", 7), card("hearts", 9), undefined, rules)).toBe(false);
    expect(isLegalHaftKhabeesMove(card("hearts", 7), card("hearts", 9), undefined, rules)).toBe(true);
    expect(isLegalHaftKhabeesMove(card("clubs", 11), card("hearts", 9), undefined, rules)).toBe(false);
  });

  it("honours the suit chosen after a jack", () => {
    expect(isLegalHaftKhabeesMove(card("clubs", 5), card("hearts", 11), "clubs")).toBe(true);
    expect(isLegalHaftKhabeesMove(card("diamonds", 5), card("hearts", 11), "clubs")).toBe(false);
    expect(isLegalHaftKhabeesMove(card("diamonds", 11), card("hearts", 11), "clubs")).toBe(true);
  });

  it("creates independent default rule settings", () => {
    const rules = createHaftKhabeesRules({ allowEightSkip: false });
    expect(rules.allowEightSkip).toBe(false);
    expect(rules.allowSevenStacking).toBe(DEFAULT_HAFTKHABEES_RULES.allowSevenStacking);
    expect(createHaftKhabeesRules()).not.toBe(DEFAULT_HAFTKHABEES_RULES);
  });
});
