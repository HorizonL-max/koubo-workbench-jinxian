import type {Cue} from './sfx';
import {S} from './shots';
import {P53_F, P54_F, P55_F, P57_ATTACH, P57_F} from './scenes/act3/Net3';
import {P58_CUTS, P58_F, P59_F} from './scenes/act3/P58_P59';
import {P60_F, P61_F} from './scenes/act3/P60_P61';
import {P62_F, P64_F} from './scenes/act3/P62_P64';

/**
 * 第三幕音效 #94–#126（SHOTBOOK 5.3 音效汇总）：全部 Freesound CC0 真实录音，tools/make_sfx_clips.py 裁好、峰值烘到 −6 dBFS。
 * f = 文件开头帧 = 动作帧 − 峰值在文件里的帧数：door 0、card 7、wood 2、drop 0、pencil 11、cloth 2、chime 3、brush 3、lyre/clink 0、bell 1、
 * spin 20、snip 2（新采样 fs:629513 剪刀，取第二下）。动作帧全部从场景导出的常量算。lyre 连用不升调、音量逐次略降。
 */
export const SFX_ACT3: Cue[] = [
  {f: P53_F.shatter, file: 'clink', vol: 0.14, dur: 0.29, note: '#94 P53 隔离圈碎了'},
  {f: P53_F.light - 3, file: 'chime', vol: 0.18, dur: 1.3, note: '#95 P53 一圈圈亮起来'},
  {f: P53_F.join + 10, file: 'lyre', vol: 0.16, dur: 0.51, note: '#96 P53 光点同时到中心'},
  {f: P54_F[0], file: 'drop', vol: 0.22, dur: 0.38, note: '#97 P54 观念点出'},
  {f: P54_F[1], file: 'drop', vol: 0.2, dur: 0.38, note: '#98 P54 情绪点出'},
  {f: P54_F[2], file: 'drop', vol: 0.2, dur: 0.38, note: '#99 P54 行为点出'},
  {f: P55_F.grow, file: 'lyre', vol: 0.13, dur: 0.51, note: '#100 P55 左簇亮'},
  {f: P55_F.env, file: 'lyre', vol: 0.12, dur: 0.51, note: '#101 P55 右簇亮'},
  {f: P55_F.gather + 4 - 3, file: 'chime', vol: 0.2, dur: 1.3, note: '#102 P55 网收成人形'},
  {f: P57_F.aware - 3, file: 'chime', vol: 0.16, dur: 1.3, note: '#103 P57 亮光漫开'},
  {f: P57_ATTACH + 10, file: 'clink', vol: 0.16, dur: 0.29, note: '#104 P57 线重新接上'},
  {f: P57_F.create - 3, file: 'brush', vol: 0.16, dur: 0.44, note: '#105 P57 新线'},
  {f: P57_F.fresh - 1, file: 'bell', vol: 0.14, dur: 1.2, note: '#106 P57 新星'},
  {f: S.P58.f0, file: 'door', vol: 0.24, dur: 0.95, note: '#107 P58 对开门滑开'},
  {f: P58_CUTS[0] - 2, file: 'snip', vol: 0.35, dur: 0.28, note: '#108 P58 剪第一根'}, // 返修：落进「是|摆」气口，音量提到上限
  {f: P58_CUTS[6] - 2, file: 'snip', vol: 0.26, dur: 0.28, note: '#109 P58 剪第七根'},
  {f: P58_CUTS[12] - 2, file: 'snip', vol: 0.26, dur: 0.28, note: '#110 P58 剪最后一根（13 根只配 3 下）'},
  {f: P58_F.drop, file: 'lyre', vol: 0.14, dur: 0.51, note: '#111 P58 线垂回来'},
  {f: P59_F.words[0] - 2, file: 'wood', vol: 0.16, dur: 0.2, note: '#112 P59 觉察翻进槽'},
  {f: P59_F.words[1] - 2, file: 'wood', vol: 0.14, dur: 0.2, note: '#113 P59 重新思考翻进槽'},
  {f: P59_F.words[2] + 6 - 2, file: 'wood', vol: 0.18, dur: 0.2, note: '#114 P59 属于自己的选择落定（back.out 过冲点）'},
  {f: P60_F.c1land - 7, file: 'card', vol: 0.28, dur: 0.28, note: '#115 P60 第一张牌落定'},
  {f: P60_F.c2land - 7, file: 'card', vol: 0.26, dur: 0.28, note: '#116 P60 第二张牌落定'},
  {f: P61_F.see, file: 'lyre', vol: 0.13, dur: 0.51, note: '#117 P61 吊坠升回去'},
  {f: P61_F.past, file: 'clink', vol: 0.12, dur: 0.29, note: '#118 P61 横杆画出、挂上'},
  {f: P61_F.anew + 4 - 1, file: 'bell', vol: 0.14, dur: 1.2, note: '#119 P61 指南针升起'},
  {f: P61_F.decide + 26 - 20, file: 'spin', vol: 0.22, dur: 0.745, note: '#120 P61 指针甩一圈落定（峰值对锁死帧）'},
  {f: P62_F.land, file: 'clink', vol: 0.16, dur: 0.29, note: '#121 P62 吊坠落位'},
  {f: P62_F.ask + 2 - 3, file: 'brush', vol: 0.18, dur: 0.44, note: '#122 P62 一笔圈住'},
  {f: S.P63.f0 - 2 + 2, file: 'cloth', vol: 0.12, dur: 0.33, note: '#123 P63 人收成头像'},
  {f: S.P63.f0 + 4, file: 'pencil', vol: 0.12, dur: 0.73, note: '#124 P63 描框'},
  {f: S.P64.f0, file: 'cloth', vol: 0.16, dur: 0.33, note: '#125 P64 头像放回满幅'},
  {f: P64_F.sweep - 3, file: 'chime', vol: 0.2, dur: 1.3, note: '#126 P64 金粉（片头同一条采样）'},
];
