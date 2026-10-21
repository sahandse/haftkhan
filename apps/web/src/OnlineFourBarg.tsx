import React from "react";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { createDeck, shuffleDeck, RANK_LABELS, SUIT_LABELS, findFourBargCapture, scoreFourBargCards, type Card, type Suit } from "@haftkhan/game-engine";

type Player = { id: string; name: string; seat: number };
type GameState = { deck: Card[]; hands: Card[][]; table: Card[]; captured: Card[][]; turn: number; finished: boolean; message: string; lastCaptor: number | null };
const suits: Record<Suit,string> = {spades:"♠",hearts:"♥",diamonds:"♦",clubs:"♣"};
const colors: Record<Suit,string> = {spades:"#173b34",hearts:"#b64e50",diamonds:"#b64e50",clubs:"#173b34"};
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const client: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function newGame(): GameState {
  const deck = shuffleDeck(createDeck());
  const hands = [deck.slice(0,4), deck.slice(4,8), deck.slice(8,12), deck.slice(12,16)];
  return { deck: deck.slice(20), hands, table: deck.slice(16,20), captured: [[],[],[],[]], turn: 0, finished: false, message: "کارت هم‌رتبه یا ترکیب با مجموع ۱۱ را جمع کن.", lastCaptor: null };
}
function applyMove(state: GameState, card: Card, player: number): GameState {
  const hands = state.hands.map((hand,index) => index === player ? hand.filter(item => item.id !== card.id) : [...hand]);
  const capturedCards = findFourBargCapture(card, state.table);
  const table = capturedCards.length ? state.table.filter(item => !capturedCards.some(c => c.id === item.id)) : [...state.table, card];
  const captured = state.captured.map((hand,index) => index === player ? [...hand,...capturedCards] : [...hand]);
  const lastCaptor = capturedCards.length ? player : state.lastCaptor;
  const deck = [...state.deck];
  if (hands.every(hand => hand.length === 0) && deck.length) {
    for (let i=0;i<4;i++) hands[i] = deck.splice(0, Math.min(4,deck.length));
  }
  const finished = hands.every(hand => hand.length === 0) && deck.length === 0;
  if (finished && table.length) captured[lastCaptor ?? player] = [...captured[lastCaptor ?? player],...table];
  return { deck, hands, table: finished ? [] : table, captured, turn: (player+1)%4, finished, lastCaptor, message: capturedCards.length ? "کارت‌ها جمع شد!" : "کارت روی میز گذاشته شد." };
}
function makeCode() { return Array.from({length:4},()=> "0123456789"[Math.floor(Math.random()*10)]).join(""); }
function makeId() { return typeof crypto!=="undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now().toString(36); }
function points(state: GameState, seat: number) { return scoreFourBargCards(state.captured[seat], state.captured.flatMap((cards,i)=>i===seat?[]:cards)); }

export default function OnlineFourBarg() {
  const [codeInput,setCodeInput] = React.useState("");
  const [roomCode,setRoomCode] = React.useState("");
  const [role,setRole] = React.useState<"host"|"guest"|null>(null);
  const [playerId,setPlayerId] = React.useState("");
  const [seat,setSeat] = React.useState<number|null>(null);
  const [players,setPlayers] = React.useState<Player[]>([]);
  const [state,setState] = React.useState<GameState|null>(null);
  const [status,setStatus] = React.useState("اتاق بساز و کد ۴ رقمی را برای سه نفر دیگر بفرست.");
  const [connected,setConnected] = React.useState(false);
  const channelRef = React.useRef<RealtimeChannel|null>(null);
  const gameRef = React.useRef<GameState|null>(null);
  const roleRef = React.useRef<"host"|"guest"|null>(null);
  const seatRef = React.useRef<number|null>(null);
  const playersRef = React.useRef<Player[]>([]);
  const playerIdRef = React.useRef("");
  React.useEffect(()=>{ gameRef.current=state; },[state]);
  React.useEffect(()=>{ roleRef.current=role; },[role]);
  React.useEffect(()=>{ seatRef.current=seat; },[seat]);
  React.useEffect(()=>{ playersRef.current=players; },[players]);
  React.useEffect(()=>{ playerIdRef.current=playerId; },[playerId]);

  const publishPlayers = React.useCallback((next:Player[]) => {
    playersRef.current=next; setPlayers(next);
    void channelRef.current?.send({type:"broadcast",event:"room-roster",payload:{players:next}});
  },[]);
  const sendState = React.useCallback((next:GameState) => {
    gameRef.current=next; setState(next);
    void channelRef.current?.send({type:"broadcast",event:"game-state",payload:{state:next}});
  },[]);

  React.useEffect(()=>{
    if(!client || !roomCode || !role || !playerId) return;
    let active=true;
    const channel = client.channel("haftkhan-room-"+roomCode,{config:{broadcast:{self:false},presence:{key:playerId}}});
    channelRef.current=channel;
    channel.on("broadcast",{event:"join"},({payload})=>{
      if(roleRef.current!=="host" || !payload?.id || !payload?.name) return;
      const id=String(payload.id);
      const current=playersRef.current;
      const existing=current.find(p=>p.id===id);
      if(existing){
        void channel.send({type:"broadcast",event:"player-assigned",payload:{target:id,seat:existing.seat,players:current}});
        return;
      }
      if(current.length>=4){
        void channel.send({type:"broadcast",event:"room-full",payload:{target:id}});
        return;
      }
      const next=[...current,{id,name:String(payload.name).slice(0,20),seat:current.length}];
      publishPlayers(next);
      void channel.send({type:"broadcast",event:"player-assigned",payload:{target:id,seat:next.length-1,players:next}});
      if(next.length===4){
        const initial=newGame();
        gameRef.current=initial;setState(initial);
        void channel.send({type:"broadcast",event:"game-state",payload:{state:initial}});
        setStatus("هر ۴ بازیکن وارد شدند؛ بازی شروع شد!");
        void channel.send({type:"broadcast",event:"room-status",payload:{text:"هر ۴ بازیکن وارد شدند؛ بازی شروع شد!"}});
      } else {
        const text="در انتظار بازیکنان دیگر؛ "+next.length+" از ۴ نفر وارد شدند.";
        setStatus(text);
        void channel.send({type:"broadcast",event:"room-status",payload:{text}});
      }
    });
    channel.on("broadcast",{event:"player-assigned"},({payload})=>{
      if(payload?.target!==playerIdRef.current) return;
      setSeat(Number(payload.seat));seatRef.current=Number(payload.seat);
      if(Array.isArray(payload.players)){setPlayers(payload.players);playersRef.current=payload.players;}
      setStatus("وارد اتاق شدی؛ صندلی "+(Number(payload.seat)+1));
    });
    channel.on("broadcast",{event:"room-full"},({payload})=>{
      if(payload?.target===playerIdRef.current){setStatus("ظرفیت اتاق تکمیل است؛ این اتاق فقط ۴ بازیکن می‌پذیرد.");setConnected(false);setRoomCode("");setRole(null);setSeat(null);}
    });
    channel.on("broadcast",{event:"leave"},({payload})=>{
      if(roleRef.current!=="host" || !payload?.id) return;
      const leavingId=String(payload.id);
      if(leavingId===playerIdRef.current) return;
      const current=playersRef.current;
      const next=current.filter(p=>p.id!==leavingId).map((p,index)=>({...p,seat:index}));
      if(next.length===current.length) return;
      publishPlayers(next);
      const text="یک بازیکن خارج شد؛ اتاق به لابی برگشت. "+next.length+" از ۴ نفر حاضرند.";
      gameRef.current=null;setState(null);
      setSeat(next.find(p=>p.id===playerIdRef.current)?.seat??null);
      seatRef.current=next.find(p=>p.id===playerIdRef.current)?.seat??null;
      setStatus(text);
      void channel.send({type:"broadcast",event:"game-reset",payload:{text}});
      void channel.send({type:"broadcast",event:"room-status",payload:{text}});
      for(const player of next) {
        void channel.send({type:"broadcast",event:"player-assigned",payload:{target:player.id,seat:player.seat,players:next}});
      }
    });
    channel.on("broadcast",{event:"game-reset"},({payload})=>{
      gameRef.current=null;setState(null);
      if(payload?.text) setStatus(String(payload.text));
    });
    channel.on("broadcast",{event:"room-roster"},({payload})=>{
      if(Array.isArray(payload?.players)){setPlayers(payload.players);playersRef.current=payload.players;}
    });
    channel.on("broadcast",{event:"room-status"},({payload})=>{if(payload?.text)setStatus(String(payload.text));});
    channel.on("broadcast",{event:"game-state"},({payload})=>{
      if(payload?.state){gameRef.current=payload.state as GameState;setState(payload.state as GameState);setConnected(true);}
    });
    channel.on("broadcast",{event:"move"},({payload})=>{
      if(roleRef.current!=="host") return;
      const current=gameRef.current;
      const player=Number(payload?.player);
      const cardId=String(payload?.cardId??"");
      const card=current?.hands[player]?.find(item=>item.id===cardId);
      if(!current || current.finished || current.hands.length!==4 || current.turn!==player || !card || player<0 || player>3 || !playersRef.current.some(p=>p.seat===player)) return;
      sendState(applyMove(current,card,player));
    });
    channel.on("broadcast",{event:"restart"},()=>{
      if(roleRef.current==="host" && playersRef.current.length===4) sendState(newGame());
    });
    channel.subscribe(async subscriptionStatus=>{
      if(!active) return;
      if(subscriptionStatus==="SUBSCRIBED"){
        setConnected(true);
        await channel.track({id:playerId,name:role==="host"?"میزبان":"بازیکن"});
        if(role==="host"){
          const host:Player={id:playerId,name:"میزبان",seat:0};
          publishPlayers([host]);
          setSeat(0);seatRef.current=0;
          setStatus("اتاق ساخته شد؛ کد ۴ رقمی را برای ۳ نفر دیگر بفرست.");
          void channel.send({type:"broadcast",event:"room-status",payload:{text:"در انتظار بازیکنان دیگر؛ ۱ از ۴ نفر وارد شدند."}});
        } else {
          void channel.send({type:"broadcast",event:"join",payload:{id:playerId,name:"بازیکن"}});
          setStatus("در حال ورود به اتاق...");
        }
      } else if(subscriptionStatus==="CHANNEL_ERROR" || subscriptionStatus==="TIMED_OUT" || subscriptionStatus==="CLOSED") {
        setConnected(false);setStatus("اتصال برقرار نشد. تنظیمات سرویس آنلاین یا کد اتاق را بررسی کن.");
      }
    });
    return ()=>{active=false;if(channelRef.current===channel)channelRef.current=null;void client.removeChannel(channel);};
  },[roomCode,role,playerId,publishPlayers,sendState]);

  const createRoom=()=>{
    if(!client){setStatus("سرویس آنلاین تنظیم نشده است؛ ابتدا VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در متغیرهای GitHub Actions قرار بده.");return;}
    const id=makeId(),code=makeCode();
    setState(null);gameRef.current=null;setPlayers([]);playersRef.current=[];
    setPlayerId(id);setSeat(0);setRoomCode(code);setRole("host");setConnected(false);setStatus("در حال ساخت اتاق...");
  };
  const joinRoom=()=>{
    if(!client){setStatus("سرویس آنلاین هنوز تنظیم نشده است؛ ابتدا تنظیمات Supabase را اضافه کن.");return;}
    const code=codeInput.trim().toUpperCase().replace(/[^0-9]/g,"");
    if(code.length!==4){setStatus("کد اتاق باید دقیقاً ۴ نویسه باشد.");return;}
    const id=makeId();
    setState(null);gameRef.current=null;setPlayers([]);playersRef.current=[];
    setPlayerId(id);setSeat(null);setRoomCode(code);setRole("guest");setConnected(false);setStatus("در حال اتصال به اتاق...");
  };
  const playCard=(card:Card)=>{
    if(!state || seat===null || state.finished || state.turn!==seat) return;
    if(role==="host") sendState(applyMove(state,card,seat));
    else void channelRef.current?.send({type:"broadcast",event:"move",payload:{player:seat,cardId:card.id}});
  };
  const restart=()=>{
    if(role==="host"&&channelRef.current&&players.length===4) sendState(newGame());
    else setStatus("فقط میزبان می‌تواند بازی را از نو شروع کند.");
  };
  const copyCode=()=>{if(roomCode) void navigator.clipboard?.writeText(roomCode);setStatus("کد اتاق: "+roomCode+" — آن را برای ۳ نفر دیگر بفرست.");};
  const myHand=state&&seat!==null?state.hands[seat]??[]:[];
  const myScore=state&&seat!==null?points(state,seat):0;
  const count=players.length;

  return <section className="play-table online-room">
    <div className="table-heading"><div><span className="eyebrow">بازی آنلاین با دوستان</span><h2>چهاربرگ ۴ نفره</h2></div><span className={"room-status "+(connected?"connected":"")}>{connected?"● متصل":"○ آفلاین"}</span></div>
    {!roomCode ? <div className="room-lobby">
      <p>یک نفر اتاق می‌سازد و کد ۴ رقمی می‌گیرد. سه نفر دیگر با همان کد وارد می‌شوند؛ بازی پس از ورود هر ۴ نفر شروع می‌شود.</p>
      <button className="primary" onClick={createRoom}>ساخت اتاق و دریافت کد</button>
      <div className="room-join"><input aria-label="کد اتاق ۴ رقمی" value={codeInput} maxLength={4} inputMode="numeric" onChange={e=>setCodeInput(e.target.value.replace(/[^0-9]/g,""))} placeholder="کد ۴ رقمی" /><button className="restart" onClick={joinRoom}>ورود به اتاق</button></div>
      {!client&&<small className="room-warning">برای ارتباط واقعی بین دستگاه‌ها، تنظیمات Supabase باید در ساخت سایت ثبت شود.</small>}
      <p className="room-status-text" role="status">{status}</p>
    </div> : <>
      <div className="room-code-line"><span>کد اتاق</span><strong>{roomCode}</strong><button className="restart" onClick={copyCode}>کپی کد</button><button className="restart" onClick={()=>{void channelRef.current?.send({type:"broadcast",event:"leave",payload:{id:playerId}});void client?.removeChannel(channelRef.current!);channelRef.current=null;setRoomCode("");setRole(null);setPlayerId("");setSeat(null);setState(null);setPlayers([]);setConnected(false);}}>خروج</button></div>
      <p className="room-status-text" role="status">{status}</p>
      <div className="room-roster">{[0,1,2,3].map(i=>{const p=players.find(x=>x.seat===i);return <div className="room-player" key={i}><b>{i+1}</b><span>{p?.name??"در انتظار بازیکن"}</span>{p&&<small>{p.id===playerId?"شما":"وارد شد"}</small>}</div>;})}</div>
      {!state ? <p className="empty-history">بازی وقتی شروع می‌شود که ۴ بازیکن وارد اتاق شوند ({count}/۴).</p> : <>
        <div className="table-status"><span>کارت‌های دسته: {state.deck.length}</span><span>امتیاز تو: {myScore}</span><span>نوبت: {state.turn===seat?"تو":players.find(p=>p.seat===state.turn)?.name??"بازیکن "+(state.turn+1)}</span></div>
        <div className="fourbarg-felt"><div className="opponents">{players.filter(p=>p.seat!==seat).map(p=><span key={p.id}>{p.name}<small>{state.hands[p.seat]?.length??0} کارت</small></span>)}</div><div className="fourbarg-table-cards">{state.table.map(card=><div className="mini-card" key={card.id}><b style={{color:colors[card.suit]}}>{RANK_LABELS[card.rank]}{suits[card.suit]}</b></div>)}</div><div className="opponents"><span>جمع کارت‌های گرفته‌شده: {state.captured[seat??0].length}</span><span>{state.finished?"بازی تمام شد":"میز بازی"}</span></div></div>
        <p className="turn-message" role="status">{state.finished?"بازی تمام شد.":state.turn===seat?"نوبت توست؛ کارت انتخاب کن.":"منتظر حرکت "+(players.find(p=>p.seat===state.turn)?.name??"بازیکن بعدی")+" هستیم."} {state.message}</p>
        <div className="fourbarg-hand">{myHand.map(card=><button key={card.id} className="hand-card" disabled={seat===null||state.turn!==seat||state.finished} onClick={()=>playCard(card)} aria-label={RANK_LABELS[card.rank]+" "+SUIT_LABELS[card.suit]}><span style={{color:colors[card.suit]}}>{RANK_LABELS[card.rank]}</span><b style={{color:colors[card.suit]}}>{suits[card.suit]}</b></button>)}</div>
        {role==="host"&&<button className="restart" onClick={restart}>شروع مجدد</button>}
      </>}
    </>}
  </section>;
}
