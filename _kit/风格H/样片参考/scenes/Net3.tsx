import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../../theme';
import {clamp01, EASE, mix, rand, rf, spring01, WF} from '../../u';
import {S} from '../../shots';
import {NightBackdrop} from '../../parts/NightBackdrop';
import {blurIn, Tip} from '../../parts/anim';
import NJ from './net3.json';

/**
 * 第五章「条件网」：P53（孤立 → 各种条件共同影响）/ P54（三个节点点在他头顶）/ P55（网收成一个人＝涌现）/ P57（重接一根线、长出新的可能）。
 * 布局 net3.json（tools/net3_layout.py）：一幕 P14 那张网的 30 个小点（少数避让标注）+ 3 个大点（P54 头顶三点）；左右两簇各 8 点；
 * 人形目标取 silhouette2.json 外轮廓 24 点 + 里面 6 点，小点和目标按总位移最小配对（每个点从头到尾是同一个点）。
 * 跨镜逐像素不动：P54 → P55（三个大点和标注）、P55 末帧 → P57 首帧（人形）。P57 末帧整页给 P58 对开门当门板（纯函数，只看 f）。
 */
type N3 = {x: number; y: number; r: number; big: boolean; cl: string; tx: number; ty: number; ci: number};
const NET = NJ as unknown as {nodes: N3[]; edges: [number, number][]; ties: [number, number][]; chain: [number, number][]; big: number[]};
const N = NET.nodes;
const SMALL = N.map((_, i) => i).filter((i) => !N[i].big);
const IS_BIG = (i: number) => N[i].big;
const CEN = {x: 540, y: 760};
const dist = (i: number, x: number, y: number) => Math.hypot(N[i].x - x, N[i].y - y);

/* —— 词锚 —— */
export const P53_F = {iso: WF('孤立', 263.8), shatter: WF('而是', 265.4), light: WF('受到了', 266.1), cond: WF('各种条件', 266.7), join: WF('共同影响', 268.0)};
export const P54_F = [WF('观念', 270.3), WF('情绪', 271.4), WF('行为', 272.8)];
export const P55_F = {grow: WF('成长经历', 274.6), env: WF('现实环境', 275.8), inter: WF('相互作用', 278.0), gather: WF('所产生', 279.5) - 8}; // 返修：迁移提前 8 帧，人形成形后停够 1s（原 0.7s）
export const P57_F = {aware: WF('认识到', 288.0), cond: WF('这些条件', 288.9), adjust: WF('调整', 291.3), create: WF('创造', 292.7), fresh: WF('新的可能', 293.2)};
export const P57_ATTACH = P57_F.adjust + 18; // 松开 8 帧 + 荡 10 帧 → 开始接上（10 帧）
const GATHER_DUR = 24;

