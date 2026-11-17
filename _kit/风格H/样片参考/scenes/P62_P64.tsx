import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../../theme';
import {charFrames, clamp01, EASE, mix, rand, rf, WF} from '../../u';
import {S} from '../../shots';
import {Pendant, PendantSpec} from '../../parts/Pendant';
import {Avatar} from '../../parts/Avatar';
import {BX, BY, L2DY, SMALL, TAKEOVER, TITLE} from '../../parts/TitlePlaque';
import {BrollFull} from '../act1/P16_P20';

/* ═════════ P62 一枚空白吊坠停住：先问一问（C05 回扣，全片最后一枚 + talkcraft hand-drawn-ellipse） ═════════
 * 中景原幅。头顶落点 (540,372) d184，徽章面是空白纸卡 + 一圈细金线；吊牌挂右侧：小字「必须要」+ 主词「做出某件事情」（38 号，按字出）。
 * 「当你觉得」线垂下；「必须要」徽章顺线滑到位起摆（2.6° 阻尼摆）；「问一问」2 帧内停死（之后连微摆都没有）、
 * 外圈细金环向外扩一次（r92→150，14 帧淡出），一笔金线逆时针把「必须要」圈起来（1.08 圈、3.2px、15 帧），圈完隔 2 帧那三个字顿一下。 */
export const P62_F = {thread: WF('当你觉得', 330.4), land: WF('必须要', 331.9), what: WF('做出某件事情', 332.4), ask: WF('问一问', 334.6)};
const WHAT_F = charFrames('做出某件事情', 332.4);
const BLANK = (f: number, inner: number) => (
  <svg width={inner} height={inner} style={{position: 'absolute', left: 0, top: 0}}>
    <circle cx={inner / 2} cy={inner / 2} r={inner / 2 - 16} fill="none" stroke={C.gold} strokeOpacity={0.75} strokeWidth={1.5} />
  </svg>
);
export const P62_SPEC: PendantSpec = {
  id: 'blank', cx: 540, cy: 372, d: 184, phase: 1.3, threadF: P62_F.thread, slideF: P62_F.land - 14, landF: P62_F.land,
  front: {art: BLANK},
  tag: {side: 'right', unfoldF: P62_F.land + 2, small: '必须要', smallF: P62_F.land + 2, main: '做出某件事情', mainCharF: WHAT_F, mainSize: 34, emphSmall: true},
  still: P62_F.ask,
};
/** 「必须要」在画布上的位置。返修（审片 P1-7：圈咬住下一行、手机上看不见）：吊牌两行主次对调后，左缘 = 540+92+28，宽 = max(6×34, 3×48)+36 = 240，
 *  高 130 → 顶 307；上行 48 号中心 y = 307+12+26 = 345；圈改深金 4px，rx 86 / ry 29（含 1.09 抖动后上下离字 ≥8px，不碰下行） */
