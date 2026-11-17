import type {Cue} from '../sfx';
import {WF} from '../u';
import {DEMO_F} from './Scenes';

/**
 * ★ 音效表。{f: 文件开头那一帧（= 动作帧 − 峰值帧，峰值秒数写在 tools/make_sfx_clips.py 的用途栏）, file: public/audio/sfx/<file>.mp3, vol ≤0.35, dur 秒, note}
 * 规矩：只给真实的物理动作配真实录音；字出现 / 标注 / 字幕不配声；同一帧一条；20 秒 6–8 处；重点那几下尽量挪进句间停顿（落在说话中间会被人声盖住）。
 * 帧号从场景导出的动作常量算（像下面 DEMO_F），不手敲。
 */
export const SFX: Cue[] = [
  {f: WF('大家', 0) + 6, file: 'chime', vol: 0.18, dur: 1.3, note: '金粉扫过标题（样片返修时删过：开口就起、没有气口；Demo 里留着听个响）'},
  {f: DEMO_F.land - 7, file: 'keys', vol: 0.3, dur: 0.65, note: '吊坠落位（keys 峰值约 0.23s）'},
];
