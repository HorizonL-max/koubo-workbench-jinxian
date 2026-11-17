import React from 'react';
import {C} from '../theme';
import {clamp01, EASE, FPS, mix, rf, spring01} from '../u';
import {dampSwing} from './anim';

/**
 * C36 线稿图标：纸面上墨线 4px + 一处金色点睛；暗底上金线 3px。一笔一笔画出来（draw-on，各笔按顺序分进度），画完各有一个小动作。
 * 图标里不写字、不写数字。局部坐标 150×150（中心 75,75），size 是屏幕上的边长。
 * 第一幕：house / globe / clock（P10 三联竖卡）、book / cap / briefcase（P16 路线卡）、family / exam / ruler（P26 线稿吊坠）。
 * 二幕要的奖状、床、碗、月亮，三幕的楼和树，照这个格式往 ICONS 里加。
 */
export type IconKind = 'house' | 'globe' | 'clock' | 'book' | 'cap' | 'briefcase' | 'family' | 'exam' | 'ruler' | 'cert' | 'bed' | 'bowl' | 'moon' | 'building' | 'tree';
type Stroke = {d: string; gold?: boolean; fill?: boolean};
const circ = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
const ICONS: Record<IconKind, Stroke[]> = {
  // 三幕 P60「成长的环境」：一栋楼 + 一棵树（左楼右树同画在一个 150 格里）
  building: [
    {d: 'M18,128 L18,40 L66,28 L66,128'},
    {d: 'M66,128 L66,58 L92,64 L92,128'},
    {d: 'M30,54 L40,54 M48,52 L56,52 M30,74 L40,74 M48,72 L56,72 M30,94 L40,94 M48,92 L56,92'},
    {d: 'M36,128 L36,112 L50,112 L50,128', gold: true},
    {d: 'M8,128 L142,128'},
  ],
  tree: [
    {d: 'M75,128 L75,84'},
    {d: 'M75,100 L60,88 M75,94 L90,80'},
    {d: 'M75,90 C40,92 32,62 50,48 C48,26 76,16 90,30 C112,26 124,50 112,66 C122,86 100,96 75,90 Z'},
    {d: circ(96, 52, 6), gold: true},
    {d: 'M40,128 L110,128'},
  ],
  house: [
    {d: 'M22,70 L75,26 L128,70'},
    {d: 'M34,62 L34,126 L116,126 L116,62'},
    {d: 'M64,126 L64,94 L86,94 L86,126'},
    {d: 'M94,80 L108,80 L108,94 L94,94 Z', gold: true},
    {d: 'M100,46 L100,30 L112,30 L112,56'},
  ],
  globe: [
    {d: circ(75, 78, 50)},
    {d: 'M75,28 L75,128'},
    {d: 'M27,64 L123,64 M27,92 L123,92'},
    {d: 'M50,12 L100,144'},
  ],
  clock: [
    {d: circ(75, 78, 52)},
    {d: Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2, r0 = i % 3 === 0 ? 40 : 44;
      return `M${(75 + Math.sin(a) * r0).toFixed(1)},${(78 - Math.cos(a) * r0).toFixed(1)} L${(75 + Math.sin(a) * 49).toFixed(1)},${(78 - Math.cos(a) * 49).toFixed(1)}`;
    }).join(' ')},
  ],
  book: [
    {d: 'M75,42 C58,32 34,32 18,38 L18,116 C34,110 58,110 75,120 Z'},
    {d: 'M75,42 C92,32 116,32 132,38 L132,116 C116,110 92,110 75,120'},
    {d: 'M75,42 L75,120'},
    {d: 'M30,58 C42,54 54,55 64,59 M30,76 C42,72 54,73 64,77 M86,59 C96,55 108,54 120,58 M86,77 C96,73 108,72 120,76'},
  ],
  cap: [
    {d: 'M14,62 L75,36 L136,62 L75,88 Z'},
    {d: 'M40,74 L40,106 C56,120 94,120 110,106 L110,74'},
  ],
  briefcase: [
    {d: 'M18,52 L132,52 L132,124 L18,124 Z'},
    {d: 'M56,52 L56,36 L94,36 L94,52'},
    {d: 'M18,80 L132,80'},
  ],
  family: [
    {d: circ(40, 40, 13) + ' M40,53 L40,100 M40,100 L30,136 M40,100 L50,136 M40,64 L24,92'},
    {d: circ(110, 40, 13) + ' M110,53 L110,100 M110,100 L100,136 M110,100 L120,136 M110,64 L126,92'},
    {d: circ(75, 76, 10) + ' M75,86 L75,114 M75,114 L68,136 M75,114 L82,136'},
    {d: 'M40,64 L64,90 M110,64 L86,90', gold: true},
  ],
  exam: [
    {d: 'M30,20 L104,20 L120,36 L120,132 L30,132 Z'},
    {d: 'M44,58 L106,58 M44,80 L106,80 M44,102 L92,102'},
    {d: circ(112, 30, 13) + ' M104,40 L98,58 L108,52 L112,62 M120,40 L124,58', gold: true},
  ],
  ruler: [
    {d: 'M14,104 L120,30 L136,52 L30,126 Z'},
    {d: Array.from({length: 9}, (_, i) => {
      const u = (i + 1) / 10, x = mix(18, 124, u), y = mix(108, 34, u), l = i % 2 ? 9 : 16;
      return `M${x.toFixed(1)},${y.toFixed(1)} L${(x + l * 0.57).toFixed(1)},${(y + l * 0.82).toFixed(1)}`;
    }).join(' ')},
    {d: 'M6,138 L144,138', gold: true},
  ],
  // —— 第二幕新增（P34 奖状墙小格、P38 回环四方位）——
  cert: [
    {d: 'M14,30 L136,30 L136,120 L14,120 Z'},
    {d: 'M24,40 L126,40 L126,110 L24,110 Z'},
    {d: 'M44,62 L106,62 M44,78 L106,78 M54,94 L96,94'},
    {d: circ(112, 104, 10) + ' M106,112 L102,128 L110,122 L114,130 L116,113', gold: true},
  ],
  bed: [
    {d: 'M14,112 L14,52 M14,92 L136,92 L136,112'},
    {d: 'M14,70 L136,70 L136,92'},
    {d: 'M24,70 C24,56 50,56 52,70', gold: true},
  ],
  bowl: [
    {d: 'M18,72 L132,72 C128,108 104,124 75,124 C46,124 22,108 18,72 Z'},
    {d: 'M54,124 L50,134 L100,134 L96,124'},
    {d: 'M60,58 C54,48 66,40 60,30 M88,58 C82,48 94,40 88,30', gold: true},
  ],
  moon: [
    {d: 'M96,22 C56,26 34,58 40,92 C46,124 82,140 114,124 C82,120 62,96 66,68 C70,44 84,30 96,22 Z'},
    {d: 'M112,46 L116,56 L126,58 L116,62 L112,72 L108,62 L98,58 L108,56 Z', gold: true},
  ],
};

