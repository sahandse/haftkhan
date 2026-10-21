import React from "react";
import { createRoot } from "react-dom/client";
import { Sparkles, Spade, Users, Palette, Trophy, Settings2, ChevronLeft, Bot, Layers3, RotateCcw } from "lucide-react";
import { RANK_LABELS, SUIT_LABELS, type Card, type Suit } from "@haftkhan/game-engine";
import { chooseBotCard } from "@haftkhan/game-engine/src/hokm";
import { createHokmGame, playHokmCard, type HokmGame } from "@haftkhan/game-engine/src/hokm-game";
import "./styles.css";

const suitGlyph: Record<Suit, string> = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const suitColor: Record<Suit, string> = { spades: "#173b34", hearts: "#b64e50", diamonds: "#b64e50", clubs: "#173b34" };

function runBots(initial: HokmGame): HokmGame {
  let game = initial;
  let guard = 0;
  while (!game.finished && game.currentPlayer !== 0 && guard < 52) {
    const hand = game.hands[game.currentPlayer];
    const leadSuit = game.trick[0]?.card.suit;
    const card = chooseBotCard(hand, leadSuit);
    game = playHokmCard(game, game.currentPlayer, card.id);
    guard += 1;
  }
  return game;
}

function App() {
  const [selected, setSelected] = React.useState("hokm");
  const [showThemes, setShowThemes] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [game, setGame] = React.useState<HokmGame | null>(null);
  const [turnMessage, setTurnMessage] = React.useState("");
  const start = () => {
    if (selected !== "hokm") {
      setNotice("هفت‌خبیث هنوز به میز قابل‌بازی متصل نشده است؛ فعلاً می‌توانی حکم را کامل بازی کنی.");
      return;
    }
    const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
    const next = createHokmGame({ trump: suits[Math.floor(Math.random() * suits.length)], firstPlayer: 0 });
    setGame(runBots(next));
    setNotice("");
    setTurnMessage("بازی شروع شد؛ کارت اول را انتخاب کن.");
  };
  const play = (card: Card) => {
    if (!game || game.finished || game.currentPlayer !== 0) return;
    try {
      let next = playHokmCard(game, 0, card.id);
      if (next.lastTrickWinner !== null) setTurnMessage(`این دست را بازیکن ${next.lastTrickWinner + 1} برد.`);
      else setTurnMessage("حرکت ثبت شد.");
      next = runBots(next);
      if (next.finished) setTurnMessage(`بازی تمام شد؛ نتیجه دست‌ها: تیم شما ${next.teamTricks[0]}، تیم رقیب ${next.teamTricks[1]}.`);
      else if (next.currentPlayer !== 0) setTurnMessage("ربات‌ها در حال بازی هستند...");
      setGame(next);
    } catch (error) {
      setTurnMessage(error instanceof Error ? error.message : "این حرکت مجاز نیست.");
    }
  };
  const legalCards = React.useMemo(() => {
    if (!game || game.currentPlayer !== 0 || !game.trick.length) return new Set(game?.hands[0]?.map(card => card.id) ?? []);
    const lead = game.trick[0].card.suit;
    const hasLead = game.hands[0].some(card => card.suit === lead);
    return new Set(game.hands[0].filter(card => !hasLead || card.suit === lead).map(card => card.id));
  }, [game]);
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="هفت‌خوان"><span className="brand-mark"><Spade size={23} fill="currentColor" /></span><span><b>هفت‌خوان</b><small>بازی، با ریشه‌های ایرانی</small></span></a>
      <button className="icon-button" onClick={() => setShowThemes(!showThemes)} aria-label="انتخاب تم"><Palette size={20}/></button>
    </header>
    {showThemes && <section className="theme-panel"><b>تم برنامه</b><span className="theme-chip active">شب فیروزه‌ای</span><span className="theme-chip">مس و زغال</span><span className="theme-chip">لاجوردی</span><small>تم‌های جایگزین هنوز به تنظیمات کامل متصل نشده‌اند.</small></section>}
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={14}/> دورهمی به سبک ایرانی</span><h1>یک دست بازی،<br/><em>هزار قصه.</em></h1><p>حکم چهارنفره با ربات‌های آفلاین، طراحی مینیمال و حال‌وهوای هنر ایرانی.</p><div className="hero-actions"><button className="primary" onClick={start}>شروع بازی <ChevronLeft size={18}/></button><span className="offline"><i/> بدون نیاز به حساب</span></div></div>
      <div className="hero-art" aria-label="نمایش گرافیکی کارت‌ها"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="playing-card card-back"><span className="card-ornament">✳</span><small>هفت‌خوان</small></div><div className="playing-card card-front"><span className="rank">A</span><span className="suit">♠</span><span className="card-bottom">A ♠</span></div><div className="floating-chip">۴ بازیکن <Users size={14}/></div></div>
    </section>
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>متوجه شدم</button></div>}
    {game && <section className="play-table" aria-label="میز بازی حکم">
      <div className="table-heading"><div><span className="eyebrow">بازی آفلاین</span><h2>میز حکم</h2></div><button className="restart" onClick={start}><RotateCcw size={15}/> بازی جدید</button></div>
      <div className="table-status"><span>خال حکم: <b style={{color:suitColor[game.trump]}}>{suitGlyph[game.trump]} {SUIT_LABELS[game.trump]}</b></span><span>تیم شما: {game.teamTricks[0]} دست</span><span>رقیب: {game.teamTricks[1]} دست</span></div>
      <div className="table-center"><div className="opponents"><span>ربات ۲ <small>{game.hands[1].length} کارت</small></span><span>ربات ۳ <small>{game.hands[2].length} کارت</small></span><span>ربات ۴ <small>{game.hands[3].length} کارت</small></span></div>
        <div className="trick-cards">{game.trick.length ? game.trick.map((play) => <div className="mini-card" key={play.player}><small>بازیکن {play.player + 1}</small><b style={{color:suitColor[play.card.suit]}}>{RANK_LABELS[play.card.rank]}{suitGlyph[play.card.suit]}</b></div>) : <span className="empty-trick">کارت‌های دست بعدی اینجا نمایش داده می‌شوند</span>}</div>
      </div>
      <p className="turn-message" role="status">{game.finished ? "این دور به پایان رسید." : game.currentPlayer === 0 ? "نوبت توست؛ یک کارت انتخاب کن." : "در انتظار حرکت ربات‌ها..."} {turnMessage}</p>
      <div className="player-hand">{game.hands[0].map((card) => <button key={card.id} className="hand-card" disabled={game.currentPlayer !== 0 || game.finished || !legalCards.has(card.id)} onClick={() => play(card)} aria-label={`${RANK_LABELS[card.rank]} ${SUIT_LABELS[card.suit]}`}><span style={{color:suitColor[card.suit]}}>{RANK_LABELS[card.rank]}</span><b style={{color:suitColor[card.suit]}}>{suitGlyph[card.suit]}</b></button>)}</div>
      <small className="game-note">نسخه آزمایشی قابل بازی: یک دور ۱۳ دستی با ربات‌های تصادفی قانونی. هوش راهبردی و هدف امتیازی نهایی هنوز تکمیل نشده است.</small>
    </section>}
    <section className="section-heading"><div><span className="eyebrow">انتخاب کن و بازی کن</span><h2>میز بعدی تو کدام است؟</h2></div><span className="section-count">۰۲ بازی</span></section>
    <section className="game-grid">
      <button className={"game-card hokm "+(selected==="hokm"?"chosen":"")} onClick={() => setSelected("hokm")}><div className="game-symbol teal"><Spade size={30} fill="currentColor"/></div><span className="game-tag">تیمی · ۴ نفره</span><h3>حکم</h3><p>با یارت هم‌تیمی شو و برای بردن دست‌ها بازی کن.</p><span className="card-link">انتخاب حکم <ChevronLeft size={16}/></span></button>
      <button className={"game-card haft "+(selected==="haft"?"chosen":"")} onClick={() => setSelected("haft")}><div className="game-symbol copper"><Layers3 size={30}/></div><span className="game-tag">رقابتی · قوانین قابل تنظیم</span><h3>هفت‌خبیث</h3><p>قوانین پایه در موتور آماده می‌شود؛ رابط بازی هنوز در دست توسعه است.</p><span className="card-link">انتخاب هفت‌خبیث <ChevronLeft size={16}/></span></button>
    </section>
    <section className="feature-strip"><div><Bot/><span><b>ربات‌های پایه</b><small>حرکت قانونی آفلاین</small></span></div><div><Palette/><span><b>هنر ایرانی</b><small>مجموعه کارت‌ها در دست طراحی</small></span></div><div><Trophy/><span><b>امتیاز دست‌ها</b><small>ثبت در طول بازی</small></span></div></section>
    <footer><span className="footer-mark">ه‍</span><span>هفت‌خوان <small>نسخه توسعه · ۰.۱</small></span><button className="settings" onClick={() => setNotice("تنظیمات کامل در مراحل بعدی پیاده‌سازی می‌شوند.")}><Settings2 size={16}/> تنظیمات</button></footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
