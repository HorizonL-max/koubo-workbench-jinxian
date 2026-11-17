import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../theme';
import {clamp01, EASE, mix, rand, rf, useF} from '../u';
import {EP, END} from '../ep/episode';

/**
 * C03 金粉扫字 → C01 顶牌（片头；之后全片常驻，EP.titleHides 里的区间让位）→（可选）C03 回扣：EP.titleOutro 片尾升回大标题、金粉带走第一行。
 * 每期只改 ep/episode.ts 的 title / titleStart / titleHides / titleOutro，不改这里。
 * 动效照 shotcraft title-demote-to-label：站稳 ≥18 帧（这里 37 帧）→ 降格 26 帧单次连续补间 bezier(.6,0,.18,1)，
 * 缩放和位移同一条曲线；降格路径上没有别的东西在动（零星金粉在降格前全部熄灭）。
 * 金粉 140 粒、固定种子；粉头沿 y=374 从 x=40 扫到 860（inOutCubic），第二行用随粉头走的遮罩（前沿羽化 60px）揭开。
 */
export const TITLE = EP.title;
// 大标题——左对齐 x=72；第二行下沿（BY+L2DY+104 = 414）要在近景头发顶之上（场地预设 cu_top_safe.text_bottom_max）
export const BX = 72, BY = 234, L2DY = 76; // 第一行 64px，第二行 104px 在块内 y=76
export const SMALL = {x: 88, y: 176, s: 28 / 64};
/** 顶牌托板宽：按两行字宽算（样片 7 字 = 360） */
export const PLATE_W = Math.max(360, Math.ceil(24 + Math.max(TITLE.l1.length * 68.5, TITLE.l2.length * 104) * SMALL.s + 18));
const T0 = EP.titleStart;
const SWEEP0 = T0 + 4, SWEEP1 = T0 + 32, DEM0 = T0 + 69, DEM = 26;
export const PLAQUE_IN = T0 + 84;
const HEAD_END = BX + TITLE.l2.length * 104 + 60;
const headX = (f: number) => (f <= SWEEP1 ? 40 + (HEAD_END - 40) * EASE.inOutC(clamp01((f - SWEEP0) / (SWEEP1 - SWEEP0))) : HEAD_END + 100 * EASE.outC(clamp01((f - SWEEP1) / 6)));
/** 片尾回扣从这一帧起接手（之前一切照常） */
export const TAKEOVER = EP.titleOutro ? EP.titleOutro.from : Infinity;
const HEAD_Y = BY + L2DY + 52;
// 每个字被粉头揭到的帧（字中心）
const CHAR_F = TITLE.l2.split('').map((_, k) => {
  const cx = BX + 104 * (k + 0.5);
  for (let f = SWEEP0; f <= SWEEP1 + 6; f += 0.25) if (headX(f) >= cx) return f;
  return SWEEP1;
});

type Dust = {s: number; life: number; x: number; y: number; vx: number; vy: number; r: number; c: string; star: boolean};
const COLS = ['#ffe9bf', '#e9c58a', '#c9a063'];
const DUST: Dust[] = Array.from({length: 140}, (_, i) => {
  const s = SWEEP0 + (SWEEP1 - SWEEP0) * (i / 140) + rand(i * 3.1) * 1.2;
  return {
    s, life: 14 + rand(i * 7.7) * 12,
    x: headX(s) + (rand(i * 1.3) - 0.5) * 60, y: HEAD_Y + (rand(i * 2.9) - 0.5) * 110,
    vx: -(1 + rand(i * 4.4) * 3), vy: 0.2 + rand(i * 5.5) * 0.9,
    r: 1.5 + rand(i * 6.6) * 3.5, c: COLS[Math.floor(rand(i * 8.8) * 3)], star: rand(i * 9.9) < 0.12,
  };
});
// 站稳期间零星落下的金粉（f34–56 生、寿命 ≤12 帧，降格 f69 前全部熄灭；只落 ≤30px，不到脸）
const FALL: Dust[] = Array.from({length: 9}, (_, i) => ({
  s: T0 + 34 + i * 2.6 + rand(i * 11.1) * 1.5, life: 9 + rand(i * 12.2) * 3,
  x: BX + 40 + rand(i * 13.3) * (TITLE.l2.length * 104 - 88), y: BY + L2DY + 30 + rand(i * 14.4) * 50, vx: -0.3, vy: 1.4 + rand(i * 15.5),
  r: 1.5 + rand(i * 16.6) * 2, c: COLS[i % 3], star: false,
}));

