import {ALL, clamp01, FPS} from './u';
import {shotAt} from './shots';
import {EP} from './ep/episode';

/**
 * 配乐电平（参数在 ep/episode.ts 的 EP.bgm）：
 * - 人声在时 base（0.035，比人声低约 18dB）；字间气口 >0.4s 抬 3dB；darkBgs 幕底（夜青 / 檀棕图解）+2dB；extraUp 区间再 +2dB；抬升都 20 帧平滑。
 * - 多遍：曲子比片子短时，passes 里每一遍都从曲子开头起（第二遍放在章节卡），上一遍在句子说完的气口 fadeOut。
 * - 口播最后一个字之后（片尾尾巴）抬 4dB，再在最后 45 帧收掉。
 */
const B = EP.bgm;
const SPOKEN = ALL.filter((c) => c.e > c.t);
const LAST_T = SPOKEN.length ? SPOKEN[SPOKEN.length - 1].e : 0;
const GAPS: [number, number][] = (() => {
  const g: [number, number][] = [];
  for (let i = 1; i < SPOKEN.length; i++) if (SPOKEN[i].t - SPOKEN[i - 1].e > 0.4) g.push([SPOKEN[i - 1].e, SPOKEN[i].t]);
  return g;
})();
const darkAt = (f: number) => {
  const s = shotAt(f);
  return (s && B.darkBgs.includes(s.bg)) || B.extraUp.some(([a, b]) => f >= a && f < b) ? 1 : 0;
};
const darkSmooth = (f: number) => {
  let s = 0;
  for (let k = -10; k <= 10; k++) s += darkAt(f + k);
  return s / 21;
};
/** 第 k 遍在合成帧 f 的音量 */
export const bgmVol = (f: number, end: number, k: number) => {
  const p = B.passes[k];
  const t = f / FPS;
  let up = 0;
  for (const [a, b] of GAPS) {
    if (t < a - 0.1 || t > b + 0.1) continue;
    up = Math.max(up, Math.min(clamp01((t - a) / 0.25), clamp01((b - t) / 0.2)));
  }
  const tail = EP.tail > 0 ? clamp01((t - LAST_T - 0.1) / 0.5) : 0;
  const gain = Math.pow(10, (3 * Math.max(up, tail) + 1 * tail + 2 * darkSmooth(f)) / 20);
  const fout = 1 - clamp01((f - (end - 45)) / 45);
  const fin = k === 0 && p.fadeIn === undefined ? clamp01((f - p.at) / (0.5 * FPS)) : clamp01((f - p.at) / (p.fadeIn ?? 6));
  const fo = p.fadeOut ? 1 - clamp01((f - p.fadeOut[0]) / (p.fadeOut[1] - p.fadeOut[0])) : 1;
  return B.base * gain * fin * fo * fout;
};
/** 第 k 遍的 Sequence 区间 [from, durationInFrames] */
export const passSpan = (k: number, end: number): [number, number] => {
  const p = B.passes[k];
  const stop = p.fadeOut ? Math.min(end, p.fadeOut[1] + 1) : end;
  return [p.at, Math.max(1, stop - p.at)];
};
