import type { Card } from "./index";

export interface HaftKhabeesRules {
  allowSevenStacking: boolean;
  allowEightSkip: boolean;
  allowElevenSuitChange: boolean;
  allowAceReverse: boolean;
}

export const DEFAULT_HAFTKHABEES_RULES: Readonly<HaftKhabeesRules> = {
  allowSevenStacking: true,
  allowEightSkip: true,
  allowElevenSuitChange: true,
  allowAceReverse: true
};

const SPECIAL_RULE_FOR_RANK: Partial<Record<Card["rank"], keyof HaftKhabeesRules>> = {
  7: "allowSevenStacking",
  8: "allowEightSkip",
  11: "allowElevenSuitChange",
  14: "allowAceReverse"
};

/** Checks a move against the active suit and top rank. chosenSuit is the suit declared by a previous jack, if any. */
export function isLegalHaftKhabeesMove(
  card: Card,
  topCard: Card,
  chosenSuit?: Card["suit"],
  rules: Readonly<HaftKhabeesRules> = DEFAULT_HAFTKHABEES_RULES
): boolean {
  const specialRule = SPECIAL_RULE_FOR_RANK[card.rank];
  if (specialRule && rules[specialRule]) return true;

  const activeSuit = chosenSuit ?? topCard.suit;
  return card.suit === activeSuit || card.rank === topCard.rank;
}

/** Return a fresh rule set so changing a setting never mutates shared defaults. */
export function createHaftKhabeesRules(
  overrides: Partial<HaftKhabeesRules> = {}
): HaftKhabeesRules {
  return { ...DEFAULT_HAFTKHABEES_RULES, ...overrides };
}
