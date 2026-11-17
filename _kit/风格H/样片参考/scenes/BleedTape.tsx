import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../theme';
import {bezier, charFrames, clamp01, EASE, F, FPS, mix, rf, useF, WF} from '../u';
import {S} from '../shots';
import {IRIS} from './Pendants';
import {Avatar} from '../parts/Avatar';

/**
 * P06 实拍出血（C07）+ C21 小头像（全片修订：人物不退场，收成左下头像继续讲）+ 刻度带急刹（C08）+ 玻璃字框；P07 开头实拍收成第三枚吊坠（C09）。
 * - 实拍铺满：b04 西装背影对写字楼，统一调色 + 顶底压暗，scale 1.04→1.00
 * - 刻度带：shotcraft gauge-readout-moves B 式（滚带定针）改横向——没有任何数字；起速约 1400px/s、指数减速，
 *   欠阻尼刹车过冲 10px 回摆（x = D(1 − e^(−ks)·cos ωs)，过冲落在 f496），停稳后锁死；>600px/s 加横向运动模糊
 * - 玻璃框：draw-svg-trace 描边（带笔头，26 帧 inOutCubic；描边圆角 = 框圆角 26），画完框内才起模糊暗底、才出字
 * - 光圈收拢：circle-match-iris 反向——圆心 = IRIS 常量（和第三枚吊坠同一组），18 帧：先 7 帧圆收到 372（内容不动），再 11 帧半径 372→92 与内容缩放 1→0.30 共用一条曲线
 */
const P6 = S.P06;
export const B04 = {src: 'broll/b04_work.mp4', from: P6.f0, startFrom: 120}; // 素材前 4s 镜头还在找人，从人站到画面中间起
const GRADE0 = {sat: 0.88, con: 1.04, sep: 0.12, bri: 0.72}; // 整屏实拍
const GRADE1 = {sat: 0.9, con: 1.04, sep: 0.12, bri: 0.95}; // 徽章统一调色（收拢过程中过渡）
const grade = (p: number) => `saturate(${mix(GRADE0.sat, GRADE1.sat, p).toFixed(3)}) contrast(${GRADE0.con}) sepia(${GRADE0.sep}) brightness(${mix(GRADE0.bri, GRADE1.bri, p).toFixed(3)})`;

// —— 刻度带 ——
const TAPE_Y = 600, PTR_X = 540;
const T0 = WF('到了', 15.2) + 2; // 滚动起点（f460）：「到了」开口后 2 帧
const TT = 1.2; // 刹停（过冲顶点）落在 1.2s（f496）
const TD = 445, OVER = 10, TK = 3.1; // 起速 ≈ (D+10)·k ≈ 1440px/s，到 TT 时只剩 ~35px/s
const TB = 0.4; // 回摆 0.4s
/** 带子位移：A 指数减速冲到 D+10（过冲）→ B 0.4s 缓回到 D → 锁死 */
export const tapeX = (f: number) => {
  const s = (f - T0) / FPS;
  if (s <= 0) return 0;
  if (s <= TT) return ((TD + OVER) * (1 - Math.exp(-TK * s))) / (1 - Math.exp(-TK * TT));
  if (s <= TT + TB) return TD + OVER * (1 - EASE.inOutC((s - TT) / TB));
  return TD; // 停稳后全锁死
};
const tapeV = (f: number) => (tapeX(f + 0.5) - tapeX(f - 0.5)) * FPS;
const STOP_F = T0 + Math.round(TT * FPS);
/** 刻度过针的帧（给棘轮咔嗒声排点）：小格 24px，相邻两下不密于 2 帧 */
export const TICK_FRAMES: number[] = (() => {
  const out: number[] = [];
  let lastC = 0, lastF = -99;
  for (let f = T0; f <= STOP_F; f += 0.1) {
    const c = Math.floor((Math.min(tapeX(f), TD) + 1e-6) / 24);
    if (c > lastC) {
      lastC = c;
      if (f - lastF >= 2) {
        out.push(Math.round(f));
        lastF = f;
      }
    }
  }
  return out;
})();
export {STOP_F};

