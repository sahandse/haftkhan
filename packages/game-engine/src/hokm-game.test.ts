import { describe, expect, it } from "vitest";
import { createHokmGame, playHokmCard } from "./hokm-game";

describe("Hokm game state", () => {
  it("deals thirteen unique cards to each of four players", () => {
    const game = createHokmGame({ trump: "spades", random: () => 0.5 });
    expect(game.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(new Set(game.hands.flat().map((card) => card.id)).size).toBe(52);
  });

  it("rejects an invalid starting player", () => {
    expect(() => createHokmGame({ trump: "spades", firstPlayer: 4 })).toThrow("firstPlayer must be between 0 and 3");
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

  it("awards exactly one trick after four legal plays", () => {
    let game = createHokmGame({ trump: "spades", random: () => 0.5 });
    for (let turn = 0; turn < 4; turn++) {
      const player = game.currentPlayer;
      const hand = game.hands[player];
      const leadSuit = game.trick[0]?.card.suit;
      const legal = leadSuit && hand.some((card) => card.suit === leadSuit)
        ? hand.find((card) => card.suit === leadSuit)!
        : hand[0];
      game = playHokmCard(game, player, legal.id);
    }
    expect(game.teamTricks[0] + game.teamTricks[1]).toBe(1);
    expect(game.trick).toHaveLength(0);
    expect(game.lastTrickWinner).not.toBeNull();
  });
});
