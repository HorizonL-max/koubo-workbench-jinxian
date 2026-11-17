import React from 'react';
import {OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, FONT, RING_GRAD} from '../theme';
import {clamp01, EASE, FPS, mix, rf, spring01} from '../u';

/**
 * C05 金线吊坠（全片母题）+ C06 徽章翻面。
 * 一枚 =「线」从画面顶边垂下 → 圆相片徽章（金环 5px + 内侧乳白细线 + 金扣 + 柔影 + 左上静态高光弧）→ 纸卡吊牌。
 * 整枚绕线的顶端锚点 (cx, 0) 摆：落位阻尼摆 θ = 2.6°·e^(−1.8t)·cos(2π·0.9t) + 常驻微摆 0.35°·sin(2π·0.18t+φ)。
 * 翻面照 shotcraft card-flip-reveal：4 帧反向预备 −10° → 16 帧 bezier(.55,0,.3,1) 翻到 194° → 弹簧（damping 15）回落 180°；
 * 面按 (1−|cosθ|) 压暗（≤0.55），侧棱 56°–124° 一道窄受光带、90° 最亮（物理受光，不是扫光）；perspective 1600。
 */
export type Media = {src?: string; from?: number; startFrom?: number; box?: {w: number; h: number; left: number; top: number}; bri?: number;
  /** 线稿徽章面（P26）：纸卡色底上画东西；q = 问号背面（P11，夜青珐琅 + 金色「？」，字号） */
  art?: (f: number, inner: number) => React.ReactNode; q?: number};
export type PendantSpec = {
  id: string; cx: number; cy: number; d: number; phase: number;
  threadF: number; threadDur?: number; // 线垂下来（默认 12 帧 outCubic）
  slideF?: number; // 徽章从 y=300 顺线滑到位（14 帧，过冲 14px）；不给 = 直接在位（#3 由光圈收拢交棒）
  landF: number; // 落位帧：阻尼摆起点
  front: Media; back?: Media; flipF?: number;
  tag: {side: 'below' | 'right'; unfoldF: number; small?: string; smallF?: number; main: string; mainCharF?: number[]; main2?: string; collapseAtFlip?: boolean;
    mainSize?: number; // 三幕加（向后兼容）：主词字号，默认 44（P62 用 38）
    emphSmall?: boolean; // 返修加（向后兼容）：上行小字当主词（Black 48 墨色），下行主词降成 Bold 34 淡墨，吊牌高 130（P62「必须要」）
  };
  kicks?: {f: number; amp: number}[]; // 额外起摆（P11 翻完小摆 2°）
  /** P29 沉进胸口：吊牌先收、徽章沿弧线滑到 to、缩到 scale（dur 帧，先慢后快），线散成虚线淡掉 */
  sink?: {f0: number; dur: number; to: [number, number]; scale: number; bulge?: number}; // 横向先慢后快（q²）+ 侧向鼓出 bulge·sin(πq)，绕开脑袋里的字
  swellF?: {f: number; amp: number; dur: number}[];
  key?: number; // 画一把小钥匙（起笔帧）
  bounceF?: number; // 半径 92→88→92 小回弹（#3）
  /** 三幕加（向后兼容）：从这一帧起 2 帧内摆动停死、之后连微摆都没有（P62「先问一问」；P61 给很早的帧 = 全程不摆） */
  still?: number;
};
export type PendantFx = {
  hidden: boolean;
  desat: number; // 0→1：P08 徽章降饱和到 35%
  lit?: {f0: number; dur: number}; // P08：亮点从横杆滑到徽章，身后的线变亮金
  barY?: number; upperFade?: number; // 横杆以上那段线淡掉（0→1）
};

