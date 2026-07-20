import React, { useState, useEffect, useMemo } from "react";

// EXACT COPY OF DESIGN REFERENCE TOKENS AND FONTS
const TOKENS = {
  paper: "#F5F3EE",
  paperRaised: "#FBFAF7",
  ink: "#1B2430",
  inkMuted: "#6B7280",
  line: "#D8D3C7",
  seal: "#A6332F",
  sealBg: "#F3E4E2",
  verified: "#3F6B4F",
  verifiedBg: "#E4ECE6",
  citation: "#9C7A32",
  citationBg: "#F1E9D6",
};

const FONT_DISPLAY = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

// Mock data matching DesignReference
const TRANSACTIONS = Array.from({ length: 96 }, (_, i) => {
  const r = Math.random();
  const status = r < 0.08 ? "flagged" : r < 0.14 ? "pending" : "clean";
  return { id: `TXN-${1000 + i}`, status };
});

const CoverageStrip = () => {
  const [revealed, setRevealed] = useState(8); // starts at "5% sampled" cluster
  const total = TRANSACTIONS.length;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setRevealed(total); return; }
    let i = 8;
    const id = setInterval(() => {
      i += 4;
      setRevealed(Math.min(i, total));
      if (i >= total) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [total]);

  return (
    <div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {TRANSACTIONS.map((t, i) => {
          const on = i < revealed;
          const bg = !on ? TOKENS.paperRaised
            : t.status === "flagged" ? TOKENS.seal
            : t.status === "pending" ? "transparent"
            : TOKENS.paper;
          const border = `1px solid ${TOKENS.line}`;
          return (
            <div
              key={t.id}
              title={`${t.id} — ${on ? t.status : "queued"}`}
              style={{
                width: 8, height: 20, background: bg, border: border,
                transition: "background 0.25s ease", borderRadius: 1,
              }}
            />
          );
        })}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: TOKENS.inkMuted, marginTop: 10 }}>
        {revealed} / {total} transactions reviewed — {revealed >= total ? "100%" : Math.round((revealed / total) * 100) + "%"} coverage
        <span style={{ color: TOKENS.line }}> · </span>
        legacy manual sampling covered ~5%
      </div>
    </div>
  );
};

export default CoverageStrip;