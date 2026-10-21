import type { Card } from "./index";

/** Returns the cards captured by a Pasur/Four Barg play, including the played card. */
export function findFourBargCapture(card: Card, table: readonly Card[]): Card[] {
  if (card.rank === 11) {
    const nonJacks = table.filter((item) => item.rank !== 11);
    return nonJacks.length ? [...nonJacks, card] : [];
  }

  const sameRank = table.find((item) => item.rank === card.rank);
  if (sameRank) return [sameRank, card];

  const value = (item: Card) => item.rank === 14 ? 1 : item.rank >= 2 && item.rank <= 10 ? item.rank : 0;
  const target = 11 - value(card);
  if (target <= 0) return [];

  const find = (start: number, remaining: number): Card[] | null => {
    if (remaining === 0) return [];
    for (let i = start; i < table.length; i++) {
      const itemValue = value(table[i]);
      if (itemValue <= 0 || itemValue > remaining) continue;
      const rest = find(i + 1, remaining - itemValue);
      if (rest) return [table[i], ...rest];
    }
    return null;
  };

  const combo = find(0, target);
  return combo ? [...combo, card] : [];
}

/** Basic Pasur scoring: most cards (3), 2♣ (2), 10♦ (3), each ace and jack (1). */
export function scoreFourBargCards(cards: readonly Card[], opponentCards: readonly Card[] = []): number {
  return (cards.length > opponentCards.length ? 3 : 0)
    + cards.filter((card) => card.rank === 14 || card.rank === 11).length
    + cards.filter((card) => card.suit === "diamonds" && card.rank === 10).length * 3
    + cards.filter((card) => card.suit === "clubs" && card.rank === 2).length * 2;
}
