import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../theme';
import {charFrames, clamp01, EASE, rf} from '../u';

/**
 * C04 升格问句（全片的几个大问句，≤4 次；对应字幕条要标 up: true，中文让位、英文留着）。
 * 用在中景上提（FULL_MSB）+ 底部压暗上提（EP.lifts）的镜头里，字在胸前区 y 940–1235。
 * - 字随声出：每个字在自己的口播起点那一帧出现，8 帧 blur-slide（上移 0.3em、模糊 14→0、透明度同一条 ease-out）。
 * - gold 里的字亮金、入场 scale 1.12→1；qmark 给了就在最后加一个「？」（晚 3 帧，scale 1.2→1）。
 * - mark（可选）：金线母题——一根金线从顶牌竖金条下端 (66,266) 垂下来（ease-in，亮笔头），拐弧贴着 mark 那几个字的字底甩成马克笔下划线
 *   （marker-underline-title：中段宽约 0.12em、首尾细、边缘毛糙、宋体正体水平微抖不上斜）。线不经过脸：垂线在 x=66。
 * 样片 P02：lines = [{'真的是你', 4.0, 96, y972}, {'自己决定的吗', 4.8, 124, y1078, gold [0,1]}]，mark 第 2 行第 0–1 字，qmark。
 */
export type QLine = {text: string; near: number; size: number; y: number; gold?: number[]};
type Mark = {line: number; chars: [number, number]; f0?: number};

const Ch: React.FC<{ch: string; f0: number; f: number; size: number; gold?: boolean; pop?: number}> = ({ch, f0, f, size, gold, pop}) => {
  const p = rf(f, f0, 8, EASE.out);
  const sc = pop ? 1 + (pop - 1) * (1 - rf(f, f0, 10, EASE.out)) : 1;
  const b = (1 - p) * 14;
  return (
    <span style={{display: 'inline-block', width: size, textAlign: 'center', opacity: p,
      transform: p < 1 || sc !== 1 ? `translateY(${((1 - p) * 0.3 * size).toFixed(2)}px) scale(${sc.toFixed(4)})` : undefined,
      filter: b > 0.01 ? `blur(${b.toFixed(2)}px)` : undefined, ...(gold ? GOLD_TEXT : {color: C.cream})}}>
      {ch}
    </span>
  );
};
/** 马克笔下划线的笔形：中段宽 ~15px、首尾 ~2px，上下边各带一点确定性毛糙 */
export const markerPath = (x0: number, x1: number, y: number) => {
  const N = 40, top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = x0 + (x1 - x0) * u;
    const w = 2 + 13 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.7);
    const wob = Math.sin(u * 23.1) * 0.6 + Math.sin(u * 57.7) * 0.35;
    const rough = (k: number) => Math.sin(u * 91 + k) * 0.5 + Math.sin(u * 173 + k * 2) * 0.35;
    top.push(`${x.toFixed(1)},${(y - w / 2 + wob + rough(1)).toFixed(2)}`);
    bot.unshift(`${x.toFixed(1)},${(y + w / 2 + wob + rough(4)).toFixed(2)}`);
  }
  return 'M' + top.join(' L') + ' L' + bot.join(' L') + ' Z';
};

export const RiseQuestion: React.FC<{f: number; f0: number; f1: number; lines: QLine[]; qmark?: boolean; mark?: Mark; uid?: string}> = ({f, f0, f1, lines, qmark, mark, uid = 'rq'}) => {
  if (f < f0 || f >= f1) return null;
  const FR = lines.map((l) => charFrames(l.text, l.near));
  const last = lines[lines.length - 1];
  const QF = FR[FR.length - 1][FR[FR.length - 1].length - 1] + 3;
  // 每行起点 x（整行居中，每字占 size 宽；问号算在最后一行）
  const lx = (k: number) => 540 - ((lines[k].text.length + (qmark && k === lines.length - 1 ? 1 : 0)) * lines[k].size) / 2;
  let ul: React.ReactNode = null;
  if (mark) {
    const L = lines[mark.line];
    const UX0 = lx(mark.line) + mark.chars[0] * L.size - 2, UX1 = lx(mark.line) + (mark.chars[1] + 1) * L.size + 6;
    const ULY = L.y + L.size * 1.11, YV = ULY - 44, X0 = 66, Y0 = 266;
    const D0 = mark.f0 ?? FR[mark.line][mark.chars[0]] - 6, D1 = D0 + 14, U1 = D1 + 12;
    const pd = rf(f, D0, D1 - D0, EASE.inQ);
    const yHead = Y0 + (YV - Y0) * pd;
    const pu = rf(f, D1, U1 - D1, EASE.outC);
    const arcP = clamp01(pu / 0.18), ulP = clamp01((pu - 0.1) / 0.9);
    const ulX = UX0 + (UX1 - UX0) * ulP;
    const tipXY: [number, number] = f < D1 ? [X0, yHead] : arcP < 1 ? [X0 + (UX0 - X0) * arcP, YV + (ULY - YV) * Math.sin((arcP * Math.PI) / 2)] : [ulX, ULY];
    ul = (
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={`${uid}G`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.goldHi} /><stop offset="0.5" stopColor={C.goldHi2} /><stop offset="1" stopColor={C.gold} />
          </linearGradient>
          <clipPath id={`${uid}C`}><rect x={UX0 - 4} y={ULY - 30} width={Math.max(0, ulX - UX0 + 4)} height={60} /></clipPath>
          <filter id={`${uid}D`} x="-5%" y="-50%" width="110%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.25" numOctaves={2} seed={7} />
            <feDisplacementMap in="SourceGraphic" scale={2.2} />
          </filter>
        </defs>
        {f >= D0 && (
          <g style={{filter: 'drop-shadow(0 0 4px rgba(233,190,120,.5))'}}>
            <line x1={X0} y1={Y0} x2={X0} y2={yHead.toFixed(1)} stroke={C.gold} strokeOpacity={0.9} strokeWidth={2} />
            {f >= D1 && <path d={`M${X0},${YV} Q${X0},${ULY} ${UX0},${ULY}`} fill="none" stroke={C.gold} strokeOpacity={0.9} strokeWidth={2} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - arcP} />}
          </g>
        )}
        {ulP > 0 && <path d={markerPath(UX0, UX1, ULY)} fill={`url(#${uid}G)`} clipPath={`url(#${uid}C)`} filter={`url(#${uid}D)`} />}
        {f >= D0 && f < U1 + 1 && (
          <g transform={`translate(${tipXY[0].toFixed(1)} ${tipXY[1].toFixed(1)})`}>
            <circle r={12} fill={C.goldHi2} opacity={0.35} /><circle r={4} fill="#fff4dc" />
          </g>
        )}
      </svg>
    );
  }
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {lines.map((l, k) => (
        <div key={k} style={{position: 'absolute', left: 0, width: 1080, top: l.y, height: l.size, display: 'flex', justifyContent: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: l.size, lineHeight: `${l.size}px`, textShadow: SOFT_SHADOW, whiteSpace: 'nowrap', filter: l.gold ? 'drop-shadow(0 2px 8px rgba(20,12,6,.55))' : undefined}}>
          {l.text.split('').map((ch, i) => {
            const g = !!l.gold?.includes(i);
            return <Ch key={i} ch={ch} f0={FR[k][i]} f={f} size={l.size} gold={g} pop={g ? 1.12 : undefined} />;
          })}
          {qmark && k === lines.length - 1 && <Ch ch="？" f0={QF} f={f} size={last.size} pop={1.2} />}
        </div>
      ))}
      {ul}
    </AbsoluteFill>
  );
};
