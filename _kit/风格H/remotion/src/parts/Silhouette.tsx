import React from 'react';
import {C} from '../theme';
import {EASE, mix, rf} from '../u';
import {drawOn} from './anim';

/**
 * C10 人影图解里的剪影（主讲人自己的轮廓）：tools/silhouette.py 从切点那一帧的人像遮罩出 {fill, outline, bbox} 写成 json。
 * 「人变剪影」转场：人物 12 帧淡出（rows 里给 fade），同时这里 12 帧淡入，房间叠化成夜青（NightBackdrop 放在 Back 层、跟着淡入）；画面上其他挂件一个像素都不动。
 * rings：「一个人从小长到大」的同形轮廓（outline 以胸口为心缩放，0.5 / 0.64 / 0.78 / 0.9，逐圈画出）。
 */
export type Sil = {fill: string; outline: string; bbox: number[]};
export const Silhouette: React.FC<{f: number; sil: Sil; f0: number; dur?: number; rings?: number[]; ringF?: number; ringGap?: number; heart?: [number, number]}> = ({f, sil, f0, dur = 12, rings = [], ringF, ringGap = 6, heart = [545, 1150]}) => {
  const op = rf(f, f0, dur, EASE.lin);
  if (op <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={sil.fill} fill={C.nightFig} stroke={C.gold} strokeOpacity={0.5} strokeWidth={1.5} opacity={op} />
      {ringF !== undefined &&
        rings.map((s, i) => {
          const p = rf(f, ringF + i * ringGap, 14, EASE.inOutC);
          if (p <= 0) return null;
          return (
            <g key={i} transform={`translate(${heart[0]} ${heart[1]}) scale(${s}) translate(${-heart[0]} ${-heart[1]})`}>
              <path d={sil.outline} fill="none" stroke={C.goldHi} strokeOpacity={mix(0.35, 0.7, i / Math.max(1, rings.length - 1))} strokeWidth={2 / s} {...drawOn(p)} />
            </g>
          );
        })}
    </svg>
  );
};
