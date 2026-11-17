import type {Row} from '../Host';
import {CU, MSB, MSO} from '../venue';

/**
 * ★ 人物满幅行表：只写「人物满幅」三种形态（FULL_CU / FULL_MS / FULL_MSB）的镜头；圆窗、拱窗、小头像、退场由场景自己画。
 * {f0, f1, cam, s0→s1 缩放, origin 推镜原点, end?(推到 s1 的帧), fade?:[a,b] 人物淡出（人变剪影）, ty?(f) 整屏纵移, sc?(f) 自定义缩放曲线}
 * 推拉一律 ≤0.5%/s（样片坑：近景背景书架有印刷字，推快了 postcheck Q5 报闪）；相邻镜方向交替。
 * 长片按幕拆：rows.act1.ts / rows.act2.ts …，这里合并（三幕互不改对方文件）。
 * 中景晚开机的那几帧（场地预设 / 粗剪交接里写的黑帧区间）不能排 cam:'ms'。
 */
export const ROWS: Row[] = [
  {f0: 0, f1: 121, cam: 'cu', s0: 1.0, s1: 1.02, origin: CU}, // 片头：顶牌扫字（近景；中景前 3.7s 没素材）
  {f0: 121, f1: 192, cam: 'ms', s0: 1.15, s1: 1.17, origin: MSB}, // 升格问句：中景上提
  // f192–240：夜青 + 小头像（场景里画）
];
