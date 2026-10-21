import React from "react";
import { createHaftKhabeesGame, drawHaftKhabeesCards, isLegalHaftKhabeesGameMove, playHaftKhabeesCard, RANK_LABELS, SUIT_LABELS, type Card, type Suit, type HaftKhabeesGame } from "@haftkhan/game-engine";

const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const glyph: Record<Suit,string> = {spades:"♠",hearts:"♥",diamonds:"♦",clubs:"♣"};
const ink: Record<Suit,string> = {spades:"#173b34",hearts:"#b64e50",diamonds:"#b64e50",clubs:"#173b34"};
function chosen(hand: readonly Card[]): Suit {
  return [...suits].sort((a,b)=>hand.filter(c=>c.suit===b).length-hand.filter(c=>c.suit===a).length)[0];
}
function playBots(initial: HaftKhabeesGame): HaftKhabeesGame {
  let game=initial, guard=0;
  while(!game.finished && game.currentPlayer!==0 && guard<100) {
    const p=game.currentPlayer, hand=game.hands[p];
    const legal=hand.filter(c=>isLegalHaftKhabeesGameMove(game,p,c.id,c.rank===11?chosen(hand):undefined));
    if(!legal.length) game=drawHaftKhabeesCards(game,p);
    else { const card=legal[Math.floor(Math.random()*legal.length)]; game=playHaftKhabeesCard(game,p,card.id,card.rank===11?chosen(hand):undefined); }
    guard++;
  }
  return game;
}
export default function HaftKhabeesBoard({ onComplete }: { onComplete?: (result: string) => void }) {
  const [game,setGame]=React.useState<HaftKhabeesGame>(()=>createHaftKhabeesGame({firstPlayer:0}));
  const [suit,setSuit]=React.useState<Suit>("spades");
  const [message,setMessage]=React.useState("بازی آماده است؛ کارت مجاز را انتخاب کن.");
  const reportedFinish = React.useRef(false);
  React.useEffect(() => { if (game.finished && !reportedFinish.current) { reportedFinish.current = true; onComplete?.(game.winnerPlayer === 0 ? "برد" : "باخت"); } }, [game.finished, game.winnerPlayer, onComplete]);
  const newGame=()=>{setGame(playBots(createHaftKhabeesGame({firstPlayer:0})));setMessage("بازی جدید شروع شد.");};
  const play=(card:Card)=>{
    if(game.finished||game.currentPlayer!==0)return;
    try{
      const next=playBots(playHaftKhabeesCard(game,0,card.id,card.rank===11?suit:undefined));
      setGame(next);
      setMessage(next.finished?(next.winnerPlayer===0?"تبریک، برنده شدی!":"ربات‌ها این دور را بردند."):"حرکت ثبت شد.");
    }catch(e){setMessage(e instanceof Error?e.message:"حرکت مجاز نیست.");}
  };
  const draw=()=>{
    if(game.finished||game.currentPlayer!==0)return;
    const next=playBots(drawHaftKhabeesCards(game,0));
    setGame(next);
    setMessage(game.pendingDraw>0?"کارت‌های جریمه گرفته شد.":"یک کارت کشیدی.");
  };
  const top=game.discardPile[game.discardPile.length-1];
  return <section className="play-table" aria-label="میز هفت‌خبیث">
    <div className="table-heading"><div><span className="eyebrow">بازی آفلاین</span><h2>میز هفت‌خبیث</h2></div><button className="restart" onClick={newGame}>بازی جدید</button></div>
    <div className="table-status"><span>خال فعال: <b style={{color:ink[game.activeSuit]}}>{glyph[game.activeSuit]} {SUIT_LABELS[game.activeSuit]}</b></span><span>جریمه: {game.pendingDraw}</span><span>دسته کارت: {game.drawPile.length}</span></div>
    <div className="table-center"><div className="opponents">{game.hands.slice(1).map((hand,i)=><span key={i}>ربات {i+2}<small>{hand.length} کارت</small></span>)}</div><div className="trick-cards"><div className="mini-card"><small>کارت روی زمین</small><b style={{color:ink[top.suit]}}>{RANK_LABELS[top.rank]}{glyph[top.suit]}</b></div><span className="empty-trick">نوبت بازیکن {game.currentPlayer+1}</span></div></div>
    <p className="turn-message" role="status">{game.finished?"بازی تمام شد.":game.pendingDraw>0?"هفت بازی کن تا جریمه را جمع کنی، یا کارت بکش.":"یک کارت هم‌خال، هم‌رتبه یا ویژه انتخاب کن."} {message}</p>
    <div className="suit-picker"><span>خال انتخابی سرباز:</span>{suits.map(s=><button key={s} className={suit===s?"chosen-suit":""} onClick={()=>setSuit(s)}>{glyph[s]} {SUIT_LABELS[s]}</button>)}</div>
    <div className="player-hand">{game.hands[0].map(card=>{const legal=isLegalHaftKhabeesGameMove(game,0,card.id,card.rank===11?suit:undefined);return <button key={card.id} className="hand-card" disabled={!legal||game.finished||game.currentPlayer!==0} onClick={()=>play(card)} aria-label={RANK_LABELS[card.rank]+" "+SUIT_LABELS[card.suit]}><span style={{color:ink[card.suit]}}>{RANK_LABELS[card.rank]}</span><b style={{color:ink[card.suit]}}>{glyph[card.suit]}</b></button>;})}</div>
    <button className="restart draw-button" onClick={draw} disabled={game.finished||game.currentPlayer!==0}>کشیدن کارت {game.pendingDraw>0?"(جریمه "+game.pendingDraw+")":""}</button>
    <small className="game-note">هفت جریمه اضافه می‌کند، هشت نوبت بعدی را رد می‌کند، سرباز خال را عوض می‌کند و آس جهت را برمی‌گرداند.</small>
  </section>;
}
