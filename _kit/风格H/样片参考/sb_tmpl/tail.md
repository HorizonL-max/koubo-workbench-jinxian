---

## 5.4 全片自检

**机器查的**（`tools/sb_build.py` + `variety_lint`）
- 字幕 c24–c189 拼起来逐句等于口播原文（标点除外）；英文每条 ≤44 字符；中文最长 14 字（c137，54 号）。
- 第 5 部分每一镜画面上的字都是口播原话的连续片段（脚本里的 `LABELS` 逐条核过）。
- `variety_lint shots.json`：PASS。64 镜 / 350s，卡 55 种，主动作 43 种，幕底 6 款，人物形态 7 种；人物退场 13 镜 83.6s（24%），最长 9.4s（P61）；同一张卡最多 2 次且隔 45s 以上（`HeroQuestion`：P02、P45）。

**手法只当一次主角**（shotcraft P4）
- 全片只出现一次的：金粉扫字降格（P01）及其倒放（P64，回扣）、刻度带急刹（P06）、实拍收成吊坠（P07）、顺着金线升上去（P14）、字重脉冲（P13）、聚光扫字（P22）、拱窗（P23）、划掉（P23）、整墙点亮（P34）、水波三环（P42）、天平（P46）、发牌星芒（P60）、扫针（P61）、手绘圈（P62）。
- 有意出现两次的：人变剪影（P08、P27，第二次缩到 8 帧）、对开门（P30、P58，卡的上限就是 2）、回环（P38、P50，第二次是走出来）、词槽牌（P13、P59）、升格问句（P02、P45）、焦点接力（P20 竖排字、P47 答案条，载体不同）。
- 贯穿的母题不算重复：金线、吊坠（P04–P08、P11、P26–P29、P61、P62）、满屋金线（P41、P51、P58）、皮影小人（P24–P25、P32–P36、P48）、节点网（P14、P53–P57）。
- 光效全片 2 处：P22 聚光、P60 星芒（只闪一次）。P34 的逐格描边是单点小光，按卡算在「整墙点亮 ≤1 次」里。

**呼吸**：呼吸镜（近景、不加东西）11 个：P03、P12、P15、P21、P28、P44、P49、P52、P56，加上 P39（只有一个小金框）、P35（只有一行字）。任意 40 秒里都有人物满幅的镜头。金句 P63 说完停 1.1s 以上。

**用到的镜头卡**（只取动效参数，皮全换成金线讲堂）
- shotcraft（★ = 用户在画廊里挑过的）：`title-demote-to-label`、`blur-slide`、`marker-underline-title`、`card-flip-reveal`、`gauge-readout-moves`（B 式 P06、A 式 P61）、`draw-svg-trace`、`circle-match-iris` ★、`glow-flyline-moves` ★（A 式光斑、B 式飞线）、`element-body-moves`、`line-carry-transition`、`type-rhythm-sync` ★（字重脉冲）、`radial-wave`、`light-play-moves` ★（聚光扫字）、`page-turn-transitions` ★（对开门）、`wall-reveal-moves` ★（逐格点亮）、`radial-ripple-phone-chips` ★、`magician-card-flourish` ★、`voice-waveform-live` ★（头像声纹弧）、`list-stack-press`、`cloner-depth-echo`、`tension-camera-moves`（后拉）、`rhythm-interrupt-moves`（跳切推近）、`mosaic-reframe`（节点迁移的写法）。★ 卡 14 张里用了 9 张；没用的 5 张（爆炸分解、骨架飞入两张、乱码轮播、三词几何接力）是界面 / 故障味的，和这期的调性对不上，没硬塞。
- talkcraft：`host-shrink-to-chip`（小头像）、`behind-text-title`、`word-slot-cycle`、`step-timeline-vertical`、`ui-prop-theater`（逐项盖章）、`soft-blur-in`、`rack-focus-pair`、`strike-and-replace`、`source-converge`、`corner-bracket-frame`、`tracking-in`、`outline-box-title`、`split-text-stagger`、`ink-underline`、`callout-line-label`、`parallel-items-with-host`、`hand-drawn-ellipse`。

**做的时候最容易丢的**（详见 handoff/02-分镜.md「全片」一节）：金线每一章的那一步（1.12）；整屏实拍必有小头像；图解里的东西跨镜时位置逐像素不动（P26→P27、P54→P55、P55→P57、P32→P33→P34）；画面上不出现口播没说过的字。
