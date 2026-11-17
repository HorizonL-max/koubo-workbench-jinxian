import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {charFrames, clamp01, EASE, mix, rf, useF, WF} from '../u';
import {Pendant, PendantFx, PendantSpec} from '../parts/Pendant';
import {SIL0, SIL1} from '../shots';

/**
 * P04–P08 三枚吊坠（一条贯穿的图层：P04 挂第一枚，P05 第二枚翻面，P06 整屏实拍时让位，P07 实拍收成第三枚，P08 进人影图解）。
 * 落点（中景原幅，实际帧核过人脸 / 头发包络，见 handoff/03）：左 (190,628)、右 (890,628)、头顶 (540,372)。
 * IRIS 常量（第三枚圆心 / 半径）和 BleedTape 的光圈收拢共用——圆心偏 >10px 一眼穿帮。
 */
export const IRIS = {cx: 540, cy: 372, r: 92, f0: 594, dur: 18};
/** P08 出点：全片在这里硬切 P09（样段靠 0.7s 尾巴淡出） */
export const P08_END = 896;
const LAND1 = WF('一定要', 9.2), LAND2 = WF('结', 12.3), FLIP2 = WF('生', 13.6) - 8;
const SWELL_P07 = WF('这样', 20.8); // 三枚各胀一下：左 → 上 → 右，错峰 2 帧

export const PD: PendantSpec[] = [
  {
    id: 'pd1', cx: 190, cy: 628, d: 208, phase: 0.3,
    threadF: WF('长', 8.4) - 1, slideF: LAND1 - 14, landF: LAND1,
    front: {src: 'broll/b01_home.mp4', from: LAND1 - 14, bri: 1.25}, // 窗前背影偏暗，再提一档
    tag: {side: 'below', unfoldF: WF('买', 9.4) - 2, small: '一定要', main: '买房子', mainCharF: charFrames('买房子', 9.4)},
    swellF: [{f: WF('一个家', 10.5), amp: 0.05, dur: 10}, {f: SWELL_P07, amp: 0.06, dur: 12}],
    key: WF('买', 9.4),
  },
  {
    id: 'pd2', cx: 890, cy: 628, d: 208, phase: 2.1,
    threadF: LAND2 - 15, slideF: LAND2 - 14, landF: LAND2,
    front: {src: 'broll/b02_ring.mp4', from: LAND2 - 14, startFrom: 60},
    back: {src: 'broll/b03_baby.mp4', from: LAND2 - 14},
    flipF: FLIP2,
    tag: {side: 'below', unfoldF: LAND2 + 4, small: '就应该', smallF: FLIP2 + 6, main: '结了婚', main2: '生个孩子'} /* 返修：小字跟翻面一起出（原 12.9s 先出，13.1–13.6s 读成「就应该 结了婚」） */,
    swellF: [{f: SWELL_P07 + 4, amp: 0.06, dur: 12}],
  },
  {
    id: 'pd3', cx: IRIS.cx, cy: IRIS.cy, d: IRIS.r * 2, phase: 4.4,
    threadF: IRIS.f0 + IRIS.dur, threadDur: 6, landF: IRIS.f0 + IRIS.dur, bounceF: IRIS.f0 + IRIS.dur,
    // 和光圈收拢末帧同一个变换：内容缩到 0.30、画布点 (540,372) 落在圆心（内圈直径 174，左上在 (453,285)）
    front: {src: 'broll/b04_work.mp4', from: 456, startFrom: 120, box: {w: 324, h: 576, left: 540 - 0.3 * 540 - (IRIS.cx - IRIS.r + 5), top: 372 - 0.3 * 372 - (IRIS.cy - IRIS.r + 5)}},
    tag: {side: 'right', unfoldF: IRIS.f0 + IRIS.dur, small: '就应该', main: '稳定的工作'},
    swellF: [{f: SWELL_P07 + 2, amp: 0.06, dur: 12}],
  },
];

// P08 点亮顺序：左（慢慢）→ 中 → 右（接受了）
export const LIT: Record<string, {f0: number; dur: number}> = {
  pd1: {f0: WF('慢慢', 26.0), dur: 19},
  pd3: {f0: WF('慢慢', 26.0) + 10, dur: 15},
  pd2: {f0: WF('慢慢', 26.0) + 20, dur: 19},
};
export const BAR = {y: 268, x0: 130, x1: 950, f0: 816, dur: 16};
/** P08 图解组整体极缓推：1.000→1.025（原点 545,760），切进来那一刻 = 1 */
export const camAt = (f: number) => (f < 671 ? 1 : 1 + 0.025 * ((f - 671) / 225));
export const CAM_ORIGIN = '545px 760px';

const ARC = {f0: 632, dur: 24, out0: 680, out: 12};
// 过三个圆心的圆：圆心 (540, 739.3)，半径 367.3
const ARC_D = 'M190,628 A367.3,367.3 0 0 1 890,628';

export const Pendants: React.FC = () => {
  const f = useF();
  if (f < PD[0].threadF || f >= P08_END) return null; // 全片：P08 在 f896 硬切收掉（P11 的问号吊坠在 scenes/act1/P11 重挂）
  const hidden = f >= 456 && f < IRIS.f0;
  const desat = rf(f, SIL0, SIL1 - SIL0, EASE.lin);
  const upperFade = rf(f, BAR.f0 + 14, 10, EASE.lin);
  const cam = camAt(f);
  const arcOp = f < ARC.f0 ? 0 : 0.7 * (1 - clamp01((f - ARC.out0) / ARC.out));
  const arcP = rf(f, ARC.f0, ARC.dur, EASE.inOutC);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', transform: cam !== 1 ? `scale(${cam.toFixed(5)})` : undefined, transformOrigin: CAM_ORIGIN}}>
      {/* P07：一道金色虚线弧把三枚连起来（画在徽章后面） */}
      {arcOp > 0 && !hidden && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <mask id="arcReveal">
              <path d={ARC_D} fill="none" stroke="#fff" strokeWidth={8} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - arcP} />
            </mask>
          </defs>
          <path d={ARC_D} fill="none" stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 10" opacity={arcOp} mask="url(#arcReveal)" />
        </svg>
      )}
      {PD.map((s) => {
        const fx: PendantFx = {hidden: hidden || (s.id === 'pd3' && f < IRIS.f0 + IRIS.dur), desat, lit: LIT[s.id], barY: BAR.y, upperFade};
        return <Pendant key={s.id} s={s} f={f} fx={fx} />;
      })}
    </AbsoluteFill>
  );
};
export {mix};
