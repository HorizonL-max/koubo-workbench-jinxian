import React from 'react';
import {clamp01, EASE, mix, rf} from '../u';
import {backOut} from './anim';

/**
 * C34 词槽：句干钉住不动，槽里的词往上翻一格换下一个（talkcraft word-slot-cycle）：换位 8 帧、中间帧模糊 4px，
 * 最后一个词用 14 帧 back.out(1.4) 落定。还没说到的词不出现（不留下一行的预告），只在上方留一行 α0.13 的残影。
 * 小号放进纸签（P13），大号放进金框牌（三幕 P59）。返回的是槽内节点，外面自己套容器（overflow hidden）。
 */
export const SlotWord: React.FC<{f: number; words: {t: string; f: number}[]; size: number; lineH: number; color: string; weight?: number; ghostOut?: number}> = ({f, words, size, lineH, color, weight = 900, ghostOut}) => {
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].f) cur = i;
  if (cur < 0) return null;
  const last = cur === words.length - 1 && words.length > 1;
  const dur = last ? 14 : 8;
  const p = cur === 0 ? rf(f, words[0].f, 8, EASE.out) : clamp01((f - words[cur].f) / dur);
  const e = cur === 0 ? p : last ? backOut(p, 1.4) : EASE.inOutC(p);
  const mid = Math.sin(Math.PI * clamp01(p)) * 4;
  const row = (t: string, y: number, op: number, blur: number, k: string) => (
    <div key={k} style={{position: 'absolute', left: 0, right: 0, top: y, height: lineH, lineHeight: `${lineH}px`, textAlign: 'center', fontWeight: weight, fontSize: size, color, opacity: op, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined, whiteSpace: 'nowrap'}}>
      {t}
    </div>
  );
  if (cur === 0) return row(words[0].t, mix(lineH * 0.4, 0, e), p, (1 - p) * 6, 'w0');
  return (
    <>
      {row(words[cur - 1].t, mix(0, -lineH, Math.min(1, e)), mix(1, 0.13, clamp01(p)) * (ghostOut ? 1 - rf(f, words[cur].f + dur, ghostOut, EASE.lin) : 1), mid, 'prev')}{/* 返修加 ghostOut：落定后残影淡到 0（P59 用） */}
      {row(words[cur].t, mix(lineH, 0, e), clamp01(p * 1.6), mid, 'cur')}
    </>
  );
};