export const LineIcon: React.FC<{kind: IconKind; f: number; f0: number; dur?: number; x: number; y: number; size: number; dark?: boolean; op?: number}> = ({kind, f, f0, dur = 12, x, y, size, dark = false, op = 1}) => {
  const p = rf(f, f0, dur, EASE.inOutC);
  if (p <= 0) return null;
  const st = ICONS[kind];
  const ink = dark ? C.goldHi : C.ink;
  const gold = dark ? C.goldHi2 : C.goldHi;
  const sw = dark ? 3 : 4;
  const done = f - (f0 + dur); // 画完后的帧数
  const t = done / FPS;
  // 返修：画线的 path 不能带 vector-effect=non-scaling-stroke——Chrome 会把 pathLength 归一后的虚线按屏幕长度算，size>150 时只画到 150/size（P10 钟面 size 200 只画到 75%）。线宽改成按 viewBox 换算。
  const strokes = st.map((s, i) => {
    const q = clamp01(p * st.length - i);
    if (q <= 0) return null;
    return <path key={i} d={s.d} fill="none" stroke={s.gold ? gold : ink} strokeWidth={(sw * 150) / size} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={q >= 1 ? 0 : 1 - q} />;
  });
  // 画完后的小动作
  const extra: React.ReactNode[] = [];
  if (done >= 0) {
    if (kind === 'house') {
      // 窗户亮灯（暖金填色）+ 烟囱冒三小段弧线循环上飘
      const lit = rf(f, f0 + dur, 8, EASE.outC);
      extra.push(<rect key="w" x={95} y={81} width={12} height={12} fill={C.goldHi} opacity={0.85 * lit} />);
      // 返修：三段上下叠的弧读成数字「3」→ 两段、左右错开、不闭合
      for (let j = 0; j < 2; j++) {
        const ph = ((t * 0.55 + j / 2) % 1);
        const yy = 22 - ph * 26, op2 = Math.sin(Math.PI * ph) * clamp01(done / 8);
        extra.push(<path key={'s' + j} d={`M${(j ? 110 : 100) + 3 * Math.sin(ph * 6)},${yy + 6} q5,-3 3,-7`} fill="none" stroke={ink} strokeOpacity={0.7 * op2} strokeWidth={sw * 0.8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />);
      }
    }
    if (kind === 'cap') {
      const a = dampSwing(f, f0 + dur, 14) + 2 * Math.sin(t * 1.6);
      extra.push(
        <g key="t" transform={`rotate(${a.toFixed(2)} 75 62)`}>
          <path d="M75,62 L118,74 L118,98" fill="none" stroke={gold} strokeWidth={sw} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d="M113,98 L123,98 L121,112 L115,112 Z" fill={gold} />
        </g>,
      );
    }
    if (kind === 'book') {
      const a = dampSwing(f, f0 + dur, 10) + 1.5 * Math.sin(t * 1.4);
      extra.push(<g key="r" transform={`rotate(${a.toFixed(2)} 75 120)`}><path d="M75,120 L72,140 L78,136 L81,142 L80,120" fill={gold} /></g>);
    }
    if (kind === 'briefcase') {
      // 金色搭扣 2 帧扣上
      const c = rf(f, f0 + dur, 2, EASE.lin);
      extra.push(<rect key="c" x={67} y={mix(64, 74, c)} width={16} height={12} rx={2} fill={gold} />);
    }
  }
  if (kind === 'globe' && p > 0.3) {
    // 经线：椭圆短轴缓缓来回（像在转）
    const w = 20 + 16 * Math.sin(Math.max(0, done) / FPS * 1.4);
    extra.push(<ellipse key="m" cx={75} cy={78} rx={Math.abs(w)} ry={50} fill="none" stroke={ink} strokeWidth={sw} vectorEffect="non-scaling-stroke" opacity={clamp01((p - 0.3) / 0.3)} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity: op}}>
      <g transform={kind === 'globe' ? 'rotate(23 75 78)' : undefined}>{strokes}{kind === 'globe' && extra}</g>
      {kind !== 'globe' && extra}
    </svg>
  );
};

