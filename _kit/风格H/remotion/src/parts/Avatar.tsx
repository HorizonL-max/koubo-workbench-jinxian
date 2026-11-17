import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HostVideo} from '../Host';
import {C} from '../theme';
import {bezier, clamp01, EASE, mix, rf} from '../u';
import {swell} from './anim';
import {Scrims} from './Scrims';
import RMS from '../ep/voice_rms.json';
import {VENUE, type AvFrame} from '../venue';

/**
 * C21 小头像（AVATAR）——凡是整屏实拍都用它（用户：「出全屏的 broll 的时候，可以让人物缩小成一个小头像在旁边讲」）。
 * 照 talkcraft host-shrink-to-chip，蒙金线讲堂的皮。全片锁死：圆心 (160,1128)、直径 176（场地预设 avatar.cx/cy/d），默认近景，口型逐帧同步、不定格。
 * 取景读场地预设 avatar.cu / avatar.ms（画布上以 ax,ay 为心、边长 side 的方块缩进圆里），取景框钉在源画面上，不跟脸。圆里不调色、不压暗。
 * 皮：金环 4px（吊坠同一条渐变）+ 环内 5px 处 1px 乳白线 + 柔影 0 8px 20px rgba(20,13,7,.45)。
 * 声纹弧（shotcraft voice-waveform-live 只取「说话起伏、停顿塌成点」）：金环右外沿 ±38° 排 7 根径向短条，3px 宽、长 3–14px，
 * 读 ep/voice_rms.json（narration.wav 逐帧 RMS，tools/voice_rms.py 出）；第 i 根延后 i 帧；起 2 帧、落 5 帧平滑；停顿缩成 3px 的点。
 *
 * 进：enter='shrink'（上一镜人物满幅）12 帧，以头像圆心为终点收成圆窗：先 4 帧只收圆（1240→430，内容不缩），
 *     再 8 帧圆半径和内容缩放共用一条曲线（R = 430·cs），圆里任何一帧都是满的（03 坑 1）。
 *     enter='cut'（上一镜是圆窗 / 纸面 / 图解）硬切，第一帧就在，金环 8 帧胀一下 1→1.06→1。
 * 出：exit='cut' 跟着硬切走（f1 那一帧不在）；exit='expand'：在下一镜头 10 帧 [f1, f1+10) 里放回满幅（收的倒放），
 *     放完那一帧下一镜的 Host（近景、scale 1.000）接手。放之前这一镜的字和框先 6 帧淡掉（场景自己做，用 AV_FADE_OUT）。
 */
export const AV = {cx: VENUE.avatar.cx, cy: VENUE.avatar.cy, d: VENUE.avatar.d, ax: VENUE.avatar.cu.ax, ay: VENUE.avatar.cu.ay, side: VENUE.avatar.cu.side};
const SHRINK = 12, EXPAND = 10, PH1 = 4;
const ease2 = bezier(0.2, 0.55, 0.32, 1);

/** 取景：画布上以 (ax,ay) 为心、边长 side 的方块缩进圆里；R1 = side/2（收圆第一段内容不缩时的圆），R0 = 盖满全屏的圆 */
type Frame = AvFrame;
export const F_CU: Frame = VENUE.avatar.cu;
/** 中景取景（样片 P63→P64「头像里换中景再放回成中景满幅」时定的：头顶、下巴、脸宽、脸心在圆里都和近景取景对上，交叉淡化时脸不跳） */
export const F_MS: Frame = VENUE.avatar.ms;

/** 进度 p：0 = 满幅（identity），1 = 头像。返回圆心、半径、内容缩放 */
const geom = (p: number, A: Frame = F_CU) => {
  if (p <= 0) return {cx: A.ax, cy: A.ay, R: 99999, cs: 1};
  const split = PH1 / SHRINK;
  const r1 = A.side / 2;
  if (p < split) return {cx: A.ax, cy: A.ay, R: mix(A.R0, r1, EASE.inQ(p / split)), cs: 1};
  const q = ease2((p - split) / (1 - split));
  const cs = mix(1, AV.d / A.side, q);
  return {cx: mix(A.ax, AV.cx, q), cy: mix(A.ay, AV.cy, q), R: r1 * cs, cs};
};

const rmsV = (RMS as {v: number[]}).v;
const env = (f: number) => {
  let e = 0;
  for (let k = Math.max(0, f - 24); k <= f; k++) {
    const v = rmsV[Math.min(rmsV.length - 1, k)] ?? 0;
    e += (v - e) * (v > e ? 0.5 : 0.2);
  }
  return e;
};
const SHAPE = [0.62, 0.82, 0.95, 1, 0.95, 0.82, 0.62];

/** toMs（可选）：从这一帧起 XF_MS 帧，圆里近景交叉淡化成中景（F_MS 取景）；之后 exit='expand' 放回成中景满幅（identity），
 *  下一镜接中景 FULL_MS、scale 1.000。cam='ms'：从头到尾都用中景取景（进场 shrink 也从中景满幅收）。 */
