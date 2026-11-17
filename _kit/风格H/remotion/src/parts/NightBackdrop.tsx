import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {FPS, rand} from '../u';

/**
 * 幕底「夜青」（SHOTBOOK 1.6）：径向渐变 + 三团大光斑漂移（shotcraft glow-flyline-moves A 式光斑底噪，口播版照
 * 镜头卡试验-20261114/trial/T1.tsx 的 Ambient 抄：多段径向渐变、screen 叠加、不做实时 blur、双正弦漂移、周期互不相等）
 * + 金尘 20 粒缓缓上飘。换皮：青 / 深蓝 / 金，峰值压到 0.22 以下。
 */
const TAU = Math.PI * 2;
const ORBS = [
  {size: 1150, peak: 0.22, c: '47,111,115', bx: 300, by: 620, p1: 96, p2: 150, ax: 280, ay: 260, seed: 1}, // 青
  {size: 1050, peak: 0.2, c: '31,70,120', bx: 820, by: 1240, p1: 126, p2: 96, ax: 300, ay: 270, seed: 2}, // 深蓝
  {size: 820, peak: 0.1, c: '201,160,99', bx: 640, by: 360, p1: 150, p2: 126, ax: 260, ay: 200, seed: 3}, // 金
];
const orbPos = (i: number, f: number) => {
  const o = ORBS[i];
  const ph = (k: number) => rand(o.seed * 7 + k) * TAU;
  return {
    x: o.bx + o.ax * (0.62 * Math.sin((TAU * f) / o.p1 + ph(1)) + 0.38 * Math.sin((TAU * f) / o.p2 + ph(2))),
    y: o.by + o.ay * (0.6 * Math.sin((TAU * f) / o.p2 + ph(3)) + 0.4 * Math.sin((TAU * f) / o.p1 + ph(4))),
  };
};
const DUST = Array.from({length: 20}, (_, i) => ({
  x: 60 + rand(i * 3.3) * 960, y: rand(i * 5.1) * 1920, v: 6 + rand(i * 7.9) * 8, r: 1.5 + rand(i * 9.7) * 2, a: 0.25 + rand(i * 11.3) * 0.35, ph: rand(i * 13.1) * TAU, sw: 0.6 + rand(i * 2.2),
}));

export const NightBackdrop: React.FC<{f: number; opacity: number}> = ({f, opacity}) => {
  if (opacity <= 0) return null;
  const t = f / FPS;
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 540px 820px, ${C.nightMid} 0%, #11263a 45%, ${C.night} 100%)`}} />
      {ORBS.map((o, i) => {
        const p = orbPos(i, f);
        return (
          <div key={i} style={{position: 'absolute', left: p.x - o.size / 2, top: p.y - o.size / 2, width: o.size, height: o.size, borderRadius: '50%', mixBlendMode: 'screen',
            background: `radial-gradient(circle closest-side, rgba(${o.c},${o.peak}) 0%, rgba(${o.c},${o.peak * 0.62}) 22%, rgba(${o.c},${o.peak * 0.3}) 48%, rgba(${o.c},${o.peak * 0.1}) 72%, rgba(${o.c},0) 100%)`}} />
        );
      })}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {DUST.map((d, i) => {
          const y = (((d.y - d.v * t) % 1920) + 1920) % 1920;
          const x = d.x + 10 * Math.sin(t * d.sw + d.ph);
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={d.r} fill={C.goldHi} opacity={d.a} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
