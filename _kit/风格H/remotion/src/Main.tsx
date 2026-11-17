import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Host, hostRow} from './Host';
import {Scrims, liftAt} from './parts/Scrims';
import {Subtitles} from './parts/Subtitles';
import {TitlePlaque} from './parts/TitlePlaque';
import {Back, Over, Under} from './ep/Scenes';
import {CUES} from './sfx';
import {bgmVol, passSpan} from './bgm';
import {EP, END} from './ep/episode';
import {FPS, useF} from './u';

/**
 * 全片合成骨架（每期不用改这里，改 ep/）。层序：
 *   Back（人物下面：夜青幕底这类要被人物淡出露出来的）→ Host 人物满幅 → Under（人物上、压暗下：剪影图解下层）
 *   → 顶底压暗 Scrims → Over（场景主体：吊坠、卡片、整屏实拍、图解上层……整屏幕底的镜头自己铺满）→ 顶牌 → 字幕。
 * 声音：口播 + 配乐（EP.bgm.passes 多遍）+ 音效表（sfx.ts）。
 */
export const Main: React.FC = () => {
  const f = useF();
  const ty = hostRow(f)?.ty?.(f) ?? 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Audio src={staticFile(EP.files.narration)} />
      {EP.bgm.passes.map((_, k) => {
        const [from, dur] = passSpan(k, END);
        return (
          <Sequence key={'bgm' + k} from={from} durationInFrames={dur} layout="none">
            <Audio src={staticFile(EP.files.bgm)} volume={(fr) => bgmVol(fr + from, END, k)} />
          </Sequence>
        );
      })}
      {CUES.filter((c) => c.f < END).map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.f)} durationInFrames={Math.max(1, Math.round(c.dur * FPS))} layout="none">
          <Audio src={staticFile(`audio/sfx/${c.file}.mp3`)} volume={c.vol} />
        </Sequence>
      ))}
      <Back />
      <Host />
      <Under />
      <AbsoluteFill style={{transform: ty ? `translateY(${ty.toFixed(2)}px)` : undefined}}>
        <Scrims lift={liftAt(f)} />
      </AbsoluteFill>
      <Over />
      <TitlePlaque />
      <Subtitles />
    </AbsoluteFill>
  );
};
