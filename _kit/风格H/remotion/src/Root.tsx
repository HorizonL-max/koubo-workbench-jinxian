import React from 'react';
import {Composition, Sequence} from 'remotion';
import {Main} from './Main';
import {END} from './ep/episode';
import {StructParts, STRUCT_END} from './StructParts';

/**
 * 竖屏 1080×1920 @30。Main = 全片（时长 = EP.hostFrames + EP.tail）。
 * 片尾有尾巴时在这里写一行注释给 preflight：preflight: host-tail=<EP.tail>
 * 分幕草稿：照 ActDraft 的写法加（<Sequence from={-起始帧}><Main/></Sequence>，帧号和音轨都和 Main 一致；
 * postcheck / qa 的镜头表也要平移到本地时间轴）。
 */
const actDraft = (from: number): React.FC => () => (
  <Sequence from={-from} layout="none">
    <Main />
  </Sequence>
);
const ActDraftDemo = actDraft(121);
export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={END} fps={30} width={1080} height={1920} />
    {/* 示例：从 f121 起的草稿（新一期改成各幕的起点和帧数） */}
    <Composition id="ActDraftDemo" component={ActDraftDemo} durationInFrames={END - 121} fps={30} width={1080} height={1920} />
    {/* 结构件冒烟（C11 C15 C16 C17/C29 C18 C20，假帧号，不接 timing、没有音轨）：出拼图见 StructParts.tsx 顶部注释 */}
    <Composition id="StructParts" component={StructParts} durationInFrames={STRUCT_END} fps={30} width={1080} height={1920} />
  </>
);
