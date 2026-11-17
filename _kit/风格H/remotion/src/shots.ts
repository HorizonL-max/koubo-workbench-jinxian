/**
 * 镜头表：读 ep/shots.json（tools/sb_build.py 生成的那份；格式同 _kit 各风格的 shots.json，每镜带 f:[f0,f1]、act、host、bg）。
 * 字幕纸面模式（bg === 'paper'）、配乐暗场 +2dB（bg 在 bgm.darkBgs 里）都按 bg 自动认。
 */
import raw from './ep/shots.json';

export type Shot = {id: string; f0: number; f1: number; act: number; host: string; bg: string};
type RawShot = {id: string; f: [number, number]; act?: number; host: string; bg: string};
export const SHOTS: Shot[] = ((raw as unknown as {shots: RawShot[]}).shots).map((s) => ({id: s.id, f0: s.f[0], f1: s.f[1], act: s.act ?? 1, host: s.host, bg: s.bg}));
/** S.P07.f0 这样取 */
export const S: Record<string, Shot> = Object.fromEntries(SHOTS.map((s) => [s.id, s]));
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.f0 && f < s.f1);
export const inShot = (f: number, id: string) => !!S[id] && f >= S[id].f0 && f < S[id].f1;
