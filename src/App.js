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

const WRAPPED_SHARE_URL = "https://freshplate.app/wrapped/2025";

const IconInstagram = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const IconTikTok = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25v-.74h-3.28v16.37a2.48 2.48 0 01-2.46 2.47 2.48 2.48 0 01-2.47-2.47 2.48 2.48 0 012.47-2.47c.26 0 .51.05.75.13v-3.35a6.27 6.27 0 00-.75-.05 5.87 5.87 0 105.87 5.87V9.51a8.52 8.52 0 004.64 1.37V7.89a4.96 4.96 0 01-2.83-.2z"/>
  </svg>
);

const IconWhatsApp = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const IconIMessage = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path fill="#fff" d="M12 3C7.03 3 3 6.58 3 11.07c0 2.47 1.21 4.68 3.1 6.11-.09.52-.33 1.88-.34 1.96 0 .12.06.22.15.28.09.06.2.07.3.02.11-.05 2.45-1.35 3.14-1.74.91.25 1.88.39 2.85.39 4.97 0 9-3.58 9-8.07C21 6.58 16.97 3 12 3z"/>
  </svg>
);

const IconLink = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
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
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [copyCopied, setCopyCopied] = useState(false);

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

  const captureAndDownload = async () => {
    const el = shareCardRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: "#0A0A0A",
        logging: false,
      });
      const a = document.createElement("a");
      a.download = "freshplate-2025.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(WRAPPED_SHARE_URL);
      setCopyCopied(true);
      setTimeout(() => setCopyCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060606", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes shareOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shareSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        button{cursor:pointer;border:none;transition:opacity .15s,transform .1s}
        button:hover{opacity:.85} button:active{transform:scale(.98)}
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
              <button type="button" onClick={() => setShareSheetOpen(true)} style={{
                width:"100%", marginTop:10,
                background:"#0057FF", color:"#fff",
                border:"none", borderRadius:10, padding:"15px 20px",
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:18, letterSpacing:1, textTransform:"uppercase",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share my 2025 Recap
              </button>
            )}
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.15)", textAlign:"center", marginTop:10 }}>
              Tap sides or swipe to navigate
            </p>
          </div>
      </div>

      {shareSheetOpen && (
        <div
          role="presentation"
          style={{
            position:"fixed",
            inset:0,
            zIndex:10000,
          }}
        >
          <div
            style={{
              position:"absolute",
              inset:0,
              background:"rgba(0,0,0,0.72)",
              animation:"shareOverlayIn 0.28s ease forwards",
            }}
            onClick={() => { setShareSheetOpen(false); setCopyCopied(false); }}
            aria-hidden
          />
          <div style={{
            position:"absolute",
            bottom:0,
            left:0,
            right:0,
            display:"flex",
            justifyContent:"center",
            pointerEvents:"none",
            paddingBottom:"max(12px, env(safe-area-inset-bottom))",
          }}>
            <div
              style={{
                pointerEvents:"auto",
                width:"100%",
                maxWidth:390,
                borderRadius:"14px 14px 0 0",
                background:"#1c1c1e",
                padding:"16px 14px 12px",
                animation:"shareSheetUp 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards",
                boxShadow:"0 -12px 40px rgba(0,0,0,0.45)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                fontFamily:"'Inter',sans-serif",
                fontSize:13,
                fontWeight:600,
                color:"rgba(255,255,255,0.45)",
                textAlign:"center",
                marginBottom:14,
                letterSpacing:0.3,
              }}>Share</div>

              <div style={{
                display:"flex",
                flexWrap:"wrap",
                justifyContent:"space-around",
                gap:"18px 12px",
                padding:"4px 4px 8px",
              }}>
                <button type="button" onClick={captureAndDownload} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                  background:"transparent", border:"none", padding:4, minWidth:68,
                  cursor:"pointer", color:"#fff",
                }}>
                  <div style={{
                    width:56, height:56, borderRadius:"50%",
                    background:"linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 4px 14px rgba(188,24,136,0.35)",
                  }}>
                    <IconInstagram size={30} />
                  </div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.85)" }}>Instagram</span>
                </button>

                <button type="button" onClick={captureAndDownload} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                  background:"transparent", border:"none", padding:4, minWidth:68,
                  cursor:"pointer", color:"#fff",
                }}>
                  <div style={{
                    width:56, height:56, borderRadius:"50%",
                    background:"#000000",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 4px 14px rgba(0,0,0,0.5)",
                  }}>
                    <IconTikTok size={28} />
                  </div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.85)" }}>TikTok</span>
                </button>

                <button type="button" onClick={captureAndDownload} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                  background:"transparent", border:"none", padding:4, minWidth:68,
                  cursor:"pointer", color:"#fff",
                }}>
                  <div style={{
                    width:56, height:56, borderRadius:"50%",
                    background:"#25D366",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 4px 14px rgba(37,211,102,0.35)",
                  }}>
                    <IconWhatsApp size={30} />
                  </div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.85)" }}>WhatsApp</span>
                </button>

                <button type="button" onClick={captureAndDownload} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                  background:"transparent", border:"none", padding:4, minWidth:68,
                  cursor:"pointer", color:"#fff",
                }}>
                  <div style={{
                    width:56, height:56, borderRadius:"50%",
                    background:"#34C759",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 4px 14px rgba(52,199,89,0.35)",
                  }}>
                    <IconIMessage size={28} />
                  </div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.85)" }}>iMessage</span>
                </button>

                <button type="button" onClick={handleCopyLink} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                  background:"transparent", border:"none", padding:4, minWidth:68,
                  cursor:"pointer", color:"#fff",
                  position:"relative",
                }}>
                  <div style={{
                    width:56, height:56, borderRadius:"50%",
                    background:"#8E8E93",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 4px 12px rgba(0,0,0,0.25)",
                  }}>
                    <IconLink size={24} />
                  </div>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,0.85)" }}>
                    {copyCopied ? "Copied!" : "Copy Link"}
                  </span>
                </button>
              </div>

              <button type="button" onClick={() => { setShareSheetOpen(false); setCopyCopied(false); }} style={{
                width:"100%",
                marginTop:10,
                padding:"14px 16px",
                borderRadius:12,
                background:"#2c2c2e",
                border:"none",
                color:"#0a84ff",
                fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif",
                fontSize:17,
                fontWeight:600,
                cursor:"pointer",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}