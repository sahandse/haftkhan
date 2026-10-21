import { describe, expect, it } from "vitest";
import { findFourBargCapture, scoreFourBargCards } from "./fourbarg";
import type { Card } from "./index";

const card = (suit: Card["suit"], rank: Card["rank"]): Card => ({ id: suit + "-" + rank, suit, rank });

describe("Four Barg rules", () => {
  it("captures a card of the same rank", () => {
    const played = card("hearts", 9);
    expect(findFourBargCapture(played, [card("clubs", 9), card("spades", 4)])).toEqual([card("clubs", 9), played]);
  });
  it("captures an eleven combination using an ace as one", () => {
    const played = card("hearts", 10);
    expect(findFourBargCapture(played, [card("clubs", 14), card("spades", 4)])).toEqual([card("clubs", 14), played]);
  });
  it("jack captures non-jacks but not a table of jacks alone", () => {
    expect(findFourBargCapture(card("hearts", 11), [card("clubs", 3), card("spades", 11)])).toHaveLength(2);
    expect(findFourBargCapture(card("hearts", 11), [card("spades", 11)])).toEqual([]);
  });
  it("scores the 2 of clubs, 10 of diamonds, aces, jacks and majority", () => {
    const hand = [card("clubs", 2), card("diamonds", 10), card("hearts", 14), card("spades", 11)];
    expect(scoreFourBargCards(hand, [])).toBe(10);
    expect(scoreFourBargCards(hand, hand)).toBe(7);
  });
});
