export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export const RANK_LABELS: Record<Rank, string> = {
  2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸",
  9: "۹", 10: "۱۰", 11: "سرباز", 12: "بی‌بی", 13: "شاه", 14: "آس"
};

export const SUIT_LABELS: Record<Suit, string> = {
  spades: "پیک", hearts: "دل", diamonds: "خشت", clubs: "گشنیز"
};

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, i) => {
      const rank = (i + 2) as Rank;
      return { id: `${suit}-${rank}`, suit, rank };
    })
  );
}

/** Fisher–Yates shuffle. Inject a random source for deterministic tests. */
export function shuffleDeck<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealCards<T>(items: readonly T[], players: number, cardsEach: number): T[][] {
  if (!Number.isInteger(players) || players < 1) throw new Error("players must be a positive integer");
  if (!Number.isInteger(cardsEach) || cardsEach < 0) throw new Error("cardsEach must be a non-negative integer");
  if (items.length < players * cardsEach) throw new Error("not enough cards to deal");
  const hands = Array.from({ length: players }, () => [] as T[]);
  for (let i = 0; i < players * cardsEach; i++) hands[i % players].push(items[i]);
  return hands;
}

export function isLegalFollowSuit(card: Card, hand: readonly Card[], leadSuit: Suit): boolean {
  return !hand.some((held) => held.suit === leadSuit) || card.suit === leadSuit;
}

export { createHokmGame, playHokmCard } from "./hokm-game";
export type { HokmGame } from "./hokm-game";
export { chooseBotCard, resolveTrick } from "./hokm";
export type { PlayedCard, TrickResult } from "./hokm";
export {
  createHaftKhabeesRules,
  DEFAULT_HAFTKHABEES_RULES,
  isLegalHaftKhabeesMove
} from "./haftkhabees";
export type { HaftKhabeesRules } from "./haftkhabees";
export {
  createHaftKhabeesGame,
  drawHaftKhabeesCards,
  isLegalHaftKhabeesGameMove,
  playHaftKhabeesCard
} from "./haftkhabees-game";
export type { HaftKhabeesGame } from "./haftkhabees-game";
