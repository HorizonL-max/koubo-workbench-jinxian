import {useCurrentFrame} from 'remotion';
import timingData from './ep/timing.json';

// 公用件：时间全部用成片绝对秒 / 绝对帧；词锚一律从 ep/timing.json 查（禁止手敲秒数）。timing.json 由 talkcraft make_timing 从期目录 timestamps.json 出
export const FPS = 30;
type Char = {ch: string; t: number; e: number};
type Scene = {id: string; text: string; startSec: number; durationSec: number; chars: Char[]};
export const timing = timingData as {totalSec: number; scenes: Scene[]};
export const ALL: Char[] = timing.scenes.flatMap((s) => s.chars);
/** 不含标点的字序列（timing.json 里带标点；字幕、词锚都按去标点后的字找，跨逗号的分条也能找到） */
const PUNCT = /[，。、？！：；,.?!:;“”"'（）()…—\s]/;
const NPI: number[] = ALL.map((c, i) => (PUNCT.test(c.ch) ? -1 : i)).filter((i) => i >= 0);
export const TXTN = NPI.map((i) => ALL[i].ch).join('');

/** near 秒附近（之后）第一次出现的 word：返回它每个字在 ALL 里的下标 */
export const findChars = (word: string, near: number): number[] => {
  const w = word.replace(new RegExp(PUNCT.source, 'g'), '');
  let k = TXTN.indexOf(w);
  while (k >= 0 && ALL[NPI[k]].t < near - 0.3) k = TXTN.indexOf(w, k + 1);
  if (k < 0) throw new Error(`anchor not found after ${near}: ${word}`);
  if (ALL[NPI[k]].t - near > 8) throw new Error(`anchor too far: ${word} @${ALL[NPI[k]].t} (near ${near})`);
  return w.split('').map((_, j) => NPI[k + j]);
};
/** near 秒附近（之后）第一次出现的 word 的开口时刻（秒） */
export const W = (word: string, near: number): number => ALL[findChars(word, near)[0]].t;
/** word 末字结束时刻（秒） */
export const WE = (word: string, near: number): number => {
  const ix = findChars(word, near);
  return ALL[ix[ix.length - 1]].e;
};
/** 秒 → 帧（与 Sequence 同规则取整） */
export const F = (sec: number) => Math.round(sec * FPS);
/** 词锚帧 */
export const WF = (word: string, near: number) => F(W(word, near));
/** 一句话里逐字的开口帧（字随声出用；跳过标点） */
export const charFrames = (text: string, near: number): number[] => findChars(text, near).map((i) => F(ALL[i].t));

export const useF = () => useCurrentFrame();

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const ax = 1 - 3 * x2 + 3 * x1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
  const ay = 1 - 3 * y2 + 3 * y1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const solve = (x: number) => {
    let lo = 0, hi = 1, u = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return u;
  };
  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sy(solve(t)));
};
export const EASE = {
  out: bezier(0.22, 1, 0.36, 1), // blur-slide 的 quint-out 级
  demote: bezier(0.6, 0, 0.18, 1), // title-demote-to-label
  flip: bezier(0.55, 0, 0.3, 1), // card-flip-reveal
  iris: bezier(0.62, 0, 0.32, 1), // circle-match-iris
  inOutC: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outC: (x: number) => 1 - Math.pow(1 - x, 3),
  inC: (x: number) => x * x * x,
  inQ: (x: number) => x * x,
  lin: (x: number) => x,
};
/** 帧 f 在 [f0, f0+dur] 归一化后过缓动 */
export const rf = (f: number, f0: number, dur: number, ease: (x: number) => number = EASE.out) => ease(clamp01((f - f0) / Math.max(1e-6, dur)));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** 确定性伪随机 */
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** 阻尼弹簧位移 0→1（帧制，damping 越大越稳） */
export const spring01 = (f: number, f0: number, damping = 15, stiffness = 170) => {
  const x = (f - f0) / FPS;
  if (x <= 0) return 0;
  const w0 = Math.sqrt(stiffness), z = damping / (2 * Math.sqrt(stiffness));
  if (z >= 1) return 1 - Math.exp(-w0 * x) * (1 + w0 * x);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + ((z * w0) / wd) * Math.sin(wd * x));
};
/** 落定后数值归零：避免 1.0000001 这类小数缩放让文字逐帧微抖（Q5） */
export const snap = (v: number, target: number, eps = 1e-3) => (Math.abs(v - target) < eps ? target : v);
export const px = (v: number) => Math.round(v * 2) / 2;
