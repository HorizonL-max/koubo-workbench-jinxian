import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {FPS, rand} from '../u';

/**
 * 幕底「宣纸」「檀棕树影」（SHOTBOOK 1.6）。夜青在 NightBackdrop。全片共用，二、三幕直接用。
 * 细线图案（同心圆）一律静止；动的只有金尘 / 树影光斑。
 */
const TAU = Math.PI * 2;

// —— 宣纸 ——
const PDUST = Array.from({length: 28}, (_, i) => ({
  x: 40 + rand(i * 2.7 + 5) * 1000, y: rand(i * 4.3 + 9) * 1920, v: 6 + rand(i * 6.1 + 1) * 8, r: 1.5 + rand(i * 8.3 + 2) * 2, a: 0.25 + rand(i * 9.1 + 3) * 0.35, ph: rand(i * 3.7) * TAU, sw: 0.5 + rand(i * 1.9),
}));
export const PaperBackdrop: React.FC<{f: number; opacity?: number}> = ({f, opacity = 1}) => {
  const t = f / FPS;
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', background: 'linear-gradient(160deg, #e6d9c5 0%, #dcc6ad 100%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.23  0 0 0 0 0.16  0 0 0 0 0.11  0 0 0 0.9 0" />
          </filter>
        </defs>
        <rect width={1080} height={1920} filter="url(#paperGrain)" opacity={0.05} />
        {Array.from({length: 9}, (_, i) => (
          <circle key={i} cx={980} cy={240} r={120 + 90 * i} fill="none" stroke="#fff" strokeOpacity={0.16} strokeWidth={1.5} />
        ))}
        {PDUST.map((d, i) => {
          const y = (((d.y - d.v * t) % 1920) + 1920) % 1920;
          const x = d.x + 10 * Math.sin(t * d.sw + d.ph);
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={d.r} fill={C.gold} opacity={d.a} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// —— 檀棕树影 ——
const LEAVES = Array.from({length: 16}, (_, i) => {
  // 沿 35° 斜带排布的暖光斑（叶隙光），固定种子
  const band = i % 4, k = Math.floor(i / 4);
  const along = 200 + k * 430 + rand(i * 3.1) * 160;
  const off = (band - 1.5) * 330 + (rand(i * 5.3) - 0.5) * 120;
  const a = (35 * Math.PI) / 180;
  return {x: 540 + Math.cos(a) * (along - 900) - Math.sin(a) * off, y: 960 + Math.sin(a) * (along - 900) + Math.cos(a) * off, w: 220 + rand(i * 7.7) * 220, h: 120 + rand(i * 8.8) * 120, al: 0.1 + rand(i * 9.9) * 0.08, ph: rand(i * 4.4) * TAU};
});
export const UmberBackdrop: React.FC<{f: number; opacity?: number}> = ({f, opacity = 1}) => {
  const t = f / FPS;
  const sway = 12 * Math.sin((TAU * t) / 7);
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', background: 'linear-gradient(155deg, #150c06 0%, #2c1d11 48%, #4d3622 100%)'}}>
      {/* 返修：戏台区一块暖色柔光把底提亮（皮影小人填实后 Y≈17，原底 Y≈27，看不出人）。垫在叶隙光斑下面——盖在上面会把光斑的晃动压掉，postcheck Q1 判静止 */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 26% at 50% 33%, rgba(150,104,58,.42) 0%, rgba(120,82,44,.22) 55%, rgba(120,82,44,0) 100%)'}} />
      <AbsoluteFill style={{transform: `translateX(${sway.toFixed(2)}px)`}}>
        {LEAVES.map((l, i) => (
          <div key={i} style={{position: 'absolute', left: l.x - l.w / 2, top: l.y - l.h / 2, width: l.w, height: l.h, transform: 'rotate(35deg)', borderRadius: '50%', mixBlendMode: 'screen',
            background: `radial-gradient(closest-side, rgba(233,180,110,${(l.al * (0.85 + 0.15 * Math.sin(t * 0.9 + l.ph))).toFixed(3)}) 0%, rgba(233,180,110,${(l.al * 0.45).toFixed(3)}) 45%, rgba(233,180,110,0) 100%)`}} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(10,6,3,.45) 100%)'}} />
    </AbsoluteFill>
  );
};

/** 戏台地面线（檀棕上的金发丝线，两端渐隐） */
export const StageFloor: React.FC<{y?: number; x0?: number; x1?: number; opacity?: number}> = ({y = 860, x0 = 110, x1 = 970, opacity = 1}) => (
  <div style={{position: 'absolute', left: x0, width: x1 - x0, top: y - 1, height: 2, opacity, background: 'linear-gradient(90deg, rgba(201,160,99,0), rgba(201,160,99,.4) 15%, rgba(201,160,99,.4) 85%, rgba(201,160,99,0))'}} />
);