const D2R = Math.PI / 180;
export const swingDeg = (s: PendantSpec, f: number, lit?: {f0: number; dur: number}) => {
  const t = (f - s.landF) / FPS;
  let a = t >= 0 ? 2.6 * Math.exp(-1.8 * t) * Math.cos(2 * Math.PI * 0.9 * t) : 0;
  a += 0.35 * Math.sin(2 * Math.PI * 0.18 * (f / FPS) + s.phase);
  for (const k of s.kicks ?? []) {
    const tk = (f - k.f) / FPS;
    if (tk >= 0) a += k.amp * Math.exp(-1.8 * tk) * Math.sin(2 * Math.PI * 0.9 * tk);
  }
  if (lit) {
    const ti = (f - (lit.f0 + lit.dur)) / FPS;
    if (ti >= 0) a += 1.6 * Math.exp(-1.8 * ti) * Math.sin(2 * Math.PI * 0.9 * ti);
  }
  if (s.still !== undefined && f >= s.still) a *= Math.max(0, 1 - (f - s.still) / 2);
  return a;
};
/** 徽章圆心当前 y（滑入 + 过冲） */
const medY = (s: PendantSpec, f: number) => {
  if (s.slideF === undefined) return s.cy;
  const a = s.slideF;
  if (f < a + 14) return mix(300, s.cy + 14, EASE.outC(clamp01((f - a) / 14)));
  return s.cy + 14 * (1 - EASE.outC(clamp01((f - a - 14) / 6)));
};
/** 翻面角度 */
export const flipDeg = (s: PendantSpec, f: number) => {
  if (s.flipF === undefined || f < s.flipF) return 0;
  const a = s.flipF;
  if (f < a + 4) return -10 * EASE.outC((f - a) / 4);
  if (f < a + 20) return mix(-10, 194, EASE.flip((f - a - 4) / 16));
  if (f < a + 40) return 194 - 14 * spring01(f, a + 20, 15, 170);
  return 180;
};
const swapFrame = (s: PendantSpec) => {
  if (s.flipF === undefined) return Infinity;
  for (let f = s.flipF; f < s.flipF + 30; f += 0.25) if (flipDeg(s, f) >= 90) return f;
  return Infinity;
};

const GRADE = 'saturate(.9) contrast(1.04) sepia(.12) brightness(.95)';
const Face: React.FC<{m: Media; d: number; f: number; desat: number; back?: boolean; theta: number}> = ({m, d, f, desat, back, theta}) => {
  const r = d / 2, inner = d - 10;
  const c = Math.cos(theta * D2R);
  const shade = (1 - Math.abs(c)) * 0.55;
  // 侧棱受光带：56°–124°，90° 最亮；背面局部 x 与屏幕相反
  const band = theta > 56 && theta < 124 ? 1 - Math.abs(theta - 90) / 34 : 0;
  const frac = clamp01((theta - 56) / 68);
  const bx = back ? 1 - frac : frac;
  const sat = mix(0.9, 0.35, desat);
  const filter = GRADE.replace('saturate(.9)', `saturate(${sat.toFixed(3)})`).replace('brightness(.95)', `brightness(${(mix(0.95, 0.85, desat) * (m.bri ?? 1)).toFixed(3)})`);
  return (
    <div style={{position: 'absolute', left: -r, top: -r, width: d, height: d, borderRadius: '50%', background: RING_GRAD, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : undefined}}>
      <div style={{position: 'absolute', left: 5, top: 5, width: inner, height: inner, borderRadius: '50%', overflow: 'hidden', background: '#2a2017'}}>
        {m.src && (
          <Sequence from={m.from ?? 0} layout="none">
            <OffthreadVideo
              src={staticFile(m.src)}
              muted
              startFrom={m.startFrom ?? 0}
              style={m.box ? {position: 'absolute', left: m.box.left, top: m.box.top, width: m.box.w, height: m.box.h, filter} : {position: 'absolute', left: 0, top: 0, width: inner, height: inner, objectFit: 'cover', filter}}
            />
          </Sequence>
        )}
        {m.art && <div style={{position: 'absolute', inset: 0, background: C.card, filter: desat > 0 ? `saturate(${mix(1, 0.35, desat).toFixed(3)}) brightness(${mix(1, 0.86, desat).toFixed(3)})` : undefined}}>{m.art(f, inner)}</div>}
        {m.q && (
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 40% 35%, #1d3850 0%, ${C.nightBack} 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontFamily: FONT.song, fontWeight: 900, fontSize: m.q, lineHeight: 1, backgroundImage: `linear-gradient(180deg, ${C.goldHi2}, ${C.goldHi} 50%, #c99550)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', transform: 'translateY(4%)'}}>？</span>
          </div>
        )}
        {/* 左上静态高光弧 */}
        <svg width={inner} height={inner} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={describeArc(inner / 2, inner / 2, inner / 2 - 9, 205, 262)} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={4} strokeLinecap="round" />
        </svg>
        {shade > 0.002 && <div style={{position: 'absolute', inset: 0, background: `rgba(10,8,6,${shade.toFixed(3)})`}} />}
        {band > 0 && <div style={{position: 'absolute', top: 0, height: inner, left: bx * inner - 7, width: 14, background: 'linear-gradient(90deg, rgba(255,240,210,0), rgba(255,240,210,.85), rgba(255,240,210,0))', opacity: band}} />}
      </div>
      {/* 内侧乳白细线（金环内 7px） */}
      <div style={{position: 'absolute', left: 12, top: 12, width: d - 24, height: d - 24, borderRadius: '50%', border: '1px solid rgba(255,246,230,.55)'}} />
    </div>
  );
};
function describeArc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(a * D2R), cy + r * Math.sin(a * D2R)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
}

