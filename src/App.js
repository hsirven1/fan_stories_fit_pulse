import { useState, useRef } from "react";
import html2canvas from "html2canvas";

const WRAPPED_DATA = {
  rides: 112,
  km: 387,
  co2: 58,
  neighborhood: "Riverside East",
  month: "August",
  style: "weekend",
  sponsor: "AssurPro",
};

const profileTitle = (data) => {
  if (data.rides > 150) return "THE OBSESSIVE";
  if (data.style === "commuter" && data.rides > 80) return "THE DAILY GRINDER";
  if (data.neighborhood === "Old Port") return "THE OLD PORT REGULAR";
  if (data.style === "weekend") return "THE WEEKEND WANDERER";
  if (data.rides < 30) return "THE OCCASIONAL ESCAPE";
  return "THE URBAN CYCLIST";
};

const DESCRIPTION_TEMPLATES = [
  (f) => `${f.neighborhood} felt the difference this ${f.month}. ${f.rides} rides in and you were just getting started.`,
  (f) => `You owned ${f.neighborhood} this ${f.month}. ${f.km}km of proof you mean business.`,
  (f) => `${f.month} was yours. ${f.rides} rides through ${f.neighborhood} and still counting.`,
  (f) => `The streets of ${f.neighborhood} remember every one of your ${f.rides} rides. ${f.month} was peak you.`,
  (f) => `${f.km}km clocked in ${f.neighborhood}. ${f.month} never knew what hit it.`,
];

const WRAPPED_DESC = DESCRIPTION_TEMPLATES[0](WRAPPED_DATA);
const WRAPPED_PHOTO = null;

const GOBIKE_SHARE_URL = "https://gobike.app/wrapped/2025";

const downloadPngBlob = (blob, filename = "gobike-2025-wrapped.png") => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Grain overlay using canvas-like SVG noise
const Grain = ({ opacity = 0.04 }) => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity, pointerEvents:"none", mixBlendMode:"overlay", zIndex:10 }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
);

// Abstract wave/shape bg
const WaveBg = ({ color, opacity = 0.12 }) => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:1 }} viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">
    <ellipse cx="320" cy="120" rx="220" ry="180" fill={color} opacity={opacity}/>
    <ellipse cx="60" cy="580" rx="180" ry="140" fill={color} opacity={opacity * 0.7}/>
    <ellipse cx="200" cy="350" rx="160" ry="120" fill={color} opacity={opacity * 0.4}/>
  </svg>
);

// GoBike logo: simple bike icon + wordmark
const GoBikeLogo = ({ color = "#fff", size = 1, hideSubtitle = false }) => {
  const s = size;
  return (
    <div style={{ display:"flex", alignItems:"center", gap: 9 * s }}>
      {/* Simple bike icon */}
      <svg width={38 * s} height={28 * s} viewBox="0 0 38 28" fill="none">
        {/* Rear wheel */}
        <circle cx="7" cy="20" r="6.5" stroke={color} strokeWidth="2" fill="none"/>
        {/* Front wheel */}
        <circle cx="31" cy="20" r="6.5" stroke={color} strokeWidth="2" fill="none"/>
        {/* Frame: chainstay bottom */}
        <line x1="7" y1="20" x2="19" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Frame: seat tube */}
        <line x1="19" y1="20" x2="17" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Frame: top tube / down tube to front */}
        <line x1="17" y1="10" x2="31" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Frame: down tube from head to bb */}
        <line x1="17" y1="10" x2="19" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        {/* Handlebar stem */}
        <line x1="31" y1="20" x2="29" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Handlebar bar */}
        <line x1="27" y1="10" x2="31.5" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        {/* Seat post */}
        <line x1="17" y1="10" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Saddle */}
        <line x1="13.5" y1="6" x2="18.5" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
      {/* Wordmark */}
      <div style={{ lineHeight: 1 }}>
        <span style={{
          fontFamily:"'Barlow Condensed',sans-serif",
          fontWeight: 800,
          fontSize: 20 * s,
          color,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          display: "block",
          lineHeight: 1,
        }}>
          Go<span style={{ fontWeight: 400, opacity: 0.7 }}>Bike</span>
        </span>
        {!hideSubtitle && <span style={{
          fontFamily:"'Inter',sans-serif",
          fontWeight: 400,
          fontSize: 9 * s,
          color,
          opacity: 0.45,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          display: "block",
          marginTop: 2,
        }}>2025 in Rides</span>}
      </div>
    </div>
  );
};

