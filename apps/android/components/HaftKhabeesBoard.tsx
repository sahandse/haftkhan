import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createHaftKhabeesGame, drawHaftKhabeesCards, isLegalHaftKhabeesGameMove, playHaftKhabeesCard, RANK_LABELS, SUIT_LABELS, type Card, type Suit, type HaftKhabeesGame } from "@haftkhan/game-engine";
const suits: Suit[]=["spades","hearts","diamonds","clubs"];
const glyph:Record<Suit,string>={spades:"♠",hearts:"♥",diamonds:"♦",clubs:"♣"};
const ink:Record<Suit,string>={spades:"#173b34",hearts:"#b64e50",diamonds:"#b64e50",clubs:"#173b34"};
function best(hand:readonly Card[]):Suit{return [...suits].sort((a,b)=>hand.filter(c=>c.suit===b).length-hand.filter(c=>c.suit===a).length)[0];}
function bots(initial:HaftKhabeesGame):HaftKhabeesGame{
 let g=initial,guard=0;
 while(!g.finished&&g.currentPlayer!==0&&guard<100){
  const p=g.currentPlayer,h=g.hands[p],legal=h.filter(c=>isLegalHaftKhabeesGameMove(g,p,c.id,c.rank===11?best(h):undefined));
  if(!legal.length)g=drawHaftKhabeesCards(g,p);
  else{const c=legal[Math.floor(Math.random()*legal.length)];g=playHaftKhabeesCard(g,p,c.id,c.rank===11?best(h):undefined);}
  guard++;
 }
 return g;
}
export default function HaftKhabeesBoard(){
 const [game,setGame]=useState<HaftKhabeesGame>(()=>createHaftKhabeesGame({firstPlayer:0}));
 const [suit,setSuit]=useState<Suit>("spades");
 const [message,setMessage]=useState("کارت مجاز را انتخاب کن.");
 const restart=()=>{setGame(bots(createHaftKhabeesGame({firstPlayer:0})));setMessage("بازی جدید شروع شد.");};
 const play=(c:Card)=>{try{const next=bots(playHaftKhabeesCard(game,0,c.id,c.rank===11?suit:undefined));setGame(next);setMessage(next.finished?(next.winnerPlayer===0?"برنده شدی!":"ربات‌ها برنده شدند."):"حرکت ثبت شد.");}catch(e){setMessage(e instanceof Error?e.message:"حرکت مجاز نیست.");}};
 const draw=()=>{const next=bots(drawHaftKhabeesCards(game,0));setGame(next);setMessage(game.pendingDraw?"کارت‌های جریمه کشیده شد.":"یک کارت کشیدی.");};
 const top=game.discardPile[game.discardPile.length-1];
 return <View style={s.panel}>
  <View style={s.row}><Text style={s.title}>میز هفت‌خبیث</Text><Pressable onPress={restart} style={s.smallButton}><Text style={s.smallText}>بازی جدید</Text></Pressable></View>
  <Text style={s.info}>خال فعال: {glyph[game.activeSuit]} {SUIT_LABELS[game.activeSuit]} · جریمه: {game.pendingDraw} · کارت‌های دسته: {game.drawPile.length}</Text>
  <View style={s.opponents}>{game.hands.slice(1).map((h,i)=><Text key={i} style={s.opponent}>ربات {i+2} · {h.length} کارت</Text>)}</View>
  <View style={s.center}><Text style={[s.topCard,{color:ink[top.suit]}]}>{RANK_LABELS[top.rank]}{glyph[top.suit]}</Text><Text style={s.info}>نوبت بازیکن {game.currentPlayer+1}</Text></View>
  <Text style={s.message}>{game.finished?"بازی تمام شد.":game.pendingDraw?"هفت بازی کن یا جریمه را بکش.":"یک کارت مجاز انتخاب کن."} {message}</Text>
  <Text style={s.info}>خال انتخابی برای سرباز</Text>
  <View style={s.row}>{suits.map(x=><Pressable key={x} onPress={()=>setSuit(x)} style={[s.smallButton,suit===x&&s.active]}><Text style={s.smallText}>{glyph[x]} {SUIT_LABELS[x]}</Text></Pressable>)}</View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hand}>{game.hands[0].map(c=>{const legal=isLegalHaftKhabeesGameMove(game,0,c.id,c.rank===11?suit:undefined);return <Pressable key={c.id} disabled={!legal||game.finished||game.currentPlayer!==0} onPress={()=>play(c)} style={[s.card,(!legal||game.finished)&&s.disabled]}><Text style={[s.rank,{color:ink[c.suit]}]}>{RANK_LABELS[c.rank]}</Text><Text style={[s.glyph,{color:ink[c.suit]}]}>{glyph[c.suit]}</Text></Pressable>;})}</ScrollView>
  <Pressable onPress={draw} disabled={game.finished||game.currentPlayer!==0} style={s.draw}><Text style={s.drawText}>کشیدن کارت {game.pendingDraw ? "(جریمه " + game.pendingDraw + ")" : ""}</Text></Pressable>
  <Text style={s.note}>هفت جریمه، هشت رد نوبت، سرباز تغییر خال و آس تغییر جهت می‌دهد.</Text>
 </View>;
}
const s=StyleSheet.create({
 panel:{marginTop:20,padding:15,borderRadius:20,borderWidth:1,borderColor:"#28534B",backgroundColor:"#0B201D",gap:12},
 row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6},
 title:{color:"#EDF6F4",fontSize:20,fontWeight:"800"},
 info:{color:"#9FBDB4",fontSize:11,lineHeight:19},
 opponents:{flexDirection:"row",justifyContent:"space-around",flexWrap:"wrap",gap:6,padding:10,backgroundColor:"#102B26",borderRadius:12},
 opponent:{color:"#D7E8E2",fontSize:10},
 center:{minHeight:90,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#245148",backgroundColor:"#10352D",borderRadius:13,padding:10},
 topCard:{fontSize:28,fontWeight:"800"},
 message:{fontSize:12,color:"#B8D5CC",lineHeight:20},
 smallButton:{paddingHorizontal:9,paddingVertical:7,borderRadius:8,borderWidth:1,borderColor:"#31594F",backgroundColor:"#102D28"},
 active:{borderColor:"#55D8C2"},
 smallText:{fontSize:10,color:"#C9E5DD"},
 hand:{gap:6,paddingVertical:8},
 card:{width:48,height:70,borderRadius:8,borderWidth:1,borderColor:"#B6CFC5",backgroundColor:"#EDF2EB",alignItems:"center",justifyContent:"space-between",paddingVertical:7},
 disabled:{opacity:0.35},
 rank:{fontSize:12,fontWeight:"800"},
 glyph:{fontSize:20,fontWeight:"700"},
 draw:{backgroundColor:"#55D8C2",borderRadius:10,padding:12,alignItems:"center"},
 drawText:{color:"#06201C",fontWeight:"800",fontSize:12},
 note:{fontSize:10,color:"#77958C",lineHeight:18}
});
