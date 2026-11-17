import React from 'react';
import {C, RING_GRAD} from '../theme';
import {EASE, mix, rf} from '../u';
import {HostVideo} from '../Host';
import {swell} from './anim';
import {VENUE} from '../venue';

/**
 * C22 圆窗（ROUND）：直径 248、圆心 (540,1070)，默认取中景；取景（源画布上哪一块缩进来）读场地预设 round_window_src；
 * 金环 5px + 内侧 7px 处 1px 乳白线 + 柔影；位置锁死不漂。在檀棕 / 夜青上金环外再加一圈 16px 暗晕（#140d07 α0.35）托住。
 * 进：硬切（第一帧就在）。出：exitF 起 6 帧缩到 0.9 淡出。人物视频和合成帧逐帧对齐，所以这里不包 Sequence。
 * 样片 P42 用过居中变体：cx 540 / cy 740 / d 300。
 */
export const ROUND = {cx: 540, cy: 1070, d: 248};
export const RoundWindow: React.FC<{
  f: number; cx?: number; cy?: number; d?: number; cam?: 'ms' | 'cu'; on?: 'paper' | 'umber' | 'night';
  src?: {x: number; y: number; size: number}; exitF?: number; popF?: number;
}> = ({f, cx = ROUND.cx, cy = ROUND.cy, d = ROUND.d, cam = 'ms', on = 'paper', src, exitF, popF}) => {
  const out = exitF !== undefined ? rf(f, exitF, 6, EASE.inOutC) : 0;
  if (out >= 1) return null;
  const sc = mix(1, 0.9, out) * (popF !== undefined ? swell(f, popF, 8, 0.06) : 1);
  const S = src ?? VENUE.round_window_src[cam];
  const inner = d - 10;
  const k = inner / S.size;
  return (
    <div style={{position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, opacity: 1 - out, transform: sc !== 1 ? `scale(${sc.toFixed(4)})` : undefined}}>
      {on !== 'paper' && <div style={{position: 'absolute', left: -16, top: -16, width: d + 32, height: d + 32, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(20,13,7,.35) 80%, rgba(20,13,7,0) 100%)'}} />}
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: RING_GRAD, boxShadow: '0 10px 24px rgba(20,13,7,.35)'}} />
      <div style={{position: 'absolute', left: 5, top: 5, width: inner, height: inner, borderRadius: '50%', overflow: 'hidden', background: '#2a2017'}}>
        <HostVideo cam={cam} style={{left: inner / 2 - S.x * k, top: inner / 2 - S.y * k, transformOrigin: '0 0', transform: `scale(${k.toFixed(5)})`}} />
      </div>
      <div style={{position: 'absolute', left: 12, top: 12, width: d - 24, height: d - 24, borderRadius: '50%', border: `1px solid rgba(255,246,230,.55)`}} />
    </div>
  );
};
export {C};
