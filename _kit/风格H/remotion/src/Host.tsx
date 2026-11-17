import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile} from 'remotion';
import {clamp01, useF} from './u';
import {EP} from './ep/episode';
import {ROWS as EP_ROWS} from './ep/rows';
import {MS_FILTER, VENUE} from './venue';

/**
 * 两个机位（SHOTBOOK 1.7）。人物视频和配音逐帧对齐，直接按合成帧播放，不包 Sequence。
 * 画布 1080×1920 = 源 1440×2560 ×0.75。只画「人物满幅」三种形态；圆窗 / 拱窗 / 小头像由各自组件画，但都用这里的 HostVideo。
 * 行表在 ep/rows.ts；推镜原点、中景压暗滤镜读场地预设（venue.ts）。
 * 片尾尾巴（EP.tail > 0）：人物定格在末帧、30 帧压暗到 0.62，只留标题和配乐。
 */
export type Row = {
  f0: number; f1: number; cam: 'cu' | 'ms'; s0: number; s1: number; origin: string;
  end?: number; // 推到 s1 的帧（之后定住；默认 f1）
  fade?: [number, number]; // 人物淡出区间（人变剪影）
  ty?: (f: number) => number; // 整屏纵向位移（顺着金线升上去时人物那一屏往下滑）
  sc?: (f: number) => number; // 自定义缩放曲线（对开门后 1.08→1.00 带缓动；给了就不用 s0/s1 线性）
};
export const ROWS: Row[] = [...EP_ROWS].sort((a, b) => a.f0 - b.f0);
export const hostRow = (f: number) => ROWS.find((r) => f >= r.f0 && f < r.f1);
export const hostScale = (r: Row, f: number) => (r.sc ? r.sc(f) : r.s0 + (r.s1 - r.s0) * clamp01((f - r.f0) / ((r.end ?? r.f1) - r.f0)));
export {MS_FILTER};

/** 人物视频的帧数（口播到这里为止；之后是合成延长的片尾尾巴） */
export const HOST_LAST = EP.hostFrames;

/** 占位人物（EP.hostPlaceholder = true）：灰底 + 按场地预设人脸中位框画一个椭圆，缓慢左右晃（过静止检查用），只用来看版式 */
const Placeholder: React.FC<{cam: 'cu' | 'ms'; style?: React.CSSProperties}> = ({cam, style}) => {
  const f = useF();
  const fc = (VENUE.face as unknown as Record<string, {median_x: number[]; median_y: number[]}>)[cam];
  const [x0, x1] = fc.median_x, [y0, y1] = fc.median_y;
  const dx = 6 * Math.sin(f / 23);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, background: cam === 'cu' ? 'linear-gradient(160deg,#6d6258,#3d342c)' : 'linear-gradient(160deg,#5f5a52,#35302a)', ...style}}>
      <div style={{position: 'absolute', left: x0 + dx, top: y0, width: x1 - x0, height: y1 - y0, borderRadius: '50%', background: '#a89584'}} />
      <div style={{position: 'absolute', left: x0 - 120 + dx, top: y1 + 40, width: x1 - x0 + 240, height: 1920, borderRadius: '45% 45% 0 0', background: '#d8d2c8'}} />
      <div style={{position: 'absolute', left: 40, top: 1480, fontSize: 40, color: '#fff8', fontFamily: 'Georgia'}}>{cam.toUpperCase()} placeholder</div>
    </div>
  );
};

const Vid: React.FC<{cam: 'cu' | 'ms'; style: React.CSSProperties}> = ({cam, style}) =>
  EP.hostPlaceholder ? (
    <Placeholder cam={cam} style={{...style, filter: undefined}} />
  ) : (
    <OffthreadVideo src={staticFile(cam === 'cu' ? EP.files.cu : EP.files.ms)} muted style={style} />
  );

export const Host: React.FC = () => {
  const f = useF();
  const r = hostRow(f);
  if (!r) return null;
  const s = hostScale(r, f);
  const op = r.fade ? 1 - clamp01((f - r.fade[0]) / (r.fade[1] - r.fade[0])) : 1;
  const ty = r.ty ? r.ty(f) : 0;
  const vid = (
    <Vid
      cam={r.cam}
      style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${s.toFixed(5)})`, transformOrigin: r.origin, filter: r.cam === 'ms' ? MS_FILTER : undefined}}
    />
  );
  const tailDim = f >= HOST_LAST ? 1 - 0.38 * clamp01((f - HOST_LAST) / 30) : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: op, transform: ty ? `translateY(${ty.toFixed(2)}px)` : undefined, filter: tailDim < 1 ? `brightness(${tailDim.toFixed(4)})` : undefined}}>
      {f >= HOST_LAST ? <Freeze frame={HOST_LAST - 1}>{vid}</Freeze> : vid}
    </AbsoluteFill>
  );
};

/**
 * 人物视频本体（给圆窗 / 小头像 / 拱窗用）：和合成帧逐帧对齐，故意不包 Sequence（包了反而错位）。
 * 统一放在 Host.tsx 里，preflight P3「直接用 OffthreadVideo」只豁免这个文件——场景里不要自己写 OffthreadVideo 读人物。
 */
export const HostVideo: React.FC<{cam: 'cu' | 'ms'; style?: React.CSSProperties}> = ({cam, style}) => (
  <Vid cam={cam} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: cam === 'ms' ? MS_FILTER : undefined, ...style}} />
);
