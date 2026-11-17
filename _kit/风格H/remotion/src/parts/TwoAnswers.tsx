import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT} from '../theme';
import {EASE, mix, rf} from '../u';
import {blurIn, unfold} from './anim';
import {Chars} from './kit';

/**
 * C18 两答纸条：一个问句下面两张纸条，各写一个答案，中间金色「还是」。先出 A（纸条展开，8 帧轻回弹），说到「还是」它 blur-in，
 * 说到 B 时 B 展开、A 同时 8 帧压到 60%（两张不同时满亮）。纸条皮照样片 P46 天平下挂的纸条：纸卡 #f4ecda、圆角 10、1px 深金边 α0.5、柔影；
 * 上行主答案 Songti Black（墨）、下行补充 Bold（ink2）。问句用 Chars 字随声出。
 * 三种摆法（layout）：'lr' 左右（A 左 B 右，「还是」在两张中间）/ 'tb' 上下（从左往右展开）/ 'diag' 斜对（A 左上歪 −3°、B 右下歪 +2°）。
 * 同一期几个拷问轮着用，不连用同一种；样片三个拷问另做了天平（C30）、实拍字条焦点接力（C31）、两人一线，这三种不在本件里。
 *
 * 参数：
 *   q        问句 {text, frames=charFrames(原话,秒), size?=64}；不给就只摆两张纸条
 *   a / b    {main, sub?, f}：f = 这张纸条展开的帧（一般 = 这个答案的开口帧）
 *   orF      「还是」出现的帧（WF('还是', 秒)）；or 改连接词（「或者」）
 *   y        问句顶（默认 320；不给问句时就是纸条区顶）。整片区域 y 320–1000，可以配圆窗 / 小头像
 *   dark     true：深底 / 人物上（问句乳白、「还是」亮金）；false：纸面（问句墨色、「还是」深金）
 *   outF     起 8 帧淡出；mainSize / subSize 默认 56 / 34
 */
export type Answer = {main: string; sub?: string; f: number};
export const slipSize = (a: Answer, mainSize = 56, subSize = 34) => ({
  w: Math.max(a.main.length * mainSize, (a.sub?.length ?? 0) * subSize) + 72,
  h: a.sub ? 30 + mainSize + 4 + 16 + subSize + 4 + 26 : mainSize + 60,
});
const Slip: React.FC<{f: number; a: Answer; cx: number; top: number; rot?: number; from: 'top' | 'left'; dim: number; mainSize: number; subSize: number}> = ({f, a, cx, top, rot = 0, from, dim, mainSize, subSize}) => {
  if (f < a.f) return null;
  const u = unfold(f, a.f);
  const {w, h} = slipSize(a, mainSize, subSize);
  return (
    <div style={{position: 'absolute', left: Math.round(cx - w / 2), top: Math.round(top), width: w, height: h, opacity: mix(1, 0.6, dim), transform: rot ? `rotate(${rot}deg)` : undefined}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 10, background: C.card, border: '1px solid rgba(168,117,42,.5)', boxShadow: '0 8px 18px rgba(20,13,7,.35)', overflow: 'hidden',
        transformOrigin: from === 'top' ? '50% 0' : '0 50%', transform: u < 1 ? (from === 'top' ? `scaleY(${u.toFixed(4)})` : `scaleX(${u.toFixed(4)})`) : undefined}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: mainSize, lineHeight: `${mainSize + 4}px`, color: C.ink, whiteSpace: 'nowrap'}}>{a.main}</div>
        {a.sub && <div style={{position: 'absolute', left: 0, right: 0, top: 30 + mainSize + 4 + 16, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: subSize, lineHeight: `${subSize + 4}px`, color: C.ink2, whiteSpace: 'nowrap'}}>{a.sub}</div>}
      </div>
    </div>
  );
};

export const TwoAnswers: React.FC<{
  f: number; a: Answer; b: Answer; orF: number; or?: string; layout?: 'lr' | 'tb' | 'diag';
  q?: {text: string; frames: number[]; size?: number}; y?: number; dark?: boolean; outF?: number; mainSize?: number; subSize?: number;
}> = ({f, a, b, orF, or = '还是', layout = 'lr', q, y = 320, dark = true, outF, mainSize = 56, subSize = 34}) => {
  const out = outF !== undefined ? rf(f, outF, 8, EASE.inOutC) : 0;
  if (out >= 1) return null;
  const qs = q?.size ?? 64;
  const top = q ? y + qs + 86 : y; // 纸条区顶
  const sa = slipSize(a, mainSize, subSize), sb = slipSize(b, mainSize, subSize);
  const dim = rf(f, b.f, 8, EASE.inOutC);
  const orH = 60;
  let A: {cx: number; top: number; rot?: number}, B: typeof A, O: {cx: number; cy: number; rot?: number};
  let from: 'top' | 'left' = 'top';
  if (layout === 'lr') {
    const hMax = Math.max(sa.h, sb.h);
    A = {cx: 290, top}; B = {cx: 790, top}; O = {cx: 540, cy: top + hMax / 2};
  } else if (layout === 'tb') {
    from = 'left';
    A = {cx: 540, top}; O = {cx: 540, cy: top + sa.h + 24 + orH / 2}; B = {cx: 540, top: top + sa.h + 24 + orH + 24};
  } else {
    A = {cx: 340, top, rot: -3}; O = {cx: 560, cy: top + sa.h + 44, rot: -3}; B = {cx: 740, top: top + sa.h + 44 + orH / 2 + 30, rot: 2};
  }
  const orStyle: React.CSSProperties = dark ? {...GOLD_TEXT, filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))'} : {color: C.goldDeep};
  const ob = blurIn(f, orF, 8, 12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 1 - out}}>
      {q && (
        <div style={{position: 'absolute', left: 0, width: 1080, top: y, height: qs + 6, textAlign: 'center'}}>
          <Chars text={q.text} frames={q.frames} f={f} size={qs} dark={dark} />
        </div>
      )}
      <Slip f={f} a={a} cx={A.cx} top={A.top} rot={A.rot} from={from} dim={dim} mainSize={mainSize} subSize={subSize} />
      {f >= orF && (
        <div style={{position: 'absolute', left: O.cx - 150, width: 300, top: O.cy - orH / 2, height: orH, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 52, lineHeight: `${orH}px`, whiteSpace: 'nowrap', transform: O.rot ? `rotate(${O.rot}deg)` : undefined}}>
          <span style={{...ob, ...orStyle, filter: [ob.filter, orStyle.filter].filter(Boolean).join(' ') || undefined}}>{or}</span>
        </div>
      )}
      <Slip f={f} a={b} cx={B.cx} top={B.top} rot={B.rot} from={from} dim={0} mainSize={mainSize} subSize={subSize} />
    </AbsoluteFill>
  );
};