/* —— 大节点（C26 大点：r14 + 外环 r22 + 光晕），P54 / P55 / P57 共用同一画法 —— */
const BIG_LABEL = ['观念', '情绪', '行为'];
/** 标注相对节点的偏移（P54 版式：观念 x230–350 y430–500、情绪 x575–690 y300–366、行为 x730–850 y430–500） */
const LAB0: [number, number][] = [[-60, 30], [35, -30], [-60, 30]];
/** 收成人形后的偏移（行为在右肩，标注挪到肩上方，不进字幕带） */
const LAB1: [number, number][] = [[-60, 34], [34, -34], [22, 12]];
const pop = (f: number, f0: number) => {
  if (f < f0) return 0;
  const u = clamp01((f - f0) / 12);
  return u < 0.5 ? mix(0, 1.5, EASE.outC(u / 0.5)) : mix(1.5, 1, EASE.inOutC((u - 0.5) / 0.5));
};
const BigDot: React.FC<{x: number; y: number; s: number; glow?: number}> = ({x, y, s, glow = 1}) =>
  s <= 0 ? null : (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})`}>
      <circle r={14 * 3.2} fill="url(#n3Glow)" opacity={glow} />
      <circle r={22} fill="none" stroke={C.goldHi} strokeOpacity={0.7} strokeWidth={2} />
      <circle r={14} fill={C.goldHi2} />
    </g>
  );
const SmallDot: React.FC<{x: number; y: number; r: number; s: number; a?: number}> = ({x, y, r, s, a = 1}) =>
  s <= 0 || a <= 0 ? null : (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})`} opacity={a}>
      <circle r={r * 3.2} fill="url(#n3Glow)" />
      <circle r={r} fill={C.goldHi} />
    </g>
  );
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="n3Glow">
      <stop offset="0" stopColor={C.goldHi2} stopOpacity={0.55} />
      <stop offset="1" stopColor={C.gold} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="n3Core">
      <stop offset="0" stopColor="#fff1d0" stopOpacity={0.95} />
      <stop offset="0.35" stopColor={C.goldHi} stopOpacity={0.5} />
      <stop offset="1" stopColor={C.gold} stopOpacity={0} />
    </radialGradient>
  </defs>
);
const Label: React.FC<{t: string; x: number; y: number; f: number; f0: number; size?: number; gold?: boolean; op?: number; center?: boolean; plate?: boolean}> = ({t, x, y, f, f0, size = 56, gold, op = 1, center, plate}) => {
  if (f < f0 || op <= 0) return null;
  const b = blurIn(f, f0, 8, 14);
  return (
    <>
    {/* 返修：浅木书架 / 节点边上的标注垫一块羽化暗托 */}
    {plate && <div style={{position: 'absolute', left: x - 18, top: y - 6, width: t.length * size + 36, height: size + 22, borderRadius: 18, background: 'rgba(20,13,7,.5)', filter: 'blur(9px)', opacity: op * rf(f, f0, 8, EASE.outC)}} />}
    <div style={{position: 'absolute', left: center ? 0 : x, width: center ? 1080 : undefined, top: y, height: size + 10, lineHeight: `${size + 10}px`, textAlign: center ? 'center' : undefined, whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: 900, fontSize: size, opacity: op}}>
      <span style={{...b, ...(gold ? GOLD_TEXT : {color: C.cream, textShadow: SOFT_SHADOW}), filter: [b.filter, gold ? 'drop-shadow(0 2px 8px rgba(20,12,6,.7))' : ''].filter(Boolean).join(' ') || undefined}}>{t}</span>
    </div>
    </>
  );
};

/* ═════════ P53 条件网：不是孤立地发生的（C26 + shotcraft radial-wave） ═════════
 * 夜青。中心金点 (540,760) r12 + 隔离虚线圈 r120（6/10，不转）。「而是」：圈碎成 12 段向外飞散 10 帧，「孤立」被一笔划掉（5 帧）压暗。
 * 「受到了」起 28 帧：30 个点按到中心的距离由近到远点亮（单点 12 帧、过冲 1.5 倍）；边从外端朝中心端画（10 帧）。最近 8 点各一根辐条连到中心。
 * 「共同影响」：所有边上同时各一颗光点跑向中心（10 帧，不错峰），中心金点涨到 r28。图解组整体 1.000→1.020。 */
