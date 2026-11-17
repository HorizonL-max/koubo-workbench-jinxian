import React from 'react';
import {C, FONT, SOFT_SHADOW} from '../theme';
import {clamp01, EASE, mix, rf} from '../u';
import {blurIn, Tip} from './anim';
import NG from './netgraph.example.json';

/**
 * C26 节点网：一份固定种子的布局（默认 netgraph.example.json = 样片那张 33 点 / 51 边；每期用 tools/netgraph_layout.py 重出一份，传 net 进来）。
 * 样片里第一章只露上半张（top），第五章用整张；同一期里几处共用同一份布局。
 * 节点：金点 r5–9 + 光晕；大节点 r14 + 外环 r22。边：2px gold α0.5。
 * 点亮照 radial-wave：单点 12 帧、过冲到 1.5 倍再落回；边 10 帧画出（带笔头）。
 * 迁移（P55 收成人形）：给 pos(i, f) 覆盖坐标即可，边跟着节点走。
 */
export type NetNode = {x: number; y: number; r: number; big: boolean; anchor: boolean; top: boolean};
export type NetLayout = {nodes: NetNode[]; edges: [number, number][]; big: number[]; anchors: number[]};
/** 样片布局（示例）；每期自己的布局用 net prop 传 */
export const NET = NG as unknown as NetLayout;
const pop = (f: number, f0: number) => {
  if (f < f0) return 0;
  const u = clamp01((f - f0) / 12);
  return u < 0.5 ? mix(0, 1.5, EASE.outC(u / 0.5)) : mix(1.5, 1, EASE.inOutC((u - 0.5) / 0.5));
};
export const NetGraph: React.FC<{
  f: number; show: (n: NetNode, i: number) => boolean; nodeF: (i: number) => number; edgeF: (e: [number, number], k: number) => number;
  labels?: {i: number; t: string; f: number; dx?: number; dy?: number}[]; pos?: (i: number, f: number) => [number, number]; opacity?: number; net?: NetLayout;
}> = ({f, show, nodeF, edgeF, labels = [], pos, opacity = 1, net = NET}) => {
  const NET_ = net;
  const P = (i: number): [number, number] => (pos ? pos(i, f) : [NET_.nodes[i].x, NET_.nodes[i].y]);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity, overflow: 'visible'}}>
        <defs>
          <radialGradient id="ngGlow">
            <stop offset="0" stopColor={C.goldHi2} stopOpacity={0.55} />
            <stop offset="1" stopColor={C.gold} stopOpacity={0} />
          </radialGradient>
        </defs>
        {NET_.edges.map((e, k) => {
          if (!show(NET_.nodes[e[0]], e[0]) || !show(NET_.nodes[e[1]], e[1])) return null;
          const p = rf(f, edgeF(e, k), 10, EASE.inOutC);
          if (p <= 0) return null;
          const [x0, y0] = P(e[0]), [x1, y1] = P(e[1]);
          const xe = mix(x0, x1, p), ye = mix(y0, y1, p);
          return (
            <g key={k}>
              <line x1={x0} y1={y0} x2={xe.toFixed(1)} y2={ye.toFixed(1)} stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} />
              {p < 1 && <Tip x={xe} y={ye} r={3} />}
            </g>
          );
        })}
        {NET_.nodes.map((n, i) => {
          if (!show(n, i)) return null;
          const s = pop(f, nodeF(i));
          if (s <= 0) return null;
          const [x, y] = P(i);
          return (
            <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})`}>
              <circle r={n.r * 3.2} fill="url(#ngGlow)" />
              {n.big && <circle r={22} fill="none" stroke={C.goldHi} strokeOpacity={0.7} strokeWidth={2} />}
              <circle r={n.r} fill={n.big ? C.goldHi2 : C.goldHi} />
            </g>
          );
        })}
      </svg>
      {labels.map((l) => {
        if (f < l.f) return null;
        const [x, y] = P(l.i);
        return (
          <div key={l.i} style={{position: 'absolute', left: x + (l.dx ?? 22), top: y + (l.dy ?? 18), whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: 900, fontSize: 44, lineHeight: '50px', color: C.cream, textShadow: SOFT_SHADOW, opacity}}>
            <span style={blurIn(f, l.f, 8, 14)}>{l.t}</span>
          </div>
        );
      })}
    </>
  );
};
