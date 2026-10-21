import { createDeck, dealCards, shuffleDeck, type Card, type Suit } from "./index";
import { createHaftKhabeesRules, isLegalHaftKhabeesMove, type HaftKhabeesRules } from "./haftkhabees";

export interface HaftKhabeesGame {
  hands: Card[][];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayer: number;
  direction: 1 | -1;
  activeSuit: Suit;
  rules: Readonly<HaftKhabeesRules>;
  pendingDraw: number;
  finished: boolean;
  winnerPlayer: number | null;
}

function nextPlayer(player: number, direction: 1 | -1, steps = 1): number {
  return ((player + direction * steps) % 4 + 4) % 4;
}

export function createHaftKhabeesGame(options: {
  firstPlayer?: number;
  random?: () => number;
  rules?: Partial<HaftKhabeesRules>;
} = {}): HaftKhabeesGame {
  const firstPlayer = options.firstPlayer ?? 0;
  if (!Number.isInteger(firstPlayer) || firstPlayer < 0 || firstPlayer > 3) {
    throw new Error("firstPlayer must be between 0 and 3");
  }
  const deck = shuffleDeck(createDeck(), options.random);
  const hands = dealCards(deck, 4, 7);
  const remaining = deck.slice(28);
  const firstDiscardIndex = remaining.findIndex((card) => ![7, 8, 11, 14].includes(card.rank));
  const firstDiscard = remaining.splice(firstDiscardIndex, 1)[0];
  return {
    hands, drawPile: remaining, discardPile: [firstDiscard],
    currentPlayer: firstPlayer, direction: 1, activeSuit: firstDiscard.suit,
    rules: createHaftKhabeesRules(options.rules), pendingDraw: 0,
    finished: false, winnerPlayer: null
  };
}

function refillDrawPile(game: HaftKhabeesGame): { drawPile: Card[]; discardPile: Card[] } {
  if (game.drawPile.length > 0) return { drawPile: [...game.drawPile], discardPile: [...game.discardPile] };
  if (game.discardPile.length <= 1) return { drawPile: [], discardPile: [...game.discardPile] };
  const top = game.discardPile[game.discardPile.length - 1];
  return {
    drawPile: shuffleDeck(game.discardPile.slice(0, -1)),
    discardPile: [top]
  };
}

export function isLegalHaftKhabeesGameMove(game: HaftKhabeesGame, player: number, cardId: string, chosenSuit?: Suit): boolean {
  if (game.finished || player !== game.currentPlayer) return false;
  const card = game.hands[player]?.find((item) => item.id === cardId);
  const top = game.discardPile[game.discardPile.length - 1];
  if (!card || !top) return false;
  if (game.pendingDraw > 0 && !(card.rank === 7 && game.rules.allowSevenStacking)) return false;
  if (card.rank === 11 && game.rules.allowElevenSuitChange && !chosenSuit) return false;
  return isLegalHaftKhabeesMove(card, top, game.activeSuit, game.rules);
}

/** Play a card; a jack must provide chosenSuit when suit-changing is enabled. */
export function playHaftKhabeesCard(
  game: HaftKhabeesGame,
  player: number,
  cardId: string,
  chosenSuit?: Suit
): HaftKhabeesGame {
  if (game.finished) throw new Error("game is already finished");
  if (player !== game.currentPlayer) throw new Error("it is not this player's turn");
  const card = game.hands[player].find((item) => item.id === cardId);
  if (!card) throw new Error("card is not in this player's hand");
  if (!isLegalHaftKhabeesGameMove(game, player, cardId, chosenSuit)) {
    throw new Error(game.pendingDraw > 0 ? "play a seven to stack the penalty or draw cards" : "card is not a legal move");
  }

  const hands = game.hands.map((hand, index) => index === player ? hand.filter((item) => item.id !== cardId) : [...hand]);
  const discardPile = [...game.discardPile, card];
  const finished = hands[player].length === 0;
  let direction = game.direction;
  let pendingDraw = game.pendingDraw;
  let activeSuit = card.suit;
  let currentPlayer: number;

  if (card.rank === 7 && game.rules.allowSevenStacking) pendingDraw += 2;
  if (card.rank === 11 && game.rules.allowElevenSuitChange) activeSuit = chosenSuit!;
  if (card.rank === 14 && game.rules.allowAceReverse) direction = direction === 1 ? -1 : 1;

  if (card.rank === 8 && game.rules.allowEightSkip) currentPlayer = nextPlayer(player, direction, 2);
  else currentPlayer = nextPlayer(player, direction);

  return { ...game, hands, discardPile, currentPlayer, direction, activeSuit, pendingDraw, finished, winnerPlayer: finished ? player : null };
}

/** Draw one card normally, or accept the pending penalty and lose the turn. */
export function drawHaftKhabeesCards(game: HaftKhabeesGame, player: number): HaftKhabeesGame {
  if (game.finished) throw new Error("game is already finished");
  if (player !== game.currentPlayer) throw new Error("it is not this player's turn");
  const amount = Math.max(1, game.pendingDraw);
  let drawPile = [...game.drawPile];
  let discardPile = [...game.discardPile];
  const hands = game.hands.map((hand) => [...hand]);
  for (let i = 0; i < amount; i++) {
    if (drawPile.length === 0) {
      const refilled = refillDrawPile({ ...game, drawPile, discardPile });
      drawPile = refilled.drawPile;
      discardPile = refilled.discardPile;
    }
    if (drawPile.length === 0) break;
    hands[player].push(drawPile.pop()!);
  }
  return {
    ...game, hands, drawPile, discardPile,
    currentPlayer: nextPlayer(player, game.direction),
    pendingDraw: 0
  };
}
