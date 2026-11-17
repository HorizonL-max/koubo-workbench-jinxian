import React from 'react';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../theme';
import {EASE, rf} from '../u';
import {Tip} from './anim';

/**
 * C07 玻璃字框（实拍上压字）：圆角 26、乳白描边 3px α0.9；描边用 draw-svg-trace 画出来（带亮笔头，inOutCubic，描边圆角 = 框圆角）；
 * 框画完框内才起 backdrop-blur 8px + 暗底，children（字）也是这时才出（字自己再按词锚 blur-slide）。
 * 样片：P06 描框 14 帧（返修从 26 改短：框里第一个字不能比口播晚）、暗底 α0.24；P63 金句框暗底 α0.5（实拍亮，字背要 ≤95）。
 * 整屏实拍 + 小头像时：框的下沿不过 y 1000，或整体在 x 280 右边（让出头像区）。
 */
export const rrPath = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
/** 圆角矩形周长上 p（0–1）处的点（笔头位置） */
const rrPoint = (x: number, y: number, w: number, h: number, r: number, p: number): [number, number] => {
  const L = [w - 2 * r, (Math.PI * r) / 2, h - 2 * r, (Math.PI * r) / 2, w - 2 * r, (Math.PI * r) / 2, h - 2 * r, (Math.PI * r) / 2];
  let s = p * L.reduce((a, b) => a + b, 0);
  const arc = (cx: number, cy: number, a0: number, d: number): [number, number] => {
    const a = a0 + (d / r);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const seg: ((d: number) => [number, number])[] = [
    (d) => [x + r + d, y], (d) => arc(x + w - r, y + r, -Math.PI / 2, d), (d) => [x + w, y + r + d], (d) => arc(x + w - r, y + h - r, 0, d),
    (d) => [x + w - r - d, y + h], (d) => arc(x + r, y + h - r, Math.PI / 2, d), (d) => [x, y + h - r - d], (d) => arc(x + r, y + r, Math.PI, d),
  ];
  for (let i = 0; i < 8; i++) {
    if (s <= L[i]) return seg[i](s);
    s -= L[i];
  }
  return [x + r, y];
};
export const GlassFrame: React.FC<{
  f: number; f0: number; dur?: number; x: number; y: number; w: number; h: number; r?: number; bg?: number; op?: number; children?: React.ReactNode;
  /** 框内 backdrop-blur 半径（默认 8；金句卡 10） */ blur?: number;
  /** 笔头颜色（默认亮金；金句卡乳白） */ tipColor?: string;
  /** 描边下的柔影（默认开；金句卡关） */ shadow?: boolean;
}> = ({f, f0, dur = 14, x, y, w, h, r = 26, bg = 0.24, op = 1, children, blur = 8, tipColor, shadow = true}) => {
  const p = rf(f, f0, dur, EASE.inOutC);
  if (p <= 0) return null;
  const done = p >= 1;
  const fill = rf(f, f0 + dur, 6, EASE.outC);
  const tip = !done ? rrPoint(x, y, w, h, r, p) : null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: op, pointerEvents: 'none'}}>
      {fill > 0 && <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, background: `rgba(20,13,7,${(bg * fill).toFixed(3)})`}} />}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={rrPath(x, y, w, h, r)} fill="none" stroke={C.cream} strokeOpacity={0.9} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={done ? 0 : 1 - p} style={shadow ? {filter: 'drop-shadow(0 1px 4px rgba(20,12,6,.6))'} : undefined} />
        {tip && <Tip x={tip[0]} y={tip[1]} r={4.5} color={tipColor} />}
      </svg>
      {done && children}
    </div>
  );
};

/**
 * C20 金句卡（样片 P63）= C07 玻璃字框 + C04 字随声出 的组合预设：实拍（或剪影）底上描一圈玻璃框（24 帧带乳白笔头、描边不带影），
 * 描完框里起 backdrop-blur 10px + 暗底 α0.5（实拍亮时字背要 ≤95），然后几行字跟着嘴出（每个字用自己的口播起点，8 帧 blur-slide；
 * 口播比框早到的字等框闭合再出）。行里可以指定亮金字（gold）和空心描边字（hollow，「应该」这类要打问号的词）。
 * 全片最长的一次呼吸（≥10s），全片 1 次；升格（中文字幕让位）。整屏实拍 + 小头像时框下沿不过 y 1000，或整体在 x 280 右边。
 * 参数：f0 起描；outF 起 6 帧淡出（不给不淡）；lines[{t, frames=charFrames(原话,秒), size, weight?, top?, gold?: 下标[], hollow?: 下标[]}]；
 *   top 不给时在框里竖直居中、行距 20。
 */
export type QuoteLine = {t: string; frames: number[]; size: number; weight?: number; top?: number; gold?: number[]; hollow?: number[]};
export const QuoteCard: React.FC<{
  f: number; f0: number; dur?: number; outF?: number; x?: number; y?: number; w?: number; h?: number; r?: number; bg?: number; lines: QuoteLine[];
}> = ({f, f0, dur = 24, outF, x = 110, y = 500, w = 860, h = 480, r = 26, bg = 0.5, lines}) => {
  const out = outF !== undefined ? 1 - rf(f, outF, 6, EASE.lin) : 1;
  if (out <= 0) return null;
  const closeF = f0 + dur;
  const total = lines.reduce((a, l) => a + l.size + 8, 0) + 20 * (lines.length - 1);
  let acc = y + (h - total) / 2;
  const tops = lines.map((l) => {
    const t = l.top ?? acc;
    acc = t + l.size + 8 + 20;
    return t;
  });
  return (
    <GlassFrame f={f} f0={f0} dur={dur} x={x} y={y} w={w} h={h} r={r} bg={bg} blur={10} tipColor={C.cream} shadow={false} op={out}>
      {lines.map((l, k) => (
        <div key={k} style={{position: 'absolute', left: 0, width: 1080, top: tops[k], height: l.size + 8, lineHeight: `${l.size + 8}px`, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: l.weight ?? 900, fontSize: l.size}}>
          {l.t.split('').map((ch, i) => {
            const p = rf(f, Math.max(l.frames[i], closeF), 8, EASE.out);
            const gold = l.gold?.includes(i);
            const hollow = l.hollow?.includes(i);
            const b = (1 - p) * 14;
            const style: React.CSSProperties = gold
              ? {...GOLD_TEXT}
              : hollow
                ? {color: 'rgba(32,22,14,.92)', WebkitTextStroke: `5px ${C.cream}`, paintOrder: 'stroke fill', textShadow: 'none'} // 空心字：描边在下、暗填充盖掉笔画交叠处，露出约 2.5px
                : {color: C.cream, textShadow: SOFT_SHADOW};
            const filt = [b > 0.01 ? `blur(${b.toFixed(2)}px)` : '', gold || hollow ? 'drop-shadow(0 2px 8px rgba(20,12,6,.7))' : ''].filter(Boolean).join(' ');
            return (
              <span key={i} style={{display: 'inline-block', opacity: p, transform: p < 1 ? `translateY(${((1 - p) * 0.3 * l.size).toFixed(2)}px)` : undefined, ...style, filter: filt || undefined}}>
                {ch}
              </span>
            );
          })}
        </div>
      ))}
    </GlassFrame>
  );
};
