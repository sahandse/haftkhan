import { describe, expect, it } from "vitest";
import { createHaftKhabeesGame, drawHaftKhabeesCards, playHaftKhabeesCard } from "./haftkhabees-game";

describe("HaftKhabees game state", () => {
  it("deals seven cards to four players and leaves one starting discard", () => {
    const game = createHaftKhabeesGame({ random: () => 0.5 });
    expect(game.hands.map(hand => hand.length)).toEqual([7, 7, 7, 7]);
    expect(game.drawPile).toHaveLength(23);
    expect(game.discardPile).toHaveLength(1);
    expect(new Set([...game.hands.flat(), ...game.drawPile, ...game.discardPile].map(card => card.id)).size).toBe(52);
  });

  it("rejects an out-of-turn move", () => {
    const game = createHaftKhabeesGame();
    expect(() => playHaftKhabeesCard(game, 1, game.hands[1][0].id)).toThrow(/turn/i);
  });

  it("draws a card and advances to the next player", () => {
    const game = createHaftKhabeesGame({ random: () => 0.5 });
    const next = drawHaftKhabeesCards(game, 0);
    expect(next.hands[0]).toHaveLength(8);
    expect(next.drawPile).toHaveLength(22);
    expect(next.currentPlayer).toBe(1);
  });

  it("requires choosing a suit for a jack when that rule is enabled", () => {
    const game = createHaftKhabeesGame({ random: () => 0.5 });
    const jack = game.hands[0].find(card => card.rank === 11);
    if (!jack) return;
    expect(() => playHaftKhabeesCard(game, 0, jack.id)).toThrow(/legal move/i);
    const next = playHaftKhabeesCard(game, 0, jack.id, "clubs");
    expect(next.activeSuit).toBe("clubs");
  });

  it("reverses direction when an ace is played legally", () => {
    const game = createHaftKhabeesGame({ random: () => 0.5 });
    const ace = game.hands[0].find(card => card.rank === 14);
    if (!ace) return;
    const forcedSuit = { ...game, activeSuit: ace.suit };
    const next = playHaftKhabeesCard(forcedSuit, 0, ace.id);
    expect(next.direction).toBe(-1);
    expect(next.currentPlayer).toBe(3);
  });

  it("adds two cards to a seven penalty and passes the turn", () => {
    const game = createHaftKhabeesGame();
    const seven = { id: "test-seven", suit: game.activeSuit, rank: 7 as const };
    const prepared = { ...game, hands: [[seven, ...game.hands[0]], ...game.hands.slice(1)] };
    const next = playHaftKhabeesCard(prepared, 0, seven.id);
    expect(next.pendingDraw).toBe(2);
    expect(next.currentPlayer).toBe(1);
  });

  it("skips the next player when an eight is played", () => {
    const game = createHaftKhabeesGame();
    const eight = { id: "test-eight", suit: game.activeSuit, rank: 8 as const };
    const prepared = { ...game, hands: [[eight, ...game.hands[0]], ...game.hands.slice(1)] };
    const next = playHaftKhabeesCard(prepared, 0, eight.id);
    expect(next.currentPlayer).toBe(2);
  });

  it("draws the full stacked penalty and clears it", () => {
    const game = createHaftKhabeesGame({ random: () => 0.5 });
    const penalized = { ...game, pendingDraw: 4 };
    const next = drawHaftKhabeesCards(penalized, 0);
    expect(next.hands[0]).toHaveLength(11);
    expect(next.pendingDraw).toBe(0);
    expect(next.currentPlayer).toBe(1);
    expect(next.drawPile).toHaveLength(19);
  });

  it("does not allow ordinary cards while a draw penalty is pending", () => {
    const game = createHaftKhabeesGame({ random: () => 0.5 });
    const ordinary = game.hands[0].find(card => ![7, 8, 11, 14].includes(card.rank));
    if (!ordinary) throw new Error("deterministic hand should contain an ordinary card");
    const penalized = { ...game, pendingDraw: 2 };
    expect(() => playHaftKhabeesCard(penalized, 0, ordinary.id)).toThrow(/penalty|draw cards/i);
  });

});