const DMIN = Math.min(...SMALL.map((i) => dist(i, CEN.x, CEN.y)));
const DMAX = Math.max(...SMALL.map((i) => dist(i, CEN.x, CEN.y)));
const p53NodeF = (i: number) => Math.round(P53_F.light + 28 * ((dist(i, CEN.x, CEN.y) - DMIN) / (DMAX - DMIN)));
const SMALL_EDGES = NET.edges.filter(([a, b]) => !IS_BIG(a) && !IS_BIG(b));
const SPOKES = [...SMALL].sort((a, b) => dist(a, CEN.x, CEN.y) - dist(b, CEN.x, CEN.y)).slice(0, 8);
/** 边的「外端 → 内端」（离中心远的一端先亮） */
const orient = ([a, b]: [number, number]): [number, number] => (dist(a, CEN.x, CEN.y) >= dist(b, CEN.x, CEN.y) ? [a, b] : [b, a]);
const P53_EDGES: {o: [number, number]; to?: 'c'}[] = [...SMALL_EDGES.map((e) => ({o: orient(e)})), ...SPOKES.map((i) => ({o: [i, -1] as [number, number], to: 'c' as const}))];
const ept = (i: number) => (i < 0 ? CEN : N[i]);
const ARCS = Array.from({length: 12}, (_, k) => ({a0: k * 30 + 2, a1: k * 30 + 24, v: 50 + rand(k * 3.7) * 40, rot: (rand(k * 5.3) - 0.5) * 40}));
const arcPath = (r: number, a0: number, a1: number) => {
  const p = (a: number) => [CEN.x + r * Math.cos((a * Math.PI) / 180), CEN.y + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};
export const P53: React.FC<{f: number}> = ({f}) => {
  const sh = S.P53;
  if (f < sh.f0 || f >= sh.f1) return null;
  const cam = 1 + 0.02 * ((f - sh.f0) / (sh.f1 - sh.f0));
  const shat = rf(f, P53_F.shatter, 10, EASE.outC);
  const strike = rf(f, P53_F.shatter, 5, EASE.inOutC);
  const runQ = rf(f, P53_F.join, 10, EASE.inOutC);
  const cr = 12 + 16 * spring01(f, P53_F.join + 8, 14, 150);
  return (
    <AbsoluteFill>
      <NightBackdrop f={f} opacity={1} />
      <AbsoluteFill style={{transform: `scale(${cam.toFixed(5)})`, transformOrigin: `${CEN.x}px ${CEN.y}px`}}>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Defs />
          {/* 边：外端先亮、朝中心画 */}
          {P53_EDGES.map((e, k) => {
            const [a, b] = e.o;
            const p = rf(f, p53NodeF(a) + 2, 10, EASE.inOutC);
            if (p <= 0) return null;
            const A = ept(a), B = ept(b);
            const xe = mix(A.x, B.x, p), ye = mix(A.y, B.y, p);
            const q = runQ > 0 && runQ < 1 ? runQ : -1;
            return (
              <g key={k}>
                <line x1={A.x} y1={A.y} x2={xe.toFixed(1)} y2={ye.toFixed(1)} stroke={C.gold} strokeOpacity={e.to ? 0.42 : 0.5} strokeWidth={2} />
                {p < 1 && <Tip x={xe} y={ye} r={3} />}
                {q > 0 && <Tip x={mix(A.x, B.x, q)} y={mix(A.y, B.y, q)} r={3.6} />}
              </g>
            );
          })}
          {SMALL.map((i) => <SmallDot key={i} x={N[i].x} y={N[i].y} r={N[i].r} s={pop(f, p53NodeF(i))} />)}
          {/* 隔离圈：碎成 12 段向外飞散 */}
          {shat < 1 && ARCS.map((a, k) => {
            const r = 120 + a.v * shat;
            return (
              <path key={k} d={arcPath(r, a.a0 + a.rot * shat, a.a1 + a.rot * shat)} fill="none" stroke={C.goldHi} strokeWidth={2} strokeDasharray={shat > 0 ? undefined : '6 10'} opacity={0.85 * (1 - shat)} />
            );
          })}
          {shat <= 0 && <circle cx={CEN.x} cy={CEN.y} r={120} fill="none" stroke={C.goldHi} strokeWidth={2} strokeDasharray="6 10" opacity={0.85} />}
          {/* 中心金点 */}
          <circle cx={CEN.x} cy={CEN.y} r={cr * 3.4} fill="url(#n3Core)" opacity={0.8} />
          <circle cx={CEN.x} cy={CEN.y} r={cr} fill={C.goldHi2} />
        </svg>
        {/* 标注 */}
        <div style={{opacity: mix(1, 0.4, strike)}}>
          <Label t="孤立" x={690} y={730} f={f} f0={P53_F.iso} />
        </div>
        {strike > 0 && (
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
            <line x1={684} y1={768} x2={684 + 134 * strike} y2={768 - 6 * strike} stroke={C.goldHi} strokeWidth={4} strokeLinecap="round" />
          </svg>
        )}
        <Label t="各种条件" x={0} y={330} f={f} f0={P53_F.cond} size={64} gold center />
        <Label t="共同影响" x={452} y={880} f={f} f0={P53_F.join} plate />{/* 返修：右移 24px 离开左边节点，垫暗托盖住从「响」字下穿过的边 */}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═════════ P54 三个节点点在他头顶：观念 / 情绪 / 行为（talkcraft callout-line-label + parallel-items-with-host） ═════════
 * 中景原幅。每个点三拍串行：弹出 + 一圈涟漪（r22→60 淡出）→ 金色虚线朝头顶长出去（12 帧）→ 标注出。虚线终点离头发 ≥10px。 */
const HEAD_END: [number, number][] = [[500, 490], [545, 480], [590, 490]];
export const BigLabels: React.FC<{f: number; pos: (k: number) => [number, number]; lab: (k: number) => [number, number]; from: (k: number) => number; op?: number}> = ({f, pos, lab, from, op = 1}) => (
  <>
    {[0, 1, 2].map((k) => {
      const [x, y] = pos(k), [dx, dy] = lab(k);
      return <Label key={k} t={BIG_LABEL[k]} x={x + dx} y={y + dy} f={f} f0={from(k)} op={op} plate />;
    })}
  </>
);
export const P54: React.FC<{f: number}> = ({f}) => {
  const sh = S.P54;
  if (f < sh.f0 || f >= sh.f1) return null;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Defs />
        {[0, 1, 2].map((k) => {
          const n = N[k], f0 = P54_F[k];
          if (f < f0) return null;
          const rip = rf(f, f0 + 2, 14, EASE.outC);
          const ln = rf(f, f0 + 6, 12, EASE.inOutC);
          const [hx, hy] = HEAD_END[k];
          const xe = mix(n.x, hx, ln), ye = mix(n.y, hy, ln);
          return (
            <g key={k}>
              {ln > 0 && <line x1={n.x} y1={n.y} x2={xe.toFixed(1)} y2={ye.toFixed(1)} stroke={C.goldHi} strokeWidth={2} strokeDasharray="4 7" opacity={0.85} />}
              {ln > 0 && ln < 1 && <Tip x={xe} y={ye} r={3} />}
              {rip < 1 && <circle cx={n.x} cy={n.y} r={mix(22, 60, rip)} fill="none" stroke={C.goldHi2} strokeWidth={2} opacity={0.8 * (1 - rip)} />}
              <BigDot x={n.x} y={n.y} s={pop(f, f0)} />
            </g>
          );
        })}
      </svg>
      <BigLabels f={f} pos={(k) => [N[k].x, N[k].y]} lab={(k) => LAB0[k]} from={(k) => P54_F[k] + 14} />
    </AbsoluteFill>
  );
};

/* ═════════ P55 / P57 共用：一张网的整套状态（纯函数，只看 f） ═════════ */
const LEFT = SMALL.filter((i) => N[i].cl === 'L');
const RIGHT = SMALL.filter((i) => N[i].cl === 'R');
const ALL_EDGES = NET.edges; // 含大点的边
/** 迁移进度（每点按到目标的距离错峰 0–8 帧） */
const MAXD = Math.max(...N.map((n) => Math.hypot(n.tx - n.x, n.ty - n.y)));
const migr = (i: number, f: number) => {
  const n = N[i];
  const lag = Math.round(8 * (1 - Math.hypot(n.tx - n.x, n.ty - n.y) / MAXD)); // 走得远的先动
  return rf(f, P55_F.gather + 4 + lag, GATHER_DUR, EASE.inOutC);
};
const ARRIVE = P55_F.gather + 4 + 8 + GATHER_DUR; // 最后一个点到位
/** P57：「行为」右上挪 50px（弹簧） */
const BEH_SHIFT = (f: number) => {
  const k = spring01(f, P57_ATTACH + 6, 13, 160);
  return [35 * k, -35 * k] as [number, number];
};
const posAt = (i: number, f: number): [number, number] => {
  const n = N[i];
  const m = migr(i, f);
  let x = mix(n.x, n.tx, m), y = mix(n.y, n.ty, m);
  if (i === 2 && f >= S.P57.f0) {
    const [dx, dy] = BEH_SHIFT(f);
    x += dx;
    y += dy;
  }
  return [x, y];
};
/** P57 亮光漫开：以「观念」（头）为心，24 帧扫到 1000px */
const AWARE_C = [N[0].tx, N[0].ty];
const awareAt = (x: number, y: number, f: number) => {
  if (f < P57_F.aware) return 0;
  const R = 1000 * EASE.outC(clamp01((f - P57_F.aware) / 24));
  const d = Math.hypot(x - AWARE_C[0], y - AWARE_C[1]);
  return clamp01((R - d) / 120);
};
/** 牵线 19→行为 在 P57 松开、荡一下、接到 8 */
const REWIRE = {tie: NET.ties.findIndex(([a, b]) => a === 19 && b === 2), from: 19, to: 8};

export const NetPage: React.FC<{f: number}> = ({f}) => {
  const inP57 = f >= S.P57.f0;
  // 图解组极缓推：P55 1.000→1.020，P57 接着 1.020→1.045（同一原点，P55 末帧 = P57 首帧）
  const camF = inP57 ? 1.02 + 0.025 * clamp01((f - S.P57.f0) / (S.P57.f1 - S.P57.f0)) : 1 + 0.02 * clamp01((f - S.P55.f0) / (S.P55.f1 - S.P55.f0 - 1));
  const camOrigin = '540px 800px';
  // —— P55 状态 ——
  const lightL = rf(f, P55_F.grow, 10, EASE.outC), lightR = rf(f, P55_F.env, 10, EASE.outC);
  const gathered = f >= P55_F.gather + 4;
  const labOut = 1 - rf(f, P55_F.gather, 8, EASE.lin);
  const edgeA = (base: number) => (gathered ? mix(base, 0.2, rf(f, P55_F.gather + 4, 12, EASE.inOutC)) : base);
  const chainP = (k: number) => rf(f, ARRIVE + k * 0.4, 10, EASE.inOutC);
  // 光点来回跑（三轮，两个方向都有）
  const inter = f >= P55_F.inter && f < P55_F.gather + 4;
  const interPh = (f - P55_F.inter) / 14;
  // 呼吸：三个大点轻轻明暗
  const breathe = (k: number) => (f >= ARRIVE ? 0.82 + 0.18 * Math.cos(((f - ARRIVE) / 40) * 2 * Math.PI + k * 2.1) : 1);
  return (
    <AbsoluteFill>
      <NightBackdrop f={f} opacity={1} />
      <AbsoluteFill style={{transform: `scale(${camF.toFixed(5)})`, transformOrigin: camOrigin}}>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Defs />
          {/* 原网的边：淡淡的（α0.35），簇亮起时该簇内的边亮到 0.6；迁移时跟着点走、压到 0.2 */}
          {ALL_EDGES.map(([a, b], k) => {
            const [x0, y0] = posAt(a, f), [x1, y1] = posAt(b, f);
            const inL = N[a].cl === 'L' && N[b].cl === 'L', inR = N[a].cl === 'R' && N[b].cl === 'R';
            const base = 0.35 + 0.25 * (inL ? lightL : inR ? lightR : 0);
            const aw = inP57 ? 0.15 * awareAt((x0 + x1) / 2, (y0 + y1) / 2, f) : 0;
            const q = inter ? (k % 2 === 0 ? 0.5 - 0.5 * Math.cos(interPh * 2 * Math.PI) : 0.5 + 0.5 * Math.cos(interPh * 2 * Math.PI)) : -1;
            return (
              <g key={k}>
                <line x1={x0.toFixed(1)} y1={y0.toFixed(1)} x2={x1.toFixed(1)} y2={y1.toFixed(1)} stroke={C.gold} strokeOpacity={edgeA(base) + aw} strokeWidth={2} />
                {q >= 0 && <Tip x={mix(x0, x1, q)} y={mix(y0, y1, q)} r={3.2} />}
              </g>
            );
          })}
          {/* 轮廓链：到位后沿轮廓连成一圈 */}
          {NET.chain.map(([a, b], k) => {
            const p = chainP(k);
            if (p <= 0) return null;
            const [x0, y0] = posAt(a, f), [x1, y1] = posAt(b, f);
            const aw = inP57 ? awareAt(x0, y0, f) : 0;
            return <line key={'c' + k} x1={x0.toFixed(1)} y1={y0.toFixed(1)} x2={mix(x0, x1, p).toFixed(1)} y2={mix(y0, y1, p).toFixed(1)} stroke={aw > 0 ? C.goldHi : C.gold} strokeOpacity={0.72 + 0.23 * aw} strokeWidth={2.2} />;
          })}
          {/* 簇的残影（迁移起留在原处，α0.2；P57 漫开时亮到 0.7）+ 簇到三个大点的牵线（簇端钉在残影上） */}
          {gathered && [...LEFT, ...RIGHT].map((i) => {
            const a = inP57 ? mix(0.2, 0.7, awareAt(N[i].x, N[i].y, f)) : 0.2 * rf(f, P55_F.gather + 4, 10, EASE.lin);
            return <SmallDot key={'g' + i} x={N[i].x} y={N[i].y} r={N[i].r} s={1} a={a} />;
          })}
          {NET.ties.map(([c, b], k) => {
            const isL = N[c].cl === 'L';
            const f0 = (isL ? P55_F.grow : P55_F.env) + 4 + 3 * (k % 3);
            const p = rf(f, f0, 10, EASE.inOutC);
            if (p <= 0) return null;
            const [bx, by] = posAt(b, f);
            let cx = N[c].x, cy = N[c].y;
            let swingTip = false;
            if (inP57 && k === REWIRE.tie && f >= P57_F.adjust) {
              // 松开：端点滑脱 8 帧（沿线往「行为」方向滑 40px）→ 荡一下 10 帧（以「行为」为轴摆过去）→ 接到 8 号点（10 帧）
              const L = Math.hypot(cx - bx, cy - by);
              const ang0 = Math.atan2(cy - by, cx - bx);
              const T = N[REWIRE.to];
              const ang1 = Math.atan2(T.y - by, T.x - bx), L1 = Math.hypot(T.x - bx, T.y - by);
              const s1 = rf(f, P57_F.adjust, 8, EASE.inOutC);
              const s2 = clamp01((f - P57_F.adjust - 8) / 10);
              const s3 = rf(f, P57_ATTACH, 10, EASE.inOutC);
              let ang = ang0, len = L - 40 * s1;
              if (f >= P57_F.adjust + 8) {
                ang = ang0 + (ang1 - ang0) * 0.55 * Math.sin((Math.PI / 2) * s2) + Math.sin(Math.PI * s2) * 0.06;
                len = L - 40;
              }
              if (f >= P57_ATTACH) {
                ang = mix(ang0 + (ang1 - ang0) * 0.55, ang1, s3);
                len = mix(L - 40, L1, s3);
              }
              cx = bx + len * Math.cos(ang);
              cy = by + len * Math.sin(ang);
              swingTip = f < P57_ATTACH + 10;
            }
            const aw = inP57 ? awareAt(N[c].x, N[c].y, f) : 0;
            const base = gathered ? mix(0.55, 0.2, rf(f, P55_F.gather + 4, 12, EASE.inOutC)) : 0.55;
            const a = inP57 ? (k === REWIRE.tie && f >= P57_F.adjust ? 0.9 : mix(0.2, 0.7, aw)) : base;
            const xe = mix(cx, bx, p), ye = mix(cy, by, p);
            return (
              <g key={'t' + k}>
                <line x1={cx.toFixed(1)} y1={cy.toFixed(1)} x2={xe.toFixed(1)} y2={ye.toFixed(1)} stroke={C.goldHi} strokeOpacity={a} strokeWidth={2} />
                {p < 1 && <Tip x={xe} y={ye} r={3} />}
                {swingTip && <Tip x={cx} y={cy} r={3.4} />}
              </g>
            );
          })}
          {/* 小点（簇亮起时过冲一下） */}
          {SMALL.map((i) => {
            const [x, y] = posAt(i, f);
            const lit = N[i].cl === 'L' ? lightL : N[i].cl === 'R' ? lightR : 0;
            const s = N[i].cl === 'L' ? (f >= P55_F.grow ? pop(f, P55_F.grow + Math.round(3 * rand(i))) : 1) : N[i].cl === 'R' ? (f >= P55_F.env ? pop(f, P55_F.env + Math.round(3 * rand(i))) : 1) : 1;
            const a = mix(0.55, 1, lit) * (gathered ? 1 : 1);
            const aw = inP57 ? awareAt(x, y, f) : 0;
            return <SmallDot key={i} x={x} y={y} r={N[i].r * (1 + 0.25 * aw)} s={s} a={gathered ? 0.95 : a} />;
          })}
          {/* 三个大点 */}
          {[0, 1, 2].map((k) => {
            const [x, y] = posAt(k, f);
            return <BigDot key={'b' + k} x={x} y={y} s={1} glow={breathe(k)} />;
          })}
          {/* P57 新线 + 新星 */}
          {inP57 && <NewStar f={f} />}
        </svg>
        {/* 大点标注跟着走（迁移时偏移从 LAB0 补间到 LAB1） */}
        <BigLabels f={f} pos={(k) => posAt(k, f)} lab={(k) => { const m = migr(k, f); return [mix(LAB0[k][0], LAB1[k][0], m), mix(LAB0[k][1], LAB1[k][1], m)]; }} from={() => -1} />
        {/* P55 标注 */}
        {!inP57 && labOut > 0 && (
          <>
            <Label t="成长经历" x={120} y={1160} f={f} f0={P55_F.grow} size={52} op={labOut} />
            <Label t="现实环境" x={700} y={1160} f={f} f0={P55_F.env} size={52} op={labOut} />
            <Label t="相互作用" x={428} y={740} f={f} f0={P55_F.inter} gold op={labOut} />
          </>
        )}
        {/* P57 标注 */}
        {inP57 && (
          <>
            <Label t="这些条件" x={0} y={300} f={f} f0={P57_F.cond} size={52} center />
            {/* 返修（审片 P1-6）：上移 30px 离开肩线；新线起笔时 8 帧淡出，不再被新线穿字、同屏金字回到一组 */}
            <Label t="调整" x={808} y={980} f={f} f0={P57_F.adjust} size={52} gold op={1 - rf(f, P57_F.create, 8, EASE.lin)} />
            <Label t="新的可能" x={606} y={404} f={f} f0={P57_F.fresh} size={60} gold />
          </>
        )}
      </AbsoluteFill>
      {inP57 && <Crack f={f} f0={S.P57.f1 - 10} dur={9} />}{/* 返修：亮缝缩到最后 10 帧（原 20 帧从胸口长出、穿过「观」字像又连了一根线） */}
    </AbsoluteFill>
  );
};
/** 新线：从「行为」往右上长到 (880,470)（16 帧，带笔头）；线头亮起四角星芒 r16，旁边再冒两个小点 */
const STAR = {x: 880, y: 470};
const NewStar: React.FC<{f: number}> = ({f}) => {
  if (f < P57_F.create) return null;
  const [bx, by] = posAt(2, f);
  const p = rf(f, P57_F.create, 16, EASE.inOutC);
  const xe = mix(bx, STAR.x, p), ye = mix(by, STAR.y, p);
  const st = rf(f, P57_F.fresh, 10, EASE.outC);
  const twinkle = f >= P57_F.fresh + 10 ? 0.9 + 0.1 * Math.cos(((f - P57_F.fresh - 10) / 36) * 2 * Math.PI) : 1;
  const L = 16 * 2.4 * st * twinkle;
  return (
    <g>
      <line x1={bx.toFixed(1)} y1={by.toFixed(1)} x2={xe.toFixed(1)} y2={ye.toFixed(1)} stroke={C.goldHi2} strokeWidth={2.6} />
      {p < 1 && <Tip x={xe} y={ye} r={4} />}
      {st > 0 && (
        <g transform={`translate(${STAR.x} ${STAR.y})`}>
          <circle r={16 * 3 * st} fill="url(#n3Core)" opacity={0.85} />
          <path d={`M0,${-L} L3,-3 L${L},0 L3,3 L0,${L} L-3,3 L${-L},0 L-3,-3 Z`} fill="#fff4dc" opacity={st} />
          <circle r={5 * st} fill="#fff8e8" />
        </g>
      )}
      <SmallDot x={STAR.x + 54} y={STAR.y + 46} r={5} s={pop(f, P57_F.fresh + 6)} />
      <SmallDot x={STAR.x - 30} y={STAR.y - 58} r={4.5} s={pop(f, P57_F.fresh + 10)} />
    </g>
  );
};
/** x=540 一条发丝亮缝（对开门预告，同 P29） */
const Crack: React.FC<{f: number; f0: number; dur?: number}> = ({f, f0, dur = 20}) => {
  const p = rf(f, f0, dur, EASE.inOutC);
  if (p <= 0) return null;
  const h = 960 * p;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={536} y={960 - h} width={8} height={2 * h} fill={C.goldHi2} opacity={0.18} style={{filter: 'blur(3px)'}} />
      <line x1={540} y1={960 - h} x2={540} y2={960 + h} stroke={C.goldHi2} strokeWidth={2} />
    </svg>
  );
};

export const P55: React.FC<{f: number}> = ({f}) => (f >= S.P55.f0 && f < S.P55.f1 ? <NetPage f={f} /> : null);
export const P57: React.FC<{f: number}> = ({f}) => (f >= S.P57.f0 && f < S.P57.f1 ? <NetPage f={f} /> : null);
export const P57_LAST = S.P57.f1 - 1;
export const P55_ARRIVE = ARRIVE;
