import { describe, expect, it } from "vitest";
import { createDeck, dealCards, isLegalFollowSuit, shuffleDeck, type Card } from "./index";

describe("shared card engine", () => {
  it("creates a standard 52-card deck with unique ids", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
  });

  it("deals cards round-robin without duplication", () => {
    const hands = dealCards(createDeck(), 4, 13);
    expect(hands).toHaveLength(4);
    expect(hands.every((hand) => hand.length === 13)).toBe(true);
    expect(new Set(hands.flat().map((card) => card.id)).size).toBe(52);
  });

  it("rejects dealing more cards than available", () => {
    expect(() => dealCards([1, 2, 3], 4, 1)).toThrow("not enough cards");
  });

  it("shuffles deterministically when a random source is injected", () => {
    const cards = [1, 2, 3, 4, 5];
    expect(shuffleDeck(cards, () => 0)).toEqual([2, 3, 4, 5, 1]);
  });

  it("enforces following suit when possible", () => {
    const hand: Card[] = [
      { id: "h-4", suit: "hearts", rank: 4 },
      { id: "s-9", suit: "spades", rank: 9 }
    ];
    expect(isLegalFollowSuit(hand[0], hand, "hearts")).toBe(true);
    expect(isLegalFollowSuit(hand[1], hand, "hearts")).toBe(false);
    expect(isLegalFollowSuit(hand[1], hand, "clubs")).toBe(true);
  });
});