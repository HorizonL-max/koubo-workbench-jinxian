import React from 'react';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../theme';
import {clamp01, EASE, mix, rf} from '../u';

/**
 * 全片共用的小动效（SHOTBOOK 1.9）。场景里不要再各写一份。
 * - blurIn：blur-slide（上移 + 模糊 + 透明度共用一个进度，ease-out）
 * - Words：按词 / 按字出（每段自己的起点帧），可指定哪几段亮金
 * - drawOn：stroke-dashoffset 画线进度 → SVG 属性
 * - Tip：亮笔头
 */
export const blurIn = (f: number, f0: number, dur = 8, dy = 20, blur = 12): React.CSSProperties => {
  const p = rf(f, f0, dur, EASE.out);
  if (p >= 1) return {display: 'inline-block'};
  return {display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(2)}px)`, filter: `blur(${((1 - p) * blur).toFixed(2)}px)`};
};

export type Seg = {t: string; f: number; gold?: boolean};
/** 一行按段出现的字。dark=true：深底 / 人物上（乳白 + 柔影，金段亮金渐变）；dark=false：纸面（墨色，金段深金，不加影） */
export const Words: React.FC<{segs: Seg[]; f: number; dark?: boolean; dur?: number; dy?: number; style?: React.CSSProperties}> = ({segs, f, dark = true, dur = 8, dy = 20, style}) => (
  <div style={{whiteSpace: 'nowrap', fontFamily: FONT.song, color: dark ? C.cream : C.ink, textShadow: dark ? SOFT_SHADOW : 'none', ...style}}>
    {segs.map((s, k) => {
      const b = blurIn(f, s.f, dur, dy);
      const gold: React.CSSProperties = s.gold ? (dark ? {...GOLD_TEXT} : {color: C.goldDeep}) : {};
      // 渐变字不能继承 text-shadow（会画在渐变上面），影子改用 drop-shadow 拼进 filter
      const filt = [b.filter, s.gold && dark ? 'drop-shadow(0 2px 8px rgba(20,12,6,.7))' : ''].filter(Boolean).join(' ');
      return (
        <span key={k} style={{...b, ...gold, filter: filt || undefined}}>
          {s.t}
        </span>
      );
    })}
  </div>
);

/** 画线：pathLength=1 的 dash 属性 */
export const drawOn = (p: number) => ({pathLength: 1, strokeDasharray: '1', strokeDashoffset: p >= 1 ? 0 : 1 - clamp01(p)});

/** 亮笔头（画线时挂在线头，画完卸载） */
export const Tip: React.FC<{x: number; y: number; r?: number; color?: string}> = ({x, y, r = 4.5, color = C.goldHi2}) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
    <circle r={r * 2.6} fill={color} opacity={0.32} />
    <circle r={r} fill="#fff4dc" />
  </g>
);

/** 折线 / 多段直线上按长度取点（给笔头定位） */
export const pointOn = (pts: [number, number][], p: number): [number, number] => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const d = clamp01(p) * L[L.length - 1];
  for (let i = 1; i < pts.length; i++) {
    if (d <= L[i]) {
      const u = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      return [mix(pts[i - 1][0], pts[i][0], u), mix(pts[i - 1][1], pts[i][1], u)];
    }
  }
  return pts[pts.length - 1];
};

/** 带阻尼的摆（挂件落位）：θ = A·e^(−1.8t)·cos(2π·0.9t) */
export const dampSwing = (f: number, f0: number, amp: number, fps = 30) => {
  const t = (f - f0) / fps;
  return t < 0 ? 0 : amp * Math.exp(-1.8 * t) * Math.cos(2 * Math.PI * 0.9 * t);
};
/** 常驻微摆 */
export const idleSwing = (f: number, amp: number, phase: number, fps = 30) => amp * Math.sin(2 * Math.PI * 0.18 * (f / fps) + phase);

/** 轻回弹的展开（0→1，8 帧左右） */
export const unfold = (f: number, f0: number, dur = 8) => rf(f, f0, dur, (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2));
/** 出现后弹一下（back.out） */
export const backOut = (x: number, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
/** 单次胀一下 1→1+amp→1 */
export const swell = (f: number, f0: number, dur: number, amp: number) => (f >= f0 && f < f0 + dur ? 1 + amp * Math.sin(Math.PI * ((f - f0) / dur)) : 1);
