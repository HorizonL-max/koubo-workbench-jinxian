import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../../theme';
import {clamp01, EASE, mix, rf, WF} from '../../u';
import {S} from '../../shots';
import {NightBackdrop} from '../../parts/NightBackdrop';
import {Pendant, PendantSpec} from '../../parts/Pendant';
import {IconKind, LineIcon} from '../../parts/LineIcons';
import {Tip, Words} from '../../parts/anim';
import sil2 from '../../silhouette2.json';

/**
 * P26–P29（第一幕的落点）：三枚线稿吊坠 → 人影图解 2（光点顺线流进脑袋长出成功 / 幸福 / 价值）→（P28 近景呼吸）→ 吊坠沉进胸口。
 * 一条贯穿的图层：吊坠配置 PD2 在 P26 / P27 / P29 同一份，跨镜逐像素不动（P28 只是被近景盖住时不画）。
 * 剪影：中景 f3414 的人像遮罩（tools/silhouette.py → silhouette2.json，P26 推到 1.015），三幕 P61 / P55 也用这一份。
 * 给二幕：P30 对开门要 P29 末帧——直接渲 <Diagram2 f={3919} />（纯函数，只看 f）。
 */
const LAND = [WF('父母的期待', 110.2), WF('学校的评价', 111.3), WF('社会的标准', 112.4)];
const THREAD0 = S.P26.f0 + 25; // 三根线先垂下来（各 12 帧、错峰 3 帧），还没有徽章
export const SIL2 = {f0: 3410, f1: 3418};
const art = (kind: IconKind, f0: number) => (f: number, inner: number) => <LineIcon kind={kind} f={f} f0={f0} dur={12} x={inner * 0.11} y={inner * 0.13} size={inner * 0.78} />;
export const P29_SINK = WF('当成是', 128.4);
const HEART = {x: 545, y: 1150};
const mk = (id: string, cx: number, cy: number, d: number, phase: number, k: number, kind: IconKind, small: string, main: string, side: 'below' | 'right'): PendantSpec => ({
  id, cx, cy, d, phase, threadF: THREAD0 + 3 * k, slideF: LAND[k] - 14, landF: LAND[k],
  front: {art: art(kind, LAND[k])},
  tag: {side, unfoldF: LAND[k] + 2, small, main},
  swellF: [{f: WF('外部的标准', 127.3), amp: 0.06, dur: 12}].map((w) => ({...w, f: w.f + 2 * [0, 2, 1][k]})),
  sink: {f0: P29_SINK + 4 * [0, 2, 1][k], dur: 16, to: [HEART.x, HEART.y], scale: 0.18},
});
// 左 → 上 → 右（落位顺序跟三个「啊」：父母 / 学校 / 社会）；下沉顺序左 → 上 → 右
export const PD2: PendantSpec[] = [
  mk('q1', 190, 628, 208, 0.9, 0, 'family', '父母的', '期待', 'below'),
  mk('q3', 540, 372, 184, 3.7, 1, 'exam', '学校的', '评价', 'right'),
  mk('q2', 890, 628, 208, 2.4, 2, 'ruler', '社会的', '标准', 'below'),
];
// sink 顺序修正：左 0、上 1、右 2
PD2[1].sink!.f0 = P29_SINK + 4;
PD2[1].sink!.bulge = 240; // 头顶那枚从右侧绕下去，不穿过「成功 / 幸福 / 价值」
PD2[2].sink!.f0 = P29_SINK + 8;
PD2[1].swellF![0].f = WF('外部的标准', 127.3) + 2;
PD2[2].swellF![0].f = WF('外部的标准', 127.3) + 4;
export const P26_LAND = LAND;
export const P29_ARRIVE = PD2.map((s) => s.sink!.f0 + 4 + s.sink!.dur);

/** 图解组极缓推：P27 1.000→1.025、P29 接着 1.025→1.035（原点 545,760） */
const camAt = (f: number) => (f < S.P27.f0 ? 1 : f < S.P28.f0 ? 1 + 0.025 * ((f - S.P27.f0) / (S.P27.f1 - S.P27.f0)) : 1.025 + 0.01 * clamp01((f - S.P29.f0) / (S.P29.f1 - S.P29.f0)));
const inDiagram = (f: number) => (f >= SIL2.f0 && f < S.P28.f0) || (f >= S.P29.f0 && f < S.P29.f1 + 1);

