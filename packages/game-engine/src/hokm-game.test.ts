import { describe, expect, it } from "vitest";
import { createHokmGame, playHokmCard } from "./hokm-game";

describe("Hokm game state", () => {
  it("deals thirteen cards to each of four players", () => {
    const game = createHokmGame({ trump: "spades", random: () => 0.5 });
    expect(game.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
  });

  it("rejects an off-suit card when the player can follow suit", () => {
    const game = createHokmGame({ trump: "spades", random: () => 0.5 });
    const lead = game.hands[0][0];
    const afterLead = playHokmCard(game, 0, lead.id);
    const nextHand = afterLead.hands[1];
    const offSuit = nextHand.find((card) => card.suit !== lead.suit);
    const matching = nextHand.find((card) => card.suit === lead.suit);
    if (offSuit && matching) {
      expect(() => playHokmCard(afterLead, 1, offSuit.id)).toThrow("must follow suit");
    } else {
      expect(afterLead.trick).toHaveLength(1);
    }
  });

  it("rejects playing out of turn", () => {
    const game = createHokmGame({ trump: "spades" });
    expect(() => playHokmCard(game, 1, game.hands[1][0].id)).toThrow("not this player's turn");
  });
});