import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT} from '../theme';
import {clamp01, EASE, mix, rand, rf} from '../u';
import {NightBackdrop} from './NightBackdrop';
import {blurIn, Seg, Words} from './anim';

/**
 * C15 概念牌（样片 P22「社会性学习」）：夜青底 + 金纹标题牌（标题两侧各一根金线 + 中间 Songti Black 亮金）+ 可选的米白大卡（936×640），卡里一行一行出字。
 * 人物退场（HIDE）、顶牌让位。标题只用口播原话。
 *
 * 标题出现两种：
 *   reveal="spot"（样片做法，shotcraft light-play-moves A 式 spotlight-sweep，口播版照 trial/T7.tsx T7a）：硬切到很暗的夜青、没有光斑底；
 *     开口起 26 帧光斑（椭圆、硬芯长软边）从最左摆到最右再回正中停住（钟摆带衰减，x 和速度同时归零），亮版文字只在光斑里显出来（没有暗版预告）；
 *     之后 8 帧光圈张开全亮、收成柔和顶光；再 10 帧两侧金线画出；光斑里有 14 粒浮尘。光效全片 ≤2 次（和别的扫光、光斑镜合算）。
 *   reveal="blur"：夜青幕底（NightBackdrop），标题 10 帧 blur-slide，落定后两侧金线 10 帧画出。
 * 大卡：cardF 起从下方 40px 升上来（10 帧 outCubic），lines 每行按自己的段落帧 blur-slide 出（墨色、金段深金）。
 *
 * 参数：
 *   from     镜头起点帧（浮尘相位、lead 小字从这里就在）
 *   titleF   标题开口帧
 *   titleY   标题中线 y（不给：有大卡 360，没有 875 = 样片）；titleSize 默认有卡 100、没卡 150（样片）
 *   lead     标题前面那半句小字（样片「有一个概念叫做」Bold 40 乳白 α0.55），在标题上方 185px
 *   card     {f, y?, lines:[{segs:[{t,f,gold?}], size?}]}；卡 x 72–1008、高 640，默认顶 = titleY + 130
 */
export type ConceptLine = {segs: Seg[]; size?: number};
const MOTES = Array.from({length: 14}, (_, i) => ({x: 200 + rand(i * 3.3 + 1) * 680, dy: rand(i * 5.7 + 2) * 420, v: 4 + rand(i * 2.1) * 6, ph: rand(i * 8.1) * 6.28, r: 1.2 + rand(i * 4.4) * 1.6}));
const SWING = 26, PER = 34.67; // 26 帧 = 0.75 周期（左→右→中）

export const ConceptPlaque: React.FC<{
  f: number; from: number; title: string; titleF: number; reveal?: 'spot' | 'blur';
  titleY?: number; titleSize?: number; lead?: string;
  card?: {f: number; y?: number; lines: ConceptLine[]};
}> = ({f, from, title, titleF, reveal = 'spot', titleY, titleSize, lead, card}) => {
  if (f < from) return null;
  const TY = titleY ?? (card ? 360 : 875);
  const size = titleSize ?? (card ? 100 : 150);
  const half = (title.length * size) / 2;
  const spotMode = reveal === 'spot';
  const PS = titleF, PE = PS + SWING;
  const spot = (fr: number) => {
    const th = -Math.PI / 2 + (2 * Math.PI * (fr - PS)) / PER;
    const e = fr < PS ? 1 : 1 - EASE.inOutC(clamp01((fr - PS - PER / 2) / (PE - PS - PER / 2)));
    const s = Math.sin(th) * e;
    return {x: 540 + 560 * s, y: TY - 16 + 30 * (1 - s * s)};
  };
  const iris = rf(f, PE, 8, EASE.outC);
  const r = mix(300, 1300, iris);
  const p = f < PS ? spot(PS) : spot(Math.min(f, PE));
  const lit = f >= PS;
  const mask = spotMode ? `radial-gradient(ellipse ${(r * 1.12).toFixed(0)}px ${(r * 0.62).toFixed(0)}px at ${p.x.toFixed(1)}px ${p.y.toFixed(1)}px, #000 0%, #000 36%, rgba(0,0,0,.55) 62%, transparent 100%)` : undefined;
  const lineF = spotMode ? PE + 8 : titleF + 10;
  const lines = rf(f, lineF, 10, EASE.inOutC);
  const t = (f - from) / 30;
  const inner = half + 10, len = 45;
  const titleNode = (
    <div style={{position: 'absolute', left: 0, width: 1080, top: TY - size / 2, height: size, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: size, lineHeight: `${size}px`, whiteSpace: 'nowrap', filter: 'drop-shadow(0 3px 12px rgba(0,0,0,.6))'}}>
      <span style={{...(spotMode ? {} : blurIn(f, titleF, 10, 0.34 * size, 14)), ...GOLD_TEXT, backgroundImage: `linear-gradient(180deg, #fff6e6 0%, ${C.goldHi2} 40%, ${C.goldHi} 100%)`}}>{title}</span>
    </div>
  );
  const cardUp = card ? rf(f, card.f, 10, EASE.outC) : 0;
  const cardY = card?.y ?? TY + 130;
  return (
    <AbsoluteFill>
      {spotMode ? <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 60% at 50% 46%, #0d1d2c 0%, #070f18 100%)'}} /> : <NightBackdrop f={f} opacity={1} />}
      {spotMode && lit && <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 40% at 50% 46%, #1b3a52 0%, #0d1d2c 80%)', WebkitMaskImage: mask, maskImage: mask, opacity: 0.85}} />}
      {lead && <div style={{position: 'absolute', left: 0, width: 1080, top: TY - 185, height: 50, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 40, lineHeight: '50px', color: C.cream, opacity: 0.55}}>{lead}</div>}
      {spotMode ? lit && <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{titleNode}</AbsoluteFill> : f >= titleF && titleNode}
      {spotMode && iris > 0 && <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 34% at 50% 40%, rgba(255,240,215,.07), transparent 70%)', opacity: iris}} />}
      {lines > 0 && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={540 - inner} y1={TY} x2={540 - inner - len * lines} y2={TY} stroke={C.gold} strokeWidth={2} />
          <line x1={540 + inner} y1={TY} x2={540 + inner + len * lines} y2={TY} stroke={C.gold} strokeWidth={2} />
        </svg>
      )}
      {spotMode && lit && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, WebkitMaskImage: mask, maskImage: mask}}>
          {MOTES.map((m, i) => <circle key={i} cx={m.x + 8 * Math.sin(t * 0.8 + m.ph)} cy={TY - 255 + m.dy - m.v * t} r={m.r} fill={C.goldHi2} opacity={0.45} />)}
        </svg>
      )}
      {card && cardUp > 0 && (
        <div style={{position: 'absolute', left: 72, top: cardY, width: 936, height: 640, borderRadius: 22, background: C.card, border: '1px solid rgba(168,117,42,.35)', boxShadow: '0 14px 34px rgba(20,13,7,.38)', opacity: cardUp, transform: `translateY(${((1 - cardUp) * 40).toFixed(2)}px)`}}>
          {card.lines.map((l, i) => {
            const s = l.size ?? 72;
            return <Words key={i} segs={l.segs} f={f} dark={false} dur={10} dy={0.34 * s} style={{position: 'absolute', left: 64, top: 64 + i * Math.round(s * 1.6), fontSize: s, lineHeight: `${s + 8}px`, fontWeight: 900}} />;
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
