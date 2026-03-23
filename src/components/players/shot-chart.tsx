"use client";

import { useState, useEffect } from "react";
import {
  type ShotZoneData,
  type ZoneColorInfo,
  ZONES,
  getZoneColorInfo,
  generateMockShotData,
  generateMockShots,
  apiCoordsToSvg,
} from "@/lib/shot-chart-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IndividualShot {
  x: number;
  y: number;
  made: boolean;
  shotType?: string | null;
  quarter?: string | null;
  gameId?: string | null;
}

type ViewMode = "zone" | "scatter";

// ---------------------------------------------------------------------------
// SVG constants — NBA-accurate half-court
// ---------------------------------------------------------------------------
const W = 500;
const H = 470;
const COURT_L = 20;
const COURT_R = 480;
const COURT_T = 20;
const COURT_B = 460;
const BASKET_X = 250;
const BASKET_Y = 423;

const PAINT_W = 150;
const PAINT_H = 178;
const PAINT_L = BASKET_X - PAINT_W / 2;
const PAINT_R = BASKET_X + PAINT_W / 2;
const PAINT_T = COURT_B - PAINT_H;

const FT_R = 56;
const FT_Y = PAINT_T;
const RA_R = 37;
const ARC_R = 222;
const CORNER_3_X = 206;
const CORNER_3_L = BASKET_X - CORNER_3_X;
const CORNER_3_R = BASKET_X + CORNER_3_X;
const CORNER_3_DY = Math.sqrt(ARC_R * ARC_R - CORNER_3_X * CORNER_3_X);
const CORNER_3_TOP = BASKET_Y - CORNER_3_DY;
const CENTER_R = 56;
const BB_W = 56;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function arcPt(angleDeg: number, r: number = ARC_R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: BASKET_X + r * Math.cos(rad), y: BASKET_Y - r * Math.sin(rad) };
}

// ---------------------------------------------------------------------------
// Zone label positions & font sizes
// ---------------------------------------------------------------------------
const ZONE_LABEL_POS: Record<string, { x: number; y: number }> = {
  restrictedArea: { x: 250, y: 400 },
  paint:          { x: 250, y: 348 },
  midLeftBaseline:  { x: 115, y: 370 },
  midRightBaseline: { x: 385, y: 370 },
  midLeftElbow:     { x: 135, y: 258 },
  midRightElbow:    { x: 365, y: 258 },
  midTop:           { x: 250, y: 240 },
  corner3Left:      { x: 32,  y: 400 },
  corner3Right:     { x: 468, y: 400 },
  wing3Left:        { x: 55,  y: 285 },
  wing3Right:       { x: 445, y: 285 },
  top3Left:         { x: 135, y: 155 },
  top3Right:        { x: 365, y: 155 },
  deep3:            { x: 250, y: 52 },
};

const ZONE_FONT: Record<string, number> = {
  restrictedArea: 14, paint: 16, midLeftBaseline: 12, midRightBaseline: 12,
  midLeftElbow: 11, midRightElbow: 11, midTop: 16,
  corner3Left: 11, corner3Right: 11, wing3Left: 12, wing3Right: 12,
  top3Left: 13, top3Right: 13, deep3: 13,
};

const STAT_FONT = "var(--font-oswald), Oswald, sans-serif";