// Sponsor display — inline "Presented by X" in flashy accent color
const SponsorDisplay = ({ sponsor, large = false }) => (
  <div style={{ display:"inline-flex", alignItems:"center", gap: large ? 7 : 5 }}>
    <span style={{ fontFamily:"'Inter',sans-serif", fontSize: large ? 12 : 10, color:"rgba(255,255,255,0.45)", letterSpacing:1.5, textTransform:"uppercase" }}>Presented by</span>
    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize: large ? 22 : 15, color:"#FFD600", letterSpacing:0.5, textTransform:"uppercase" }}>{sponsor}</span>
  </div>
);

const slides = (data, desc, photo) => {
  const rank = `TOP ${Math.max(2, Math.min(99, 105 - Math.round(data.rides / 1.6)))}%`;
  const laps = Math.round(data.km / 5.1);

  return [
    // 0 — INTRO
    {
      bg: "#0057FF",
      textColor: "#fff",
      render: () => (
        <>
          <WaveBg color="#fff"/>
          <Grain opacity={0.05}/>
          {/* Giant bleed bike silhouette */}
          <div style={{ position:"absolute", right:-60, top:"50%", transform:"translateY(-55%)", opacity:0.07, zIndex:2, pointerEvents:"none" }}>
            <svg width="340" height="340" viewBox="0 0 100 100" fill="none">
              <circle cx="28" cy="65" r="22" stroke="#fff" strokeWidth="5" fill="none"/>
              {[0,60,120,180,240,300].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={28+6*Math.cos(r)} y1={65+6*Math.sin(r)} x2={28+22*Math.cos(r)} y2={65+22*Math.sin(r)} stroke="#fff" strokeWidth="2.5"/>})}
              <circle cx="72" cy="65" r="22" stroke="#fff" strokeWidth="5" fill="none"/>
              {[0,60,120,180,240,300].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={72+6*Math.cos(r)} y1={65+6*Math.sin(r)} x2={72+22*Math.cos(r)} y2={65+22*Math.sin(r)} stroke="#fff" strokeWidth="2.5"/>})}
              <polyline points="28,65 45,30 62,42 72,65" stroke="#fff" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
              <line x1="45" y1="30" x2="28" y2="65" stroke="#fff" strokeWidth="5" strokeLinecap="round"/>
              <line x1="62" y1="42" x2="72" y2="37" stroke="#fff" strokeWidth="5" strokeLinecap="round"/>
              <line x1="70" y1="37" x2="78" y2="39" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
              <line x1="45" y1="30" x2="45" y2="22" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
              <line x1="40" y1="22" x2="52" y2="22" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ position:"relative", zIndex:5, display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between" }}>
            <div style={{ height: 48 }}/>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:88, color:"#fff", lineHeight:0.88, letterSpacing:-2, textTransform:"uppercase", marginBottom:28 }}>
                YOUR<br/>YEAR<br/>IN<br/>RIDES.
              </div>
            </div>
            <div style={{ height:8 }}/>
          </div>
        </>
      )
    },

    // 1 — RIDES COUNT
    {
      bg: "#FF3B00",
      textColor: "#fff",
      render: () => (
        <>
          <Grain opacity={0.06}/>
          {/* Giant number bleeding off right */}
          <div style={{ position:"absolute", right:-20, top:"50%", transform:"translateY(-48%)", zIndex:2, pointerEvents:"none", lineHeight:0.8 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:280, color:"rgba(0,0,0,0.12)", letterSpacing:-10, display:"block" }}>
              {data.rides}
            </span>
          </div>
          <div style={{ position:"relative", zIndex:5, display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:2, marginTop:48 }}>This year you rode</div>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:160, color:"#fff", lineHeight:0.82, letterSpacing:-5, marginBottom:16 }}>
                {data.rides}
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:42, color:"rgba(255,255,255,0.9)", textTransform:"uppercase", lineHeight:1, marginBottom:32 }}>
                RIDES.
              </div>
              <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:12, padding:"16px 20px", display:"inline-flex", gap:8, alignItems:"center" }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14, color:"rgba(255,255,255,0.8)" }}>
                  That's {(data.rides / 365).toFixed(1)}x per day. Every. Single. Day.
                </span>
              </div>
            </div>
            <div style={{ height:4 }}/>
          </div>
        </>
      )
    },

    // 2 — KM
    {
      bg: "#0A0A0A",
      textColor: "#fff",
      render: () => (
        <>
          <Grain opacity={0.05}/>
          {/* Glowing line */}
          <div style={{ position:"absolute", left:0, right:0, top:"38%", height:1, background:"linear-gradient(90deg, transparent, #0057FF, transparent)", zIndex:2, opacity:0.6 }}/>
          <div style={{ position:"absolute", left:0, right:0, top:"38%", height:40, background:"linear-gradient(90deg, transparent, rgba(0,87,255,0.08), transparent)", zIndex:2 }}/>
          <div style={{ position:"relative", zIndex:5, display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:2, marginBottom:20, marginTop:48 }}>Distance covered</div>
              {/* Giant KM number */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:0 }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:148, color:"#0057FF", lineHeight:0.85, letterSpacing:-5 }}>{data.km}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:48, color:"rgba(255,255,255,0.3)", marginTop:24 }}>KM</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:28, color:"#fff", textTransform:"uppercase", lineHeight:1.2 }}>
                {laps} laps around<br/>{data.neighborhood}.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"16px 16px" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:36, color:"#0057FF", lineHeight:1 }}>{data.co2}kg</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>CO₂ saved</div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"16px 16px" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:36, color:"#0057FF", lineHeight:1 }}>{rank}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>City rank</div>
                </div>
              </div>
            </div>
            <div style={{ height:4 }}/>
          </div>
        </>
      )
    },

    // 3 — NEIGHBORHOOD
    {
      bg: "#1A0A3D",
      textColor: "#fff",
      render: () => (
        <>
          {/* Photo background */}
          {photo && (
            <div style={{
              position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
              backgroundImage:`url(${photo})`,
              backgroundSize:"cover", backgroundPosition:"center",
              filter:"brightness(0.35) saturate(0.8)",
            }}/>
          )}
          {/* Color overlay on top of photo */}
          <div style={{ position:"absolute", inset:0, background: photo ? "linear-gradient(180deg, rgba(26,10,61,0.5) 0%, rgba(26,10,61,0.85) 60%, #1A0A3D 100%)" : "transparent", zIndex:2, pointerEvents:"none" }}/>
          <Grain opacity={0.06}/>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 70% 30%, rgba(120,60,255,0.2) 0%, transparent 65%)", zIndex:3, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:5, display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:2, marginTop:48 }}>Your home turf</div>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:72, color:"#fff", lineHeight:0.9, letterSpacing:-1, textTransform:"uppercase", marginBottom:24 }}>
                {data.neighborhood.split(" ").map((w,i) => <span key={i} style={{ display:"block" }}>{w}</span>)}
              </div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:14, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:28 }}>
                Most of your rides started here. You put in the work every {data.month} and it showed.
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"16px", border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(12px)" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:34, color:"#B87FFF", lineHeight:1 }}>{data.month}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1.5, marginTop:4 }}>Peak month</div>
                </div>
                <div style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"16px", border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(12px)" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:34, color:"#B87FFF", lineHeight:1 }}>
                    {data.style === "commuter" ? "Daily" : data.style === "weekend" ? "Weekend" : "Social"}
                  </div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1.5, marginTop:4 }}>Rider type</div>
                </div>
              </div>
            </div>
            <div style={{ height:4 }}/>
          </div>
        </>
      )
    },

    // 4 — IDENTITY / AI DESC
    {
      bg: "#F5F0E8",
      textColor: "#0A0A0A",
      render: () => (
        <>
          <Grain opacity={0.04}/>
          <div style={{ position:"absolute", bottom:-20, left:-30, right:-30, height:280, background:"linear-gradient(180deg, transparent, rgba(0,87,255,0.08))", zIndex:2, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:5, display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:48 }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(0,0,0,0.35)", textTransform:"uppercase", letterSpacing:2 }}>Your 2025 identity</span>
            </div>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize: profileTitle(data).length > 16 ? 44 : 76, color:"#0A0A0A", lineHeight:0.88, letterSpacing:-1, textTransform:"uppercase", marginBottom:32 }}>
                {profileTitle(data).split(" ").map((w,i) => <span key={i} style={{ display:"block" }}>{w}</span>)}
              </div>
              {/* Wrapped description */}
              <div style={{ background:"#0057FF", borderRadius:16, padding:"22px 22px" }}>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:15, color:"#fff", lineHeight:1.75, fontWeight:300 }}>
                  "{desc || 'Your story is being crafted…'}"
                </p>
              </div>
            </div>
            <div style={{ height:4 }}/>
          </div>
        </>
      )
    },

    // 5 — SHARE CARD
    {
      bg: "#0A0A0A",
      textColor: "#fff",
      render: () => (
        <>
          <Grain opacity={0.06}/>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 85%, rgba(0,87,255,0.18) 0%, transparent 55%)", zIndex:2, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 80% 15%, rgba(255,59,0,0.1) 0%, transparent 55%)", zIndex:2, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:5, display:"flex", flexDirection:"column", height:"100%", gap:10, paddingBottom:8, overflow:"hidden" }}>

            {/* Header — GoBike + 2025 in Rides + AssurPro with separator */}
            <div style={{ paddingTop:14, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:5 }}>
              <GoBikeLogo color="rgba(255,255,255,0.95)" size={1.4} hideSubtitle/>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:34, color:"rgba(255,255,255,0.4)", lineHeight:1, letterSpacing:-1, textTransform:"uppercase" }}>2025 in Rides</div>
              <SponsorDisplay sponsor={data.sponsor} large/>
              <div style={{ width:"100%", height:1, background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", marginTop:4 }}/>
            </div>

            {/* Rider type */}
            <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 16px" }}>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1.5, marginBottom:3 }}>Rider type</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:28, color:"#fff", lineHeight:1 }}>{profileTitle(data)}</div>
            </div>

            {/* District image */}
            <div style={{ position:"relative", borderRadius:14, overflow:"hidden", height:120, flexShrink:0 }}>
              <img
                crossOrigin="anonymous"
                src="https://picsum.photos/seed/montreal-bike/800/500"
                alt={data.neighborhood}
                style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block" }}
              />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.72) 100%)" }}/>
              <div style={{ position:"absolute", bottom:10, left:14, right:14 }}>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:8, color:"rgba(255,255,255,0.5)", letterSpacing:2.5, textTransform:"uppercase", marginBottom:2 }}>Your neighbourhood</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:"#fff", lineHeight:1, letterSpacing:-0.3, textTransform:"uppercase" }}>{data.neighborhood}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2 }}>
              {[
                { val:data.rides, lbl:"rides", color:"#FF3B00" },
                { val:`${data.km}km`, lbl:"covered", color:"#0057FF" },
                { val:`${data.co2}kg`, lbl:"CO₂ saved", color:"#00C87A" },
                { val:rank, lbl:"city rank", color:"#B87FFF" },
              ].map((s,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.07)", padding:"10px 14px", borderRadius:i===0?"10px 0 0 0":i===1?"0 10px 0 0":i===2?"0 0 0 10px":"0 0 10px 0" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:s.color, lineHeight:1, letterSpacing:-0.5 }}>{s.val}</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:1.5, marginTop:3 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"auto" }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.2)", letterSpacing:1 }}>#GoBike2025</span>
            </div>
          </div>
        </>
      )
    },
  ];
};