export const XF_MS = 8;
export const Avatar: React.FC<{f: number; f0: number; f1: number; enter?: 'shrink' | 'cut'; exit?: 'cut' | 'expand'; toMs?: number; cam?: 'cu' | 'ms'}> = ({f, f0, f1, enter = 'cut', exit = 'cut', toMs, cam = 'cu'}) => {
  const end = exit === 'expand' ? f1 + EXPAND : f1;
  if (f < f0 || f >= end) return null;
  let p = 1;
  if (enter === 'shrink') p = clamp01((f - f0) / SHRINK);
  if (exit === 'expand' && f >= f1) p = 1 - clamp01((f - f1 + 1) / EXPAND);
  const msOp = cam === 'ms' ? 1 : toMs === undefined ? 0 : EASE.inOutC(clamp01((f - toMs) / XF_MS));
  const g = geom(p, msOp >= 1 ? F_MS : F_CU);
  const pop = enter === 'cut' ? swell(f, f0, 8, 0.06) : 1;
  const R = g.R * pop;
  const full = p <= 0;
  const settled = p >= 1;
  // 声纹弧：头像落定后才有
  const bars: React.ReactNode[] = [];
  if (settled) {
    for (let i = 0; i < 7; i++) {
      const a = ((-38 + (76 * i) / 6) * Math.PI) / 180;
      const e = env(f - i);
      const L = 3 + 11 * clamp01((e - 0.12) / 0.7) * SHAPE[i];
      const r0 = AV.d / 2 * pop + 9;
      const x0 = AV.cx + Math.cos(a) * r0, y0 = AV.cy + Math.sin(a) * r0;
      const x1 = AV.cx + Math.cos(a) * (r0 + L - 3), y1 = AV.cy + Math.sin(a) * (r0 + L - 3);
      bars.push(<line key={i} x1={x0.toFixed(2)} y1={y0.toFixed(2)} x2={x1.toFixed(2)} y2={y1.toFixed(2)} stroke={C.goldHi} strokeOpacity={0.85} strokeWidth={3} strokeLinecap="round" />);
    }
  }
  const layer = (cam: 'cu' | 'ms', A: Frame, op = 1) => {
    const gg = geom(p, A);
    return (
      <HostVideo
        key={cam}
        cam={cam}
        style={{transformOrigin: '0 0', opacity: op < 1 ? op : undefined,
          transform: full ? undefined : `translate(${(gg.cx - A.ax * gg.cs * pop).toFixed(3)}px, ${(gg.cy - A.ay * gg.cs * pop).toFixed(3)}px) scale(${(gg.cs * pop).toFixed(5)})`}}
      />
    );
  };
  // 交叉淡化只发生在头像落定时（p = 1，两种取景的圆完全重合）；淡完以后只画中景
  const vid = msOp <= 0 ? layer('cu', F_CU) : msOp >= 1 ? layer('ms', F_MS) : <>{layer('cu', F_CU)}{layer('ms', F_MS, msOp)}</>;
  // 定稿后返修：中景放回时圆里叠同一份顶底压暗（Main 的 Scrims 在场景层下面，被圆盖住），放完那一帧 = Host + Scrims，
  // 中景底部的桌面 / 白线 / 双手在放大途中不会先亮出来再突然变暗。头像落定时圆在 y 1040–1216，压暗不碰圆（底 1400 起、顶 420 止）。
  const scr = msOp > 0 ? <Scrims /> : null;
  if (full) return <AbsoluteFill>{vid}{scr}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 柔影 */}
      {settled && <div style={{position: 'absolute', left: AV.cx - R, top: AV.cy - R, width: 2 * R, height: 2 * R, borderRadius: '50%', boxShadow: '0 8px 20px rgba(20,13,7,.45), 0 0 0 4px rgba(20,13,7,.28), 0 0 14px 10px rgba(20,13,7,.42)'}} />} {/* 返修：金环外加一圈约 12px 暗晕，身后实拍乱时边缘不糊 */}
      <AbsoluteFill style={{clipPath: `circle(${(R - 2).toFixed(2)}px at ${g.cx.toFixed(2)}px ${g.cy.toFixed(2)}px)`}}>
        {vid}
        {scr}
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id="avRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.goldHi2} />
            <stop offset="0.45" stopColor={C.gold} />
            <stop offset="1" stopColor={C.goldDark} />
          </linearGradient>
        </defs>
        <circle cx={g.cx} cy={g.cy} r={Math.max(1, R - 2)} fill="none" stroke="url(#avRing)" strokeWidth={4} />
        {R < 300 && <circle cx={g.cx} cy={g.cy} r={Math.max(1, R - 9)} fill="none" stroke={C.cream} strokeOpacity={0.55} strokeWidth={1} />}
        {bars}
      </svg>
    </AbsoluteFill>
  );
};
/** 头像保留区：这一镜里其他字和框的下沿不过 y 1000，或者整体在 x 280 右边 */
export const AV_ZONE = {x0: 60, x1: 260, y0: 1028, y1: 1228};
export const AV_SHRINK = SHRINK;
