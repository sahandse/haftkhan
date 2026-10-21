import React from "react";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { createDeck, shuffleDeck, RANK_LABELS, SUIT_LABELS, findFourBargCapture, scoreFourBargCards, type Card, type Suit } from "@haftkhan/game-engine";

type Role = "host" | "guest";
type GameState = { deck: Card[]; hands: Card[][]; table: Card[]; captured: Card[][]; turn: number; finished: boolean; message: string; lastCaptor: number | null };
const suits: Record<Suit,string> = {spades:"♠",hearts:"♥",diamonds:"♦",clubs:"♣"};
const colors: Record<Suit,string> = {spades:"#173b34",hearts:"#b64e50",diamonds:"#b64e50",clubs:"#173b34"};
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const client: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function newGame(): GameState {
  const deck = shuffleDeck(createDeck());
  return { deck: deck.slice(12), hands: [deck.slice(0,4), deck.slice(4,8)], table: deck.slice(8,12), captured: [[],[]], turn: 0, finished: false, message: "کارت هم‌رتبه یا ترکیب با مجموع ۱۱ را جمع کن.", lastCaptor: null };
}
function applyMove(state: GameState, card: Card, player: number): GameState {
  const hands = state.hands.map((hand,index) => index === player ? hand.filter(item => item.id !== card.id) : [...hand]);
  const capturedCards = findFourBargCapture(card, state.table);
  const table = capturedCards.length ? state.table.filter(item => !capturedCards.some(c => c.id === item.id)) : [...state.table, card];
  const captured = state.captured.map((hand,index) => index === player ? [...hand,...capturedCards] : [...hand]);
  const lastCaptor = capturedCards.length ? player : state.lastCaptor;
  const deck = [...state.deck];
  if (hands.every(hand => hand.length === 0) && deck.length) {
    hands[0] = deck.splice(0, Math.min(4,deck.length));
    hands[1] = deck.splice(0, Math.min(4,deck.length));
  }
  const finished = hands.every(hand => hand.length === 0) && deck.length === 0;
  if (finished && table.length) captured[lastCaptor ?? player] = [...captured[lastCaptor ?? player],...table];
  return { deck, hands, table: finished ? [] : table, captured, turn: 1-player, finished, lastCaptor, message: capturedCards.length ? (player === 0 ? "بازیکن اول کارت‌ها را جمع کرد." : "بازیکن دوم کارت‌ها را جمع کرد.") : "کارت روی میز گذاشته شد." };
}
function makeCode() { return Array.from({length:6},()=> "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join(""); }

export default function OnlineFourBarg() {
  const [codeInput,setCodeInput] = React.useState("");
  const [roomCode,setRoomCode] = React.useState("");
  const [role,setRole] = React.useState<Role|null>(null);
  const [state,setState] = React.useState<GameState|null>(null);
  const [status,setStatus] = React.useState("برای بازی آنلاین، یک اتاق بساز یا کد دوستت را وارد کن.");
  const [connected,setConnected] = React.useState(false);
  const channelRef = React.useRef<RealtimeChannel|null>(null);
  const gameRef = React.useRef<GameState|null>(null);
  const roleRef = React.useRef<Role|null>(null);
  React.useEffect(()=>{ gameRef.current=state; },[state]);
  React.useEffect(()=>{ roleRef.current=role; },[role]);
  const sendState = React.useCallback((next:GameState)=> {
    gameRef.current=next; setState(next);
    void channelRef.current?.send({type:"broadcast",event:"game-state",payload:{state:next}});
  },[]);
  React.useEffect(()=>{
    if(!client || !roomCode || !role) return;
    const channel = client.channel("haftkhan-room-"+roomCode,{config:{broadcast:{self:false}}});
    channelRef.current=channel;
    channel.on("broadcast",{event:"join"},()=>{
      if(roleRef.current==="host" && gameRef.current) void channel.send({type:"broadcast",event:"game-state",payload:{state:gameRef.current}});
    });
    channel.on("broadcast",{event:"game-state"},({payload})=>{
      if(payload?.state){gameRef.current=payload.state as GameState;setState(payload.state as GameState);setConnected(true);setStatus("اتصال برقرار است؛ بازی همگام‌سازی می‌شود.");}
    });
    channel.on("broadcast",{event:"move"},({payload})=>{
      if(roleRef.current!=="host") return;
      const current=gameRef.current;
      const player=Number(payload?.player);
      const cardId=String(payload?.cardId??"");
      const card=current?.hands[player]?.find(item=>item.id===cardId);
      if(!current || current.finished || current.turn!==player || !card || (player!==0&&player!==1)) return;
      sendState(applyMove(current,card,player));
    });
    channel.on("broadcast",{event:"restart"},()=>{
      if(roleRef.current==="guest") setStatus("دوستت شروع مجدد را انتخاب کرد.");
    });
    channel.subscribe((subscriptionStatus)=>{
      if(subscriptionStatus==="SUBSCRIBED"){
        setConnected(true);
        setStatus(roleRef.current==="host"?"اتاق آماده است؛ کد را برای دوستت بفرست.":"وصل شدیم؛ منتظر وضعیت بازی میزبان هستیم.");
        if(roleRef.current==="host"){
          const initial=gameRef.current??newGame();
          sendState(initial);
        } else {
          void channel.send({type:"broadcast",event:"join",payload:{at:Date.now()}});
        }
      } else if(subscriptionStatus==="CHANNEL_ERROR" || subscriptionStatus==="TIMED_OUT" || subscriptionStatus==="CLOSED") {
        setConnected(false); setStatus("اتصال برقرار نشد. تنظیمات سرویس آنلاین یا کد اتاق را بررسی کن.");
      }
    });
    return ()=>{channelRef.current=null;void client.removeChannel(channel);};
  },[roomCode,role,sendState]);

  const createRoom=()=> {
    if(!client){setStatus("سرویس آنلاین هنوز تنظیم نشده است. ابتدا VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در تنظیمات ساخت سایت قرار بده.");return;}
    const code=makeCode(); setState(newGame());setRoomCode(code);setRole("host");setConnected(false);setStatus("در حال ساخت اتاق...");
  };
  const joinRoom=()=> {
    if(!client){setStatus("سرویس آنلاین هنوز تنظیم نشده است. ابتدا تنظیمات Supabase را اضافه کن.");return;}
    const code=codeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
    if(code.length!==6){setStatus("کد اتاق باید دقیقاً ۶ نویسه باشد.");return;}
    setState(null);setRoomCode(code);setRole("guest");setConnected(false);setStatus("در حال اتصال به اتاق...");
  };
  const playCard=(card:Card)=>{
    if(!state || !role || state.finished || state.turn!==(role==="host"?0:1)) return;
    if(role==="host") sendState(applyMove(state,card,0));
    else void channelRef.current?.send({type:"broadcast",event:"move",payload:{player:1,cardId:card.id}});
  };
  const restart=()=>{
    if(role==="host"&&channelRef.current){const next=newGame();sendState(next);void channelRef.current.send({type:"broadcast",event:"restart",payload:{}});}
    else setStatus("فقط سازنده‌ی اتاق می‌تواند بازی را از نو شروع کند.");
  };
  const copyCode=()=>{if(roomCode) void navigator.clipboard?.writeText(roomCode);setStatus("کد اتاق: "+roomCode+" — آن را برای دوستت بفرست.");};
  const myPlayer=role==="host"?0:1;
  const myHand=state?.hands[myPlayer]??[];
  const myScore=state?scoreFourBargCards(state.captured[myPlayer],state.captured[1-myPlayer]):0;
  const theirScore=state?scoreFourBargCards(state.captured[1-myPlayer],state.captured[myPlayer]):0;

  return <section className="play-table online-room">
    <div className="table-heading"><div><span className="eyebrow">بازی آنلاین با دوست</span><h2>چهاربرگ دونفره</h2></div><span className={"room-status "+(connected?"connected":"")}>{connected?"● متصل":"○ آفلاین"}</span></div>
    {!roomCode ? <div className="room-lobby">
      <p>اتاق بساز و کد ۶ رقمی را برای دوستت بفرست؛ یا با کد دوستت وارد اتاق شو.</p>
      <button className="primary" onClick={createRoom}>ساخت اتاق جدید</button>
      <div className="room-join"><input aria-label="کد اتاق" value={codeInput} maxLength={6} onChange={e=>setCodeInput(e.target.value.toUpperCase())} placeholder="کد ۶ رقمی دوستت" /><button className="restart" onClick={joinRoom}>ورود به اتاق</button></div>
      {!client&&<small className="room-warning">برای فعال‌کردن ارتباط واقعی، ابتدا باید متغیرهای محیطی Supabase را تنظیم کرد.</small>}
      <p className="room-status-text" role="status">{status}</p>
    </div> : <>
      <div className="room-code-line"><span>کد اتاق</span><strong>{roomCode}</strong><button className="restart" onClick={copyCode}>کپی کد</button><button className="restart" onClick={()=>{void channelRef.current?.send({type:"broadcast",event:"leave",payload:{}});setRoomCode("");setRole(null);setState(null);setConnected(false);}}>خروج</button></div>
      <p className="room-status-text" role="status">{status}</p>
      {!state ? <p className="empty-history">منتظر شروع میزبان هستیم…</p> : <>
        <div className="table-status"><span>کارت‌های دسته: {state.deck.length}</span><span>امتیاز تو: {myScore}</span><span>امتیاز دوستت: {theirScore}</span><span>نوبت: {state.turn===myPlayer?"تو":"دوستت"}</span></div>
        <div className="fourbarg-felt"><div className="opponents"><span>{role==="host"?"دوستت":"میزبان"}<small>{state.hands[1-myPlayer].length} کارت</small></span><span>روی میز</span></div><div className="fourbarg-table-cards">{state.table.map(card=><div className="mini-card" key={card.id}><b style={{color:colors[card.suit]}}>{RANK_LABELS[card.rank]}{suits[card.suit]}</b></div>)}</div><div className="opponents"><span>امتیاز تو: {myScore}</span><span>امتیاز دوستت: {theirScore}</span></div></div>
        <p className="turn-message" role="status">{state.finished?"بازی تمام شد.":state.turn===myPlayer?"نوبت توست؛ کارت انتخاب کن.":"منتظر حرکت دوستت هستیم."} {state.message}</p>
        <div className="fourbarg-hand">{myHand.map(card=><button key={card.id} className="hand-card" disabled={state.turn!==myPlayer||state.finished} onClick={()=>playCard(card)} aria-label={RANK_LABELS[card.rank]+" "+SUIT_LABELS[card.suit]}><span style={{color:colors[card.suit]}}>{RANK_LABELS[card.rank]}</span><b style={{color:colors[card.suit]}}>{suits[card.suit]}</b></button>)}</div>
        {role==="host"&&<button className="restart" onClick={restart}>شروع مجدد</button>}
      </>}
    </>}
  </section>;
}
