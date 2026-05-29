import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";

/** Shown only during PNG capture (hidden from normal browsing). */
const SHARE_EXPORT_CTA = {
  line: "Try FitPulse today -- Use code PULSE2025 for 15% off your first month",
};

const WRAPPED_DATA = {
  classes: 187,
  calories: 94350,
  streak: 23,
  favorite_instructor: "Sarah M.",
  favorite_class: "HIIT",
  time_of_day: "Early Bird",
  personal_record: "847 output",
  style: "crusher",
};

const PROFILE_BY_STYLE = {
  crusher: {
    title: "THE CRUSHER",
    descriptions: [
      (f) => `${f.classes} classes. Zero excuses. You showed up heavy and left heavier — that's the crusher way.`,
      (f) => `Every rep counted. ${f.personal_record} wasn't luck — it was you refusing to tap out.`,
    ],
  },
  early_bird: {
    title: "THE EARLY BIRD",
    descriptions: [
      (f) => `While the city slept, you were already sweating. ${f.time_of_day} sessions, ${f.classes} times this year.`,
      (f) => `Alarm at dawn, PR by breakfast. ${f.streak}-day streaks don't build themselves before 7am.`,
    ],
  },
  comeback: {
    title: "THE COMEBACK KID",
    descriptions: [
      (f) => `You fell off. You came back harder. ${f.streak} days straight says everything they need to know.`,
      (f) => `The comeback wasn't quiet — ${f.classes} classes later and you're not the same person who walked in.`,
    ],
  },
  endurance: {
    title: "THE ENDURANCE MACHINE",
    descriptions: [
      (f) => `${f.calories.toLocaleString()} calories. ${f.classes} classes. You don't burn out — you burn through.`,
      (f) => `Long game energy. ${f.streak}-day streaks are just Tuesday for an endurance machine like you.`,
    ],
  },
  social: {
    title: "THE SOCIAL SWEATER",
    descriptions: [
      (f) => `You came for the workout, stayed for the crew. ${f.favorite_instructor}'s class? Basically your second living room.`,
      (f) => `${f.classes} classes and counting — every session with ${f.favorite_class} was a group chat IRL.`,
    ],
  },
};

const profileMeta = (data) => {
  const key = data.style in PROFILE_BY_STYLE ? data.style : "crusher";
  const profile = PROFILE_BY_STYLE[key];
  const desc = profile.descriptions[0](data);
  return { title: profile.title, desc, key };
};

const WRAPPED_META = profileMeta(WRAPPED_DATA);

const FITPULSE_SHARE_URL = "https://fitpulse.app/wrapped/2025";

const COLORS = {
  base: "#0A0A0A",
  orange: "#FF4800",
  red: "#C0392B",
};

/** Matches slide content padding so backgrounds can bleed to card edges. */
const SLIDE_PAD = { top: 36, right: 30, bottom: 60, left: 30 };

const isBrightSlideBg = (bg) => bg === COLORS.orange;

