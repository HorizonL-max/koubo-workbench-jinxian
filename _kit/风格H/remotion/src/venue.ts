/**
 * 同场地预设：读工程上一级的「场地预设.json」（_kit 里是 _kit/风格H/场地预设.json；新一期拷到期目录根、和 remotion/ 同级）。
 * 组件里所有和房间 / 机位 / 人脸位置有关的数（中景滤镜、小头像和圆窗取景、吊坠和金线落点、压暗、字幕托板）都从这里取，不写死。
 */
import raw from '../../场地预设.json';

type XY = [number, number];
export type Venue = {
  remotion_ms_filter: {filter: string};
  face: {cu: {hair_top: number}; ms: {hair_top: number[]}; msb: {chin_max: number}};
  cu_top_safe: {text_bottom_max: number};
  host_forms: Record<'FULL_CU' | 'FULL_MS' | 'FULL_MSB', {origin: string; scale: number[]}>;
  scrims: {
    top: {alpha: number; to_y: number};
    bottom: {from_y: number; mid_y: number; mid_alpha: number; end_alpha: number};
    lift: {from_y: number; mid_y: number; mid_alpha: number; end_y: number; end_alpha: number};
  };
  subtitle: {plate_alpha: number};
  avatar: {cx: number; cy: number; d: number; cu: AvFrame; ms: AvFrame};
  round_window_src: {ms: {x: number; y: number; size: number}; cu: {x: number; y: number; size: number}};
  ms_hang: {pendants: XY[]; threads: XY[]; thread_reveal_order: number[]; thread_cut_y: number};
};
export type AvFrame = {ax: number; ay: number; side: number; R0: number};
export const VENUE = raw as unknown as Venue;
/** 人物满幅三种形态的推镜原点（rows 表用） */
export const CU = VENUE.host_forms.FULL_CU.origin, MSO = VENUE.host_forms.FULL_MS.origin, MSB = VENUE.host_forms.FULL_MSB.origin;
export const MS_FILTER = VENUE.remotion_ms_filter.filter;