const Key: React.FC<{f: number; f0: number}> = ({f, f0}) => {
  const p = rf(f, f0, 12, EASE.inOutC);
  if (p <= 0) return null;
  const path = 'M0,0 m-11,0 a11,11 0 1,0 22,0 a11,11 0 1,0 -22,0 M11,0 L54,0 M44,0 L44,9 M52,0 L52,11';
  return (
    <svg width={140} height={140} viewBox="-70 -70 140 140" style={{position: 'absolute', left: 22, top: 70, overflow: 'visible'}}>
      <g transform="rotate(-32)">
        <path d={path} fill="none" stroke="rgba(20,13,7,.55)" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
        <path d={path} fill="none" stroke={C.goldHi} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
      </g>
    </svg>
  );
};

const Tag: React.FC<{s: PendantSpec; f: number; my: number; r: number}> = ({s, f, my, r}) => {
  const t = s.tag;
  if (f < t.unfoldF) return null;
  let u = rf(f, t.unfoldF, 8, (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2)); // 轻回弹
  if (t.collapseAtFlip) u *= 1 - rf(f, swapFrame(s), 6, EASE.inOutC); // P11：翻过 90° 时吊牌从下往上收起
  if (s.sink) u *= 1 - rf(f, s.sink.f0, 6, EASE.inOutC); // P29：吊牌先收
  if (u <= 0.001) return null;
  const two = t.small ? rf(f, t.smallF ?? t.unfoldF, 8, EASE.outC) : 0;
  const es = !!t.emphSmall;
  const h = mix(72, es ? 130 : 104, two);
  const sw = swapFrame(s);
  const sp = t.main2 ? rf(f, sw - 3, 8, EASE.outC) : 0;
  const n0 = t.main.length, n1 = (t.main2 ?? t.main).length;
  const ms = t.mainSize ?? 44;
  const w = Math.max(mix(n0, n1, sp) * ms, (t.small?.length ?? 0) * (es ? 48 : 32)) + 36;
  const box: React.CSSProperties =
    t.side === 'below'
      ? {left: -w / 2, top: my + r + 14, transformOrigin: '50% 0', transform: `scaleY(${u.toFixed(4)})`}
      : {left: r + 28, top: my - h / 2, transformOrigin: '0 50%', transform: `scaleX(${u.toFixed(4)})`};
  const mainChars = (txt: string, fs?: number[]) =>
    txt.split('').map((ch, k) => {
      const p = fs ? rf(f, fs[k], 6, EASE.out) : 1;
      return (
        <span key={k} style={{display: 'inline-block', opacity: p, transform: p < 1 ? `translateY(${((1 - p) * 10).toFixed(2)}px)` : undefined, filter: p < 1 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : undefined}}>
          {ch}
        </span>
      );
    });
  const mainStyle: React.CSSProperties = {position: 'absolute', left: 0, right: 0, bottom: 12, height: es ? 40 : 48, textAlign: 'center', fontFamily: FONT.song, fontWeight: es ? 700 : 900, fontSize: ms, lineHeight: es ? '40px' : '48px', color: es ? C.ink2 : C.ink, whiteSpace: 'nowrap'};
  return (
    <>
      {/* 挂绳 */}
      {t.side === 'below' ? (
        <div style={{position: 'absolute', left: -0.75, top: my + r - 2, width: 1.5, height: 17 * u, background: C.gold}} />
      ) : (
        <div style={{position: 'absolute', left: r - 2, top: my - 0.75, width: 31 * u, height: 1.5, background: C.gold}} />
      )}
      <div style={{position: 'absolute', width: w, height: h, borderRadius: 10, background: C.card, border: '1px solid rgba(168,117,42,.5)', boxShadow: '0 6px 14px rgba(20,13,7,.28)', overflow: 'hidden', ...box}}>
        {t.small && (
          <div style={es ? {position: 'absolute', left: 0, right: 0, top: 12, height: 52, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: 48, lineHeight: '52px', color: C.ink, opacity: two, whiteSpace: 'nowrap'} : {position: 'absolute', left: 0, right: 0, top: 12, height: 34, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 32, lineHeight: '34px', color: C.goldDeep, opacity: two, whiteSpace: 'nowrap'}}>
            {t.small}
          </div>
        )}
        {t.main2 && sp > 0 ? (
          <>
            {sp < 1 && <div style={{...mainStyle, opacity: 1 - sp, transform: `translateY(${(-sp * 22).toFixed(2)}px)`, filter: `blur(${(sp * 6).toFixed(2)}px)`}}>{t.main}</div>}
            <div style={{...mainStyle, opacity: sp, transform: sp < 1 ? `translateY(${((1 - sp) * 22).toFixed(2)}px)` : undefined, filter: sp < 1 ? `blur(${((1 - sp) * 6).toFixed(2)}px)` : undefined}}>{t.main2}</div>
          </>
        ) : (
          <div style={mainStyle}>{mainChars(t.main, t.mainCharF)}</div>
        )}
      </div>
    </>
  );
};

