import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, Pressable, View } from "react-native";
import { RANK_LABELS, SUIT_LABELS, type Card, type Suit } from "@haftkhan/game-engine";
import { chooseBotCard } from "@haftkhan/game-engine/src/hokm";
import { createHokmGame, playHokmCard, type HokmGame } from "@haftkhan/game-engine/src/hokm-game";

const teal = "#55D8C2";
const suitGlyph: Record<Suit, string> = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const suitColor: Record<Suit, string> = { spades: "#173b34", hearts: "#b64e50", diamonds: "#b64e50", clubs: "#173b34" };

function runBots(initial: HokmGame): HokmGame {
  let game = initial;
  let guard = 0;
  while (!game.finished && game.currentPlayer !== 0 && guard < 52) {
    const hand = game.hands[game.currentPlayer];
    const leadSuit = game.trick[0]?.card.suit;
    game = playHokmCard(game, game.currentPlayer, chooseBotCard(hand, leadSuit).id);
    guard += 1;
  }
  return game;
}

export default function HomeScreen() {
  const [selected, setSelected] = useState("hokm");
  const [game, setGame] = useState<HokmGame | null>(null);
  const [message, setMessage] = useState("");
  const start = () => {
    if (selected !== "hokm") {
      setMessage("هفت‌خبیث هنوز به میز قابل‌بازی متصل نشده است.");
      return;
    }
    const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
    setGame(runBots(createHokmGame({ trump: suits[Math.floor(Math.random() * suits.length)], firstPlayer: 0 })));
    setMessage("بازی شروع شد؛ کارت اول را انتخاب کن.");
  };
  const play = (card: Card) => {
    if (!game || game.finished || game.currentPlayer !== 0) return;
    try {
      let next = playHokmCard(game, 0, card.id);
      if (next.lastTrickWinner !== null) setMessage(`بازیکن ${next.lastTrickWinner + 1} این دست را برد.`);
      next = runBots(next);
      if (next.finished) setMessage(`پایان دور؛ تیم شما ${next.teamTricks[0]}، رقیب ${next.teamTricks[1]} دست.`);
      setGame(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "این حرکت مجاز نیست.");
    }
  };
  const legalCards = useMemo(() => {
    if (!game || game.currentPlayer !== 0 || !game.trick.length) return new Set(game?.hands[0]?.map(card => card.id) ?? []);
    const lead = game.trick[0].card.suit;
    const hasLead = game.hands[0].some(card => card.suit === lead);
    return new Set(game.hands[0].filter(card => !hasLead || card.suit === lead).map(card => card.id));
  }, [game]);

  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="light-content" backgroundColor="#071313" />
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.top}><View style={s.logo}><Text style={s.spade}>♠</Text></View><View style={s.brand}><Text style={s.brandTitle}>هفت‌خوان</Text><Text style={s.caption}>بازی، با ریشه‌های ایرانی</Text></View><View style={s.version}><Text style={s.versionText}>۰.۱</Text></View></View>
      <View style={s.hero}><Text style={s.kicker}>✦  دورهمی به سبک ایرانی</Text><Text style={s.title}>یک دست بازی،{"\n"}<Text style={{color:teal}}>هزار قصه.</Text></Text><Text style={s.description}>حکم چهارنفره با ربات‌های آفلاین و طراحی مینیمال.</Text><View style={s.pill}><View style={s.dot}/><Text style={s.pillText}>بدون نیاز به حساب یا اینترنت</Text></View></View>
      <Text style={s.sectionTitle}>میز بعدی تو کدام است؟</Text>
      <Pressable accessibilityRole="button" onPress={()=>setSelected("hokm")} style={[s.gameCard,selected==="hokm"&&s.selected]}><View style={s.cardTop}><Text style={s.cardSymbol}>♠</Text><Text style={s.tag}>تیمی · ۴ نفره</Text></View><Text style={s.gameTitle}>حکم</Text><Text style={s.gameDescription}>با یارت هم‌تیمی شو و برای بردن دست‌ها بازی کن.</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>setSelected("haft")} style={[s.gameCard,selected==="haft"&&s.selected]}><View style={s.cardTop}><Text style={[s.cardSymbol,{color:"#DF9A69"}]}>▤</Text><Text style={s.tag}>رقابتی · قوانین قابل تنظیم</Text></View><Text style={s.gameTitle}>هفت‌خبیث</Text><Text style={s.gameDescription}>رابط بازی این حالت هنوز در دست توسعه است.</Text></Pressable>
      <Pressable style={s.start} onPress={start}><Text style={s.startText}>{game && !game.finished ? "بازی جدید  ‹" : "شروع بازی  ‹"}</Text></Pressable>
      {!!message && <Text accessibilityLiveRegion="polite" style={s.message}>{message}</Text>}
      {game && <View style={s.table}>
        <Text style={s.tableTitle}>میز حکم</Text>
        <Text style={s.tableInfo}>خال حکم: {suitGlyph[game.trump]} {SUIT_LABELS[game.trump]}  ·  تیم شما {game.teamTricks[0]}  |  رقیب {game.teamTricks[1]}</Text>
        <View style={s.opponents}>{game.hands.slice(1).map((hand,index)=><View key={index} style={s.opponent}><Text style={s.opponentName}>ربات {index+2}</Text><Text style={s.opponentCount}>{hand.length} کارت</Text></View>)}</View>
        <View style={s.trick}>{game.trick.length ? game.trick.map(play=><View key={play.player} style={s.trickCard}><Text style={s.trickPlayer}>{play.player===0?"تو":`ربات ${play.player+1}`}</Text><Text style={[s.trickValue,{color:suitColor[play.card.suit]}]}>{RANK_LABELS[play.card.rank]}{suitGlyph[play.card.suit]}</Text></View>) : <Text style={s.empty}>کارت‌های این دست اینجا نمایش داده می‌شوند</Text>}</View>
        <Text style={s.handTitle}>{game.finished ? "این دور تمام شد" : game.currentPlayer===0 ? "نوبت توست؛ کارت انتخاب کن" : "در انتظار ربات‌ها..."}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hand}>
          {game.hands[0].map(card=><Pressable key={card.id} disabled={game.currentPlayer!==0||game.finished||!legalCards.has(card.id)} onPress={()=>play(card)} style={[s.handCard,(game.currentPlayer!==0||game.finished||!legalCards.has(card.id))&&s.cardDisabled]}><Text style={[s.handRank,{color:suitColor[card.suit]}]}>{RANK_LABELS[card.rank]}</Text><Text style={[s.handSuit,{color:suitColor[card.suit]}]}>{suitGlyph[card.suit]}</Text></Pressable>)}
        </ScrollView>
        <Text style={s.note}>نسخه آزمایشی: یک دور ۱۳ دستی با ربات‌های تصادفی قانونی؛ هوش راهبردی و امتیاز نهایی کامل نشده است.</Text>
      </View>}
      <View style={s.features}><Text style={s.feature}>♟  ربات‌های پایه آفلاین</Text><Text style={s.feature}>✳  طراحی کارت ایرانی در دست ساخت</Text><Text style={s.feature}>♜  ثبت امتیاز دست‌ها</Text></View>
      <Text style={s.footer}>هفت‌خوان  ·  نسخه توسعه</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#071313"},container:{padding:22,paddingBottom:34},top:{flexDirection:"row",alignItems:"center",marginBottom:26},logo:{width:45,height:45,borderRadius:14,borderWidth:1,borderColor:"#2B655C",backgroundColor:"#102B29",alignItems:"center",justifyContent:"center"},spade:{color:teal,fontSize:25},brand:{marginLeft:12,flex:1},brandTitle:{fontSize:19,fontWeight:"800",color:"#EDF6F4",textAlign:"left"},caption:{fontSize:11,color:"#8BA6A2",marginTop:2,textAlign:"left"},version:{borderWidth:1,borderColor:"#203838",borderRadius:9,paddingHorizontal:10,paddingVertical:6},versionText:{color:"#8BA6A2",fontSize:11},hero:{padding:22,borderWidth:1,borderColor:"#21413D",borderRadius:24,backgroundColor:"#0B1D1C",marginBottom:26},kicker:{color:teal,fontSize:12,fontWeight:"600",textAlign:"left"},title:{fontSize:37,fontWeight:"800",lineHeight:53,color:"#EDF6F4",marginTop:14,textAlign:"left"},description:{fontSize:13,lineHeight:25,color:"#A2B9B5",marginTop:13,textAlign:"left"},pill:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:7,borderWidth:1,borderColor:"#25443F",borderRadius:20,paddingHorizontal:11,paddingVertical:8,marginTop:18},dot:{width:6,height:6,borderRadius:3,backgroundColor:teal},pillText:{fontSize:10,color:"#C1D8D2"},sectionTitle:{fontSize:19,fontWeight:"700",color:"#EDF6F4",marginBottom:14,textAlign:"left"},gameCard:{padding:18,borderRadius:18,borderWidth:1,borderColor:"#203838",backgroundColor:"#0D1E1E",marginBottom:13},selected:{borderColor:"#3A887B"},cardTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},cardSymbol:{fontSize:29,color:teal},tag:{fontSize:10,color:"#93ADA7"},gameTitle:{fontSize:21,fontWeight:"800",color:"#EDF6F4",marginTop:12,textAlign:"left"},gameDescription:{fontSize:12,color:"#9BB2AD",lineHeight:22,marginTop:5,textAlign:"left"},start:{backgroundColor:teal,borderRadius:12,padding:15,alignItems:"center",marginTop:7},startText:{fontWeight:"800",fontSize:14,color:"#06201C"},message:{marginTop:14,color:"#C8E7DE",fontSize:12,lineHeight:22,textAlign:"center"},table:{marginTop:22,padding:15,borderRadius:20,borderWidth:1,borderColor:"#28534B",backgroundColor:"#0B201D"},tableTitle:{color:"#EDF6F4",fontSize:21,fontWeight:"800",textAlign:"left"},tableInfo:{color:"#9FBDB4",fontSize:11,lineHeight:23,marginTop:8,textAlign:"left"},opponents:{flexDirection:"row",justifyContent:"space-around",marginTop:18,padding:12,borderRadius:12,backgroundColor:"#102B26"},opponent:{alignItems:"center",gap:4},opponentName:{color:"#D7E8E2",fontSize:10},opponentCount:{color:"#86AAA0",fontSize:10},trick:{minHeight:100,marginTop:12,borderRadius:13,borderWidth:1,borderColor:"#245148",backgroundColor:"#10352D",flexDirection:"row",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:7,padding:10},trickCard:{width:54,height:68,borderRadius:8,backgroundColor:"#E9F0E9",alignItems:"center",justifyContent:"center",gap:5},trickPlayer:{fontSize:8,color:"#45615A"},trickValue:{fontSize:18,fontWeight:"800"},empty:{fontSize:10,color:"#86AAA0",textAlign:"center"},handTitle:{fontSize:12,color:"#B8D5CC",marginTop:15,marginBottom:8,textAlign:"left"},hand:{gap:6,paddingVertical:7},handCard:{width:49,height:72,borderRadius:8,borderWidth:1,borderColor:"#B6CFC5",backgroundColor:"#EDF2EB",alignItems:"center",justifyContent:"space-between",paddingVertical:7},cardDisabled:{opacity:0.4},handRank:{fontSize:13,fontWeight:"800"},handSuit:{fontSize:21,fontWeight:"700"},note:{color:"#77958C",fontSize:10,lineHeight:18,marginTop:8},features:{borderTopWidth:1,borderTopColor:"#1A3030",marginTop:27,paddingTop:18,gap:12},feature:{color:"#A2B9B5",fontSize:12,textAlign:"left"},footer:{marginTop:26,textAlign:"center",color:"#68827D",fontSize:11}
});