/** 钟的两根针（P10）：分针 −720°（30 帧 outCubic），时针 −60° */
export const ClockHands: React.FC<{f: number; f0: number; spinF: number; x: number; y: number; size: number}> = ({f, f0, spinF, x, y, size}) => {
  const p = rf(f, f0, 8, EASE.outC);
  if (p <= 0) return null;
  const q = rf(f, spinF, 30, EASE.outC);
  const m = -720 * q + 60, h = -60 * q + 300;
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity: p}}>
      <g transform={`rotate(${h.toFixed(2)} 75 78)`}><line x1={75} y1={78} x2={75} y2={50} stroke={C.ink} strokeWidth={5} strokeLinecap="round" vectorEffect="non-scaling-stroke" /></g>
      <g transform={`rotate(${m.toFixed(2)} 75 78)`}><line x1={75} y1={78} x2={75} y2={36} stroke={C.ink} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" /></g>
      <circle cx={75} cy={78} r={4.5} fill={C.goldHi} />
    </svg>
  );
};
/** 地球上落一枚金色小图钉（P10）：从上方 30px 落下，弹簧 */
export const GlobePin: React.FC<{f: number; f0: number; x: number; y: number; size: number}> = ({f, f0, x, y, size}) => {
  if (f < f0) return null;
  const s = spring01(f, f0, 12, 170);
  const k = size / 150;
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" style={{position: 'absolute', left: x, top: y, overflow: 'visible', opacity: clamp01((f - f0) / 3)}}>
      <g transform={`translate(0 ${((1 - s) * -30 / k).toFixed(2)})`}>
        <line x1={92} y1={66} x2={92} y2={50} stroke={C.goldDeep} strokeWidth={3} vectorEffect="non-scaling-stroke" />
        <circle cx={92} cy={46} r={7} fill={C.goldHi} stroke={C.goldDeep} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
};
