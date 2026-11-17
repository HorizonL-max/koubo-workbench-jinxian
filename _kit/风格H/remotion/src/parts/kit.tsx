import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, FONT, GOLD_TEXT, RING_GRAD, SOFT_SHADOW} from '../theme';
import {clamp01, EASE, mix, rf} from '../u';
import {blurIn, dampSwing, idleSwing, Tip, unfold} from './anim';
import {tagSize} from './PaperTag';

/**
 * 金线讲堂小件合集（样片里散在各幕场景文件里、跨镜复用的，收到这里）：
 * Chars 字随声出 / TagBody 纸签本体 / HangTag 顺线滑下的挂签 / Cert 奖状 / CertEdge 侧看的奖状 / GoldArrow 一笔金箭头 /
 * LoopTrack C28 回环 / FramePlaque C29 小金框牌 + C17 金框牌（描框大号）/ BrollFull 整屏实拍（统一调色 + 顶底压暗）。
 */


/** 一个字一个字出（字随声出，C04 的 blur-slide：上移 0.3em、模糊 14→0、透明度同一进度，8 帧）。frames = charFrames(原话, 秒)，每个字用自己的口播起点 */
export const Chars: React.FC<{text: string; frames: number[]; f: number; size: number; gold?: (i: number) => boolean; dark?: boolean; weight?: number; dur?: number}> = ({text, frames, f, size, gold, dark = true, weight = 900, dur = 8}) => (
  <span style={{whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: weight, fontSize: size, lineHeight: `${size}px`}}>
    {text.split('').map((ch, i) => {
      const p = rf(f, frames[i], dur, EASE.out);
      const g = gold?.(i);
      const b = (1 - p) * 14;
      return (
        <span key={i} style={{display: 'inline-block', opacity: p,
          transform: p < 1 ? `translateY(${((1 - p) * 0.3 * size).toFixed(2)}px)` : undefined,
          filter: [b > 0.01 ? `blur(${b.toFixed(2)}px)` : '', g && dark ? 'drop-shadow(0 2px 8px rgba(20,12,6,.7))' : ''].filter(Boolean).join(' ') || undefined,
          ...(g ? (dark ? GOLD_TEXT : {color: C.goldDeep}) : {color: dark ? C.cream : C.ink, textShadow: dark ? SOFT_SHADOW : 'none'})}}>
          {ch}
        </span>
      );
    })}
  </span>
);

/** 纸签本体（C24 皮），可以单独控制主词出现帧（小字先出、主词后出） */
export const TagBody: React.FC<{w: number; h: number; main: string; small?: string; size: number; u: number; mainOp?: number; mainSize?: number}> = ({w, h, main, small, size, u, mainOp = 1}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 10, background: C.card, border: '1px solid rgba(168,117,42,.5)', boxShadow: '0 6px 14px rgba(20,13,7,.28)', overflow: 'hidden',
    transformOrigin: '50% 0', transform: u < 1 ? `scaleY(${u.toFixed(4)})` : undefined}}>
    {small && <div style={{position: 'absolute', left: 0, right: 0, top: 12, height: 34, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 32, lineHeight: '34px', color: C.goldDeep, whiteSpace: 'nowrap'}}>{small}</div>}
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 12, height: size + 4, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: size, lineHeight: `${size + 4}px`, color: C.ink, whiteSpace: 'nowrap', opacity: mainOp}}>{main}</div>
  </div>
);

/**
 * 从顶边垂线挂下来的纸签（样片 P30 / P51）：线先垂下 12 帧，签顺线滑到位（过冲 10px 回落）后展开，绕线顶端阻尼摆 + 常驻微摆。
 * x = 线的 x（签的中心），y = 签顶。mainF 给了：主词在那一帧才出（小字先出）。
 */
