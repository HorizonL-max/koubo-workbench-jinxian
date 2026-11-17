import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, GOLD_TEXT, SOFT_SHADOW} from '../../theme';
import {charFrames, clamp01, EASE, mix, rf, WF} from '../../u';
import {S} from '../../shots';
import {Avatar} from '../../parts/Avatar';
import {BrollFull} from '../act1/P16_P20';
import {blurIn} from '../../parts/anim';
import {Chars} from './common';

/* ═════════ P43 实拍亲子背影 + 小头像：所处的环境（C21「在」→「放」+ talkcraft ink-underline） ═════════
 * 实拍 b08（只拍到牵着的两只手，不露脸）1.00→1.03；头像硬切就在，镜尾 [f1, f1+10) 放回满幅（P44 的人物行从 f1+10 起接手）。
 * 「离不开」Bold 64 居中 y 340–410；「所处的环境」Black 108 亮金 x 270–810、y 430–545，跟着嘴出；墨迹下划线 14 帧（起笔 12px 收笔 2px，线心离字底 6px，两端各超出 8px）。
 * 放之前字和下划线 6 帧淡掉；放大期间实拍留在圆外。 */
export const P43_F = {leave: WF('离不开', 205.3), env: WF('所处的环境', 206.1), ul: WF('所处的环境', 206.1) + 27};
const ENV_F = charFrames('所处的环境', 206.1);
const UL = (() => {
  const x0 = 262, x1 = 818, y = 551, N = 36, top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = mix(x0, x1, u), w = mix(12, 2, Math.pow(u, 0.8));
    const wob = Math.sin(u * 19.3) * 0.7;
    top.push(`${x.toFixed(1)},${(y - w / 2 + wob).toFixed(2)}`);
    bot.unshift(`${x.toFixed(1)},${(y + w / 2 + wob).toFixed(2)}`);
  }
  return 'M' + top.join(' L') + ' L' + bot.join(' L') + ' Z';
})();
export const P43: React.FC<{f: number}> = ({f}) => {
  const sh = S.P43;
  if (f < sh.f0 || f >= sh.f1 + 10) return null;
  const sc = mix(1, 1.03, clamp01((f - sh.f0) / (sh.f1 - sh.f0)));
  const out = 1 - rf(f, sh.f1 - 6, 6, EASE.lin);
  const ul = rf(f, P43_F.ul, 14, EASE.inOutC);
  return (
    <AbsoluteFill>
 {/* 返修：207s 左边进来一件红衣（本期不出红色大色块）→ 整条降饱和 0.7 */}
      <AbsoluteFill style={{filter: 'saturate(0.7)'}}><BrollFull src="broll/b08_family.mp4" from={sh.f0} dur={sh.f1 + 10 - sh.f0} scale={sc} origin="540px 960px" topDark={0.72} topTo={640} /></AbsoluteFill>
      <Avatar f={f} f0={sh.f0} f1={sh.f1} enter="cut" exit="expand" />
      {out > 0 && (
        <AbsoluteFill style={{opacity: out}}>
          <div style={{position: 'absolute', left: 0, width: 1080, top: 340, height: 70, textAlign: 'center', fontFamily: FONT.song, fontWeight: 700, fontSize: 64, lineHeight: '70px', color: C.cream, textShadow: SOFT_SHADOW}}>
            <span style={blurIn(f, P43_F.leave, 8, 20)}>离不开</span>
          </div>
          <div style={{position: 'absolute', left: 270, top: 430, height: 115}}>
            <Chars text="所处的环境" frames={ENV_F} f={f} size={108} gold={() => true} />
          </div>
          {ul > 0 && (
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
              <defs><clipPath id="p43ul"><rect x={250} y={520} width={580 * ul} height={60} /></clipPath></defs>
              <path d={UL} fill={C.goldHi} clipPath="url(#p43ul)" style={{filter: 'drop-shadow(0 2px 6px rgba(20,12,6,.6))'}} />
            </svg>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* ═════════ P45 升格问句：是否还能够重新去审视（C04 回扣，离 P02 三分多钟） ═════════
 * 中景上提 + 底部压暗上提（Scrims.LIFT_MORE）。第一行「是否还能够」Black 76 乳白居中、顶 y 968；第二行「重新去审视」Black 128 亮金 x 220–860、顶 y 1062；
 * 每个字在自己的口播起点出（8 帧 blur-slide）；「审视」下面金色干笔下划线（10 帧，中段宽约 0.12em、首尾细、边缘毛糙）。c120 升格（字幕带里只有英文）。 */
export const P45_F = {q: WF('是否还能够', 212.9)};
const QF = charFrames('是否还能够重新去审视', 212.9);
export const P45_UL = QF[9] + 8;
const UL2 = (() => {
  const UX0 = 604, UX1 = 862, ULY = 1200, N = 40, top: string[] = [], bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = UX0 + (UX1 - UX0) * u;
    const w = 2 + 13 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.7);
    const wob = Math.sin(u * 23.1) * 0.6 + Math.sin(u * 57.7) * 0.35;
    const rough = (k: number) => Math.sin(u * 91 + k) * 0.5 + Math.sin(u * 173 + k * 2) * 0.35;
    top.push(`${x.toFixed(1)},${(ULY - w / 2 + wob + rough(1)).toFixed(2)}`);
    bot.unshift(`${x.toFixed(1)},${(ULY + w / 2 + wob + rough(4)).toFixed(2)}`);
  }
  return 'M' + top.join(' L') + ' L' + bot.join(' L') + ' Z';
})();
export const P45: React.FC<{f: number}> = ({f}) => {
  const sh = S.P45;
  if (f < sh.f0 || f >= sh.f1) return null;
  const ul = rf(f, P45_UL, 10, EASE.inOutC);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 968, height: 80, textAlign: 'center'}}>
        <Chars text="是否还能够" frames={QF.slice(0, 5)} f={f} size={76} />
      </div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 1062, height: 130, textAlign: 'center'}}>
        <Chars text="重新去审视" frames={QF.slice(5)} f={f} size={128} gold={() => true} />
      </div>
      {ul > 0 && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <defs><clipPath id="p45ul"><rect x={596} y={1180} width={(270 * ul).toFixed(1)} height={40} /></clipPath></defs>
          <path d={UL2} fill={C.goldHi} clipPath="url(#p45ul)" style={{filter: 'drop-shadow(0 2px 6px rgba(20,12,6,.6))'}} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
export {GOLD_TEXT};
