import { createDeck, dealCards, isLegalFollowSuit, shuffleDeck, type Card, type Suit } from "./index";
import { resolveTrick, type PlayedCard } from "./hokm";

export interface HokmGame {
  hands: Card[][];
  currentPlayer: number;
  trump: Suit;
  trick: PlayedCard[];
  teamTricks: [number, number];
  finished: boolean;
  lastTrickWinner: number | null;
}

export function createHokmGame(options: {
  trump: Suit;
  firstPlayer?: number;
  random?: () => number;
}): HokmGame {
  const firstPlayer = options.firstPlayer ?? 0;
  if (!Number.isInteger(firstPlayer) || firstPlayer < 0 || firstPlayer > 3) {
    throw new Error("firstPlayer must be between 0 and 3");
  }
  return {
    hands: dealCards(shuffleDeck(createDeck(), options.random), 4, 13),
    currentPlayer: firstPlayer,
    trump: options.trump,
    trick: [],
    teamTricks: [0, 0],
    finished: false,
    lastTrickWinner: null
  };
}

/** Seats 0+2 form one team; seats 1+3 form the other. */
export function playHokmCard(game: HokmGame, player: number, cardId: string): HokmGame {
  if (game.finished) throw new Error("game is already finished");
  if (player !== game.currentPlayer) throw new Error("it is not this player's turn");
  const hand = game.hands[player];
  const card = hand.find((item) => item.id === cardId);
  if (!card) throw new Error("card is not in this player's hand");
  const leadSuit = game.trick[0]?.card.suit;
  if (leadSuit && !isLegalFollowSuit(card, hand, leadSuit)) {
    throw new Error("player must follow suit when possible");
  }

  const hands = game.hands.map((items, index) =>
    index === player ? items.filter((item) => item.id !== cardId) : [...items]
  );
  const trick = [...game.trick, { player, card }];
  if (trick.length < 4) {
    return {
      ...game, hands, trick,
      currentPlayer: (player + 1) % 4,
      lastTrickWinner: null
    };
  }

  const result = resolveTrick(trick, game.trump);
  const team = result.winner % 2 === 0 ? 0 : 1;
  const teamTricks: [number, number] = [...game.teamTricks] as [number, number];
  teamTricks[team] += 1;
  const finished = hands.every((items) => items.length === 0);
  return {
    hands,
    currentPlayer: result.winner,
    trump: game.trump,
    trick: [],
    teamTricks,
    finished,
    lastTrickWinner: result.winner
  };
}
