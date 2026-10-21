import React from "react";
import { createRoot } from "react-dom/client";
import { Sparkles, Spade, Users, Palette, Trophy, Settings2, ChevronLeft, Bot, Layers3 } from "lucide-react";
import "./styles.css";

function App() {
  const [selected, setSelected] = React.useState("hokm");
  const [showThemes, setShowThemes] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const start = () => setNotice(selected === "hokm" ? "میز حکم آماده می‌شود؛ موتور کامل بازی در مرحله بعد اضافه می‌شود." : "بخش هفت‌خبیث در حال آماده‌سازی قوانین قابل تنظیم است.");
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="هفت‌خوان">
        <span className="brand-mark"><Spade size={23} fill="currentColor" /></span>
        <span><b>هفت‌خوان</b><small>بازی، با ریشه‌های ایرانی</small></span>
      </a>
      <button className="icon-button" onClick={() => setShowThemes(!showThemes)} aria-label="انتخاب تم"><Palette size={20}/></button>
    </header>
    {showThemes && <section className="theme-panel">
      <b>تم برنامه</b><span className="theme-chip active">شب فیروزه‌ای</span><span className="theme-chip">مس و زغال</span><span className="theme-chip">لاجوردی</span>
      <small>انتخاب تم‌های دیگر در مرحله شخصی‌سازی فعال می‌شود.</small>
    </section>}
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={14}/> دورهمی به سبک ایرانی</span>
        <h1>یک دست بازی،<br/><em>هزار قصه.</em></h1>
        <p>حکم و هفت‌خبیث؛ با طراحی مینیمال، کارت‌های الهام‌گرفته از هنر ایران و ربات‌هایی برای بازی آفلاین.</p>
        <div className="hero-actions"><button className="primary" onClick={start}>شروع بازی <ChevronLeft size={18}/></button><span className="offline"><i/> قابل بازی آفلاین</span></div>
      </div>
      <div className="hero-art" aria-label="نمایش گرافیکی کارت‌ها">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="playing-card card-back"><span className="card-ornament">✳</span><small>هفت‌خوان</small></div>
        <div className="playing-card card-front"><span className="rank">A</span><span className="suit">♠</span><span className="card-bottom">A ♠</span></div>
        <div className="floating-chip">۴ بازیکن <Users size={14}/></div>
      </div>
    </section>
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>متوجه شدم</button></div>}
    <section className="section-heading"><div><span className="eyebrow">انتخاب کن و بازی کن</span><h2>میز بعدی تو کدام است؟</h2></div><span className="section-count">۰۲ بازی</span></section>
    <section className="game-grid">
      <button className={"game-card hokm "+(selected==="hokm"?"chosen":"")} onClick={() => setSelected("hokm")}>
        <div className="game-symbol teal"><Spade size={30} fill="currentColor"/></div><span className="game-tag">تیمی · ۴ نفره</span><h3>حکم</h3><p>با یارت هم‌تیمی شو و برای بردن هفت دست بجنگ.</p><span className="card-link">انتخاب حکم <ChevronLeft size={16}/></span>
      </button>
      <button className={"game-card haft "+(selected==="haft"?"chosen":"")} onClick={() => setSelected("haft")}>
        <div className="game-symbol copper"><Layers3 size={30}/></div><span className="game-tag">رقابتی · قوانین قابل تنظیم</span><h3>هفت‌خبیث</h3><p>کارت‌هایت را زودتر تمام کن و حرکت بعدی را غافلگیرکننده بساز.</p><span className="card-link">انتخاب هفت‌خبیث <ChevronLeft size={16}/></span>
      </button>
    </section>
    <section className="feature-strip">
      <div><Bot/><span><b>ربات‌های هوشمند</b><small>سه سطح دشواری</small></span></div>
      <div><Palette/><span><b>۱۰ طرح کارت</b><small>الهام از فرهنگ ایران</small></span></div>
      <div><Trophy/><span><b>آمار و رکورد</b><small>پیشرفت محلی</small></span></div>
    </section>
    <footer><span className="footer-mark">ه‍</span><span>هفت‌خوان <small>نسخه آغازین · ۰.۱</small></span><button className="settings" onClick={() => setNotice("تنظیمات کامل در مراحل بعدی پیاده‌سازی می‌شوند.")}><Settings2 size={16}/> تنظیمات</button></footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
