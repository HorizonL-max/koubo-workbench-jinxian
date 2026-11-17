import React from 'react';
import {C, FONT} from '../theme';
import {unfold} from './anim';

/**
 * C24 纸签（就是 C05 的吊牌单独拿出来）：纸卡 #f4ecda、圆角 10、1px 深金边 α0.5、柔影；
 * 两行式（小字 Songti Bold 32 深金 + 主词 Songti Black 44–56 墨）或单行。出现：从上往下展开（scaleY 0→1，8 帧，轻微回弹）。
 * x / y 是纸签左上角（cx 给了就按中心对齐）；hang 给了就从纸签顶边中点往上挂一根短金线。
 */
export const tagSize = (main: string, small?: string, size = 44) => {
  const w = Math.max(main.length * size, (small?.length ?? 0) * 32) + 36;
  const h = small ? size + 60 : size + 28;
  return {w, h};
};
export const PaperTag: React.FC<{
  f: number; f0: number; main: string; small?: string; size?: number;
  x?: number; cx?: number; y: number; rot?: number; opacity?: number; hang?: number; from?: 'top' | 'left';
  mainNode?: React.ReactNode; w?: number;
}> = ({f, f0, main, small, size = 44, x, cx, y, rot = 0, opacity = 1, hang, from = 'top', mainNode, w: wFix}) => {
  if (f < f0) return null;
  const u = unfold(f, f0);
  const {w: w0, h} = tagSize(main, small, size);
  const w = wFix ?? w0;
  const left = cx !== undefined ? cx - w / 2 : x ?? 0;
  return (
    <div style={{position: 'absolute', left, top: y, width: w, height: h, opacity, transform: rot ? `rotate(${rot}deg)` : undefined}}>
      {hang !== undefined && <div style={{position: 'absolute', left: w / 2 - 0.75, top: -hang * u, width: 1.5, height: hang * u, background: C.gold}} />}
      <div style={{position: 'absolute', inset: 0, borderRadius: 10, background: C.card, border: '1px solid rgba(168,117,42,.5)', boxShadow: '0 6px 14px rgba(20,13,7,.28)', overflow: 'hidden',
        transformOrigin: from === 'top' ? '50% 0' : '0 50%', transform: u < 1 ? (from === 'top' ? `scaleY(${u.toFixed(4)})` : `scaleX(${u.toFixed(4)})`) : undefined}}>
        {small && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 12, height: 34, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 32, lineHeight: '34px', color: C.goldDeep, whiteSpace: 'nowrap'}}>{small}</div>
        )}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 12, height: size + 4, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: size, lineHeight: `${size + 4}px`, color: C.ink, whiteSpace: 'nowrap'}}>
          {mainNode ?? main}
        </div>
      </div>
    </div>
  );
};
