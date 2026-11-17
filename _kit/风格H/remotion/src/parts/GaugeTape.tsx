import React from 'react';
import {C} from '../theme';
import {clamp01, EASE, FPS, mix, rf} from '../u';

/**
 * C08 刻度带急刹（shotcraft gauge-readout-moves B 式「滚带定针」改横向）：一条**没有数字**的刻度尺横着滚，指针不动，
 * 带子指数减速冲过停点 over px → tb 秒缓回停点 → 锁死（样片「到了某个年龄」）。全片 ≤2 次。
 * 用显式两段公式，不用欠阻尼弹簧（阻尼大时过冲顶点会提前、过冲也更大，卡不准帧——样片坑）。
 * 小格 24px（高 22、2px）、大格 120px（高 44、3px）、停点那根刹住后长到 64、亮金；速度 >600px/s 加横向运动模糊；停的那一下指针下压 6px。
 * 刻度过针的帧（tickFrames）给棘轮咔嗒声逐下排。
 */
export type Gauge = {t0: number; dist?: number; over?: number; k?: number; tt?: number; tb?: number};
const G = (g: Gauge) => ({dist: 445, over: 10, k: 3.1, tt: 1.2, tb: 0.4, ...g});
export const tapeX = (g0: Gauge, f: number) => {
  const g = G(g0);
  const s = (f - g.t0) / FPS;
  if (s <= 0) return 0;
  if (s <= g.tt) return ((g.dist + g.over) * (1 - Math.exp(-g.k * s))) / (1 - Math.exp(-g.k * g.tt));
  if (s <= g.tt + g.tb) return g.dist + g.over * (1 - EASE.inOutC((s - g.tt) / g.tb));
  return g.dist;
};
/** 刹停（过冲顶点）那一帧 */
export const stopFrame = (g: Gauge) => g.t0 + Math.round(G(g).tt * FPS);
/** 刻度过针的帧：相邻两下不密于 2 帧 */
export const tickFrames = (g0: Gauge): number[] => {
  const g = G(g0);
  const out: number[] = [];
  let lastC = 0, lastF = -99;
  for (let f = g.t0; f <= stopFrame(g0); f += 0.1) {
    const c = Math.floor((Math.min(tapeX(g0, f), g.dist) + 1e-6) / 24);
    if (c > lastC) {
      lastC = c;
      if (f - lastF >= 2) {
        out.push(Math.round(f));
        lastF = f;
      }
    }
  }
  return out;
};
export const GaugeTape: React.FC<{f: number; g: Gauge; y?: number; ptrX?: number; baseF?: number; op?: number; uid?: string}> = ({f, g, y = 600, ptrX = 540, baseF, op = 1, uid = 'gt'}) => {
  const base = rf(f, baseF ?? g.t0 - 6, 6, EASE.outC);
  if (base <= 0) return null;
  const D = G(g).dist;
  const x = tapeX(g, f);
  const v = Math.abs((tapeX(g, f + 0.5) - tapeX(g, f - 0.5)) * FPS);
  const blur = clamp01((v - 600) / 800) * 6;
  const SF = stopFrame(g);
  const stopOn = rf(f, SF, 4, EASE.outC);
  const ticks: React.ReactNode[] = [];
  for (let n = -60; n <= 40; n++) {
    const sx = ptrX + n * 24 + D - x;
    if (sx < -10 || sx > 1090) continue;
    const major = n % 5 === 0, isStop = n === 0;
    const h = isStop ? mix(44, 64, stopOn) : major ? 44 : 22;
    ticks.push(<rect key={n} x={(sx - (major ? 1.5 : 1)).toFixed(2)} y={y - h} width={major ? 3 : 2} height={h} fill={isStop && stopOn > 0 ? C.goldHi : C.gold} opacity={isStop ? 1 : major ? 0.9 : 0.7} />);
  }
  const dip = f >= SF && f < SF + 6 ? 6 * Math.sin(Math.PI * ((f - SF) / 6)) : 0;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
      <defs>
        <linearGradient id={`${uid}F`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.14" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.86" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${uid}M`}><rect x={0} y={0} width={1080} height={1920} fill={`url(#${uid}F)`} /></mask>
        <filter id={`${uid}B`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} /></filter>
      </defs>
      <g mask={`url(#${uid}M)`} style={{filter: 'drop-shadow(0 1px 3px rgba(20,12,6,.6))'}}>
        <line x1={540 - 540 * base} x2={540 + 540 * base} y1={y} y2={y} stroke={C.gold} strokeWidth={2} />
        {f >= g.t0 && <g filter={blur > 0.05 ? `url(#${uid}B)` : undefined}>{ticks}</g>}
      </g>
      {f >= g.t0 - 2 && <path d={`M${ptrX - 11},${y - 92 + dip} L${ptrX + 11},${y - 92 + dip} L${ptrX},${y - 70 + dip} Z`} fill={C.cream} style={{filter: 'drop-shadow(0 1px 4px rgba(20,12,6,.7))'}} />}
    </svg>
  );
};
