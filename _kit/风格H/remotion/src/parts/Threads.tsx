import React from 'react';
import {C} from '../theme';
import {clamp01, EASE, mix, rf} from '../u';
import {dampSwing, idleSwing} from './anim';
import {VENUE} from '../venue';

/**
 * C25 满屋金线（Threads）：中景原幅上从顶边垂下来的 13 根金线，「一直在、现在才看见」。二幕 P41 / P51 用，三幕 P58 接着用。
 * 13 根线的 x / 下端 y 读场地预设（场地预设.json 的 ms_hang.threads；样片那个房间用 face_env 核过：头顶三根离头发顶 ≥86px，左右列离脸侧 ≥57px）。
 * 换场地 / 换座位后重核那份 json，不改这里。
 * 线 2px gold，默认 α0.55，外发光同 C05；下端一粒金珠 r6；各自绕顶端微摆 0.3°–0.5°，相位互不相同。
 * 五个状态都由调用方按帧给（每根一个值，0–1）：
 *   reveal 显（从上往下显出来，透明度从上往下走，不做扫光）；lit 亮（α0.55→0.95，金珠胀一下由 swellF 给）；
 *   cut 剪（在 y≈286 断开：下半截掉下去淡出、上半截缩回顶边）；drop 垂（剪完后重新垂下来，12 帧 + 阻尼摆，dropF 给起点）。
 * 线从顶牌后面过：本组件要画在 TitlePlaque 之下（场景层里画即可）。
 */
export const THREADS: {x: number; y: number}[] = VENUE.ms_hang.threads.map(([x, y]) => ({x, y}));
/** 显形顺序：头顶正上方那根先，向两边一根一根（P41） */
export const REVEAL_ORDER: number[] = VENUE.ms_hang.thread_reveal_order;
const AMP = THREADS.map((_, i) => 0.3 + ((i * 37) % 10) / 50);
const PH = THREADS.map((_, i) => (i * 2.399) % (Math.PI * 2));
export const CUT_Y: number = VENUE.ms_hang.thread_cut_y;

export type ThreadState = {reveal: number; lit?: number; cut?: number; drop?: number; dropF?: number; swellF?: number; alpha?: number};
/** 返修（审片 P1：亮木书架前 2px / α0.55 的线手机上看不见，P58 剪线读不出来）：线宽 2→3.5、默认 α0.55→0.85、金珠 r6→8，
 *  整组加暗描边（drop-shadow 跟着透明度走，显形渐隐不受影响）；scrim>0 时顶部 0–430 加一层压暗（头发顶在 y 500 以下，不碰脸）。 */
const TW = 3.5, BEAD = 8;
export const Threads: React.FC<{f: number; st: (i: number) => ThreadState; only?: number[]; scrim?: number}> = ({f, st, only, scrim = 0}) => (
  <>
  {scrim > 0 && <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 430, background: `linear-gradient(180deg, rgba(20,13,7,${(scrim * 1.4).toFixed(3)}) 0%, rgba(20,13,7,${scrim.toFixed(3)}) 45%, rgba(20,13,7,0) 100%)`, pointerEvents: 'none'}} />}
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', filter: 'drop-shadow(0 0 1.5px rgba(20,13,7,.9)) drop-shadow(0 1px 3px rgba(20,13,7,.55))'}}>
    <defs>
      <filter id="thrGlow" x="-50%" y="-5%" width="200%" height="110%">
        <feGaussianBlur stdDeviation="2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {THREADS.map((t, i) => {
      if (only && !only.includes(i)) return null;
      const s = st(i);
      if (s.reveal <= 0) return null;
      const lit = s.lit ?? 0;
      const a = (s.alpha ?? 0.85) + (1 - (s.alpha ?? 0.85)) * lit;
      const cut = s.cut ?? 0;
      const drop = s.drop ?? 0;
      let ang = idleSwing(f, AMP[i], PH[i]);
      if (s.dropF !== undefined && f >= s.dropF) ang += dampSwing(f, s.dropF + 12, 2.2);
      const sw = s.swellF !== undefined ? (f >= s.swellF && f < s.swellF + 10 ? 1 + 0.6 * Math.sin((Math.PI * (f - s.swellF)) / 10) : 1) : 1;
      // 显：透明度从上往下走（线头前 60px 渐隐），长度 = reveal
      const yEnd = t.y * s.reveal;
      const id = `thrFade${i}`;
      const els: React.ReactNode[] = [];
      if (cut <= 0 || drop > 0) {
        // 整根（或重新垂下来的那一根）
        const len = drop > 0 ? t.y * EASE.outC(drop) : yEnd;
        els.push(
          <g key="w" transform={`rotate(${ang.toFixed(3)} ${t.x} 0)`}>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2={len} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={C.gold} stopOpacity={a} />
              <stop offset={clamp01(1 - 60 / Math.max(60, len)) * (s.reveal < 1 && drop <= 0 ? 1 : 1.0001)} stopColor={C.gold} stopOpacity={a} />
              <stop offset="1" stopColor={C.gold} stopOpacity={s.reveal < 1 && drop <= 0 ? 0 : a} />
            </linearGradient>
            <rect x={t.x - TW / 2} y={0} width={TW} height={Math.max(0.1, len)} fill={`url(#${id})`} filter="url(#thrGlow)" />
            {(s.reveal >= 1 || drop >= 1) && <circle cx={t.x} cy={len} r={BEAD * sw} fill={lit > 0.5 ? C.goldHi2 : C.goldHi} opacity={Math.min(1, a + 0.25)} />}
          </g>,
        );
      } else {
        // 剪：上半截缩回顶边，下半截掉下去淡出
        const up = CUT_Y * (1 - EASE.inOutC(clamp01(cut * 1.4)));
        const fall = EASE.inQ(cut) * 900;
        els.push(
          <g key="c" transform={`rotate(${ang.toFixed(3)} ${t.x} 0)`}>
            <rect x={t.x - TW / 2} y={0} width={TW} height={Math.max(0.1, up)} fill={C.gold} opacity={a} />
            <g opacity={1 - clamp01(cut * 1.2)}>
              <rect x={t.x - TW / 2} y={CUT_Y + fall} width={TW} height={Math.max(0.1, t.y - CUT_Y)} fill={C.gold} opacity={a} />
              <circle cx={t.x} cy={t.y + fall} r={BEAD} fill={C.goldHi} opacity={a} />
            </g>
          </g>,
        );
      }
      return <g key={i}>{els}</g>;
    })}
  </svg>
  </>
);
export {mix, rf};