// ---------------------------------------------------------------------------
// Zone paths
// ---------------------------------------------------------------------------
function buildZonePaths(): Record<string, string> {
  const raL = BASKET_X - RA_R, raR = BASKET_X + RA_R;

  const paintDy = Math.sqrt(ARC_R * ARC_R - (PAINT_W / 2) * (PAINT_W / 2));
  const paintArcL = { x: PAINT_L, y: BASKET_Y - paintDy };
  const paintArcR = { x: PAINT_R, y: BASKET_Y - paintDy };

  const ftDx = Math.sqrt(ARC_R * ARC_R - (BASKET_Y - PAINT_T) * (BASKET_Y - PAINT_T));
  const ftArcL = { x: BASKET_X - ftDx, y: PAINT_T };
  const ftArcR = { x: BASKET_X + ftDx, y: PAINT_T };

  const arcTop = arcPt(90);
  const WING_ANGLE = 65;
  const wingTopL = arcPt(180 - WING_ANGLE);
  const wingTopR = arcPt(WING_ANGLE);
  const deepY = COURT_T + 70;

  const p: Record<string, string> = {};

  p.restrictedArea = `M ${raL} ${BASKET_Y} A ${RA_R} ${RA_R} 0 0 1 ${raR} ${BASKET_Y} Z`;

  p.paint = `M ${PAINT_L} ${COURT_B} L ${PAINT_L} ${PAINT_T} L ${PAINT_R} ${PAINT_T} L ${PAINT_R} ${COURT_B} L ${raR} ${BASKET_Y} A ${RA_R} ${RA_R} 0 0 0 ${raL} ${BASKET_Y} L ${PAINT_L} ${COURT_B} Z`;

  p.midLeftBaseline = [
    `M ${PAINT_L} ${COURT_B}`,
    `L ${CORNER_3_L} ${COURT_B}`,
    `L ${CORNER_3_L} ${CORNER_3_TOP}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${ftArcL.x} ${ftArcL.y}`,
    `L ${PAINT_L} ${PAINT_T}`,
    `L ${PAINT_L} ${COURT_B} Z`,
  ].join(" ");

  p.midRightBaseline = [
    `M ${PAINT_R} ${COURT_B}`,
    `L ${PAINT_R} ${PAINT_T}`,
    `L ${ftArcR.x} ${ftArcR.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${CORNER_3_R} ${CORNER_3_TOP}`,
    `L ${CORNER_3_R} ${COURT_B}`,
    `L ${PAINT_R} ${COURT_B} Z`,
  ].join(" ");

  p.midLeftElbow = [
    `M ${PAINT_L} ${PAINT_T}`,
    `L ${ftArcL.x} ${ftArcL.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${paintArcL.x} ${paintArcL.y}`,
    `L ${PAINT_L} ${PAINT_T} Z`,
  ].join(" ");

  p.midRightElbow = [
    `M ${PAINT_R} ${PAINT_T}`,
    `L ${paintArcR.x} ${paintArcR.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${ftArcR.x} ${ftArcR.y}`,
    `L ${PAINT_R} ${PAINT_T} Z`,
  ].join(" ");

  p.midTop = [
    `M ${PAINT_L} ${PAINT_T}`,
    `L ${paintArcL.x} ${paintArcL.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${paintArcR.x} ${paintArcR.y}`,
    `L ${PAINT_R} ${PAINT_T}`,
    `L ${PAINT_L} ${PAINT_T} Z`,
  ].join(" ");

  p.corner3Left = `M ${COURT_L} ${COURT_B} L ${CORNER_3_L} ${COURT_B} L ${CORNER_3_L} ${CORNER_3_TOP} L ${COURT_L} ${CORNER_3_TOP} Z`;
  p.corner3Right = `M ${CORNER_3_R} ${COURT_B} L ${COURT_R} ${COURT_B} L ${COURT_R} ${CORNER_3_TOP} L ${CORNER_3_R} ${CORNER_3_TOP} Z`;

  p.wing3Left = [
    `M ${COURT_L} ${CORNER_3_TOP}`,
    `L ${CORNER_3_L} ${CORNER_3_TOP}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${wingTopL.x} ${wingTopL.y}`,
    `L ${COURT_L} ${wingTopL.y} Z`,
  ].join(" ");

  p.wing3Right = [
    `M ${CORNER_3_R} ${CORNER_3_TOP}`,
    `L ${COURT_R} ${CORNER_3_TOP}`,
    `L ${COURT_R} ${wingTopR.y}`,
    `L ${wingTopR.x} ${wingTopR.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${CORNER_3_R} ${CORNER_3_TOP} Z`,
  ].join(" ");

  p.top3Left = [
    `M ${COURT_L} ${wingTopL.y}`,
    `L ${wingTopL.x} ${wingTopL.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${arcTop.x} ${arcTop.y}`,
    `L ${BASKET_X} ${deepY}`,
    `L ${COURT_L} ${deepY} Z`,
  ].join(" ");

  p.top3Right = [
    `M ${arcTop.x} ${arcTop.y}`,
    `A ${ARC_R} ${ARC_R} 0 0 1 ${wingTopR.x} ${wingTopR.y}`,
    `L ${COURT_R} ${wingTopR.y}`,
    `L ${COURT_R} ${deepY}`,
    `L ${BASKET_X} ${deepY} Z`,
  ].join(" ");

  p.deep3 = `M ${COURT_L} ${COURT_T} L ${COURT_R} ${COURT_T} L ${COURT_R} ${deepY} L ${COURT_L} ${deepY} Z`;

  return p;
}

