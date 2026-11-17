import React from 'react';
import {useF, WF} from '../u';
import {S} from '../shots';
import {NightBackdrop} from '../parts/NightBackdrop';
import {RiseQuestion} from '../parts/RiseQuestion';
import {Pendant, PendantSpec} from '../parts/Pendant';
import {LineIcon} from '../parts/LineIcons';
import {Avatar} from '../parts/Avatar';

/**
 * ★ 每期场景入口：Main 会在三个层上各挂一次（见 Main.tsx 的层序）。每镜自己按帧区间 return null。
 *   Back  = 人物下面（被人物淡出才露出来的：人变剪影时的夜青幕底）
 *   Under = 人物上、顶底压暗下（剪影图解的下层）
 *   Over  = 场景主体（大部分镜头都在这里）
 * 长片按幕拆：scenes/act1/Act1.tsx …（每幕一个入口），在这里合并。
 *
 * 下面是模板自带的 8 秒 Demo（三镜，取样片开头的口播）：
 *   D1 f0–121   近景满幅 + C03 金粉扫字 → C01 顶牌（TitlePlaque 自己画，这里没东西）
 *   D2 f121–192 中景上提 + C04 升格问句 + 金线甩成下划线（字幕 c3 升格）
 *   D3 f192–240 夜青幕底 + C21 小头像（从近景满幅收进来）+ C05 金线吊坠（线稿房子面 + 吊牌「比如你 / 为什么」）
 */
const D3 = () => S.D3;
export const DEMO_F = (() => {
  const why = WF('为什么', 6.8);
  return {thread: S.D3.f0 + 6, slide: why - 16, land: why - 2, tag: why};
})();
const PD_DEMO: PendantSpec = {
  id: 'demo', cx: 640, cy: 620, d: 208, phase: 1.3,
  threadF: DEMO_F.thread, slideF: DEMO_F.slide, landF: DEMO_F.land,
  front: {art: (f, inner) => <LineIcon kind="house" f={f} f0={DEMO_F.land - 4} dur={12} x={inner * 0.11} y={inner * 0.13} size={inner * 0.78} />},
  tag: {side: 'below', unfoldF: DEMO_F.tag, small: '比如你', main: '为什么'},
};

export const Back: React.FC = () => {
  const f = useF();
  return f >= D3().f0 && f < D3().f1 ? <NightBackdrop f={f} opacity={1} /> : null;
};
export const Under: React.FC = () => null;
export const Over: React.FC = () => {
  const f = useF();
  return (
    <>
      <RiseQuestion
        f={f} f0={S.D2.f0} f1={S.D2.f1} qmark
        lines={[{text: '真的是你', near: 4.0, size: 96, y: 972}, {text: '自己决定的吗', near: 4.8, size: 124, y: 1078, gold: [0, 1]}]}
        mark={{line: 1, chars: [0, 1]}}
      />
      {f >= D3().f0 && f < D3().f1 && (
        <>
          <Pendant s={PD_DEMO} f={f} fx={{hidden: false, desat: 0}} />
          <Avatar f={f} f0={D3().f0} f1={D3().f1} enter="shrink" />
        </>
      )}
    </>
  );
};
