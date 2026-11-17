// 「金线讲堂」视觉系统 token（SHOTBOOK 1.3 / 1.4）。全片只从这里取色取字，不在场景里随手取色。
export const C = {
  gold: '#c9a063',
  goldHi: '#e9be78',
  goldHi2: '#f1d9a8',
  goldDeep: '#a8752a',
  goldDark: '#8f6a34',
  cream: '#fff6e6',
  card: '#f4ecda',
  ink: '#3a2a1c',
  ink2: '#6b5743',
  night: '#0d1d2c',
  nightMid: '#173349',
  nightBack: '#14293b',
  nightFig: '#284257',
  scrim: '#140d07',
};
/** 亮金渐变字（深底 / 人物上的强调字） */
export const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: `linear-gradient(180deg, ${C.goldHi2} 0%, ${C.goldHi} 46%, #c99550 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  textShadow: 'none',
};
/** 金环渐变（徽章外圈） */
export const RING_GRAD = `conic-gradient(from 210deg, ${C.goldHi2}, ${C.gold} 25%, ${C.goldDark} 50%, ${C.gold} 75%, ${C.goldHi2})`;
export const FONT = {
  song: '"Songti SC", "STSong", "Source Han Serif SC", "Noto Serif SC", "Noto Serif CJK SC", "SimSun", serif',
  en: 'Georgia, "Times New Roman", serif',
};
/** 深底 / 人物上的字：柔影 */
export const SOFT_SHADOW = '0 2px 10px rgba(20,12,6,.75)';
import type React from 'react';