// —— P27 三条线：吊牌下沿 / 头顶徽章下沿 → 左太阳穴 / 头顶 / 右太阳穴 ——
const FLY: [number, number, number, number][] = [
  [190, 628 + 104 + 14 + 104, 430, 760],
  [540, 372 + 92, 545, 540],
  [890, 628 + 104 + 14 + 104, 660, 760],
];
const CRAWL = [WF('不知不觉', 114.2) - 5, WF('影响了', 115.4)];
const WORDS = [
  {t: '成功', f: WF('成功', 117.7), y: 600},
  {t: '幸福', f: WF('幸福', 120.1), y: 712},
  {t: '价值', f: WF('价值', 122.1), y: 824},
];
export const P27_WORD_F = WORDS.map((w) => w.f);

const Under: React.FC<{f: number}> = ({f}) => {
  const silOp = rf(f, SIL2.f0, SIL2.f1 - SIL2.f0, EASE.lin);
  const glow = rf(f, CRAWL[1], 10, EASE.outC);
  const steps = P29_ARRIVE.filter((a) => f >= a).length;
  const heart = f >= S.P29.f0 ? mix(0, 1, steps / 3) : 0;
  const hp = steps > 0 ? rf(f, P29_ARRIVE[steps - 1], 6, EASE.outC) : 0;
  const lvl = steps > 0 ? mix((steps - 1) / 3, steps / 3, hp) : 0;
  const pulse = 0.85 + 0.15 * Math.cos(((f - S.P29.f0) / 48) * 2 * Math.PI);
  const sw = f >= WF('想法', 130.0) && f < WF('想法', 130.0) + 10 ? Math.sin(Math.PI * ((f - WF('想法', 130.0)) / 10)) : 0;
  const ringsOp = 0.22 * rf(f, S.P29.f0 + 99, 10, EASE.outC);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <radialGradient id="heart2">
          <stop offset="0" stopColor="#fff1d0" stopOpacity={0.9} />
          <stop offset="0.3" stopColor={C.goldHi} stopOpacity={0.45} />
          <stop offset="1" stopColor={C.gold} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={sil2.fill} fill={C.nightFig} stroke={C.goldHi} strokeOpacity={mix(0.5, 0.85, glow * (f < S.P28.f0 ? 1 : 0.4))} strokeWidth={mix(1.5, 2.2, glow)} opacity={silOp} />
      {heart > 0 && lvl > 0 && (
        <g opacity={lvl}>
          <circle cx={HEART.x} cy={HEART.y} r={46 + 14 * sw} fill="url(#heart2)" opacity={pulse} />
          <circle cx={HEART.x} cy={HEART.y} r={12} fill="#ffe9bf" />
        </g>
      )}
      {ringsOp > 0 && PD2.map((s) => <circle key={s.id} cx={s.cx} cy={s.cy} r={s.d / 2} fill="none" stroke={C.goldHi} strokeWidth={2} strokeDasharray="5 9" opacity={ringsOp} />)}
    </svg>
  );
};
const Flylines: React.FC<{f: number}> = ({f}) => {
  if (f < CRAWL[0]) return null;
  const crawl = rf(f, CRAWL[0], CRAWL[1] - CRAWL[0], EASE.inOutC);
  const lit = rf(f, CRAWL[1], 8, EASE.outC);
  const out = f >= S.P29.f0 ? 0.3 * (1 - rf(f, P29_SINK, 12, EASE.lin)) : 1;
  if (out <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
      {FLY.map(([x0, y0, x1, y1], i) => {
        const xe = mix(x0, x1, crawl), ye = mix(y0, y1, crawl);
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={xe} y2={ye} stroke={lit > 0 ? C.goldHi : C.gold} strokeWidth={2} strokeDasharray="3 9" strokeDashoffset={lit > 0 ? -((f - CRAWL[1]) * 0.6) : 0} opacity={mix(0.35, 0.8, lit)} />
            {/* 光点：三个词各一次，顺线跑进去（10 帧、错峰 2 帧），光头到了就卸载 */}
            {WORDS.map((w, k) => {
              const q = rf(f, w.f - 8 + 2 * i, 10, EASE.inOutC); // 提前 8 帧起跑：「价值」离镜尾只有 25 帧，按原写法只亮 0.43s
              if (q <= 0 || q >= 1) return null;
              return <g key={k}><Tip x={mix(x0, x1, q)} y={mix(y0, y1, q)} r={6} /></g>;
            })}
          </g>
        );
      })}
    </svg>
  );
};
const Over: React.FC<{f: number}> = ({f}) => {
  const dim29 = f >= S.P29.f0 ? 0.35 : 1;
  const topOn = f >= S.P29.f0;
  return (
    <>
      {WORDS.map((w, k) => {
        const arrive = w.f + 4;
        if (f < arrive) return null;
        const dim = k < WORDS.length - 1 && f >= WORDS[k + 1].f + 12 ? 0.6 : 1;
        return (
          <Words key={k} f={f} segs={[{t: w.t, f: arrive}]} dur={10} style={{position: 'absolute', left: 0, width: 1090, top: w.y, textAlign: 'center', fontWeight: 900, fontSize: 84, lineHeight: '84px', opacity: Math.min(dim, dim29)}} />
        );
      })}
      {/* 返修：头顶吊坠的金线 x=540 从「的」字上穿过 → 标注后垫一块不透明夜青托板，线从托板后面过 */}
      {topOn && f >= WF('外部的标准', 127.3) && (
        <div style={{position: 'absolute', left: 386, top: 176, width: 308, height: 84, borderRadius: 8, background: C.night, boxShadow: `0 0 10px 6px ${C.night}`, opacity: rf(f, WF('外部的标准', 127.3), 6, EASE.outC)}} />
      )}
      {topOn && (
        <Words f={f} segs={[{t: '外部', f: WF('外部的标准', 127.3), gold: true}, {t: '的标准', f: WF('外部的标准', 127.3) + 7}]}
          style={{position: 'absolute', left: 0, width: 1080, top: 186, textAlign: 'center', fontWeight: 900, fontSize: 54, lineHeight: '64px', opacity: mix(1, 0.5, rf(f, S.P29.f0 + 99, 10, EASE.inOutC))}} />
      )}
      {topOn && f >= WF('自己内心', 128.9) && (
        <div style={{position: 'absolute', left: 600, top: 1046, fontFamily: FONT.song, fontWeight: 700, fontSize: 48, lineHeight: '56px', color: C.cream, textShadow: SOFT_SHADOW, whiteSpace: 'nowrap', opacity: rf(f, WF('自己内心', 128.9), 8, EASE.outC)}}>
          <div>自己内心</div>
          <div style={{marginTop: 2}}>
            <span style={{...GOLD_TEXT, filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))'}}>真正</span>的想法
          </div>
        </div>
      )}
    </>
  );
};
/** P29 末尾：x=540 一条金色发丝亮缝从画面中点向上下描出（对开门的预告，穿过心口光点） */
const Crack: React.FC<{f: number}> = ({f}) => {
  const p = rf(f, S.P29.f1 - 20, 20, EASE.inOutC);
  if (p <= 0) return null;
  const h = 960 * p;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={536} y={960 - h} width={8} height={2 * h} fill={C.goldHi2} opacity={0.18} style={{filter: 'blur(3px)'}} />
      <line x1={540} y1={960 - h} x2={540} y2={960 + h} stroke={C.goldHi2} strokeWidth={2} />
    </svg>
  );
};

