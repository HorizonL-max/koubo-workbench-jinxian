import React from 'react';
import {AbsoluteFill} from 'remotion';
import {bezier, clamp01} from '../u';

/**
 * C35 对开门（shotcraft page-turn-transitions barn-door-split，全片 2 次：二幕 P30、三幕 P58）。
 * 规格（SHOTBOOK 1.10）：图解裂成两扇门滑开，真人在门后（不拿人物那一屏去裂）；两扇各滑 ∓1000px / 24 帧 bezier(.42,0,.8,.25)，
 * 按速度加横向运动模糊；门内缘 10px 受光切面。卡里的「过曝光束」不要。裂之前的发丝亮缝由上一镜自己画（P29 的 Crack）。
 * page：旧页（纯函数画面，比如 <Diagram2 f={3919} />），左右两半各渲一份、各自裁切。门后的东西由调用方垫在下面。
 */
const EZ = bezier(0.42, 0, 0.8, 0.25);
export const DOOR = {dur: 24, dist: 1000};
export const doorP = (f: number, f0: number) => EZ(clamp01((f - f0) / DOOR.dur));
export const BarnDoor: React.FC<{f: number; f0: number; page: React.ReactNode; uid?: string}> = ({f, f0, page, uid = 'bd'}) => {
  const p = doorP(f, f0);
  if (p >= 1) return null;
  const dx = DOOR.dist * p;
  const v = DOOR.dist * (doorP(f + 1, f0) - doorP(f - 1, f0)) / 2; // px/帧
  const blur = Math.min(26, v * 0.35);
  const half = (side: -1 | 1) => (
    <AbsoluteFill
      style={{
        clipPath: side < 0 ? 'inset(0 540px 0 0)' : 'inset(0 0 0 540px)',
        transform: dx ? `translateX(${(side * dx).toFixed(2)}px)` : undefined,
        filter: blur > 0.3 ? `url(#${uid}Mb)` : undefined,
      }}
    >
      {page}
      {/* 门内缘受光切面 10px */}
      <div style={{position: 'absolute', top: 0, bottom: 0, width: 10, left: side < 0 ? 530 : 540,
        background: side < 0 ? 'linear-gradient(90deg, rgba(233,190,120,0), rgba(241,217,168,.55))' : 'linear-gradient(90deg, rgba(241,217,168,.55), rgba(233,190,120,0))',
        opacity: clamp01(p * 6)}} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={`${uid}Mb`} x="-10%" y="0" width="120%" height="100%">
            <feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} />
          </filter>
        </defs>
      </svg>
      {half(-1)}
      {half(1)}
    </AbsoluteFill>
  );
};
