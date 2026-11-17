/**
 * 音效表：ep/sfx.ts 的 SFX（按帧排序），再套 ep/sfx_edit.json 的「少而准」修改（tools/sfx_thin.py 按 sfx_check 分级生成：
 * {"<note>|<同 note 第几条>": {"drop": true} | {"shift": 帧}}；清空成 {} 就回到原表）。
 * 全部 Freesound 真实录音（CC0），tools/make_sfx_clips.py 裁好、峰值烘到 −6 dBFS；f = 文件开头那一帧（已按峰值对齐动作）。
 */
export type Cue = {f: number; file: string; vol: number; dur: number; note: string};
import {SFX} from './ep/sfx';
import SFX_EDIT from './ep/sfx_edit.json';
export const CUES_RAW: Cue[] = [...SFX].sort((a, b) => a.f - b.f);
const EDIT = SFX_EDIT as Record<string, {drop?: boolean; shift?: number}>;
export const CUES: Cue[] = (() => {
  const seen: Record<string, number> = {};
  const out: Cue[] = [];
  for (const c of CUES_RAW) {
    const k = seen[c.note] ?? 0;
    seen[c.note] = k + 1;
    const e = EDIT[`${c.note}|${k}`];
    if (e?.drop) continue;
    out.push(e?.shift ? {...c, f: c.f + e.shift, note: `${c.note}（挪 ${e.shift > 0 ? '+' : ''}${e.shift} 帧进气口）`} : c);
  }
  return out.sort((a, b) => a.f - b.f);
})();
