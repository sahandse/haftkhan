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

/** A lightweight deterministic bot: protects a winning partner and spends only enough strength to beat opponents. */
export function chooseStrategicBotCard(
  hand: readonly Card[],
  trump: Suit,
  trick: readonly PlayedCard[],
  player: number
): Card {
  if (!hand.length) throw new Error("bot hand cannot be empty");
  const leadSuit = trick[0]?.card.suit;
  const legal = leadSuit && hand.some(card => card.suit === leadSuit)
    ? hand.filter(card => card.suit === leadSuit)
    : [...hand];
  const byCost = (a: Card, b: Card) => {
    const scoreA = a.suit === trump ? 200 + a.rank : leadSuit && a.suit === leadSuit ? 100 + a.rank : a.rank;
    const scoreB = b.suit === trump ? 200 + b.rank : leadSuit && b.suit === leadSuit ? 100 + b.rank : b.rank;
    return scoreA - scoreB;
  };
  if (!trick.length) {
    const counts = new Map<Suit, number>();
    for (const card of hand) counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
    const preferred = [...counts.keys()].sort((a,b) => {
      const aTrump = a === trump ? 1 : 0;
      const bTrump = b === trump ? 1 : 0;
      return aTrump - bTrump || (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    })[0];
    const preferredCards = hand.filter(card => card.suit === preferred);
    return preferredCards.sort((a,b) => a.rank - b.rank)[0];
  }
  const winning = trick.reduce((best, play) => strength(play.card, leadSuit!, trump) > strength(best.card, leadSuit!, trump) ? play : best);
  if (winning.player % 2 === player % 2) return [...legal].sort(byCost)[0];
  const winningScore = strength(winning.card, leadSuit!, trump);
  const winners = legal.filter(card => strength(card, leadSuit!, trump) > winningScore);
  return (winners.length ? winners : legal).sort(byCost)[0];
}
