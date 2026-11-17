import React from 'react';
import {OffthreadVideo, Sequence, staticFile} from 'remotion';

/**
 * 实拍片段：一律包在 Sequence 里（from = 入场帧），素材从 startFrom 帧开始播——
 * 直接写 OffthreadVideo 会按整片时间取素材帧，短素材定格（render-pitfalls P3）。
 * 片段是方块 / 竖条，放进父容器 cover 铺满；style 可以覆盖尺寸和位置（给光圈收拢用）。
 */
export const Clip: React.FC<{src: string; from: number; dur: number; startFrom?: number; style?: React.CSSProperties; filter?: string}> = ({src, from, dur, startFrom = 0, style, filter}) => (
  <Sequence from={from} durationInFrames={dur} layout="none">
    <OffthreadVideo
      src={staticFile(src)}
      muted
      startFrom={startFrom}
      style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', filter, ...style}}
    />
  </Sequence>
);
