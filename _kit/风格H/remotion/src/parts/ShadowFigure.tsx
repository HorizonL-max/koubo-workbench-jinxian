import React from 'react';
import {C} from '../theme';
import {clamp01, EASE, mix, rf} from '../u';

/**
 * C23 皮影小人：头（圆）+ 身体（上窄下宽的圆角梯形）+ 两条两节胳膊（圆头粗线，线宽 = 身高 0.11）+ 两条腿。
 * 填 #1b0f08，朝光一侧（左）1.5px 金色轮廓光 α0.55，脚下一枚接触阴影。没有五官。大人 400–420，孩子 220–230。
 * 姿势用关节角度插值（lerpPose），不逐帧手绘。角度：0 = 竖直向下，正 = 往外侧张（左臂往左、右臂往右），180 = 举过头顶；肘角相对上臂、同号继续往外弯。
 * 出场：轮廓先描一圈（drawF 起 14 帧，带金线）再填实（6 帧）。
 * 二幕 P32–P36、P48 接着用（大人 / 孩子 / 长大：外面套一层 scale，原点在脚）。
 */
export type Pose = {lA: number; lE: number; rA: number; rE: number; lean: number; head: number; lL: number; rL: number; crouch?: number};
export const STAND: Pose = {lA: 8, lE: 4, rA: 8, rE: 4, lean: 0, head: 0, lL: 5, rL: 5};
export const lerpPose = (a: Pose, b: Pose, p: number): Pose => ({
  lA: mix(a.lA, b.lA, p), lE: mix(a.lE, b.lE, p), rA: mix(a.rA, b.rA, p), rE: mix(a.rE, b.rE, p), lean: mix(a.lean, b.lean, p), head: mix(a.head, b.head, p), lL: mix(a.lL, b.lL, p), rL: mix(a.rL, b.rL, p), crouch: mix(a.crouch ?? 0, b.crouch ?? 0, p),
});
const D = Math.PI / 180;
type P2 = [number, number];
const rot = (p: P2, o: P2, deg: number): P2 => {
  const c = Math.cos(deg * D), s = Math.sin(deg * D);
  return [o[0] + (p[0] - o[0]) * c - (p[1] - o[1]) * s, o[1] + (p[0] - o[0]) * s + (p[1] - o[1]) * c];
};
/** 骨架点（画布坐标）；外部可取 hand / head 定位 */
export const figurePts = (x: number, y: number, h: number, ps: Pose) => {
  const cr = (ps.crouch ?? 0) * 0.12 * h;
  const hip: P2 = [x, y - 0.45 * h + cr];
  const sh: P2 = [x, y - 0.8 * h + cr];
  const L = (side: -1 | 1, a: number, e: number) => {
    const o: P2 = [sh[0] + side * 0.1 * h, sh[1] + 0.02 * h];
    const el: P2 = [o[0] + side * Math.sin(a * D) * 0.17 * h, o[1] + Math.cos(a * D) * 0.17 * h];
    const a2 = a + e;
    const hd: P2 = [el[0] + side * Math.sin(a2 * D) * 0.16 * h, el[1] + Math.cos(a2 * D) * 0.16 * h];
    return [o, el, hd] as P2[];
  };
  const Lg = (side: -1 | 1, a: number) => {
    const o: P2 = [hip[0] + side * 0.07 * h, hip[1]];
    const kn: P2 = [o[0] + side * Math.sin(a * D) * 0.22 * h + side * (ps.crouch ?? 0) * 0.06 * h, o[1] + Math.cos(a * D) * 0.22 * h - cr * 0.5];
    const ft: P2 = [x + side * (0.07 * h + Math.sin(a * D) * 0.44 * h), y];
    return [o, kn, ft] as P2[];
  };
  // 上身绕胯前倾
  const up = (p: P2) => rot(p, hip, ps.lean);
  const lArm = L(-1, ps.lA, ps.lE).map(up), rArm = L(1, ps.rA, ps.rE).map(up);
  const head: P2 = up([sh[0], sh[1] - 0.115 * h]);
  const body = [[-0.1, 0], [0.1, 0], [0.13, 0.35], [-0.13, 0.35]].map(([dx, dy]) => up([x + dx * h, sh[1] - 0.01 * h + dy * h]));
  return {head, headR: 0.085 * h, body, lArm, rArm, lLeg: Lg(-1, ps.lL), rLeg: Lg(1, ps.rL), lw: 0.11 * h, hip, sh: up(sh)};
};
const pl = (pts: P2[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const poly = (pts: P2[]) => pl(pts) + ' Z';

export const ShadowFigure: React.FC<{
  f: number; x: number; y: number; h: number; pose: Pose; drawF?: number; opacity?: number;
  eye?: number; handDot?: 'l' | 'r'; handDotOp?: number; rim?: number; gild?: number;
  /** 身体里从脚往上填的带子（每条 0–1），uid 给遮罩用（同一帧里多个小人要不同） */
  bands?: number[]; uid?: string;
  /** 返修：填实后留一圈 2px 香槟金边（檀棕底上小人和底只差 10 级亮度，手机上看不见） */
  edge?: number;
}> = ({f, x, y, h, pose, drawF, opacity = 1, eye = 0, handDot, handDotOp = 1, rim = 0.55, gild = 0, bands, uid = 'sf', edge = 0.6}) => {
  const P = figurePts(x, y, h, pose);
  const dp = drawF === undefined ? 1 : rf(f, drawF, 14, EASE.inOutC);
  const fill = drawF === undefined ? 1 : rf(f, drawF + 14, 6, EASE.outC);
  if (dp <= 0) return null;
  const limbs = [P.lLeg, P.rLeg, P.lArm, P.rArm];
  const shape = (color: string, dx = 0, extra = 0) => (
    <g transform={dx ? `translate(${dx} 0)` : undefined}>
      {limbs.map((l, i) => <path key={i} d={pl(l)} fill="none" stroke={color} strokeWidth={P.lw + extra} strokeLinecap="round" strokeLinejoin="round" />)}
      <path d={poly(P.body)} fill={color} stroke={color} strokeWidth={P.lw * 0.5 + extra} strokeLinejoin="round" />
      <circle cx={P.head[0]} cy={P.head[1]} r={P.headR + extra / 2} fill={color} />
    </g>
  );
  const eyeP: P2 = [P.head[0] + Math.sin(pose.head * D) * P.headR * 0.55, P.head[1] - P.headR * 0.1];
  const hand = handDot ? (handDot === 'l' ? P.lArm[2] : P.rArm[2]) : null;
  return (
    <g opacity={opacity}>
      {/* 接触阴影 */}
      <ellipse cx={x} cy={y + 2} rx={0.24 * h} ry={0.025 * h} fill="#000" opacity={0.35 * fill} />
      {fill > 0 && (
        <g opacity={fill}>
          {gild > 0 && <g opacity={gild} style={{filter: 'drop-shadow(0 0 6px rgba(233,190,120,.8))'}}>{shape(C.goldHi, 0, 5)}</g>}
          {edge > 0 && <g opacity={edge}>{shape(C.goldHi, 0, 4)}</g>}
          <g opacity={rim}>{shape(C.goldHi, -1.5, 1)}</g>
          {shape('#1b0f08')}
          {bands && (
            <>
              <defs>
                <mask id={`band-${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>{shape('#fff')}</mask>
              </defs>
              <g mask={`url(#band-${uid})`}>
                {bands.map((b, i) => {
                  if (b <= 0) return null;
                  const n = bands.length, bh = (h * 1.02) / n;
                  const col = ['#7d5520', '#94682a', '#a8752a', '#bf8f4a', '#d5aa68', '#e9c58a'][Math.min(5, Math.round((i / Math.max(1, n - 1)) * 5))];
                  return <rect key={i} x={x - h} y={y - (i + 1) * bh} width={2 * h} height={bh + 0.6} fill={col} opacity={0.82 * b} />;
                })}
              </g>
            </>
          )}
        </g>
      )}
      {/* 描轮廓：金线 2px 沿各部件画出来 */}
      {fill < 1 && (
        <g opacity={1 - fill} fill="none" stroke={C.goldHi} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {limbs.map((l, i) => <path key={i} d={pl(l)} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - dp} />)}
          <path d={poly(P.body)} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - dp} />
          <circle cx={P.head[0]} cy={P.head[1]} r={P.headR} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - dp} />
        </g>
      )}
      {eye > 0 && <circle cx={eyeP[0]} cy={eyeP[1]} r={Math.max(3, P.headR * 0.18)} fill={C.goldHi2} opacity={eye} />}
      {hand && handDotOp > 0 && (
        <g opacity={handDotOp}>
          <circle cx={hand[0]} cy={hand[1]} r={P.lw * 0.9} fill={C.goldHi} opacity={0.3} />
          <circle cx={hand[0]} cy={hand[1]} r={Math.max(3, P.lw * 0.32)} fill={C.goldHi2} />
        </g>
      )}
    </g>
  );
};
export {clamp01};
