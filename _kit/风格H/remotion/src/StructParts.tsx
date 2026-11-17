import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useF} from './u';
import {NightBackdrop} from './parts/NightBackdrop';
import {UmberBackdrop, PaperBackdrop} from './parts/Backdrops';
import {ChapterCard} from './parts/ChapterCard';
import {ConceptPlaque} from './parts/ConceptPlaque';
import {QuoteSlip} from './parts/QuoteSlip';
import {FramePlaque} from './parts/kit';
import {TwoAnswers} from './parts/TwoAnswers';
import {QuoteCard} from './parts/GlassFrame';

/**
 * 结构件冒烟合成（StructParts）：6 个结构件（C11 / C15 / C16 / C17+C29 / C18×3 / C20）各占 90 帧，帧号都是假的（等间隔逐字），
 * 只用来看版式和动效是否完好，不接任何一期的 timing。出拼图：
 *   node ../tools/stills_frames.mjs <输出目录> --comp StructParts 12 85 112 175 265 305 350 378 440 470 530 615 705 795 830 885
 * 人物位用一块暖灰色代替（C11 放在中景上提胸前，C20 放在实拍上）。
 */
export const SEG = 90;
const seq = (start: number, n: number, step = 3) => Array.from({length: n}, (_, i) => start + i * step);
const Stand: React.FC<{tone?: string}> = ({tone = '#5a4636'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% 40%, #8a705a 0%, ${tone} 60%, #2a1e15 100%)`}} />
);
const segs: React.FC<{f: number}>[] = [
  // 0 C16 章节卡
  ({f}) => <ChapterCard f={f} from={0} title="一个人的自由" titleF={6} sub="究竟是能够随心所欲的做出选择" subFrames={seq(34, 14, 3)} subGold={(i) => i >= 5 && i <= 8} />,
  // 1 C15 概念牌：聚光扫字（样片做法）
  ({f}) => <ConceptPlaque f={f} from={0} title="社会性学习" titleF={8} lead="有一个概念叫做" />,
  // 2 C15 概念牌：标题牌 + 米白大卡
  ({f}) => (
    <ConceptPlaque f={f} from={0} title="社会性学习" titleF={4} reveal="blur" card={{f: 22, lines: [
      {segs: [{t: '通过', f: 30}, {t: '观察', f: 36, gold: true}]},
      {segs: [{t: '和', f: 44}, {t: '模仿', f: 48, gold: true}]},
      {segs: [{t: '周围人的', f: 56}, {t: '行为', f: 64}]},
      {segs: [{t: '逐渐形成', f: 70}, {t: '观念', f: 76, gold: true}]},
    ]}} />
  ),
  // 3 C11 引语纸条（人物位 = 暖灰）
  ({f}) => (
    <>
      <Stand />
      <QuoteSlip f={f} f0={4} lines={[{text: '这些都是', frames: seq(15, 4, 3), size: 60}, {text: '我自己决定的呀', frames: seq(32, 7, 3), size: 92}]} underline={{line: 1, from: 0, to: 3, f: 42}} />
    </>
  ),
  // 4 C17 金框牌（大号描框，檀棕树影底）
  ({f}) => (
    <>
      <UmberBackdrop f={f} />
      <FramePlaque f={f} f0={4} dur={18} text="仅此而已" sub="说到底" size={120} w={860} h={420} x={110} y={560} />
    </>
  ),
  // 5 C29 小号描框（P39 那块）+ 原来的静态小牌（回归：静态写法不能变）
  ({f}) => (
    <>
      <Stand tone="#3e3026" />
      <FramePlaque f={f} f0={4} text="仅此而已" />
      <FramePlaque text="社会性学习" y={700} />
    </>
  ),
  // 6–8 C18 两答纸条：左右 / 上下 / 斜对
  ({f}) => (
    <>
      <NightBackdrop f={f} opacity={1} />
      <TwoAnswers f={f} layout="lr" q={{text: '你追求成功', frames: seq(4, 5, 3)}} a={{main: '真正热爱', sub: '自己的事业', f: 24}} orF={40} b={{main: '害怕', sub: '被别人看不起', f: 50}} />
    </>
  ),
  ({f}) => (
    <>
      <PaperBackdrop f={f} />
      <TwoAnswers f={f} layout="tb" dark={false} q={{text: '希望孩子成绩优秀', frames: seq(4, 8, 2)}} a={{main: '为了孩子未来', sub: '的发展', f: 24}} orF={40} b={{main: '自己无法接受', sub: '孩子不如别人', f: 50}} />
    </>
  ),
  ({f}) => (
    <>
      <UmberBackdrop f={f} />
      <TwoAnswers f={f} layout="diag" q={{text: '控制一个人', frames: seq(4, 5, 3)}} a={{main: '出于爱', f: 24}} orF={40} b={{main: '害怕失去', f: 50}} />
    </>
  ),
  // 9 C20 金句卡（实拍位 = 暖灰）
  ({f}) => (
    <>
      <Stand tone="#7a6248" />
      <QuoteCard f={f} f0={4} lines={[
        {t: '这是我真正想要的', frames: seq(30, 8, 2), size: 92, top: 548, gold: [3, 4, 5, 6]},
        {t: '还是', frames: seq(48, 2, 2), size: 52, weight: 700, top: 672},
        {t: '我一直以为自己', frames: seq(54, 7, 2), size: 72, weight: 700, top: 752},
        {t: '应该这样做的', frames: seq(68, 6, 2), size: 92, top: 848, hollow: [0, 1]},
      ]} />
    </>
  ),
];
export const STRUCT_END = segs.length * SEG;
export const StructParts: React.FC = () => {
  const f = useF();
  const k = Math.min(segs.length - 1, Math.floor(f / SEG));
  const Seg = segs[k];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Seg f={f - k * SEG} />
    </AbsoluteFill>
  );
};
