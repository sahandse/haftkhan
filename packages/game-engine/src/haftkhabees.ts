import type { Card } from "./index";

export interface HaftKhabeesRules {
  allowSevenStacking: boolean;
  allowEightSkip: boolean;
  allowElevenSuitChange: boolean;
  allowAceReverse: boolean;
}
export const DEFAULT_HAFTKHABEES_RULES: HaftKhabeesRules = {
  allowSevenStacking: true,
  allowEightSkip: true,
  allowElevenSuitChange: true,
  allowAceReverse: true
};

export function isLegalHaftKhabeesMove(
  card: Card,
  topCard: Card,
  chosenSuit?: Card["suit"]
): boolean {
  if (card.rank === 7 || card.rank === 8 || card.rank === 11 || card.rank === 14) return true;
  if (chosenSuit) return card.suit === chosenSuit;
  return card.suit === topCard.suit || card.rank === topCard.rank;
}
