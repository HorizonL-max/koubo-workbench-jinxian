import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../theme';
import {clamp01, EASE, FPS, rand, rf} from '../u';
import {NightBackdrop} from './NightBackdrop';
import {backOut} from './anim';

/**
 * C16 章节卡（样片 P40「一个人的自由」）：夜青底 + 中部一条青绿粒子光波缓流；金色主题短语每个字在自己的裁切盒里从下方 115% 升起
 * （talkcraft split-text-stagger：back.out(1.2) 15 帧、错峰 2 帧），末字落定后底线 3px 12 帧从中间往两边画出；
 * 下面一行乳白副句逐字硬现（每个字跟自己的口播起点），前面一根金色光标，关键字亮金。
 * 规格：主题短语只用口播原话、≤8 字；口播不断，整镜 ≤4s；人物退场（HIDE）；顶牌在这镜让位（ep/episode.ts 的 titleHides）。
 *
 * 参数：
 *   from      镜头起点帧（光波从这里 10 帧淡入、按这里算流动相位）
 *   titleF    主题短语第一个字开始升起的帧（一般 = WF(短语)）
 *   sub/subFrames  副句和逐字开口帧（charFrames(副句, 秒)）；subGold(i) 哪几个字亮金
 *   y         主题短语字盒顶（样片 600）；底线在 y+151，副句在 y+206
 *   backdrop  false 时不画夜青底（自己铺别的底时用）；wave=false 不画光波
 */
export const TealWave: React.FC<{f: number; from: number; y?: number; n?: number; opacity?: number}> = ({f, from, y = 1000, n = 90, opacity = 1}) => {
  const t = (f - from) / FPS;
  const fade = clamp01((f - from) / 10) * opacity;
  if (fade <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {Array.from({length: n}, (_, i) => {
        const u = i / (n - 1), k = i % 3, j = rand(i * 3.7 + 2), s = 1.2 + rand(i * 5.1) * 2.2;
        const x = -40 + u * 1160;
        const ph = t * (0.55 + 0.12 * k) + u * (5.2 + k * 0.9) + k * 1.7;
        const yy = y + Math.sin(ph) * (46 + 18 * k) + (j - 0.5) * 22 + (k - 1) * 30;
        const a = (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(ph * 1.3 + j * 6))) * fade;
        return <circle key={i} cx={x.toFixed(1)} cy={yy.toFixed(1)} r={s} fill={k === 1 ? '#7fc9bf' : '#4f9c96'} opacity={a} />;
      })}
    </svg>
  );
};

export const ChapterCard: React.FC<{
  f: number; from: number; title: string; titleF: number; titleSize?: number; y?: number;
  sub?: string; subFrames?: number[]; subSize?: number; subGold?: (i: number) => boolean;
  backdrop?: boolean; wave?: boolean; waveY?: number;
}> = ({f, from, title, titleF, titleSize = 132, y = 600, sub, subFrames, subSize = 50, subGold, backdrop = true, wave = true, waveY = 1000}) => {
  if (f < from) return null;
  const n = title.length;
  const boxH = Math.round(titleSize * 1.06);
  const W = n * titleSize;
  const lastIn = titleF + 2 * (n - 1) + 15;
  const ul = rf(f, lastIn, 12, EASE.inOutC);
  const ulY = y + Math.round(boxH * 1.0786); // 样片 140 高字盒 → 底线 y+151
  const subY = y + Math.round(boxH * 1.4714); // → 副句 y+206
  const sn = sub && subFrames ? subFrames.filter((x) => f >= x).length : 0;
  const subW = (sub?.length ?? 0) * subSize;
  return (
    <AbsoluteFill>
      {backdrop && <NightBackdrop f={f} opacity={1} />}
      {wave && <TealWave f={f} from={from} y={waveY} />}
      <div style={{position: 'absolute', left: 540 - W / 2, top: y, width: W, height: boxH, display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 3px 12px rgba(0,0,0,.55))'}}>
        {title.split('').map((ch, i) => {
          const q = rf(f, titleF + 2 * i, 15, EASE.lin);
          const yy = q <= 0 ? 1.15 : 1.15 * (1 - backOut(q, 1.2));
          return (
            <div key={i} style={{width: titleSize, height: boxH, overflow: 'hidden', position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, top: 0, width: titleSize, height: boxH, transform: `translateY(${(yy * boxH).toFixed(2)}px)`, fontFamily: FONT.song, fontWeight: 900, fontSize: titleSize, lineHeight: `${boxH}px`, textAlign: 'center', ...GOLD_TEXT}}>{ch}</div>
            </div>
          );
        })}
      </div>
      {ul > 0 && <div style={{position: 'absolute', left: 540 - (W / 2) * ul, width: W * ul, top: ulY, height: 3, background: `linear-gradient(90deg, ${C.goldDark}, ${C.goldHi2} 50%, ${C.goldDark})`}} />}
      {sub && subFrames && (
        <div style={{position: 'absolute', left: 540 - subW / 2, top: subY, height: subSize + 6, width: subW, display: 'flex', fontFamily: FONT.song, fontWeight: 700, fontSize: subSize, lineHeight: `${subSize + 6}px`, color: C.cream, textShadow: SOFT_SHADOW, whiteSpace: 'nowrap'}}>
          {sub.split('').map((ch, i) => {
            const gold = subGold?.(i);
            return <span key={i} style={{width: subSize, textAlign: 'center', opacity: f >= subFrames[i] ? 1 : 0, ...(gold ? {...GOLD_TEXT, filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))'} : {})}}>{ch}</span>;
          })}
          {f >= subFrames[0] - 3 && sn < sub.length && <div style={{position: 'absolute', left: sn * subSize + 3, top: Math.round(subSize * 0.12), width: 4, height: Math.round(subSize * 0.92), background: C.goldHi}} />}
        </div>
      )}
    </AbsoluteFill>
  );
};
