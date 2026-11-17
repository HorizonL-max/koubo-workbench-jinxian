import type {Cue} from '../parts/Subtitles';
import CUES_JSON from './cues.json';

/**
 * ★ 字幕分条。默认读 tools/sb_build.py 导出的 cues.json（分镜阶段写在 sb_data.py 的 CUES 表里，脚本核过「拼起来 = 口播原文」）；
 * 要手改就直接在这里改数组。{zh, en, near(该条入点秒附近，查字用), hl?(强调词，一条最多一个), hlNear?(强调词晚亮), up?(升格：中文让位给画面大字，英文留着), end?(出点上限帧)}
 * 一条最多 13 个字（14–15 字自动降到 54 号）；英文 ≤44 字符；不带标点。
 */
export const CUES: Cue[] = CUES_JSON as Cue[];