const Tape: React.FC<{f: number; op: number}> = ({f, op}) => {
  const base = rf(f, P6.f0 + 4, 6, EASE.outC); // 基线从中间向两边画出（全片修订：晚 4 帧，让小头像先收）
  if (base <= 0) return null;
  const x = tapeX(f);
  const v = Math.abs(tapeV(f));
  const blur = clamp01((v - 600) / 800) * 6;
  const stopOn = rf(f, STOP_F, 4, EASE.outC);
  // 停点刻度在带坐标 u=0；屏幕 x = 540 + u + D − x(s)
  const ticks: React.ReactNode[] = [];
  for (let n = -60; n <= 40; n++) {
    const u = n * 24;
    const sx = PTR_X + u + TD - x;
    if (sx < -10 || sx > 1090) continue;
    const major = n % 5 === 0;
    const isStop = n === 0;
    const h = isStop ? mix(44, 64, stopOn) : major ? 44 : 22;
    ticks.push(<rect key={n} x={(sx - (major ? 1.5 : 1)).toFixed(2)} y={TAPE_Y - h} width={major ? 3 : 2} height={h} fill={isStop && stopOn > 0 ? C.goldHi : C.gold} opacity={isStop ? 1 : major ? 0.9 : 0.7} />);
  }
  const dip = f >= STOP_F && f < STOP_F + 6 ? 6 * Math.sin(Math.PI * ((f - STOP_F) / 6)) : 0;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
      <defs>
        <linearGradient id="tapeFade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.14" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.86" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="tapeMask">
          <rect x={0} y={0} width={1080} height={1920} fill="url(#tapeFade)" />
        </mask>
        <filter id="mblur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} />
        </filter>
      </defs>
      <g mask="url(#tapeMask)" style={{filter: 'drop-shadow(0 1px 3px rgba(20,12,6,.6))'}}>
        <line x1={540 - 540 * base} x2={540 + 540 * base} y1={TAPE_Y} y2={TAPE_Y} stroke={C.gold} strokeWidth={2} />
        {f >= T0 && <g filter={blur > 0.05 ? 'url(#mblur)' : undefined}>{ticks}</g>}
      </g>
      {/* 固定指针：乳白小三角，尖朝下 */}
      {f >= T0 - 2 && <path d={`M${PTR_X - 11},${508 + dip} L${PTR_X + 11},${508 + dip} L${PTR_X},${530 + dip} Z`} fill={C.cream} style={{filter: 'drop-shadow(0 1px 4px rgba(20,12,6,.7))'}} />}
    </svg>
  );
};

// —— 标注「到了某个年龄」——
const LABEL = [
  {t: '到了', f: Math.max(P6.f0 + 4, WF('到了', 15.2)), gold: false},
  {t: '某个', f: Math.max(P6.f0 + 8, WF('某个', 15.4)), gold: true},
  {t: '年龄', f: WF('年龄', 15.7), gold: true},
];
// —— 玻璃框 ——
// 全片修订：框上移让出小头像（原 y 790–1090 → 760–1000），描框、出字的帧不变
const FR = {x: 110, y: 760, w: 860, h: 240, r: 26, f0: STOP_F + 2, dur: 14}; // 返修：描框 26→14 帧，框里「就应」不再比口播晚 0.4s
const L1 = '就应该要有', L2W = [
  {t: '一份', f: WF('一份', 18.1)},
  {t: '稳定的', f: WF('稳定的', 18.4)},
  {t: '工作', f: WF('工作', 18.9)},
];
const L1F = charFrames(L1, 17.0);
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;

const blurIn = (f: number, f0: number, dur = 8): React.CSSProperties => {
  const p = rf(f, f0, dur, EASE.out);
  return {display: 'inline-block', opacity: p, transform: p < 1 ? `translateY(${((1 - p) * 20).toFixed(2)}px)` : undefined, filter: p < 1 ? `blur(${((1 - p) * 12).toFixed(2)}px)` : undefined};
};