/** 人影图解 2（P27 / P29 的完整画面，不含 P26 的人物镜） */
export const Diagram2: React.FC<{f: number}> = ({f}) => {
  const night = rf(f, SIL2.f0, SIL2.f1 - SIL2.f0, EASE.lin);
  const desat = night;
  const c = camAt(f);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <NightBackdrop f={f} opacity={night} />
      <AbsoluteFill style={{transform: c !== 1 ? `scale(${c.toFixed(5)})` : undefined, transformOrigin: '545px 760px'}}>
        <Under f={f} />
        <Flylines f={f} />
        {PD2.map((s) => <Pendant key={s.id} s={s} f={f} fx={{hidden: false, desat}} />)}
        <Over f={f} />
      </AbsoluteFill>
      <Crack f={f} />
    </AbsoluteFill>
  );
};

/** P26 吊坠挂在真人上；P27–P29 走 Diagram2（P28 近景呼吸不画） */
export const P26_P29: React.FC<{f: number}> = ({f}) => {
  if (f < S.P26.f0 || f >= S.P29.f1) return null;
  if (inDiagram(f)) return <Diagram2 f={f} />;
  if (f >= S.P28.f0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {PD2.map((s) => <Pendant key={s.id} s={s} f={f} fx={{hidden: false, desat: 0}} />)}
    </AbsoluteFill>
  );
};
export {Tip};