const ZONE_PATHS = buildZonePaths();

// ---------------------------------------------------------------------------
// SVG Filters — glow effects
// ---------------------------------------------------------------------------
function ShotChartDefs() {
  return (
    <defs>
      {/* Hot zone (emerald) soft glow */}
      <filter id="glow-pulse" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0.2 0 0 0 0  0 0.8 0 0 0.05  0 0 0.6 0 0  0 0 0 0.45 0" result="colorBlur" />
        <feComposite in="SourceGraphic" in2="colorBlur" operator="over" />
      </filter>

      {/* Cold zone (coral) subtle glow */}
      <filter id="glow-cold" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="0.9 0 0 0 0.05  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 0.35 0" result="colorBlur" />
        <feComposite in="SourceGraphic" in2="colorBlur" operator="over" />
      </filter>

      {/* Hover highlight */}
      <filter id="zone-hover" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.3" />
          <feFuncG type="linear" slope="1.3" />
          <feFuncB type="linear" slope="1.3" />
        </feComponentTransfer>
      </filter>

      {/* Text shadow for readability */}
      <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Clip path for court image */}
      <clipPath id="court-clip">
        <rect x={COURT_L} y={COURT_T} width={COURT_R - COURT_L} height={COURT_B - COURT_T} />
      </clipPath>

      {/* Clip path for scatter dots — inset well within court lines */}
      <clipPath id="scatter-clip">
        <rect x={COURT_L + 15} y={COURT_T + 15} width={COURT_R - COURT_L - 30} height={COURT_B - COURT_T - 30} rx={4} />
      </clipPath>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Court lines
// ---------------------------------------------------------------------------
function CourtLines() {
  return (
    <g stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} fill="none" className="pointer-events-none">
      <rect x={COURT_L} y={COURT_T} width={COURT_R - COURT_L} height={COURT_B - COURT_T} />
      <rect x={PAINT_L} y={PAINT_T} width={PAINT_W} height={PAINT_H} />
      <path d={`M ${BASKET_X - FT_R} ${FT_Y} A ${FT_R} ${FT_R} 0 0 1 ${BASKET_X + FT_R} ${FT_Y}`} />
      <path d={`M ${BASKET_X - FT_R} ${FT_Y} A ${FT_R} ${FT_R} 0 0 0 ${BASKET_X + FT_R} ${FT_Y}`} strokeDasharray="6 4" opacity={0.3} strokeWidth={1} />
      <path d={`M ${BASKET_X - RA_R} ${BASKET_Y} A ${RA_R} ${RA_R} 0 0 1 ${BASKET_X + RA_R} ${BASKET_Y}`} />
      <path d={`M ${CORNER_3_L} ${COURT_B} L ${CORNER_3_L} ${CORNER_3_TOP} A ${ARC_R} ${ARC_R} 0 0 1 ${CORNER_3_R} ${CORNER_3_TOP} L ${CORNER_3_R} ${COURT_B}`} />
      <path d={`M ${BASKET_X - CENTER_R} ${COURT_T} A ${CENTER_R} ${CENTER_R} 0 0 0 ${BASKET_X + CENTER_R} ${COURT_T}`} />
      {[PAINT_T + 55, PAINT_T + 95, PAINT_T + 130, PAINT_T + 155].map((hy, i) => (
        <g key={`h-${i}`}>
          <line x1={PAINT_L - 8} y1={hy} x2={PAINT_L} y2={hy} />
          <line x1={PAINT_R} y1={hy} x2={PAINT_R + 8} y2={hy} />
        </g>
      ))}
      <line x1={BASKET_X - BB_W / 2} y1={442} x2={BASKET_X + BB_W / 2} y2={442} strokeWidth={3} opacity={0.6} />
      <circle cx={BASKET_X} cy={BASKET_Y} r={8} stroke="#ff6b35" strokeWidth={2} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Animated zone fill
// ---------------------------------------------------------------------------
function ZoneFill({
  zoneId,
  path,
  colorInfo,
  isHovered,
  onHover,
  onLeave,
}: {
  zoneId: string;
  path: string;
  colorInfo: ZoneColorInfo;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const filterMap: Record<string, string> = {
    hot: "url(#glow-pulse)",
    neutral: "",
    cold: "url(#glow-cold)",
  };

  const baseFilter = filterMap[colorInfo.tier] || "";
  const filter = isHovered ? "url(#zone-hover)" : baseFilter;

  return (
    <path
      d={path}
      fill={colorInfo.fill}
      opacity={isHovered ? 1 : 0.85}
      filter={filter || undefined}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        cursor: "pointer",
        transition: "opacity 0.2s ease, filter 0.2s ease",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Zone label with hover animation
// ---------------------------------------------------------------------------
function ZoneLabel({
  zoneId,
  data,
  isHovered,
}: {
  zoneId: string;
  data: ShotZoneData;
  isHovered: boolean;
}) {
  if (data.fga === 0) return null;
  const pos = ZONE_LABEL_POS[zoneId];
  if (!pos) return null;
  const fs = ZONE_FONT[zoneId] ?? 12;

  return (
    <g
      className="pointer-events-none select-none"
      style={{
        transition: "transform 0.2s ease, opacity 0.2s ease",
        transform: isHovered ? "scale(1.15)" : "scale(1)",
        transformOrigin: `${pos.x}px ${pos.y}px`,
        opacity: isHovered ? 1 : 0.9,
      }}
    >
      {/* FG% */}
      <text
        x={pos.x} y={pos.y - fs * 0.55}
        textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={fs} fontWeight="700"
        fontFamily={STAT_FONT}
        filter={isHovered ? "url(#text-glow)" : undefined}
        stroke="rgba(0,0,0,0.5)" strokeWidth={2} paintOrder="stroke"
      >
        {data.fgPct}%
      </text>
      {/* FGM/FGA */}
      <text
        x={pos.x} y={pos.y + fs * 0.55}
        textAnchor="middle" dominantBaseline="central"
        fill="rgba(255,255,255,0.85)" fontSize={fs - 2} fontWeight="500"
        fontFamily={STAT_FONT}
        stroke="rgba(0,0,0,0.5)" strokeWidth={2} paintOrder="stroke"
      >
        {data.fgm}/{data.fga}
      </text>
      {/* Extra detail on hover */}
      {isHovered && (
        <text
          x={pos.x} y={pos.y + fs * 1.6}
          textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.6)" fontSize={fs - 3}
          fontFamily={STAT_FONT}
          stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} paintOrder="stroke"
        >
          avg {data.leagueAvgPct}%
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Scatter overlay
// ---------------------------------------------------------------------------
function ScatterOverlay({ shots }: { shots: IndividualShot[] }) {
  return (
    <g>
      {shots.map((shot, i) => {
        const { x, y } = apiCoordsToSvg(shot.x, shot.y);
        if (shot.made) {
          return <circle key={i} cx={x} cy={y} r={4} fill="#4ade80" opacity={0.8} stroke="#166534" strokeWidth={0.5} />;
        }
        const s = 3.5;
        return (
          <g key={i} opacity={0.8}>
            <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke="#f87171" strokeWidth={1.5} />
            <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke="#f87171" strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------
function ViewToggle({ mode, onChange, scatterDisabled, locale }: {
  mode: ViewMode; onChange: (m: ViewMode) => void; scatterDisabled: boolean; locale: string;
}) {
  const isZh = locale === "zh-TW";
  return (
    <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
      <button onClick={() => onChange("zone")}
        className={`px-3 py-1.5 transition-colors ${mode === "zone" ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-white/5"}`}>
        {isZh ? "區域" : "Zone"}
      </button>
      <button onClick={() => !scatterDisabled && onChange("scatter")} disabled={scatterDisabled}
        className={`px-3 py-1.5 transition-colors ${mode === "scatter" ? "bg-primary/20 text-primary font-medium" : scatterDisabled ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:bg-white/5"}`}
        title={scatterDisabled ? (isZh ? "需要真實數據" : "Requires real data") : ""}>
        {isZh ? "散佈圖" : "Scatter"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------
function ZoneLegend({ locale }: { locale: string }) {
  const isZh = locale === "zh-TW";
  const items = [
    { color: "#34d399", label: isZh ? "高於平均" : "Above Avg" },
    { color: "#94a3b8", label: isZh ? "接近平均" : "Near Avg" },
    { color: "#f87171", label: isZh ? "低於平均" : "Below Avg" },
  ];
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {items.map((item) => (
        <span key={item.color} className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}80` }}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ShotChart({
  position, locale, zones: externalZones, shots: externalShots,
  teamAbbreviation,
}: {
  position: string | null; locale: string;
  zones?: ShotZoneData[]; shots?: IndividualShot[];
  teamAbbreviation?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("zone");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [courtImgError, setCourtImgError] = useState(false);
  const courtImgSrc = teamAbbreviation ? `/courts/${teamAbbreviation}.png` : null;
  const showCourtImg = viewMode === "scatter" && courtImgSrc && !courtImgError;

  // Reset image error when team changes
  useEffect(() => { setCourtImgError(false); }, [teamAbbreviation]);
  const isZh = locale === "zh-TW";

  const zones = externalZones ?? generateMockShotData(position);
  const hasRealShots = !!externalShots && externalShots.length > 0;
  const mockShots = !hasRealShots ? generateMockShots(position) : null;
  const zoneMap = new Map(zones.map((z) => [z.zoneId, z]));

  // Pre-compute color info for all zones
  const zoneColors = new Map<string, ZoneColorInfo>();
  for (const z of zones) {
    zoneColors.set(z.zoneId, getZoneColorInfo(z.fgPct, z.leagueAvgPct));
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle + legend */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <ViewToggle mode={viewMode} onChange={setViewMode} scatterDisabled={false} locale={locale} />
        {viewMode === "zone" && <ZoneLegend locale={locale} />}
        {viewMode === "scatter" && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
              {isZh ? "進球" : "Made"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 text-[#f87171] font-bold leading-none">x</span>
              {isZh ? "未進" : "Miss"}
            </span>
          </div>
        )}
      </div>

      {/* Court SVG */}
      <div className="w-full max-w-[520px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <ShotChartDefs />

          {/* Background */}
          <rect x="0" y="0" width={W} height={H} rx="8" fill="#0f0f1a" />

          {/* Court background — real image (scatter) or dark fill (zone) */}
          {showCourtImg ? (
            <image
              href={courtImgSrc}
              x={COURT_L} y={COURT_T}
              width={COURT_R - COURT_L} height={COURT_B - COURT_T}
              preserveAspectRatio="none"
              onError={() => setCourtImgError(true)}
            />
          ) : (
            <rect x={COURT_L} y={COURT_T} width={COURT_R - COURT_L} height={COURT_B - COURT_T}
              fill="#141428" rx="2" />
          )}

          {/* Zone fills with glow */}
          {viewMode === "zone" &&
            ZONES.map((zoneDef) => {
              const data = zoneMap.get(zoneDef.id);
              if (!data) return null;
              const path = ZONE_PATHS[zoneDef.id];
              if (!path) return null;
              const colorInfo = zoneColors.get(zoneDef.id);
              if (!colorInfo) return null;
              return (
                <ZoneFill
                  key={zoneDef.id}
                  zoneId={zoneDef.id}
                  path={path}
                  colorInfo={colorInfo}
                  isHovered={hoveredZone === zoneDef.id}
                  onHover={() => setHoveredZone(zoneDef.id)}
                  onLeave={() => setHoveredZone(null)}
                />
              );
            })}

          {/* Court lines — hidden when real court image is shown */}
          {!showCourtImg && <CourtLines />}

          {/* Data labels */}
          {viewMode === "zone" &&
            ZONES.map((zoneDef) => {
              const data = zoneMap.get(zoneDef.id);
              if (!data) return null;
              return (
                <ZoneLabel
                  key={`label-${zoneDef.id}`}
                  zoneId={zoneDef.id}
                  data={data}
                  isHovered={hoveredZone === zoneDef.id}
                />
              );
            })}

          {/* Scatter overlay — clipped to court interior */}
          {viewMode === "scatter" && (
            <g clipPath="url(#scatter-clip)">
              {hasRealShots && <ScatterOverlay shots={externalShots} />}
              {!hasRealShots && mockShots && mockShots.map((shot, i) => {
                if (shot.made) {
                  return <circle key={i} cx={shot.x} cy={shot.y} r={4} fill="#4ade80" opacity={0.8} stroke="#166534" strokeWidth={0.5} />;
                }
                const s = 3.5;
                return (
                  <g key={i} opacity={0.8}>
                    <line x1={shot.x - s} y1={shot.y - s} x2={shot.x + s} y2={shot.y + s} stroke="#f87171" strokeWidth={1.5} />
                    <line x1={shot.x + s} y1={shot.y - s} x2={shot.x - s} y2={shot.y + s} stroke="#f87171" strokeWidth={1.5} />
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Hover tooltip below chart */}
      {viewMode === "zone" && hoveredZone && (() => {
        const data = zoneMap.get(hoveredZone);
        const zoneDef = ZONES.find((z) => z.id === hoveredZone);
        if (!data || !zoneDef) return null;
        const colorInfo = zoneColors.get(hoveredZone);
        const delta = data.fgPct - data.leagueAvgPct;
        const sign = delta > 0 ? "+" : "";
        return (
          <div className="text-xs text-center animate-in fade-in duration-150 slide-in-from-bottom-1">
            <span className="font-medium" style={{ color: colorInfo?.fill }}>
              {isZh ? zoneDef.nameZh : zoneDef.name}
            </span>
            <span className="text-muted-foreground mx-2">|</span>
            <span className="text-white font-bold">{data.fgPct}%</span>
            <span className="text-muted-foreground ml-1">({data.fgm}/{data.fga})</span>
            <span className="text-muted-foreground mx-2">|</span>
            <span style={{ color: delta > 0 ? "#34d399" : delta < 0 ? "#f87171" : "#94a3b8" }}>
              {sign}{delta.toFixed(1)}% vs avg
            </span>
          </div>
        );
      })()}

      {/* Scatter stats summary */}
      {viewMode === "scatter" && (() => {
        const shots = hasRealShots ? externalShots : mockShots;
        if (!shots || shots.length === 0) return null;
        const made = shots.filter((s) => s.made).length;
        return (
          <div className="text-xs text-muted-foreground">
            {made}/{shots.length}{" "}
            ({((made / shots.length) * 100).toFixed(1)}%)
          </div>
        );
      })()}
    </div>
  );
}
