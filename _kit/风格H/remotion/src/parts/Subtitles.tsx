import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SOFT_SHADOW} from '../theme';
import {ALL, F, findChars, timing, useF} from '../u';
import {shotAt} from '../shots';
import {CUES as EP_CUES} from '../ep/cues';
import {VENUE} from '../venue';

/**
 * C02 金线字幕带（全片在，位置固定 x 130–950 / y 1250–1400）：中文一行 + 英文一行。
 * 素排：整条硬现硬走、不带标点；强调词只换颜色，一条最多一个。
 * 入点 = 首字起点 −2 帧；出点 = min(下一条入点, 末字结束 +0.25s)。
 * 升格（up: true）：中文让位给画面上的大字，英文留在字幕带里，上面那根金线隐去。
 * 字幕托 α 读场地预设 subtitle.plate_alpha（按白 T 恤上实测字背亮度定，要求 Y ≤ 95）。
 * 纸面模式：当前帧所在镜头 bg === 'paper' 时托板不要、金线留着；中文墨色、强调深金、英文淡墨，不加影。
 * 字幕表在 ep/cues.ts（默认读 sb_build 导出的 ep/cues.json）。
 */
export type Cue = {zh: string; en: string; near: number; hl?: string; hlNear?: number; up?: boolean; end?: number /* 返修：出点上限（帧） */};
export const CUES: Cue[] = EP_CUES;

type Line = Cue & {f0: number; f1: number; hlF: number};
export const LINES: Line[] = (() => {
  const raw = CUES.map((c) => {
    const ix = findChars(c.zh, c.near);
    const t0 = ALL[ix[0]].t, t1 = ALL[ix[ix.length - 1]].e;
    return {c, ix, f0: F(t0) - 2, end: F(t1 + 0.25)};
  });
  return raw.map((r, k) => ({
    ...r.c,
    f0: r.f0,
    // 返修：和下一条只隔 ≤8 帧时延到下一条入点（托板一直在，1–8 帧的「空托板」会闪）
    f1: Math.min(r.c.end ?? Infinity, k + 1 < raw.length && raw[k + 1].f0 - r.end <= 8 ? raw[k + 1].f0 : Math.min(k + 1 < raw.length ? raw[k + 1].f0 : Infinity, r.end)),
    hlF: r.c.hlNear !== undefined ? F(ALL[r.ix[r.c.zh.indexOf(r.c.hl!)]].t) : -1,
  }));
})();

/** 字幕托不透明度：场地预设（白 T 恤上实测后定） */
export const PLATE_ALPHA = VENUE.subtitle.plate_alpha;
const lineAt = (f: number) => LINES.find((l) => f >= l.f0 && f < l.f1);
/** 升格期间（中文让位）：给场景查 */
export const upgradedAt = (f: number) => !!lineAt(f)?.up;

const ZhLine: React.FC<{l: Line; f: number; paper: boolean}> = ({l, f, paper}) => {
  const size = l.zh.length >= 14 ? 54 : 58;
  const hlOn = l.hl && (l.hlF < 0 || f >= l.hlF);
  let body: React.ReactNode = l.zh;
  if (hlOn) {
    const k = l.zh.indexOf(l.hl!);
    body = (
      <>
        {l.zh.slice(0, k)}
        <span style={{color: paper ? C.goldDeep : C.goldHi}}>{l.hl}</span>
        {l.zh.slice(k + l.hl!.length)}
      </>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: 1271 + (58 - size) / 2, height: size + 6, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: size, lineHeight: `${size + 6}px`, color: paper ? C.ink : C.cream, textShadow: paper ? 'none' : SOFT_SHADOW, letterSpacing: 1, whiteSpace: 'nowrap'}}>
      {body}
    </div>
  );
};

export const Subtitles: React.FC = () => {
  const f = useF();
  const l = lineAt(f);
  const up = !!l?.up;
  const paper = shotAt(f)?.bg === 'paper';
  const hair = (y: number): React.CSSProperties => ({position: 'absolute', left: 190, width: 700, top: y - 0.75, height: 1.5, background: `linear-gradient(90deg, rgba(201,160,99,0) 0%, rgba(201,160,99,.6) 18%, rgba(201,160,99,.6) 82%, rgba(201,160,99,0) 100%)`});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 托板：圆角 18、羽化、左右 90px 渐隐 */}
      <div
        style={{
          position: 'absolute', left: 130, top: 1250, width: 820, height: 150, borderRadius: 18,
          background: `rgba(20,13,7,${paper ? 0 : PLATE_ALPHA})`, filter: 'blur(10px)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0px, #000 90px, #000 730px, transparent 820px)',
          maskImage: 'linear-gradient(90deg, transparent 0px, #000 90px, #000 730px, transparent 820px)',
        }}
      />
      {!up && <div style={hair(1250)} />}
      <div style={hair(1400)} />
      {l && !up && <ZhLine l={l} f={f} paper={paper} />}
      {l && (
        <div style={{position: 'absolute', left: 0, width: 1080, top: 1348, height: 42, textAlign: 'center', fontFamily: FONT.en, fontSize: 34, lineHeight: '42px', color: paper ? C.ink2 : 'rgba(255,246,230,.86)', textShadow: paper ? 'none' : SOFT_SHADOW, whiteSpace: 'nowrap'}}>
          {l.en}
        </div>
      )}
    </AbsoluteFill>
  );
};
export {timing};
