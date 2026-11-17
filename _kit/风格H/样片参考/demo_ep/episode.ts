/**
 * ★ 每期配置（这一期的数，全在这里；组件不写死本期帧号）。
 * 现在填的是模板自带的 8 秒 Demo（取自样片开头 0–8s），新一期整份改掉。
 * 帧号一律 30fps 合成帧；能用词锚算的（WF('某词', 秒)）就别手敲。
 */
export type Hide = [number, number] | [number, number, number] | [number, number, number, number];
export type BgmPass = {
  at: number; // 这一遍从合成第几帧起放（曲子从头放）
  fadeIn?: number; // 进场淡入帧数（第一遍默认 0.5s 起音，其余默认 6 帧）
  fadeOut?: [number, number]; // 在这段帧里淡出到 0 并停（不给 = 放到片尾）
};
export const EP = {
  /** ★ 人物视频帧数（ffprobe nb_frames；两条机位必须相同）。口播到这里为止 */
  hostFrames: 240,
  /** 口播后合成再延长多少帧（片尾尾巴：人物定格在末帧、30 帧压暗到 0.62）。Root 里 preflight 注释要写 host-tail=<这个数> */
  tail: 0,
  /** 文件（public/ 下）。人物视频必须是内置盘上的真实文件或硬链接，不能软链（渲染 404） */
  files: {cu: 'host/host.mp4', ms: 'host/host_ms.mp4', narration: 'narration.wav', bgm: 'audio/bgm.mp3'},
  /** true = 人物用灰色占位画（没有人物视频时看版式用；交付前必须 false） */
  hostPlaceholder: false,

  /** ★ C01 顶牌 / C03 片头标题：两行。第一行 ≤12 字（Bold 64→28），第二行 ≤9 字（Black 104→46，金色） */
  title: {l1: '你以为', l2: '自己在决定人生'},
  /** 片头扫字从哪一帧开始（扫 28 帧 → 站稳 → 第 start+69 帧起 26 帧降成顶牌） */
  titleStart: 0,
  /** 顶牌让位：[f0, f1, 淡出帧数(默认6；1=切镜那帧就没), 窗口后淡入帧数(默认0=直接在)]。夜青图解顶部有标注、章节卡、聚光镜时加 */
  titleHides: [] as Hide[],
  /** 片尾回扣（可选）：from 起顶牌升回两行大标题（26 帧）；sweepF 给了就从那一帧起金粉扫走第一行（「你以为」被带走），不要扫就删 sweepF */
  titleOutro: null as null | {from: number; sweepF?: number},

  /** 底部压暗上提的区间（升格问句、胸前区镜头：中景上提 FULL_MSB 时）。切进来 6 帧到位，镜尾硬切回去 */
  lifts: [[121, 192]] as [number, number][],

  /** 配乐（Mixkit「Piano Reflections」3:19）。曲子比片子短时分两遍，每遍都从曲子开头起，在句子说完的气口收 */
  bgm: {
    base: 0.035, // 人声在时的音量（比人声低约 18dB）；字间气口 >0.4s 抬 3dB（自动）
    darkBgs: ['night', 'umber'], // 这些幕底的镜头整体 +2dB（按 shots.json 的 bg 自动认）
    extraUp: [] as [number, number][], // 再 +2dB 的区间（金句镜）
    passes: [{at: 0}] as BgmPass[],
  },
};
export const END = EP.hostFrames + EP.tail;