const FullBleedBg = ({ children, base = COLORS.base }) => (
  <div
    style={{
      position: "absolute",
      top: -SLIDE_PAD.top,
      left: -SLIDE_PAD.left,
      right: -SLIDE_PAD.right,
      bottom: -SLIDE_PAD.bottom,
      zIndex: 0,
      pointerEvents: "none",
      background: base,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

const downloadPngBlob = (blob, filename = "fitpulse-2025-wrapped.png") => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

function measureCaptureSubtreeSize(root) {
  const rootRect = root.getBoundingClientRect();
  let maxRight = rootRect.right;
  let maxBottom = rootRect.bottom;
  const nodes = root.querySelectorAll("*");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const r = node.getBoundingClientRect();
    const st = getComputedStyle(node);
    const mr = parseFloat(st.marginRight) || 0;
    const mb = parseFloat(st.marginBottom) || 0;
    maxRight = Math.max(maxRight, r.right + mr);
    maxBottom = Math.max(maxBottom, r.bottom + mb);
  }
  const w = Math.max(Math.ceil(maxRight - rootRect.left), 1);
  const h = Math.max(Math.ceil(maxBottom - rootRect.top), 1);
  return { width: w, height: h };
}

const Grain = ({ opacity = 0.04 }) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none", mixBlendMode: "overlay", zIndex: 10 }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

const PulseBg = ({ color = COLORS.orange, opacity = 0.14 }) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">
    <ellipse cx="300" cy="100" rx="200" ry="160" fill={color} opacity={opacity} />
    <ellipse cx="70" cy="600" rx="170" ry="130" fill={color} opacity={opacity * 0.65} />
    <ellipse cx="195" cy="360" rx="140" ry="100" fill={COLORS.red} opacity={opacity * 0.35} />
  </svg>
);

const LightningIcon = ({ color = "#fff", size = 1 }) => (
  <svg width={28 * size} height={34 * size} viewBox="0 0 28 34" fill="none">
    <path
      d="M16 0L4 18h9l-3 16 18-22h-10L16 0z"
      fill={color}
      stroke={color}
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
  </svg>
);

const FlameIcon = ({ color = COLORS.orange, size = 1, opacity = 1 }) => (
  <svg width={32 * size} height={40 * size} viewBox="0 0 32 40" fill="none" style={{ opacity }}>
    <path
      d="M16 38C16 38 4 28 4 16C4 8 10 2 16 0C22 2 28 8 28 16C28 28 16 38 16 38Z"
      fill={color}
      opacity="0.25"
    />
    <path
      d="M16 34C16 34 8 26 8 17C8 11 12 6 16 4C20 6 24 11 24 17C24 26 16 34 16 34Z"
      fill={color}
    />
    <ellipse cx="16" cy="22" rx="4" ry="6" fill="#FFD4A8" opacity="0.85" />
  </svg>
);

const FitPulseLogo = ({ color = "#fff", size = 1, hideSubtitle = false, onBrightBg = false }) => {
  const ink = onBrightBg ? COLORS.base : color;
  const accent = onBrightBg ? COLORS.base : COLORS.orange;
  const bolt = onBrightBg ? COLORS.base : COLORS.orange;

  return (
  <div style={{ display: "flex", alignItems: "center", gap: 9 * size }}>
    <LightningIcon color={bolt} size={size * 1.1} />
    <div style={{ lineHeight: 1 }}>
      <span
        style={{
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 900,
          fontSize: 20 * size,
          color: ink,
          letterSpacing: 1,
          textTransform: "uppercase",
          display: "block",
          lineHeight: 1,
        }}
      >
        Fit<span style={{ color: accent }}>Pulse</span>
      </span>
      {!hideSubtitle && (
        <span
          style={{
            fontFamily: "'Inter',sans-serif",
            fontWeight: 400,
            fontSize: 9 * size,
            color: ink,
            opacity: onBrightBg ? 0.55 : 0.45,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            display: "block",
            marginTop: 2,
          }}
        >
          Your 2025 gains
        </span>
      )}
    </div>
  </div>
  );
};

const formatCalories = (n) => n.toLocaleString("en-US");

const slides = (data, meta, shareCaptureActive) => {
  const perWeek = (data.classes / 52).toFixed(1);

  return [
    // 0 — INTRO
    {
      bg: COLORS.base,
      textColor: "#fff",
      render: () => (
        <>
          <PulseBg color={COLORS.orange} opacity={0.16} />
          <Grain opacity={0.05} />
          <div style={{ position: "absolute", right: -30, top: "42%", transform: "translateY(-50%)", opacity: 0.08, zIndex: 2, pointerEvents: "none" }}>
            <LightningIcon color={COLORS.orange} size={12} />
          </div>
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ height: 48 }} />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 900,
                  fontSize: 86,
                  color: "#fff",
                  lineHeight: 0.88,
                  letterSpacing: -2,
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                YOUR
                <br />
                YEAR
                <br />
                IN
                <br />
                <span style={{ color: COLORS.orange }}>SWEAT.</span>
              </div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 280 }}>
                Your 2025 studio story — class by class, rep by rep.
              </p>
            </div>
            <div style={{ height: 8 }} />
          </div>
        </>
      ),
    },

    // 1 — CLASSES
    {
      bg: COLORS.orange,
      textColor: "#fff",
      render: () => (
        <>
          <Grain opacity={0.06} />
          <div style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-48%)", zIndex: 2, pointerEvents: "none", lineHeight: 0.8 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 280, color: "rgba(0,0,0,0.12)", letterSpacing: -10, display: "block" }}>
              {data.classes}
            </span>
          </div>
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 2, marginTop: 48 }}>
              Classes attended
            </div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 160, color: "#fff", lineHeight: 0.82, letterSpacing: -5, marginBottom: 16 }}>
                {data.classes}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 42, color: "rgba(255,255,255,0.95)", textTransform: "uppercase", lineHeight: 1, marginBottom: 32 }}>
                CLASSES.
              </div>
              <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 12, padding: "16px 20px", display: "inline-flex" }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                  That's {perWeek} classes a week. You didn't miss — you committed.
                </span>
              </div>
            </div>
            <div style={{ height: 4 }} />
          </div>
        </>
      ),
    },

    // 2 — CALORIES
    {
      bg: COLORS.base,
      textColor: "#fff",
      render: () => (
        <>
          <Grain opacity={0.05} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "38%", height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.orange}, transparent)`, zIndex: 2, opacity: 0.7 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "38%", height: 40, background: `linear-gradient(90deg, transparent, rgba(255,72,0,0.1), transparent)`, zIndex: 2 }} />
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20, marginTop: 48 }}>
                Calories burned
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 4 }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 88, color: COLORS.orange, lineHeight: 0.85, letterSpacing: -3 }}>
                  {formatCalories(data.calories)}
                </span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: "rgba(255,255,255,0.35)", marginTop: 8, textTransform: "uppercase" }}>
                CAL
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: "#fff", textTransform: "uppercase", lineHeight: 1.15 }}>
                Enough fuel burned
                <br />
                to power a week of HIIT.
              </div>
              <div style={{ background: "rgba(255,72,0,0.12)", border: `1px solid rgba(255,72,0,0.25)`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 34, color: COLORS.orange, lineHeight: 1 }}>
                  {Math.round(data.calories / data.classes)}
                </div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
                  Avg cal per class
                </div>
              </div>
            </div>
            <div style={{ height: 4 }} />
          </div>
        </>
      ),
    },

    // 3 — STREAK
    {
      bg: COLORS.red,
      textColor: "#fff",
      render: () => (
        <>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${COLORS.red} 0%, ${COLORS.base} 85%)`, zIndex: 0 }} />
          <PulseBg color="#FF6B35" opacity={0.2} />
          <Grain opacity={0.06} />
          <div style={{ position: "absolute", left: "50%", top: "18%", transform: "translateX(-50%)", zIndex: 2, opacity: 0.15, pointerEvents: "none" }}>
            <FlameIcon color="#fff" size={8} />
          </div>
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 2, marginTop: 48, display: "flex", alignItems: "center", gap: 8 }}>
              <FlameIcon color={COLORS.orange} size={0.55} />
              Longest streak
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <FlameIcon color={COLORS.orange} size={1.4} />
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 148, color: "#fff", lineHeight: 0.85, letterSpacing: -5 }}>
                  {data.streak}
                </div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 44, color: COLORS.orange, textTransform: "uppercase", lineHeight: 1, marginBottom: 28 }}>
                DAYS ON FIRE.
              </div>
              <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "16px 20px" }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>
                  {data.streak} consecutive days. No rest days in your vocabulary.
                </span>
              </div>
            </div>
            <div style={{ height: 4 }} />
          </div>
        </>
      ),
    },

    // 4 — FAVORITES
    {
      bg: COLORS.base,
      textColor: "#fff",
      render: () => (
        <>
          <PulseBg color={COLORS.red} opacity={0.12} />
          <Grain opacity={0.05} />
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginTop: 48 }}>
              Your studio favorites
            </div>
            <div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: COLORS.orange, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                Favorite instructor
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 64, color: "#fff", lineHeight: 0.92, letterSpacing: -1, marginBottom: 32 }}>
                {data.favorite_instructor}
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: COLORS.orange, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                Go-to class
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 72, color: COLORS.orange, lineHeight: 0.9, letterSpacing: -1, textTransform: "uppercase", marginBottom: 24 }}>
                {data.favorite_class}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,72,0,0.2)" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: "#fff", lineHeight: 1 }}>{data.time_of_day}</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>
                    Peak time
                  </div>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, border: "1px solid rgba(192,57,43,0.25)" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: COLORS.red, lineHeight: 1 }}>
                    {data.classes}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>
                    With them
                  </div>
                </div>
              </div>
            </div>
            <div style={{ height: 4 }} />
          </div>
        </>
      ),
    },

    // 5 — PERSONAL RECORD
    {
      bg: COLORS.orange,
      textColor: "#fff",
      render: () => (
        <>
          <Grain opacity={0.06} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(192,57,43,0.35) 0%, transparent 55%)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 2, marginTop: 48 }}>
              Peak performance
            </div>
            <div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                Personal record
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 72, color: "#fff", lineHeight: 0.9, letterSpacing: -2, textTransform: "uppercase", marginBottom: 28 }}>
                {data.personal_record.split(" ").map((w, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {w}
                  </span>
                ))}
              </div>
              <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.65, margin: 0 }}>
                  Your highest output of the year. The room felt it. You owned the leaderboard.
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 30, color: "#fff" }}>{data.streak}d</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 4 }}>
                  Best streak
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 30, color: "#fff" }}>{data.favorite_class}</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 4 }}>
                  PR class
                </div>
              </div>
            </div>
          </div>
        </>
      ),
    },

    // 6 — IDENTITY
    {
      bg: COLORS.base,
      textColor: "#fff",
      render: () => (
        <>
          <PulseBg color={COLORS.orange} opacity={0.1} />
          <Grain opacity={0.04} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: `linear-gradient(180deg, transparent, rgba(255,72,0,0.12))`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 2, marginTop: 48 }}>
              Your 2025 identity
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 900,
                  fontSize: meta.title.length > 18 ? 44 : 68,
                  color: COLORS.orange,
                  lineHeight: 0.88,
                  letterSpacing: -1,
                  textTransform: "uppercase",
                  marginBottom: 28,
                }}
              >
                {meta.title.split(" ").map((w, i) => (
                  <span key={i} style={{ display: "block", color: i === 0 ? "rgba(255,255,255,0.4)" : COLORS.orange }}>
                    {w}
                  </span>
                ))}
              </div>
              <div style={{ background: `linear-gradient(135deg, ${COLORS.red} 0%, ${COLORS.orange} 100%)`, borderRadius: 16, padding: "22px 22px" }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "#fff", lineHeight: 1.75, fontWeight: 400, margin: 0 }}>
                  "{meta.desc}"
                </p>
              </div>
            </div>
            <div style={{ height: 4 }} />
          </div>
        </>
      ),
    },

    // 7 — SHARE CARD
    {
      bg: COLORS.base,
      textColor: "#fff",
      render: () => (
        <>
          <FullBleedBg>
            <Grain opacity={0.06} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 80% at 20% 85%, rgba(255,72,0,0.28) 0%, transparent 55%)", zIndex: 1 }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 80% at 80% 15%, rgba(192,57,43,0.22) 0%, transparent 55%)", zIndex: 1 }} />
          </FullBleedBg>
          <div
            style={{
              position: "relative",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
              gap: 10,
              paddingBottom: 8,
              overflow: shareCaptureActive ? "visible" : "hidden",
            }}
          >
              <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 5 }}>
                <FitPulseLogo color="rgba(255,255,255,0.95)" size={1.4} hideSubtitle />
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 34, color: "rgba(255,255,255,0.4)", lineHeight: 1, letterSpacing: -1, textTransform: "uppercase" }}>
                  Your 2025 gains
                </div>
                <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,72,0,0.35), transparent)", marginTop: 4 }} />
              </div>

              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", border: `1px solid rgba(255,72,0,0.2)` }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>
                  Studio identity
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: COLORS.orange, lineHeight: 1.05 }}>{meta.title}</div>
                <p
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.55,
                    margin: 0,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  "{meta.desc}"
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {[
                  { val: data.classes, lbl: "classes", color: COLORS.orange },
                  { val: formatCalories(data.calories), lbl: "calories", color: "#fff" },
                  { val: `${data.streak}d`, lbl: "best streak", color: COLORS.red },
                  { val: data.personal_record, lbl: "personal record", color: COLORS.orange },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      padding: "10px 14px",
                      borderRadius: i === 0 ? "10px 0 0 0" : i === 1 ? "0 10px 0 0" : i === 2 ? "0 0 0 10px" : "0 0 10px 0",
                    }}
                  >
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: s.lbl === "personal record" ? 18 : 26, color: s.color, lineHeight: 1.1, letterSpacing: -0.5, textTransform: "uppercase" }}>
                      {s.val}
                    </div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 3 }}>
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "rgba(255,72,0,0.1)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,72,0,0.2)" }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                    Instructor
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", lineHeight: 1 }}>{data.favorite_instructor}</div>
                </div>
                <div style={{ background: "rgba(192,57,43,0.12)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(192,57,43,0.25)" }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                    Class · Time
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: COLORS.orange, lineHeight: 1 }}>
                    {data.favorite_class}
                  </div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{data.time_of_day}</div>
                </div>
              </div>

              {shareCaptureActive && (
                <div
                  aria-hidden
                  style={{
                    marginTop: 6,
                    borderRadius: 14,
                    padding: "16px 18px",
                    background: COLORS.orange,
                    boxShadow: "0 8px 24px rgba(255,72,0,0.35)",
                  }}
                >
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: "#fff", lineHeight: 1.55, fontWeight: 500, margin: 0, textAlign: "center" }}>
                    {SHARE_EXPORT_CTA.line}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>#FitPulse2025</span>
              </div>
          </div>
        </>
      ),
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
  const [copyToast, setCopyToast] = useState("");
  const [shareCaptureActive, setShareCaptureActive] = useState(false);

  const data = WRAPPED_DATA;
  const meta = WRAPPED_META;
  const allSlides = slides(data, meta, shareCaptureActive);

  const goTo = (nextIdx) => {
    if (nextIdx < 0 || nextIdx >= allSlides.length) return;
    setDir(nextIdx > idx ? 1 : -1);
    setVisible(false);
    setTimeout(() => {
      setIdx(nextIdx);
      setVisible(true);
    }, 160);
  };

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) goTo(dx > 0 ? idx + 1 : idx - 1);
    touchStart.current = null;
  };

  const handleShare = async () => {
    const el = shareCardRef.current;
    if (!el || shareLoading) return;

    const title = "My FitPulse — Your 2025 gains";
    const url = FITPULSE_SHARE_URL;
    const scale = 2;

    setShareLoading(true);
    try {
      flushSync(() => {
        setShareCaptureActive(true);
      });

      await new Promise((r) => setTimeout(r, 220));

      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch (_) {
          /* ignore */
        }
      }

      const { width: capW, height: capH } = measureCaptureSubtreeSize(el);

      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        scale,
        width: capW,
        height: capH,
        backgroundColor: COLORS.base,
        logging: false,
      });
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png");
      });
      const file = new File([blob], "fitpulse-2025-wrapped.png", { type: "image/png" });

      const tryCopyLink = async (message = "Link copied") => {
        try {
          await navigator.clipboard.writeText(url);
          setCopyToast(message);
          setTimeout(() => setCopyToast(""), 2200);
        } catch (e) {
          console.error(e);
        }
      };

      if (!navigator.share) {
        downloadPngBlob(blob);
        await tryCopyLink("Saved · link copied");
        return;
      }

      const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

      if (canShareFiles) {
        try {
          await navigator.share({ title, text: title, url, files: [file] });
        } catch (e) {
          if (e?.name === "AbortError") return;
          downloadPngBlob(blob);
          await tryCopyLink("Saved · link copied");
        }
        return;
      }

      downloadPngBlob(blob);
      await tryCopyLink("Saved · link copied");
    } catch (e) {
      console.error(e);
    } finally {
      flushSync(() => {
        setShareCaptureActive(false);
      });
      setShareLoading(false);
    }
  };

  const progressColor = (i) => (i <= idx ? COLORS.orange : "rgba(255,255,255,0.18)");

  return (
    <div style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        button{cursor:pointer;border:none;transition:opacity .15s,transform .1s}
        button:hover:not(:disabled){opacity:.85} button:active:not(:disabled){transform:scale(.98)}
        button:disabled{opacity:.75;cursor:wait}
      `}</style>

      <div style={{ width: "100%", maxWidth: 390 }}>
        <div>
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{
              borderRadius: 28,
              overflow: idx === allSlides.length - 1 && shareCaptureActive ? "visible" : "hidden",
              height: 620,
              position: "relative",
              boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,72,0,0.12)`,
              background: allSlides[idx].bg,
            }}
          >
            <div
              ref={idx === allSlides.length - 1 ? shareCardRef : undefined}
              style={{
                position: "absolute",
                ...(idx === allSlides.length - 1 && shareCaptureActive
                  ? { top: 0, left: 0, right: 0, bottom: "auto", minHeight: "100%", height: "auto" }
                  : { inset: 0 }),
                padding: "36px 30px 60px",
                background: allSlides[idx].bg,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : `translateY(${dir * 14}px)`,
                transition: "opacity 0.16s ease, transform 0.16s ease",
                zIndex: 20,
                overflow: idx === allSlides.length - 1 && shareCaptureActive ? "visible" : "hidden",
              }}
            >
              {allSlides[idx].render()}
            </div>

            {shareLoading && (
              <div
                aria-live="polite"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 80,
                  borderRadius: 28,
                  background: "rgba(6,6,6,0.85)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  padding: 24,
                  textAlign: "center",
                  pointerEvents: "all",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 100 100" fill="none" style={{ animation: "spin 0.85s linear infinite", color: COLORS.orange }}>
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" strokeDasharray="66 200" strokeLinecap="round" />
                </svg>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Preparing your recap…
                </span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)", maxWidth: 260, lineHeight: 1.5 }}>
                  One moment while we line everything up for sharing.
                </span>
              </div>
            )}

            {idx < allSlides.length - 1 && (
              <div style={{ position: "absolute", top: 22, left: 24, right: 24, zIndex: 35, pointerEvents: "none" }}>
                <FitPulseLogo color="rgba(255,255,255,0.92)" size={1.1} onBrightBg={isBrightSlideBg(allSlides[idx].bg)} />
              </div>
            )}

            <div style={{ position: "absolute", bottom: 24, left: 30, right: 30, display: "flex", gap: 5, zIndex: 30 }}>
              {allSlides.map((_, i) => (
                <div
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    cursor: "pointer",
                    background: progressColor(i),
                    transition: "background 0.25s",
                  }}
                />
              ))}
            </div>

            <div onClick={() => goTo(idx - 1)} style={{ position: "absolute", left: 0, top: 0, width: "35%", height: "100%", zIndex: 25, cursor: idx > 0 ? "pointer" : "default" }} />
            <div onClick={() => goTo(idx + 1)} style={{ position: "absolute", right: 0, top: 0, width: "35%", height: "100%", zIndex: 25, cursor: idx < allSlides.length - 1 ? "pointer" : "default" }} />
          </div>

          {idx === allSlides.length - 1 && (
            <button
              type="button"
              disabled={shareLoading}
              onClick={handleShare}
              style={{
                width: "100%",
                marginTop: 10,
                background: COLORS.orange,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "15px 20px",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: 1,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {shareLoading ? (
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none" style={{ animation: "spin 0.85s linear infinite" }}>
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" strokeDasharray="66 200" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
              Share my 2025 Recap
            </button>
          )}
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 10 }}>
            Tap sides or swipe to navigate
          </p>
        </div>
      </div>

      {copyToast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: "max(24px, env(safe-area-inset-bottom))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20000,
            background: "rgba(40,40,40,0.96)",
            color: "#fff",
            padding: "10px 22px",
            borderRadius: 20,
            fontFamily: "'Inter',sans-serif",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          {copyToast}
        </div>
      )}
    </div>
  );
}