export const BleedTape: React.FC = () => {
  const f = useF();
  if (f < P6.f0 || f >= IRIS.f0 + IRIS.dur) return null;
  // 光圈收拢
  // 收拢分两段（18 帧不变）：① 7 帧圆从画外（离圆心最远的角 1639px）收到 372px，内容不缩——圆心离画面顶边只有 372px，
  // 这时缩内容会露出矩形的上边（v1 实测穿帮）；② 11 帧圆半径 372→92 和内容缩放 1→0.30 共用同一条曲线（circle-match-iris 的命门），
  // 全程 372·cs ≥ R，圆里永远是满的。
  const IR1 = 7;
  const ip = f < IRIS.f0 ? 0 : 1; // 收拢开始了没有
  const q1 = rf(f, IRIS.f0, IR1, EASE.inQ);
  const q2 = rf(f, IRIS.f0 + IR1, IRIS.dur - IR1, bezier(0.2, 0.55, 0.32, 1));
  const R = f < IRIS.f0 + IR1 ? mix(1660, 372, q1) : mix(372, IRIS.r, q2);
  const cs = mix(1, 0.3, q2);
  const push = f < S.P06.f1 ? mix(1.04, 1.0, clamp01((f - P6.f0) / (P6.f1 - P6.f0))) : 1;
  const ovOp = 1 - rf(f, IRIS.f0, 6, EASE.lin); // P06 的刻度带 / 标注 / 框和字 6 帧淡掉
  const scrimOp = 1 - rf(f, IRIS.f0, 10, EASE.lin);
  const fp = rf(f, FR.f0, FR.dur, EASE.inOutC); // 描边进度
  const closed = f >= FR.f0 + FR.dur;
  const flash = f >= FR.f0 + FR.dur && f < FR.f0 + FR.dur + 8 ? 1 - (f - FR.f0 - FR.dur) / 8 : 0;
  const glass = rf(f, FR.f0 + FR.dur, 6, EASE.outC);
  // 笔头位置：沿圆角矩形周长取点（顺时针从左上起）
  const tip = (() => {
    const per = 2 * (FR.w + FR.h - 4 * FR.r) + 2 * Math.PI * FR.r;
    let d = fp * per;
    const segs: [number, (u: number) => [number, number]][] = [
      [FR.w - 2 * FR.r, (u) => [FR.x + FR.r + u, FR.y]],
      [(Math.PI * FR.r) / 2, (u) => { const a = -Math.PI / 2 + u / FR.r; return [FR.x + FR.w - FR.r + FR.r * Math.cos(a), FR.y + FR.r + FR.r * Math.sin(a)]; }],
      [FR.h - 2 * FR.r, (u) => [FR.x + FR.w, FR.y + FR.r + u]],
      [(Math.PI * FR.r) / 2, (u) => { const a = u / FR.r; return [FR.x + FR.w - FR.r + FR.r * Math.cos(a), FR.y + FR.h - FR.r + FR.r * Math.sin(a)]; }],
      [FR.w - 2 * FR.r, (u) => [FR.x + FR.w - FR.r - u, FR.y + FR.h]],
      [(Math.PI * FR.r) / 2, (u) => { const a = Math.PI / 2 + u / FR.r; return [FR.x + FR.r + FR.r * Math.cos(a), FR.y + FR.h - FR.r + FR.r * Math.sin(a)]; }],
      [FR.h - 2 * FR.r, (u) => [FR.x, FR.y + FR.h - FR.r - u]],
      [(Math.PI * FR.r) / 2, (u) => { const a = Math.PI + u / FR.r; return [FR.x + FR.r + FR.r * Math.cos(a), FR.y + FR.r + FR.r * Math.sin(a)]; }],
    ];
    for (const [len, fn] of segs) {
      if (d <= len) return fn(d);
      d -= len;
    }
    return [FR.x + FR.r, FR.y] as [number, number];
  })();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 实拍层（光圈裁切 + 内容缩放同一条曲线） */}
      <AbsoluteFill style={{clipPath: ip > 0 ? `circle(${R.toFixed(2)}px at ${IRIS.cx}px ${IRIS.cy}px)` : undefined}}>
        <AbsoluteFill style={{transform: `scale(${(cs * push).toFixed(5)})`, transformOrigin: `${IRIS.cx}px ${IRIS.cy}px`, background: '#111'}}>
          <Sequence from={B04.from} layout="none">
            <OffthreadVideo src={staticFile(B04.src)} muted startFrom={B04.startFrom} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: grade(q2)}} />
          </Sequence>
          {scrimOp > 0 && (
            <AbsoluteFill style={{opacity: scrimOp, background: 'linear-gradient(180deg, rgba(20,13,7,.5) 0%, rgba(20,13,7,0) 21.9%, rgba(20,13,7,0) 72.9%, rgba(20,13,7,.8) 88.5%, rgba(20,13,7,.86) 100%)'}} />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      {/* C21 小头像：f456 近景满幅收成头像（12 帧），f594 光圈开始收拢那一帧撤掉（门后露出的是中景真人） */}
      <Avatar f={f} f0={P6.f0} f1={IRIS.f0} enter="shrink" exit="cut" />
      {/* 圆边金环 + 落影 */}
      {ip > 0 && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 8px 18px rgba(20,13,7,.45))'}}>
          <circle cx={IRIS.cx} cy={IRIS.cy} r={R - 2.5} fill="none" stroke={C.gold} strokeWidth={5} />
        </svg>
      )}
      {ovOp > 0 && (
        <AbsoluteFill style={{opacity: ovOp}}>
          <Tape f={f} op={1} />
          {/* 「到了某个年龄」 */}
          <div style={{position: 'absolute', left: 0, width: 1080, top: 420, height: 70, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: 64, lineHeight: '70px', whiteSpace: 'nowrap', textShadow: SOFT_SHADOW}}>
            {LABEL.map((w, k) => (
              <span key={k} style={{...blurIn(f, w.f), ...(w.gold ? GOLD_TEXT : {color: C.cream}), filter: [blurIn(f, w.f).filter, w.gold ? 'drop-shadow(0 2px 8px rgba(20,12,6,.7))' : ''].filter(Boolean).join(' ') || undefined}}>
                {w.t}
              </span>
            ))}
          </div>
          {/* 玻璃框：先描边，画完框内才起模糊和暗底 */}
          {glass > 0 && (
            <div style={{position: 'absolute', left: FR.x, top: FR.y, width: FR.w, height: FR.h, borderRadius: FR.r, overflow: 'hidden', opacity: glass, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(20,13,7,.24)'}} />
          )}
          {f >= FR.f0 && (
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
              <path d={rr(FR.x, FR.y, FR.w, FR.h, FR.r)} fill="none" stroke={C.cream} strokeOpacity={0.9} strokeWidth={3 + 2 * flash} pathLength={1} strokeDasharray="1" strokeDashoffset={closed ? 0 : 1 - fp} />
              {!closed && (
                <g transform={`translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)})`}>
                  <circle r={11} fill={C.cream} opacity={0.3} />
                  <circle r={4.5} fill="#fff" />
                </g>
              )}
            </svg>
          )}
          {closed && (
            <>
              <div style={{position: 'absolute', left: 0, width: 1080, top: 790, height: 62, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 56, lineHeight: '62px', whiteSpace: 'nowrap', filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))'}}>
                {L1.split('').map((ch, k) => (
                  <span key={k} style={{...blurIn(f, Math.max(L1F[k], FR.f0 + FR.dur)), ...GOLD_TEXT}}>{ch}</span>
                ))}
              </div>
              <div style={{position: 'absolute', left: 0, width: 1080, top: 872, height: 104, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: 96, lineHeight: '104px', color: C.cream, whiteSpace: 'nowrap', textShadow: SOFT_SHADOW}}>
                {L2W.map((w, k) => (
                  <span key={k} style={blurIn(f, w.f, 10)}>{w.t}</span>
                ))}
              </div>
            </>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
export {F};
