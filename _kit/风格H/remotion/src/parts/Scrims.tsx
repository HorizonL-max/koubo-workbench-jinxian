import React from 'react';
import {AbsoluteFill} from 'remotion';
import {mix, rf, EASE} from '../u';
import {VENUE} from '../venue';
import {EP} from '../ep/episode';

/**
 * 压暗层（SHOTBOOK 1.5）：只在顶和底，任何时候不盖到脸。数值读场地预设 scrims（顶 α0.50@y0→0@y420；底 0@1400→0.80@1700→0.86@1920）。
 * lift（0→1）：升格问句 / 胸前区镜头时底部压暗上提（α0@905 → 0.82@1000 → 0.88@1400 以下）——起点要在中景上提的下巴最低点以下。
 * 底部压暗顺带盖住中景的桌面、白线、手（场地预设 ms_bottom_clutter）。
 */
const V = VENUE.scrims;
const SC = (a: number) => `rgba(20,13,7,${a.toFixed(3)})`;
export const Scrims: React.FC<{lift?: number; opacity?: number}> = ({lift = 0, opacity = 1}) => {
  const a0 = mix(V.bottom.from_y, V.lift.from_y, lift), a1 = mix(V.bottom.mid_y, V.lift.mid_y, lift), a2 = mix(1920, V.lift.end_y, lift);
  const v1 = mix(V.bottom.mid_alpha, V.lift.mid_alpha, lift), v2 = mix(V.bottom.end_alpha, V.lift.end_alpha, lift);
  const pct = (y: number) => `${((y / 1920) * 100).toFixed(2)}%`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${SC(V.top.alpha)} 0%, ${SC(V.top.alpha * 0.44)} ${pct(V.top.to_y * 0.41)}, ${SC(0)} ${pct(V.top.to_y)})`}} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${SC(0)} ${pct(a0)}, ${SC(v1 * 0.55)} ${pct((a0 + a1) / 2)}, ${SC(v1)} ${pct(a1)}, ${SC(v2)} ${pct(a2)}, ${SC(v2)} 100%)`}} />
    </AbsoluteFill>
  );
};
/** 上提区间读 EP.lifts：切进来 6 帧到位，镜尾硬切回去 */
export const liftAt = (f: number) => {
  const w = EP.lifts.find(([a, b]) => f >= a && f < b);
  return w ? rf(f, w[0], 6, EASE.outC) : 0;
};
