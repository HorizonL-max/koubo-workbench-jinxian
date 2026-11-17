import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT} from '../theme';
import {EASE, mix, rf} from '../u';

/**
 * C11 引语纸条（样片 P09「这些都是 / 我自己决定的呀」）：别人 / 自己心里的一句话。
 * 米白纸卡（默认 x 110–970 / y 962–1232，圆角 22，1px 深金边 α0.35，柔影）从下方 40px 升上来（10 帧 outCubic）；
 * 晚 6 帧左上角一个大号金色上引号（Songti Black 150）scale 0.6→1；字逐字硬现（每个字跟自己的口播起点），前面一根金色光标领先，
 * 全部打完后光标 15 帧一闪；可选一道深金下划线（10 帧画出）；退场：纸条下移 20px 淡出（8 帧 inOutCubic）。
 * 放在「中景上提」（FULL_MSB）的胸前区 y 940–1235；属于升格（这几条字幕中文让位、只留英文）。打字写法参考 typewriter-moves，不做删改重打。
 *
 * 参数：
 *   f0      纸条开始升起的帧（样片 = 第一个字的开口帧 − 11）
 *   outF    开始淡出的帧（样片 = 镜尾 − 8）；不给就不退场
 *   lines   每行 {text, frames=charFrames(原话,秒), size, weight, color?}；默认排法：第一行 Bold 60 ink2、第二行 Black 92 ink
 *   underline {line, from, to, f}：第 line 行第 from..to-1 个字下面画线，f 起画
 *   x / y / w / h  纸条位置；字的左边距 = 140（引号让位）
 */
export type SlipLine = {text: string; frames: number[]; size: number; weight?: number; color?: string};
export const QuoteSlip: React.FC<{
  f: number; f0: number; outF?: number; lines: SlipLine[];
  underline?: {line: number; from: number; to: number; f: number};
  x?: number; y?: number; w?: number; h?: number; quote?: boolean;
}> = ({f, f0, outF, lines, underline, x = 110, y = 962, w = 860, h = 270, quote = true}) => {
  const up = rf(f, f0, 10, EASE.outC);
  if (up <= 0) return null;
  const out = outF !== undefined ? rf(f, outF, 8, EASE.inOutC) : 0;
  if (out >= 1) return null;
  const q = rf(f, f0 + 6, 8, EASE.outC);
  const tx = x + 140;
  // 每行的顶：第一行 y+34，之后每行接在上一行下面（行高 = 字号 + 4，行距 20）
  const tops: number[] = [];
  lines.forEach((l, i) => tops.push(i === 0 ? y + 34 : tops[i - 1] + lines[i - 1].size + 4 + 20));
  // 光标：领先在下一个要出的字前面；切到下一行要等那一行第一个字前 3 帧
  let cl = 0;
  for (let i = 1; i < lines.length; i++) {
    const prevDone = lines[i - 1].frames.filter((t) => f >= t).length === lines[i - 1].text.length;
    if (prevDone && f >= lines[i].frames[0] - 3) cl = i;
  }
  const L = lines[cl];
  const nOn = L.frames.filter((t) => f >= t).length;
  const lh = L.size + 4;
  const ch = Math.round(0.9375 * L.size - 6.25); // 样片 60 号 → 50、92 号 → 80
  const cx = tx + nOn * L.size + 4;
  const cy = tops[cl] + Math.round(0.0625 * L.size + 2.25); // 样片 +6 / +8
  const last = lines[lines.length - 1];
  const allDone = last.frames.filter((t) => f >= t).length === last.text.length;
  const blink = allDone ? (Math.floor((f - last.frames[last.text.length - 1]) / 15) % 2 === 0 ? 1 : 0) : 1;
  const ul = underline ? rf(f, underline.f, 10, EASE.outC) : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 1 - out, transform: `translateY(${((1 - up) * 40 + out * 20).toFixed(2)}px)`}}>
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 22, background: C.card, border: '1px solid rgba(168,117,42,.35)', boxShadow: '0 14px 34px rgba(20,13,7,.38)', opacity: up}} />
      {quote && <div style={{position: 'absolute', left: x + 18, top: y - 40, fontFamily: FONT.song, fontWeight: 900, fontSize: 150, lineHeight: '150px', ...GOLD_TEXT, transformOrigin: '30% 60%', transform: `scale(${mix(0.6, 1, q).toFixed(4)})`, opacity: q}}>“</div>}
      {lines.map((l, i) => (
        <div key={i} style={{position: 'absolute', left: tx, top: tops[i], fontFamily: FONT.song, fontWeight: l.weight ?? (i === 0 && lines.length > 1 ? 700 : 900), fontSize: l.size, lineHeight: `${l.size + 4}px`, color: l.color ?? (i === 0 && lines.length > 1 ? C.ink2 : C.ink), whiteSpace: 'nowrap', letterSpacing: 0}}>
          {l.text.split('').map((c, k) => <span key={k} style={{opacity: f >= l.frames[k] ? 1 : 0}}>{c}</span>)}
        </div>
      ))}
      {underline && ul > 0 && (
        <div style={{position: 'absolute', left: tx + underline.from * lines[underline.line].size, top: tops[underline.line] + lines[underline.line].size + 4 + 8, width: (underline.to - underline.from) * lines[underline.line].size * ul, height: 6, borderRadius: 3, background: C.goldDeep}} />
      )}
      {f >= lines[0].frames[0] - 4 && <div style={{position: 'absolute', left: cx, top: cy, width: 4, height: ch, background: C.goldHi, opacity: blink}} />}
    </AbsoluteFill>
  );
};