export default function App() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dir, setDir] = useState(1);
  const touchStart = useRef(null);
  const shareCardRef = useRef(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const data = WRAPPED_DATA;
  const allSlides = slides(data, WRAPPED_DESC, WRAPPED_PHOTO);

  const goTo = (nextIdx) => {
    if (nextIdx < 0 || nextIdx >= allSlides.length) return;
    setDir(nextIdx > idx ? 1 : -1);
    setVisible(false);
    setTimeout(() => { setIdx(nextIdx); setVisible(true); }, 160);
  };

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) goTo(dx > 0 ? idx + 1 : idx - 1);
    touchStart.current = null;
  };

  const handleShare = async () => {
    const el = shareCardRef.current;
    if (!el || shareLoading) return;

    const title = "My GoBike 2025 Wrapped";
    const url = GOBIKE_SHARE_URL;

    setShareLoading(true);
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: "#0A0A0A",
        logging: false,
      });
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png");
      });
      const file = new File([blob], "gobike-2025-wrapped.png", { type: "image/png" });

      if (!navigator.share) {
        try {
          await navigator.clipboard.writeText(url);
          setCopyToast(true);
          setTimeout(() => setCopyToast(false), 2000);
        } catch (e) {
          console.error(e);
        }
        return;
      }

      const shareData = { title, url, files: [file] };
      const canShareFiles =
        typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] });

      if (!canShareFiles) {
        downloadPngBlob(blob);
        return;
      }

      try {
        await navigator.share(shareData);
      } catch (e) {
        if (e?.name === "AbortError") return;
        downloadPngBlob(blob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060606", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button{cursor:pointer;border:none;transition:opacity .15s,transform .1s}
        button:hover:not(:disabled){opacity:.85} button:active:not(:disabled){transform:scale(.98)}
        button:disabled{opacity:.75;cursor:wait}
      `}</style>

      <div style={{ width:"100%", maxWidth:390 }}>

        <div>
            <div
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              style={{ borderRadius:28, overflow:"hidden", height:620, position:"relative", boxShadow:"0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)", background: allSlides[idx].bg }}
            >
              <div
                ref={idx === allSlides.length - 1 ? shareCardRef : undefined}
                style={{
                  position:"absolute", inset:0, padding:"36px 30px 60px",
                  background: allSlides[idx].bg,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : `translateY(${dir*14}px)`,
                  transition:"opacity 0.16s ease, transform 0.16s ease",
                  zIndex:20,
                }}
              >
                {allSlides[idx].render()}
              </div>

              {/* Persistent logo + sponsor — top bar, hidden on last slide where it has its own header */}
              {idx < allSlides.length - 1 && (
              <div style={{ position:"absolute", top:22, left:24, right:24, zIndex:35, pointerEvents:"none", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <GoBikeLogo color={allSlides[idx].bg === "#F5F0E8" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.92)"} size={1.1}/>
                <SponsorDisplay sponsor={data.sponsor}/>
              </div>
              )}

              {/* Progress bar */}
              <div style={{ position:"absolute", bottom:24, left:30, right:30, display:"flex", gap:5, zIndex:30 }}>
                {allSlides.map((_,i) => (
                  <div key={i} onClick={()=>goTo(i)} style={{
                    flex:1, height:3, borderRadius:2, cursor:"pointer",
                    background: i <= idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                    transition:"background 0.25s",
                  }}/>
                ))}
              </div>

              {/* Tap zones */}
              <div onClick={()=>goTo(idx-1)} style={{ position:"absolute", left:0, top:0, width:"35%", height:"100%", zIndex:25, cursor:idx>0?"pointer":"default" }}/>
              <div onClick={()=>goTo(idx+1)} style={{ position:"absolute", right:0, top:0, width:"35%", height:"100%", zIndex:25, cursor:idx<allSlides.length-1?"pointer":"default" }}/>
            </div>

            {idx === allSlides.length - 1 && (
              <button type="button" disabled={shareLoading} onClick={handleShare} style={{
                width:"100%", marginTop:10,
                background:"#0057FF", color:"#fff",
                border:"none", borderRadius:10, padding:"15px 20px",
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:18, letterSpacing:1, textTransform:"uppercase",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10
              }}>
                {shareLoading ? (
                  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" style={{ animation:"spin 0.85s linear infinite" }}>
                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" strokeDasharray="66 200" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                )}
                Share my 2025 Recap
              </button>
            )}
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.15)", textAlign:"center", marginTop:10 }}>
              Tap sides or swipe to navigate
            </p>
          </div>
      </div>

      {copyToast && (
        <div
          role="status"
          style={{
            position:"fixed",
            bottom:"max(24px, env(safe-area-inset-bottom))",
            left:"50%",
            transform:"translateX(-50%)",
            zIndex:20000,
            background:"rgba(40,40,40,0.96)",
            color:"#fff",
            padding:"10px 22px",
            borderRadius:20,
            fontFamily:"'Inter',sans-serif",
            fontSize:14,
            fontWeight:500,
            boxShadow:"0 4px 24px rgba(0,0,0,0.35)",
            pointerEvents:"none",
          }}
        >
          Copied!
        </div>
      )}
    </div>
  );
}