const Particle: React.FC<{d: Dust; f: number}> = ({d, f}) => {
  const a = f - d.s;
  if (a < 0 || a > d.life) return null;
  const u = a / d.life;
  const x = d.x + d.vx * a * (1 - u * 0.4), y = d.y + d.vy * a + 0.04 * a * a;
  const op = (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85) * 0.95;
  const r = d.r * (1 - u * 0.5);
  if (d.star) {
    const L = r * 3.2;
    return (
      <g opacity={op} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
        <rect x={-L} y={-0.6} width={2 * L} height={1.2} fill={d.c} />
        <rect x={-0.6} y={-L} width={1.2} height={2 * L} fill={d.c} />
        <circle r={r * 0.6} fill="#fff4dc" />
      </g>
    );
  }
  return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill={d.c} opacity={op} />;
};

/**
 * 顶牌让位：EP.titleHides 每段 [f0, f1, 淡出帧数(默认 hideDur；1 = 切镜那一帧就没), 窗口结束后淡入帧数(默认 0 = 直接在)]。
 * 夜青图解镜顶部有标注、聚光扫字、章节卡时让位；下一镜切回来时直接在。
 */
const HIDES = EP.titleHides;
export const TitlePlaque: React.FC<{hideDur?: number}> = ({hideDur = 6}) => {
  const f = useF();
  if (f >= TAKEOVER) return <TitleOutro f={f} />;
  if (f < T0) return null;
  const w = HIDES.find((h) => f >= h[0] && f < h[1]);
  const back = HIDES.find((h) => (h[3] ?? 0) > 0 && f >= h[1] && f < h[1] + (h[3] as number));
  const vis = w ? (w[2] === 1 ? 0 : 1 - clamp01((f - w[0]) / (w[2] ?? hideDur))) : back ? clamp01((f - back[1] + 1) / (back[3] as number)) : 1;
  if (vis <= 0) return null;
  const dem = rf(f, DEM0, DEM, EASE.demote); // 0 大标题 → 1 顶牌
  const s = mix(1, SMALL.s, dem);
  const tx = mix(BX, SMALL.x, dem), ty = mix(BY, SMALL.y, dem);
  // 第一行 blur-slide（f3–13）
  const p1 = rf(f, T0 + 3, 10, EASE.out);
  // 第二行遮罩
  const hx = headX(f) - BX; // 块内坐标
  const reveal = f >= SWEEP1 + 6 ? 'none' : `linear-gradient(90deg, #000 ${Math.max(0, hx - 30).toFixed(1)}px, transparent ${(hx + 30).toFixed(1)}px)`;
  const plateIn = rf(f, PLAQUE_IN, 12, EASE.outC);
  const barIn = rf(f, PLAQUE_IN + 2, 10, EASE.outC);
  const headOp = f < SWEEP0 ? 0 : f <= SWEEP1 ? Math.min(1, (f - SWEEP0) / 3) : 1 - clamp01((f - SWEEP1) / 6);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: vis}}>
      {/* 返修：大标题压在浅木书架上读不清 → 大标题期间左上一块柔和压暗（随降格淡掉，顶牌托板接手） */}
      {dem < 1 && f >= T0 && (
        <div style={{position: 'absolute', left: -120, top: 120, width: 1040, height: 400, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(20,13,7,.62) 0%, rgba(20,13,7,.45) 55%, rgba(20,13,7,0) 100%)', opacity: (1 - dem) * clamp01((f - T0) / 4)}} />
      )}
      {/* 顶牌托板 + 竖金条（降格末段淡入） */}
      {plateIn > 0 && (
        <div style={{position: 'absolute', left: 64, top: 168, width: PLATE_W, height: 102, borderRadius: 10, background: 'rgba(20,13,7,.72)', boxShadow: '0 0 6px 2px rgba(20,13,7,.5)', opacity: plateIn}} />
      )}
      {barIn > 0 && <div style={{position: 'absolute', left: 64, top: 172, width: 6, height: 94 * barIn, background: `linear-gradient(180deg, ${C.goldHi2}, ${C.gold} 60%, ${C.goldDark})`}} />}
      {/* 标题块：以左上为原点整体缩放 + 位移（同一条曲线） */}
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: dem >= 1 ? `translate(${SMALL.x}px, ${SMALL.y}px) scale(${SMALL.s})` : `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})`}}>
        <div style={{position: 'absolute', left: 0, top: (1 - p1) * 24, whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: 700, fontSize: 64, lineHeight: '64px', letterSpacing: 4.5, color: C.cream, textShadow: SOFT_SHADOW, opacity: p1, filter: p1 < 1 ? `blur(${((1 - p1) * 12).toFixed(2)}px)` : undefined}}>
          {TITLE.l1}
        </div>
        <div style={{position: 'absolute', left: 0, top: L2DY, whiteSpace: 'nowrap', display: 'flex', WebkitMaskImage: reveal, maskImage: reveal, filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))'}}>
          {TITLE.l2.split('').map((ch, k) => {
            const b = 10 * (1 - clamp01((f - CHAR_F[k]) / 6));
            return (
              <span key={k} style={{display: 'inline-block', width: 104, fontFamily: FONT.song, fontWeight: 900, fontSize: 104, lineHeight: '104px', ...GOLD_TEXT, filter: b > 0.01 ? `blur(${b.toFixed(2)}px)` : undefined}}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>
      {/* 金粉 */}
      {f < T0 + 70 && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id="dustHead">
              <stop offset="0%" stopColor="#fff1d0" stopOpacity={0.95} />
              <stop offset="35%" stopColor="#e9c58a" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#c9a063" stopOpacity={0} />
            </radialGradient>
          </defs>
          {headOp > 0 && <circle cx={headX(f)} cy={HEAD_Y} r={70} fill="url(#dustHead)" opacity={headOp} />}
          {DUST.map((d, i) => <Particle key={i} d={d} f={f} />)}
          {FALL.map((d, i) => <Particle key={'f' + i} d={d} f={f} />)}
        </svg>
      )}
    </AbsoluteFill>
  );
};

/* ═════════ C03 回扣：片尾升回大标题 + 金粉带走第一行（EP.titleOutro） ═════════
 * 样片 P64：顶牌 26 帧升回两行大标题（EASE.demote 倒放）→ 两行静止 ≥1s → sweepF 起 26 帧金粉扫第一行，三个字逐个碎（各 8 帧）、
 * 金粉 180 粒向右上飘（只用最亮两档金）→ 扫完主行胀一下 1→1.04→1（14 帧）。不要扫：titleOutro 里不给 sweepF，停在两行大标题。
 * 扫字最好落在句间气口里；扫完离片尾至少 1s（样片口播后另加了 45 帧尾巴）。 */
const OUT = EP.titleOutro;
const L1_CX = TITLE.l1.split('').map((_, k) => BX + (64 + 4.5) * (k + 0.5));
const SW = OUT?.sweepF !== undefined ? {f0: OUT.sweepF, dur: 26, x0: 40, x1: BX + TITLE.l1.length * 68.5 + 90, y: BY + 32} : null;
const sweepX = (f: number) => (SW ? mix(SW.x0, SW.x1, clamp01((f - SW.f0) / SW.dur)) : -999);
const CHAR_GONE = L1_CX.map((cx) => {
  if (!SW) return Infinity;
  for (let f = SW.f0; f <= SW.f0 + SW.dur; f += 0.25) if (sweepX(f) >= cx) return f;
  return SW.f0 + SW.dur;
});
const OCOLS = ['#fff1d0', '#ffe9bf'];
const ODUST = SW
  ? Array.from({length: 60 * TITLE.l1.length}, (_, i) => {
      const k = i % TITLE.l1.length;
      return {
        s: CHAR_GONE[k] + rand(i * 2.7) * 8, life: 16 + rand(i * 7.1) * 14, x: L1_CX[k] + (rand(i * 1.9) - 0.5) * 64, y: BY + 6 + rand(i * 3.3) * 56,
        vx: 1.5 + rand(i * 4.4) * 3.5, vy: -(0.6 + rand(i * 5.5) * 2.2), r: 2.1 + rand(i * 6.6) * 4.5, c: OCOLS[Math.floor(rand(i * 8.8) * 2)], star: rand(i * 9.9) < 0.14,
      };
    })
  : [];
const TitleOutro: React.FC<{f: number}> = ({f}) => {
  if (!OUT || f >= END) return null;
  const plate = 1 - rf(f, OUT.from, 8, EASE.lin);
  const dem = EASE.demote(1 - clamp01((f - OUT.from) / 26)); // 1 = 顶牌 → 0 = 大标题
  const s = mix(1, SMALL.s, dem);
  const tx = mix(BX, SMALL.x, dem), ty = mix(BY, SMALL.y, dem);
  const headOp = !SW || f < SW.f0 ? 0 : f <= SW.f0 + SW.dur ? Math.min(1, (f - SW.f0) / 3) : 1 - clamp01((f - SW.f0 - SW.dur) / 6);
  const PULSE_F = SW ? SW.f0 + SW.dur + 2 : Infinity;
  const pulse = f >= PULSE_F && f < PULSE_F + 14 ? 1 + 0.04 * Math.sin((Math.PI * (f - PULSE_F)) / 14) : 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {dem < 1 && <div style={{position: 'absolute', left: -120, top: 120, width: 1040, height: 400, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(20,13,7,.62) 0%, rgba(20,13,7,.45) 55%, rgba(20,13,7,0) 100%)', opacity: 1 - dem}} />}
      {plate > 0 && (
        <>
          <div style={{position: 'absolute', left: 64, top: 168, width: PLATE_W, height: 102, borderRadius: 10, background: 'rgba(20,13,7,.72)', boxShadow: '0 0 6px 2px rgba(20,13,7,.5)', opacity: plate}} />
          <div style={{position: 'absolute', left: 64, top: 172, width: 6, height: 94, background: `linear-gradient(180deg, ${C.goldHi2}, ${C.gold} 60%, ${C.goldDark})`, opacity: plate}} />
        </>
      )}
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: 700, fontSize: 64, lineHeight: '64px', letterSpacing: 4.5, color: C.cream, textShadow: SOFT_SHADOW}}>
          {TITLE.l1.split('').map((ch, k) => {
            const g = clamp01((f - CHAR_GONE[k]) / 8);
            return (
              <span key={k} style={{display: 'inline-block', opacity: 1 - g, filter: g > 0 ? `blur(${(g * 8).toFixed(2)}px)` : undefined, transform: g > 0 ? `translate(${(g * 10).toFixed(1)}px, ${(-g * 6).toFixed(1)}px)` : undefined}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, top: L2DY, whiteSpace: 'nowrap', display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))', transformOrigin: '0 50%', transform: pulse !== 1 ? `scale(${pulse.toFixed(4)})` : undefined}}>
          {TITLE.l2.split('').map((ch, k) => (
            <span key={k} style={{display: 'inline-block', width: 104, fontFamily: FONT.song, fontWeight: 900, fontSize: 104, lineHeight: '104px', ...GOLD_TEXT}}>{ch}</span>
          ))}
        </div>
      </div>
      {SW && f >= SW.f0 && f < SW.f0 + SW.dur + 50 && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id="outroHead">
              <stop offset="0%" stopColor="#fff1d0" stopOpacity={0.95} />
              <stop offset="35%" stopColor="#e9c58a" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#c9a063" stopOpacity={0} />
            </radialGradient>
          </defs>
          {headOp > 0 && <circle cx={sweepX(f)} cy={SW.y} r={70} fill="url(#outroHead)" opacity={headOp} />}
          {ODUST.map((d, i) => {
            const a = f - d.s;
            if (a < 0 || a > d.life) return null;
            const u = a / d.life;
            const x = d.x + d.vx * a, y = d.y + d.vy * a;
            const op = (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85) * 0.95;
            const r = d.r * (1 - u * 0.5);
            if (d.star) {
              const L = r * 3.2;
              return (
                <g key={i} opacity={op} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                  <rect x={-L} y={-0.6} width={2 * L} height={1.2} fill={d.c} />
                  <rect x={-0.6} y={-L} width={1.2} height={2 * L} fill={d.c} />
                </g>
              );
            }
            return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill={d.c} opacity={op} />;
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
};