export const HangTag: React.FC<{f: number; f0: number; x: number; y: number; main: string; small?: string; size?: number; amp?: number; phase?: number; mainF?: number; lineF?: number; lineOp?: number; slideDur?: number}> = ({f, f0, x, y, main, small, size = 44, amp = 2, phase = 0, mainF, lineF, lineOp = 0.85, slideDur = 14}) => {
  const lf = lineF ?? f0;
  if (f < lf) return null;
  const line = rf(f, lf, 12, EASE.outC);
  const {w, h} = tagSize(main, small, size);
  const slide = rf(f, f0, slideDur, EASE.outC);
  const over = f >= f0 + slideDur ? 0 : Math.sin(Math.PI * slide) * 10;
  const ty = f < f0 ? -9999 : mix(Math.min(300, y - 200), y, slide) + over;
  const ang = f >= f0 ? dampSwing(f, f0 + 10, amp) + idleSwing(f, 0.35, phase) : 0;
  const u = unfold(f, f0 + 4);
  const mainOp = mainF === undefined ? 1 : clamp01((f - mainF) / 4);
  const lineEnd = f < f0 ? y * line : ty;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${x}px 0px`, transform: ang ? `rotate(${ang.toFixed(3)}deg)` : undefined, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x - 1, top: 0, width: 2, height: Math.max(0, lineEnd), background: C.gold, opacity: lineOp, boxShadow: '0 0 4px rgba(233,190,120,.5)'}} />
      {f >= f0 && (
        <div style={{position: 'absolute', left: Math.round(x - w / 2), top: ty, width: w, height: h}}>
          <TagBody w={w} h={h} main={main} small={small} size={size} u={u} mainOp={mainOp} />
        </div>
      )}
    </div>
  );
};

/** 奖状正面（170×124，纸卡色，金色双线边 + 小绶带花结 + 三行墨线，没有字）；stampP：「认可」金印盖下进度（4 帧 1.6→1、转 −10°） */
export const CERT = {w: 170, h: 124};
export const Cert: React.FC<{x: number; y: number; stampF?: number; f: number; scale?: number; rot?: number}> = ({x, y, stampF, f, scale = 1, rot = 0}) => {
  const st = stampF !== undefined ? rf(f, stampF, 4, EASE.outC) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: CERT.w, height: CERT.h, transformOrigin: '50% 0', transform: scale !== 1 || rot ? `rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})` : undefined}}>
      <svg width={CERT.w} height={CERT.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.45))'}}>
        <rect x={0} y={0} width={170} height={124} rx={4} fill={C.card} />
        <rect x={6} y={6} width={158} height={112} rx={3} fill="none" stroke={C.gold} strokeWidth={2} />
        <rect x={11} y={11} width={148} height={102} rx={2} fill="none" stroke={C.gold} strokeWidth={1} opacity={0.8} />
        <path d="M45,46 L125,46 M45,64 L125,64 M60,82 L110,82" stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
        <circle cx={140} cy={98} r={9} fill={C.goldHi} stroke={C.goldDeep} strokeWidth={1.5} />
        <path d="M134,105 L130,121 L137,116 L140,123 L143,106" fill={C.goldDeep} />
      </svg>
      {st > 0 && (
        <div style={{position: 'absolute', left: 85 - 46, top: 62 - 46, width: 92, height: 92, borderRadius: '50%', border: `4px solid ${C.goldDeep}`, boxSizing: 'border-box',
          transform: `rotate(-10deg) scale(${mix(1.6, 1, st).toFixed(4)})`, opacity: clamp01(st * 2), background: 'rgba(244,236,218,.82)',
          textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: 38, lineHeight: '84px', color: C.goldDeep, whiteSpace: 'nowrap'}}>
          认可
        </div>
      )}
    </div>
  );
};

/** 侧看的一张奖状（摞起来的一层）：一条纸卡色的边 + 一道金线，厚 22 */
export const CertEdge: React.FC<{cx: number; y: number; w?: number}> = ({cx, y, w = 180}) => (
  <g>
    <rect x={cx - w / 2} y={y} width={w} height={20} rx={3} fill={C.card} />
    <rect x={cx - w / 2} y={y + 20} width={w} height={2} fill="#2a1a0e" opacity={0.7} />
    <line x1={cx - w / 2 + 6} y1={y + 6} x2={cx + w / 2 - 6} y2={y + 6} stroke={C.gold} strokeWidth={2} />
  </g>
);

/** 一笔画出的金色箭头线（draw-svg-trace，带亮笔头） */
export const GoldArrow: React.FC<{x0: number; y0: number; x1: number; y1: number; p: number; w?: number; op?: number}> = ({x0, y0, x1, y1, p, w = 4, op = 1}) => {
  if (p <= 0) return null;
  const x = mix(x0, x1, p), y = mix(y0, y1, p);
  const a = Math.atan2(y1 - y0, x1 - x0);
  const head = rf(p, 0.85, 0.15, EASE.lin);
  const hx = (k: number) => x1 - Math.cos(a + k) * 22, hy = (k: number) => y1 - Math.sin(a + k) * 22;
  return (
    <g opacity={op}>
      <line x1={x0} y1={y0} x2={x} y2={y} stroke={C.goldHi} strokeWidth={w} strokeLinecap="round" style={{filter: 'drop-shadow(0 2px 6px rgba(20,12,6,.6))'}} />
      {head > 0 && <path d={`M${hx(0.5)},${hy(0.5)} L${x1},${y1} L${hx(-0.5)},${hy(-0.5)}`} fill="none" stroke={C.goldHi} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={head} />}
      {p < 1 && <Tip x={x} y={y} r={4} />}
    </g>
  );
};

/* ═════════ C28 回环（LoopTrack，样片 P38 / P50 共用：一圈轨道 + 匀速绕圈的金点，每绕一圈轨道粗一档 —— 「重复」） ═════════
 * 一圈圆形轨道 + 一颗匀速绕圈的金点（r11 + 光晕）。圈本身不转（细线不做慢速旋转），动的只有金点。
 * angle 用度：0 = 正右，90 = 正下，180 = 正左，270 = 正上（SVG 方向，角度增大 = 顺时针）。 */
export const LoopTrack: React.FC<{cx: number; cy: number; r: number; w: number; op?: number; draw?: number; lead?: number; dotA?: number; dotOp?: number; glow?: number}> = ({cx, cy, r, w, op = 1, draw = 1, lead = 0, dotA, dotOp = 1, glow = 0}) => {
  // 进场：一条金线从画面左边 y=cy 进来，绕成一个圈闭合（lead = 进场直线长度）
  const L1 = lead, L2 = 2 * Math.PI * r, tot = L1 + L2;
  const d = (lead > 0 ? `M${cx - r - lead},${cy} L${cx - r},${cy} ` : `M${cx - r},${cy} `) + `A${r},${r} 0 1 1 ${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy}`;
  const p = clamp01(draw);
  let tip: [number, number] | null = null;
  if (p < 1) {
    const s = p * tot;
    if (s <= L1) tip = [cx - r - lead + s, cy];
    else { const a = Math.PI + (s - L1) / r; tip = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  }
  const dot = dotA !== undefined ? [cx + r * Math.cos((dotA * Math.PI) / 180), cy + r * Math.sin((dotA * Math.PI) / 180)] : null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={d} fill="none" stroke={C.gold} strokeOpacity={op} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={p >= 1 ? 0 : 1 - p} style={glow > 0 ? {filter: `drop-shadow(0 0 ${(4 * glow).toFixed(1)}px rgba(233,190,120,.7))`} : undefined} />
      {tip && <Tip x={tip[0]} y={tip[1]} r={4.5} />}
      {dot && dotOp > 0 && (
        <g opacity={dotOp}>
          <circle cx={dot[0]} cy={dot[1]} r={26} fill={C.goldHi} opacity={0.22} />
          <circle cx={dot[0]} cy={dot[1]} r={11} fill={C.goldHi2} />
        </g>
      )}
    </svg>
  );
};


/**
 * C29 小金框牌 / C17 金框牌（同一个件，大小和出场方式用参数切；样片「仅此而已」P39、皮影戏台顶上的小牌 P24）。
 * 两种用法：
 *   静态（不给 f / f0，C29 原来的样子）：深底 #1a0f08 + 2px 渐变金边（RING_GRAD）+ 金字，切进来就在。x,y = 左上；宽按字数算。
 *   描框（给 f、f0，P39 / C17）：3px 渐变金框从顶边中点顺时针一笔画完一圈（dur 帧 inOutCubic，带亮笔头，精确闭合）；
 *     闭合前 2 帧框里起暗底（rgba(20,13,7,.38)，6 帧）；闭合后主词 6 帧 blur-in（乳白 Black + 柔影，color='gold' 换亮金）；
 *     sub 给了就是两行：上行小字（Bold 亮金）、下行大字，小字比大字早 subLead 帧出。
 * 尺寸：C29 小号 = 近景顶区一行（样片 480×120、r16、字 84）；C17 大号 = 860×420、r26、上行小字 48 + 下行大字 120，配檀棕树影底。
 * 断语专用（「仅此而已」这类），一镜一块；配乐可以在这 2 秒停住，只留一下木头轻叩（wood）。
 * 为什么不另起一个组件：C17 和 C29 是同一套皮（深底 + 渐变金边 + 宋体），只差尺寸和出场方式；分成两个件以后两边的边宽、渐变、字距会各改各的。
 */
const rrFromTop = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + w / 2},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
/** 圆角矩形周长上 p（0–1）处的点，从顶边中点顺时针量 */
const rrTopPoint = (x: number, y: number, w: number, h: number, r: number, p: number): [number, number] => {
  const segs: [number, (d: number) => [number, number]][] = [
    [w / 2 - r, (d) => [x + w / 2 + d, y]],
    [(Math.PI * r) / 2, (d) => { const a = -Math.PI / 2 + d / r; return [x + w - r + r * Math.cos(a), y + r + r * Math.sin(a)]; }],
    [h - 2 * r, (d) => [x + w, y + r + d]],
    [(Math.PI * r) / 2, (d) => { const a = d / r; return [x + w - r + r * Math.cos(a), y + h - r + r * Math.sin(a)]; }],
    [w - 2 * r, (d) => [x + w - r - d, y + h]],
    [(Math.PI * r) / 2, (d) => { const a = Math.PI / 2 + d / r; return [x + r + r * Math.cos(a), y + h - r + r * Math.sin(a)]; }],
    [h - 2 * r, (d) => [x, y + h - r - d]],
    [(Math.PI * r) / 2, (d) => { const a = Math.PI + d / r; return [x + r + r * Math.cos(a), y + r + r * Math.sin(a)]; }],
    [w / 2 - r, (d) => [x + r + d, y]],
  ];
  let s = clamp01(p) * segs.reduce((a, b) => a + b[0], 0);
  for (const [len, fn] of segs) {
    if (s <= len) return fn(s);
    s -= len;
  }
  return [x + w / 2, y];
};
export const FramePlaque: React.FC<{
  text: string; x?: number; y?: number; size?: number; w?: number; h?: number; op?: number;
  f?: number; f0?: number; dur?: number; r?: number; sub?: string; subSize?: number; subLead?: number; color?: 'gold' | 'cream'; uid?: string;
}> = ({text, x, y = 292, size, w, h, op = 1, f, f0, dur = 10, r, sub, subSize = 48, subLead = 4, color, uid}) => {
  const autoId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  if (f === undefined || f0 === undefined) {
    const S0 = size ?? 40, H0 = h ?? 64;
    const W = w ?? Math.max(200, text.length * S0 + 120);
    return (
      <div style={{position: 'absolute', left: x ?? 360, top: y, width: W, height: H0, opacity: op, borderRadius: r ?? 10, boxSizing: 'border-box', border: '2px solid transparent', background: `linear-gradient(#1a0f08, #1a0f08) padding-box, ${RING_GRAD} border-box`, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: S0, lineHeight: `${H0 - 4}px`}}>
        <span style={(color ?? 'gold') === 'gold' ? GOLD_TEXT : {color: C.cream}}>{text}</span>
      </div>
    );
  }
  // 描框
  const S = size ?? 84, H = h ?? (sub ? Math.round(S + subSize + 28 + 2 * 36) : 120);
  const W = w ?? Math.max(480, text.length * S + 144);
  const X = x ?? 540 - W / 2, R = r ?? (H >= 300 ? 26 : 16);
  if (f < f0) return null;
  const p = rf(f, f0, dur, EASE.inOutC);
  const tip = p < 1 ? rrTopPoint(X, y, W, H, R, p) : null;
  const wordF = f0 + dur;
  const gid = uid ?? `fpg${autoId}`;
  const total = sub ? subSize + 28 + S : S;
  const top0 = y + (H - total) / 2;
  const mainStyle: React.CSSProperties = (color ?? 'cream') === 'gold' ? {...GOLD_TEXT, filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))'} : {color: C.cream, textShadow: SOFT_SHADOW};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: op, pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.goldHi2} /><stop offset="0.5" stopColor={C.gold} /><stop offset="1" stopColor={C.goldDark} />
          </linearGradient>
        </defs>
        <rect x={X} y={y} width={W} height={H} rx={R} fill="rgba(20,13,7,.38)" opacity={rf(f, wordF - 2, 6, EASE.lin)} />
        <path d={rrFromTop(X, y, W, H, R)} fill="none" stroke={`url(#${gid})`} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={p >= 1 ? 0 : 1 - p} style={{filter: 'drop-shadow(0 2px 6px rgba(20,12,6,.6))'}} />
        {tip && <Tip x={tip[0]} y={tip[1]} r={4} />}
      </svg>
      {sub && f >= wordF - subLead && (
        <div style={{position: 'absolute', left: X, width: W, top: top0, height: subSize, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: subSize, lineHeight: `${subSize}px`, whiteSpace: 'nowrap', filter: 'drop-shadow(0 2px 6px rgba(20,12,6,.7))'}}>
          <span style={{...blurIn(f, wordF - subLead, 6, 10, 12), ...GOLD_TEXT}}>{sub}</span>
        </div>
      )}
      {f >= wordF && (
        <div style={{position: 'absolute', left: X, width: W, top: sub ? top0 + subSize + 28 : top0, height: S, textAlign: 'center', fontFamily: FONT.song, fontWeight: 900, fontSize: S, lineHeight: `${S}px`, whiteSpace: 'nowrap'}}>
          <span style={{...blurIn(f, wordF, 6, 10, 12), ...mainStyle}}>{text}</span>
        </div>
      )}
    </div>
  );
};

/** 整屏实拍统一调色（SHOTBOOK 1.6 broll）+ 顶底压暗；topDark 给字压暗用（顶部 α → 0 @ topTo） */
export const BROLL_GRADE = 'saturate(.88) contrast(1.04) sepia(.12) brightness(.72)';
export const BrollFull: React.FC<{src: string; from: number; dur: number; startFrom?: number; scale: number; origin: string; topDark?: number; topTo?: number}> = ({src, from, dur, startFrom = 0, scale, origin, topDark = 0.5, topTo = 420}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
    <AbsoluteFill style={{transform: `scale(${scale.toFixed(5)})`, transformOrigin: origin}}>
      <Sequence from={from} durationInFrames={dur} layout="none">
        <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, filter: BROLL_GRADE}} />
      </Sequence>
    </AbsoluteFill>
    <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(20,13,7,${topDark}) 0px, rgba(20,13,7,${(topDark * 0.45).toFixed(3)}) ${Math.round(topTo * 0.55)}px, rgba(20,13,7,0) ${topTo}px, rgba(20,13,7,0) 1400px, rgba(20,13,7,.8) 1700px, rgba(20,13,7,.86) 1920px)`}} />
  </AbsoluteFill>
);

