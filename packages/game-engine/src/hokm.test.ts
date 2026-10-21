import { describe, expect, it } from "vitest";
import { chooseBotCard, chooseStrategicBotCard, resolveTrick } from "./hokm";
import type { Card } from "./index";

const card = (suit: Card["suit"], rank: Card["rank"], id: string): Card => ({ suit, rank, id });

describe("Hokm helpers", () => {
  it("lets trump beat a higher non-trump card", () => {
    const plays = [
      { player: 0, card: card("hearts", 14, "h-a") },
      { player: 1, card: card("hearts", 10, "h-10") },
      { player: 2, card: card("spades", 2, "s-2") },
      { player: 3, card: card("hearts", 13, "h-k") }
    ];
    expect(resolveTrick(plays, "spades").winner).toBe(2);
  });

  it("requires four cards to resolve a trick", () => {
    expect(() => resolveTrick([{ player: 0, card: card("hearts", 2, "h-2") }], "spades")).toThrow();
  });

  it("bot follows the lead suit when it has one", () => {
    const hand = [card("spades", 8, "s-8"), card("hearts", 4, "h-4")];
    expect(chooseBotCard(hand, "hearts").suit).toBe("hearts");
  });
  it("prefers a low card when partner is winning", () => {
    const trick = [{ player: 0, card: card("hearts", 10, "h10") }, { player: 1, card: card("hearts", 5, "h5") }];
    const hand = [card("hearts", 3, "h3"), card("hearts", 14, "ha")];
    expect(chooseStrategicBotCard(hand, "spades", trick, 2).id).toBe("h3");
  });
});