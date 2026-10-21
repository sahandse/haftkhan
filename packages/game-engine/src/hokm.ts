import type { Card, Suit } from "./index";

export interface PlayedCard { player: number; card: Card; }
export interface TrickResult { winner: number; winningCard: Card; }
const strength = (card: Card, leadSuit: Suit, trump: Suit) =>
  card.suit === trump ? 200 + card.rank : card.suit === leadSuit ? 100 + card.rank : card.rank;

export function resolveTrick(plays: readonly PlayedCard[], trump: Suit): TrickResult {
  if (plays.length !== 4) throw new Error("A Hokm trick must contain exactly four cards");
  const leadSuit = plays[0].card.suit;
  const winner = plays.reduce((best, play) =>
    strength(play.card, leadSuit, trump) > strength(best.card, leadSuit, trump) ? play : best
  );
  return { winner: winner.player, winningCard: winner.card };
}

/** Basic legal random bot. Strategic partner/trick evaluation will be layered on later. */
export function chooseBotCard(hand: readonly Card[], leadSuit?: Suit): Card {
  if (!hand.length) throw new Error("bot hand cannot be empty");
  const legal = leadSuit && hand.some((card) => card.suit === leadSuit)
    ? hand.filter((card) => card.suit === leadSuit)
    : [...hand];
  return legal[Math.floor(Math.random() * legal.length)];
}