export const Pendant: React.FC<{s: PendantSpec; f: number; fx: PendantFx}> = ({s, f, fx}) => {
  if (fx.hidden || f < s.threadF) return null;
  const r = s.d / 2;
  const sk = s.sink;
  const sq = sk ? rf(f, sk.f0 + 4, sk.dur, EASE.inQ) : 0; // 下沉进度（先慢后快）
  if (sk && f >= sk.f0 + 4 + sk.dur) return null;
  const theta = swingDeg(s, f, fx.lit) * (1 - sq);
  const my = medY(s, f);
  const medVis = s.slideF === undefined ? f >= s.landF : f >= s.slideF;
  const appear = s.slideF === undefined ? 1 : rf(f, s.slideF, 8, EASE.outC);
  const claspTop = s.cy - r - 18;
  const drop = rf(f, s.threadF, s.threadDur ?? 12, EASE.outC) * claspTop;
  const threadEnd = medVis ? Math.max(drop, my - r - 16) : drop;
  // 金环胀一下
  let sw = 1;
  for (const w of s.swellF ?? []) if (f >= w.f && f < w.f + w.dur) sw *= 1 + w.amp * Math.sin(Math.PI * ((f - w.f) / w.dur));
  if (s.bounceF !== undefined && f >= s.bounceF && f < s.bounceF + 6) sw *= 1 - (4 / 92) * Math.sin(Math.PI * ((f - s.bounceF) / 6));
  const scale = mix(0.6, 1, appear) * sw;
  const fl = flipDeg(s, f);
  const lift = s.flipF !== undefined && f >= s.flipF && f < s.flipF + 30 ? 60 * Math.sin(Math.PI * clamp01((f - s.flipF) / 26)) : 0;
  // P08 点亮：亮点从横杆位置滑到金扣，身后的线变亮金
  const barY = fx.barY ?? 268;
  let litY = -1, ringFlash = 0;
  if (fx.lit && f >= fx.lit.f0) {
    const q = rf(f, fx.lit.f0, fx.lit.dur, EASE.inOutC);
    litY = mix(barY, my - r - 16, q);
    const fa = fx.lit.f0 + fx.lit.dur;
    if (f >= fa) ringFlash = Math.max(0, 1 - (f - fa) / 14);
  }
  const upper = 1 - (fx.upperFade ?? 0);
  return (
    <div style={{position: 'absolute', left: s.cx, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `rotate(${theta.toFixed(4)}deg)`}}>
      {/* 线：横杆以上一段 + 以下一段（P08 横杆画出后上段淡掉） */}
      <svg width={40} height={Math.max(2, threadEnd + 2)} style={{position: 'absolute', left: -20, top: 0, overflow: 'visible', filter: 'drop-shadow(0 0 4px rgba(233,190,120,.5))', opacity: sk ? 1 - rf(f, sk.f0, sk.dur + 4, EASE.lin) : 1}} strokeDasharray={sk && f >= sk.f0 ? `${mix(40, 4, rf(f, sk.f0, 10, EASE.outC)).toFixed(1)} ${mix(0, 9, rf(f, sk.f0, 10, EASE.outC)).toFixed(1)}` : undefined}>
        {upper > 0 && <line x1={20} y1={0} x2={20} y2={Math.min(threadEnd, barY)} stroke={C.gold} strokeOpacity={0.85 * upper} strokeWidth={2} />}
        {threadEnd > barY && <line x1={20} y1={barY} x2={20} y2={threadEnd} stroke={C.gold} strokeOpacity={0.85} strokeWidth={2} />}
        {litY > barY && <line x1={20} y1={barY} x2={20} y2={litY} stroke={C.goldHi2} strokeWidth={3} />}
        {litY > barY && f < (fx.lit!.f0 + fx.lit!.dur) && (
          <g transform={`translate(20 ${litY.toFixed(1)})`}>
            <circle r={14} fill={C.goldHi2} opacity={0.35} />
            <circle r={4.5} fill="#fff4dc" />
          </g>
        )}
      </svg>
      {medVis && (
        <div style={{position: 'absolute', left: sk ? (sk.to[0] - s.cx) * sq * sq + (sk.bulge ?? 0) * Math.sin(Math.PI * sq) : 0, top: sk ? mix(my, sk.to[1], sq) : my, width: 0, height: 0, opacity: appear * (sq > 0.8 ? 1 - (sq - 0.8) / 0.2 : 1), transform: sq > 0 ? `scale(${mix(1, sk!.scale, sq).toFixed(4)})` : undefined}}>
          {/* 金扣 */}
          <div style={{position: 'absolute', left: -7, top: -r - 18, width: 14, height: 20, borderRadius: 5, background: `linear-gradient(180deg, ${C.goldHi2}, ${C.gold} 55%, ${C.goldDark})`, boxShadow: '0 1px 3px rgba(20,13,7,.4)'}}>
            <div style={{position: 'absolute', left: 4, top: 3, width: 6, height: 6, borderRadius: 3, background: 'rgba(40,28,16,.55)'}} />
          </div>
          {/* 徽章（含翻面） */}
          <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `scale(${scale.toFixed(4)})`, perspective: 1600}}>
            <div style={{position: 'absolute', left: -r, top: -r, width: s.d, height: s.d, borderRadius: '50%', transform: fl !== 0 ? `scaleX(${Math.max(0.06, Math.abs(Math.cos(fl * D2R))).toFixed(4)})` : undefined, boxShadow: `0 10px 24px rgba(20,13,7,.35)${ringFlash > 0 ? `, 0 0 ${(22 * ringFlash).toFixed(1)}px rgba(241,217,168,${(0.85 * ringFlash).toFixed(3)})` : ''}`}} />
            <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transform: fl !== 0 || lift ? `translateZ(${lift.toFixed(2)}px) rotateY(${fl.toFixed(3)}deg)` : undefined}}>
              <Face m={s.front} d={s.d} f={f} desat={fx.desat} theta={Math.abs(fl)} />
              {s.back && <Face m={s.back} d={s.d} f={f} desat={fx.desat} back theta={Math.abs(fl)} />}
              {s.key !== undefined && fl < 90 && (
                <div style={{position: 'absolute', left: -r, top: -r, width: s.d, height: s.d, backfaceVisibility: 'hidden'}}>
                  <Key f={f} f0={s.key} />
                </div>
              )}
            </div>
            {ringFlash > 0 && <div style={{position: 'absolute', left: -r, top: -r, width: s.d, height: s.d, borderRadius: '50%', border: `5px solid rgba(255,240,205,${(0.7 * ringFlash).toFixed(3)})`}} />}
          </div>
          <Tag s={s} f={f} my={0} r={r} />
        </div>
      )}
    </div>
  );
};