const RING = {cx: 540 + 92 + 28 + 120, cy: 345, rx: 86, ry: 29};
const ELL = (() => {
  const N = 60, pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = -Math.PI * 0.15 - u * Math.PI * 2 * 1.08; // 逆时针 1.08 圈，起笔收笔交叉
    const w = 1 + 0.05 * Math.sin(u * 7.1) + 0.04 * u;
    pts.push(`${(RING.cx + RING.rx * w * Math.cos(a)).toFixed(1)},${(RING.cy + RING.ry * w * Math.sin(a) - 3 * u).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
})();
export const P62: React.FC<{f: number}> = ({f}) => {
  const sh = S.P62;
  if (f < sh.f0 || f >= sh.f1) return null;
  const ring = rf(f, P62_F.ask, 14, EASE.outC);
  const ell = rf(f, P62_F.ask + 2, 15, EASE.inOutC);
  const pulseF = P62_F.ask + 2 + 15 + 2;
  const pulse = f >= pulseF && f < pulseF + 8 ? 1 + 0.06 * Math.sin((Math.PI * (f - pulseF)) / 8) : 1;
  return (
    <AbsoluteFill>
      <Pendant s={P62_SPEC} f={f} fx={{hidden: false, desat: 0}} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {f >= P62_F.ask && ring < 1 && <circle cx={540} cy={372} r={mix(92, 150, ring)} fill="none" stroke={C.goldHi2} strokeWidth={2} opacity={0.8 * (1 - ring)} />}
        {ell > 0 && (
          <g transform={pulse !== 1 ? `translate(${RING.cx} ${RING.cy}) scale(${pulse.toFixed(4)}) translate(${-RING.cx} ${-RING.cy})` : undefined}>
            <path d={ELL} fill="none" stroke={C.goldDeep} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={ell >= 1 ? 0 : 1 - ell} style={{filter: 'drop-shadow(0 1px 3px rgba(20,12,6,.5))'}} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ═════════ P63 金句卡（实拍 + 小头像；C20 = C07 玻璃字框 + C04 字随声出） ═════════
 * 实拍 b10（Mixkit 3977 晨光透过窗帘，暖、亮、慢）1.04→1.00；f10101 近景满幅收成头像（12 帧）；镜尾 [f1, f1+10) 放回满幅。
 * 玻璃框 x110–970、y500–980 描一圈（24 帧带笔头），描完框里才起模糊和暗底；四行跟着嘴出：
 * 「这是我真正想要的」Black 92（「真正想要」亮金）/「还是」Bold 52 /「我一直以为自己」Bold 72 /「应该这样做的」Black 92（「应该」空心描边 2.5px）。
 * 升格（c182–c184 中文让位）。框和字在 f10316–10322 6 帧淡掉。 */
const FR = {x: 110, y: 500, w: 860, h: 480, r: 26, f0: S.P63.f0 + 4, dur: 24};
const LINES = [
  {t: '这是我真正想要的', near: 336.9, size: 92, w: 900, top: 548, gold: [3, 4, 5, 6]},
  {t: '还是', near: 339.2, size: 52, w: 700, top: 672},
  {t: '我一直以为自己', near: 339.6, size: 72, w: 700, top: 752},
  {t: '应该这样做的', near: 341.3, size: 92, w: 900, top: 848, hollow: [0, 1]},
].map((l) => ({...l, frames: charFrames(l.t, l.near)}));
export const P63_F = {first: LINES[0].frames[0]};
/** 定稿后返修：小头像圆里近景 → 中景的交叉淡化起点（8 帧，淡完后停 6 帧再放大） */
export const P63_TO_MS = S.P63.f1 - 14;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
const perim = 2 * (FR.w + FR.h - 4 * FR.r) + 2 * Math.PI * FR.r;
const tipAt = (p: number): [number, number] => {
  let d = p * perim;
  const R = FR.r;
  const segs: [number, (u: number) => [number, number]][] = [
    [FR.w - 2 * R, (u) => [FR.x + R + u, FR.y]],
    [(Math.PI * R) / 2, (u) => { const a = -Math.PI / 2 + u / R; return [FR.x + FR.w - R + R * Math.cos(a), FR.y + R + R * Math.sin(a)]; }],
    [FR.h - 2 * R, (u) => [FR.x + FR.w, FR.y + R + u]],
    [(Math.PI * R) / 2, (u) => { const a = u / R; return [FR.x + FR.w - R + R * Math.cos(a), FR.y + FR.h - R + R * Math.sin(a)]; }],
    [FR.w - 2 * R, (u) => [FR.x + FR.w - R - u, FR.y + FR.h]],
    [(Math.PI * R) / 2, (u) => { const a = Math.PI / 2 + u / R; return [FR.x + R + R * Math.cos(a), FR.y + FR.h - R + R * Math.sin(a)]; }],
    [FR.h - 2 * R, (u) => [FR.x, FR.y + FR.h - R - u]],
    [(Math.PI * R) / 2, (u) => { const a = Math.PI + u / R; return [FR.x + R + R * Math.cos(a), FR.y + R + R * Math.sin(a)]; }],
  ];
  for (const [len, fn] of segs) {
    if (d <= len) return fn(d);
    d -= len;
  }
  return [FR.x + R, FR.y];
};
export const P63: React.FC<{f: number}> = ({f}) => {
  const sh = S.P63;
  if (f < sh.f0 || f >= sh.f1 + 10) return null;
  const sc = mix(1.04, 1.0, clamp01((f - sh.f0) / (sh.f1 - sh.f0)));
  const out = 1 - rf(f, sh.f1 - 6, 6, EASE.lin);
  const fp = rf(f, FR.f0, FR.dur, EASE.inOutC);
  const closed = f >= FR.f0 + FR.dur;
  const glass = rf(f, FR.f0 + FR.dur, 6, EASE.outC);
  const tip = tipAt(fp);
  return (
    <AbsoluteFill>
      {/* 统一调色（brightness .72）把晨光压成了暗棕：这一镜整体再提 1.3 倍，留住「清晨的亮」（顶底压暗一起提，字幕托不受影响） */}
      <AbsoluteFill style={{filter: 'brightness(1.3) saturate(1.06)'}}>
        <BrollFull src="broll/b10_window.mp4" from={sh.f0} dur={sh.f1 + 10 - sh.f0} scale={sc} origin="540px 900px" topDark={0.6} topTo={520} />
      </AbsoluteFill>
      {/* 定稿后返修（用户：最后一个镜头用正面）：放大前 14 帧圆里先 8 帧交叉淡化成中景，再放回成中景满幅，接 P64 FULL_MS */}
      <Avatar f={f} f0={sh.f0} f1={sh.f1} enter="shrink" exit="expand" toMs={P63_TO_MS} />
      {out > 0 && (
        <AbsoluteFill style={{opacity: out}}>
          {glass > 0 && <div style={{position: 'absolute', left: FR.x, top: FR.y, width: FR.w, height: FR.h, borderRadius: FR.r, overflow: 'hidden', opacity: glass, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'rgba(20,13,7,.5)'}} />}
          {f >= FR.f0 && (
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
              <path d={rr(FR.x, FR.y, FR.w, FR.h, FR.r)} fill="none" stroke={C.cream} strokeOpacity={0.9} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={closed ? 0 : 1 - fp} />
              {!closed && (
                <g transform={`translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)})`}>
                  <circle r={11} fill={C.cream} opacity={0.3} />
                  <circle r={4.5} fill="#fff" />
                </g>
              )}
            </svg>
          )}
          {closed && LINES.map((l, k) => (
            <div key={k} style={{position: 'absolute', left: 0, width: 1080, top: l.top, height: l.size + 8, lineHeight: `${l.size + 8}px`, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: l.w, fontSize: l.size}}>
              {l.t.split('').map((ch, i) => {
                const p = rf(f, Math.max(l.frames[i], FR.f0 + FR.dur), 8, EASE.out);
                const gold = l.gold?.includes(i);
                const hollow = l.hollow?.includes(i);
                const b = (1 - p) * 14;
                const style: React.CSSProperties = gold
                  ? {...GOLD_TEXT}
                  : hollow
                    ? {color: 'rgba(32,22,14,.92)', WebkitTextStroke: `5px ${C.cream}`, paintOrder: 'stroke fill', textShadow: 'none'} /* 返修：空心字内部笔画交叠处的描边线用暗填充盖掉（stroke 在下，露出约 2.5px） */
                    : {color: C.cream, textShadow: SOFT_SHADOW};
                const filt = [b > 0.01 ? `blur(${b.toFixed(2)}px)` : '', gold || hollow ? 'drop-shadow(0 2px 8px rgba(20,12,6,.7))' : ''].filter(Boolean).join(' ');
                return (
                  <span key={i} style={{display: 'inline-block', opacity: p, transform: p < 1 ? `translateY(${((1 - p) * 0.3 * l.size).toFixed(2)}px)` : undefined, ...style, filter: filt || undefined}}>
                    {ch}
                  </span>
                );
              })}
            </div>
          ))}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* ═════════ P64 片尾：顶牌升回大标题，金粉带走「你以为」（C21 放 + title-demote-to-label 倒放 + C03 回扣） ═════════
 * 头像在 [10322, 10332) 放回满幅（P63 画）。「就是从」f10379 起：顶牌托板和竖金条 8 帧淡掉，两行字以左上为原点从 0.4375 倍连续放大回 1 倍、
 * 移到 (72,234)，26 帧，P01 降格那条曲线倒着走（同一条 bezier(.6,0,.18,1)，时间反过来）。之后金粉团沿第一行从 x=40 扫到 300（18 帧）：
 * 「你以为」三个字被扫到时碎成金粉向右上飘散、熄灭；第二行不动。顶牌从 TAKEOVER 起由这里画（TitlePlaque 让出）。 */
// 返修（审片 P1-2：站稳到开扫只有 0.27s、「你以为」10 帧就没、尾巴 0.37s，多数人会错过）：
// 升回 f10354–10380 → 两行标题静止 1s → f10410 起扫 26 帧（落在「开始」和「好」之间的气口）；三个字逐个碎（各 8 帧、错峰约 7 帧）；
// 金粉 96→180 粒、粒径 ×1.5、只用最亮两档金；扫完主行「自己在决定人生」胀一下 1→1.04→1（14 帧）；口播后合成延长 1.5s 尾巴。
const PROMO = {f0: TAKEOVER, dur: 26};
export const P64_F = {sweep: 10410};
const SWEEP = {f0: P64_F.sweep, dur: 26, x0: 40, x1: 300, y: BY + 32};
const PULSE_F = SWEEP.f0 + SWEEP.dur + 2;
const L1_CX = [0, 1, 2].map((k) => BX + (64 + 4.5) * (k + 0.5)); // 第一行三个字的中心（64 号 + 字距 4.5）
const sweepX = (f: number) => mix(SWEEP.x0, SWEEP.x1, clamp01((f - SWEEP.f0) / SWEEP.dur));
const CHAR_GONE = L1_CX.map((cx) => {
  for (let f = SWEEP.f0; f <= SWEEP.f0 + SWEEP.dur; f += 0.25) if (sweepX(f) >= cx) return f;
  return SWEEP.f0 + SWEEP.dur;
});
const COLS = ['#fff1d0', '#ffe9bf'];
const DUST = Array.from({length: 180}, (_, i) => {
  const k = i % 3;
  const s = CHAR_GONE[k] + rand(i * 2.7) * 8;
  return {
    s, life: 16 + rand(i * 7.1) * 14, x: L1_CX[k] + (rand(i * 1.9) - 0.5) * 64, y: BY + 6 + rand(i * 3.3) * 56,
    vx: 1.5 + rand(i * 4.4) * 3.5, vy: -(0.6 + rand(i * 5.5) * 2.2), r: 2.1 + rand(i * 6.6) * 4.5, c: COLS[Math.floor(rand(i * 8.8) * 2)], star: rand(i * 9.9) < 0.14,
  };
});
export const P64Title: React.FC<{f: number}> = ({f}) => {
  if (f < TAKEOVER || f >= S.P64.f1) return null;
  const plate = 1 - rf(f, PROMO.f0, 8, EASE.lin);
  const dem = EASE.demote(1 - clamp01((f - PROMO.f0) / PROMO.dur)); // 1 = 顶牌 → 0 = 大标题
  const s = mix(1, SMALL.s, dem);
  const tx = mix(BX, SMALL.x, dem), ty = mix(BY, SMALL.y, dem);
  const headOp = f < SWEEP.f0 ? 0 : f <= SWEEP.f0 + SWEEP.dur ? Math.min(1, (f - SWEEP.f0) / 3) : 1 - clamp01((f - SWEEP.f0 - SWEEP.dur) / 6);
  const pulse = f >= PULSE_F && f < PULSE_F + 14 ? 1 + 0.04 * Math.sin((Math.PI * (f - PULSE_F)) / 14) : 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 返修：大标题压在木书架上 → 升回时左上一块柔和压暗（同片头 P01） */}
      {dem < 1 && <div style={{position: 'absolute', left: -120, top: 120, width: 1040, height: 400, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(20,13,7,.62) 0%, rgba(20,13,7,.45) 55%, rgba(20,13,7,0) 100%)', opacity: 1 - dem}} />}
      {plate > 0 && (
        <>
          <div style={{position: 'absolute', left: 64, top: 168, width: 360, height: 102, borderRadius: 10, background: 'rgba(20,13,7,.72)', boxShadow: '0 0 6px 2px rgba(20,13,7,.5)', opacity: plate}} />
          <div style={{position: 'absolute', left: 64, top: 172, width: 6, height: 94, background: `linear-gradient(180deg, ${C.goldHi2}, ${C.gold} 60%, ${C.goldDark})`, opacity: plate}} />
        </>
      )}
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', fontFamily: FONT.song, fontWeight: 700, fontSize: 64, lineHeight: '64px', letterSpacing: 4.5, color: C.cream, textShadow: SOFT_SHADOW}}>
          {TITLE.l1.split('').map((ch, k) => {
            const g = clamp01((f - CHAR_GONE[k]) / 8);
            return (
              <span key={k} style={{display: 'inline-block', opacity: 1 - g, filter: g > 0 ? `blur(${(g * 8).toFixed(2)}px)` : undefined, transform: g > 0 ? `translate(${(g * 10).toFixed(1)}px, ${(-g * 6).toFixed(1)}px)` : undefined}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 0, top: L2DY, whiteSpace: 'nowrap', display: 'flex', filter: 'drop-shadow(0 2px 8px rgba(20,12,6,.7))', transformOrigin: '0 50%', transform: pulse !== 1 ? `scale(${pulse.toFixed(4)})` : undefined}}>
          {TITLE.l2.split('').map((ch, k) => (
            <span key={k} style={{display: 'inline-block', width: 104, fontFamily: FONT.song, fontWeight: 900, fontSize: 104, lineHeight: '104px', ...GOLD_TEXT}}>{ch}</span>
          ))}
        </div>
      </div>
      {f >= SWEEP.f0 && f < SWEEP.f0 + SWEEP.dur + 50 && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id="p64Head">
              <stop offset="0%" stopColor="#fff1d0" stopOpacity={0.95} />
              <stop offset="35%" stopColor="#e9c58a" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#c9a063" stopOpacity={0} />
            </radialGradient>
          </defs>
          {headOp > 0 && <circle cx={sweepX(f)} cy={SWEEP.y} r={70} fill="url(#p64Head)" opacity={headOp} />}
          {DUST.map((d, i) => {
            const a = f - d.s;
            if (a < 0 || a > d.life) return null;
            const u = a / d.life;
            const x = d.x + d.vx * a, y = d.y + d.vy * a;
            const op = (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85) * 0.95;
            const r = d.r * (1 - u * 0.5);
            if (d.star) {
              const L = r * 3.2;
              return (
                <g key={i} opacity={op} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                  <rect x={-L} y={-0.6} width={2 * L} height={1.2} fill={d.c} />
                  <rect x={-0.6} y={-L} width={1.2} height={2 * L} fill={d.c} />
                </g>
              );
            }
            return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill={d.c} opacity={op} />;
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
};
