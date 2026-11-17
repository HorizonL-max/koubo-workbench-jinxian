# 风格H：金线讲堂（宋体 · 香槟金细线 · 米白纸卡 · 夜青 / 檀棕暗场 · 竖屏双机位）

来源：照一条心理学知识类对标样片（横屏书房口播、香槟金 + 米色纸面 + 深蓝绿 / 深棕暗场、宋体衬线）的风格，为一期竖屏双机位口播从零设计。样片成片 1080×1920、约 5 分 50 秒、64 镜。

和风格A～G 并存，按题材选一套，同一期不混用。

**适合**
- 心理、人生观点、成长、关系类口播：知性、温暖、克制。对成年观众讲道理，语气平和、层层递进，不吓人、不喊口号。
- 竖屏 9:16、两个机位（近景 + 中景）、书房 / 室内讲堂场景。
- 一个抽象概念要「画出来」的片子：吊坠、剪影图解、节点网、皮影小人、满屋金线都是给「看不见的影响」造型用的。

**不适合**
- 冲击感强、情绪炸的文案（吐槽、翻车、强观点）：用风格C / E。
- 参数对比、机型 A vs B、价格：用风格D / F。
- 数码、AI 工具讲解：用风格A / G。
- 横屏：版式全是按竖屏安全区排的，横屏要重排。

参考文件：
- `演示540p.mp4`：整片 540×960 低码率版，351s。
- `样张.jpg`：12 张关键帧。依次是：片头扫字、升格问句、吊坠和吊牌、实拍 + 刻度带 + 小头像、人影图解、三联竖卡 + 圆窗、皮影戏台、剪影图解 2、奖状墙、满屋金线、网收成人形、片尾标题回扣。
- `样片参考/`：样片的 SHOTBOOK、镜头表、几份有代表性的场景代码、分镜生成器的数据和模板。**只看写法，不要整份拷进新一期。**

---

## 环境（路径都由工作台的 `setup/paths.sh` 给出）
```bash
source setup/paths.sh            # 得到 $KB（工作台）、$PY（Python）、$TALKCRAFT（video-talkcraft 技能）
KIT=$KB/_kit/风格H                # 下文 $KIT
export KOUBO_YUNET=~/.cache/koubo/face_detection_yunet_2023mar.onnx   # tools/face_env.py 用的人脸模型（setup/install.sh 会下载）
```
- `remotion/node_modules` 是软链，指向 `$TALKCRAFT/runtime/node_modules`（不在工程里跑 npm install）。`setup/new_episode.sh` 会自动接好；手动拷工程时用 `bash $TALKCRAFT/runtime/link-runtime.sh <期目录>`。
- **字体**：标题和字幕用宋体衬线（Black 900 / Bold 700），英文用 Georgia。macOS 自带 `Songti SC`，效果和样片一致；Windows / Linux 请装免费可商用的**思源宋体**（Source Han Serif SC / Noto Serif SC，含 Heavy 字重），否则会退到 SimSun，粗字出不来、观感差很多。`setup/check_env.sh` 会提示。
- **配乐不随包分发**：样片用的是 Mixkit「Piano Reflections」（Ahjay Stelino，Mixkit Stock Music Free License，可免费商用但不允许再分发素材文件）。请自己到 https://mixkit.co 搜这首（或任意温暖钢琴 / 氛围曲）下载，放到 `remotion/public/audio/bgm.mp3`。没有配乐时冒烟测试会自动垫一段静音。
- 实拍空镜也不随包：样片的 Mixkit 免费空镜按每期需要自己下载，来源和授权记进期目录 `SOURCE.md`。

---

## 目录
```
风格H/
├─ README.md
├─ 场地预设.json          同场地预设（两机位调色、HLG、人脸位置、头像取景、底部杂物、挂件落点…）组件和脚本都从这里读
├─ 样张.jpg / 演示540p.mp4（不随包）/ 样张-结构件.jpg（6 个结构件的冒烟拼图）
├─ remotion/              模板工程（自带一个 8 秒 Demo）
│  ├─ package.json / remotion.config.ts（CRF 12）/ tsconfig.json / node_modules→软链
│  ├─ public/audio/bgm.mp3（不随包，自己放）、audio/sfx/（24 条裁好的真实拟音 + 原始预览 + 授权）、host/（空，放人物视频）、broll/（空）
│  └─ src/
│     ├─ 系统件：theme.ts  u.ts  venue.ts  shots.ts  Host.tsx  Main.tsx  Root.tsx  bgm.ts  sfx.ts  index.ts  StructParts.tsx（结构件冒烟合成）
│     ├─ parts/            组件（下面「组件目录」）
│     └─ ep/ ★             每期数据：episode.ts rows.ts cues.ts(+cues.json) sfx.ts sfx_edit.json Scenes.tsx shots.json timing.json voice_rms.json
├─ tools/                 本风格专用脚本（都带参数，不写死期目录）
└─ 样片参考/               SHOTBOOK.md、shots.json、sfx_plan.json、scenes/（代表性场景）、sb_tmpl/、sb_data.example.py、demo_ep/（Demo 的 ep 备份）
```
另有通用的双机位粗剪脚本放在 `_tools/dualcam/`，用法见那里的 README。

---

## 直接复用（零件）｜每期重新设计（分镜）

| 直接复用（零件） | 每期重新设计（分镜） |
|---|---|
| `remotion/src/` 系统件：`theme`、`u`（词锚 W / WF / charFrames）、`venue`、`shots`、`Host`（两机位 + 片尾定格）、`Main` 骨架、`bgm`（多遍接法）、`sfx`（少而准修改表） | SHOTBOOK（视觉系统可以微调，逐镜全新写） |
| `parts/` 全部组件（目录见下） | 选卡、版式、哪句配哪件东西 |
| `public/` 里的配乐和 24 条真实拟音 | 文案：画面上的字只用口播原话 |
| `tools/`：`sb_build.py` 生成器、face_env、silhouette、headtop_cut、voice_rms、make_sfx_clips、sfx_thin、netgraph_layout… | `ep/` 下的所有文件：rows、cues、sfx、Scenes、shots、timing |
| `_tools/dualcam/` 双机位粗剪 | 场景代码（`ep/` 或 `scenes/actN/`） |
| `场地预设.json`（同一个房间、同一套机位时） | 空镜：每期按文案重新找 |

**用户的硬规矩**
- SHOTBOOK、选卡、版式、文案、场景代码每期重新设计。
- 每期至少 3～5 种前几期没用过的包装形式。样片里只做成场景、没抽成组件的那些（见组件目录末尾）也算「用过」，别原样再来一遍。
- **结构件可以每期复用，换文案即可**：C11 引语纸条、C15 概念牌、C16 章节卡、C17 金框牌（C29 小号）、C18 两答纸条、C20 金句卡这 6 个是片子的骨架件（2026-11-15 抽成组件，见组件目录）。它们不算进上面那 3～5 种新形式，新形式要另外设计。
- `样片参考/` 只用来看写法：词锚怎么挂、吊坠配置怎么写、跨镜不动的东西怎么做成纯函数。**不要整份拷进新一期。**
- 新组件做好后补进 `parts/` 和下面的目录。

---

## 视觉 token（`src/theme.ts`）

| token | 值 | 用在 |
|---|---|---|
| `gold` 香槟金 | `#c9a063` | 细线、框、金条、吊坠环 |
| `goldHi` / `goldHi2` 亮金 | `#e9be78` / `#f1d9a8` | 深底和人物上的强调字（`GOLD_TEXT` 渐变字） |
| `goldDeep` 深金 | `#a8752a` | 纸面上的强调字、吊牌小字 |
| `goldDark` | `#8f6a34` | 金环渐变暗端（`RING_GRAD`） |
| `cream` 乳白 | `#fff6e6` | 深底和人物上的正文 |
| `card` 纸卡 | `#f4ecda` | 米白卡、吊牌、纸签 |
| 纸面 paper | `#e6d9c5 → #dcc6ad`（160°） | 宣纸幕底（`PaperBackdrop`） |
| `ink` / `ink2` 墨 | `#3a2a1c` / `#6b5743` | 纸面上的字、线稿 |
| `night` 夜青 | `#0d1d2c`，中心提亮到 `#173349` | 夜青幕底；徽章背面 `#14293b` |
| `nightFig` 剪影 | `#284257` + 1.5px 金边 α0.5 | 夜青上的人影 |
| 檀棕 umber | `#150c06 → #4d3622` | 皮影戏台（`UmberBackdrop`） |
| `scrim` 压暗 | `#140d07` | 顶底压暗、字幕托、所有暗托 |

- 强调色只有金一种，一屏里金色字最多 1 组。不用红、蓝紫、纯黑、纯白。
- **字体**：中文 `Songti SC`，英文 `Georgia`（只用在字幕翻译行）。字阶如下，最小 32px，比这还小的字删掉：

  | 档 | 字号 / 字重 |
  |---|---|
  | 巨 | 120–124 Black |
  | 大 | 92–104 Black |
  | 中 | 56–64 |
  | 字幕 | 58 Bold（14–15 字时降到 54） |
  | 标签 | 44–48 Black |
  | 小 | 32–34 |

- 深底和人物上的字加柔影 `SOFT_SHADOW`；纸面上的字不加影。金色渐变字要配 `textShadow: none`，阴影改用 `filter: drop-shadow`。
- **金线**：
  - 母题线 2px（`gold` α0.85，外发光 `0 0 4px rgba(233,190,120,.5)`）。
  - 满屋金线返修后改成 3.5px、α0.85，加暗描边：亮木书架前 2px 在手机上看不见。
  - 细线图案（同心圆、刻度、网格）不低于 2px，而且**一律静止**：细线慢转会逐帧闪。
  - 吊坠金环 5px，头像金环 4px，圆窗金环 5px，内侧都有一圈 1px 乳白线。
- **五款幕底**：

  | 名 | 用在 | 做法 |
  |---|---|---|
  | `host` | 口播 | 人物满幅 + 顶底压暗 |
  | `broll` | 整屏实拍 | 统一调色 `BROLL_GRADE` + 顶底压暗 |
  | `paper` 宣纸 | 概念、清单、路线 | 右上静止同心圆纹 + 金尘上飘 |
  | `night` 夜青 | 「你 / 我们」的内视图 | 三团光斑漂移 + 金尘 |
  | `umber` 檀棕 | 「一个人」的皮影戏 | 树叶光斑左右晃 |

  三个世界不混用。任意 45 秒内至少换一次幕底。
- **竖屏版式和安全区**（1080×1920）：

  | 区域 | 范围 | 放什么 |
  |---|---|---|
  | 平台顶栏 | y 0–160 | 只放压暗和垂下来的金线 |
  | 顶牌 | x 64–424（宽按标题算），y 168–270 | 常驻标题牌 |
  | 顶区 | y 280–500 | 中景头顶上方：小卡、吊坠、一行字 |
  | 人两侧列 | 左 x 86–296，右 x 784–994，y 520–900 | 只在中景原幅时可用 |
  | 胸前区 | y 940–1235 | 只在中景上提时可用 |
  | **字幕带** | x 130–950，y 1250–1400 | 全片固定 |
  | **右侧平台按钮列** | x 936–1080，y 900–1536 | 不放要读的字；右边的东西底边不过 y 900 |
  | **底部 20%** | y 1536–1920 平台底栏 | 不放任何信息，只有压暗，顺带盖住中景的桌面、白线、手 |

  要读的字在 y>900 时，右边不过 x 930。

---

## 组件目录（`remotion/src/parts/`）

几点约定：
- 「样片用在」写的是样片镜号，逐镜做法查 `样片参考/SHOTBOOK.md`。
- 音效都是 `public/audio/sfx/` 里的真实拟音。
- 次数上限按 350 秒一期算。
- 组件里不写本期帧号：标题、让位区间、上提区间、配乐接法在 `ep/episode.ts`，取景、落点、滤镜在 `场地预设.json`。

| 组件 | 文件 | 主要参数 | 动效要点 | 样片用在 | 音效 | 上限 |
|---|---|---|---|---|---|---|
| C01 顶牌 + C03 金粉扫字 + 片尾回扣 | `TitlePlaque.tsx` | `EP.title{l1,l2}` / `titleStart` / `titleHides[[f0,f1,淡出,淡入]]` / `titleOutro{from,sweepF?}` | 140 粒金粉扫第二行（28 帧），站稳 ≥18 帧，第 69 帧起 26 帧 `bezier(.6,0,.18,1)` 降成左上顶牌（缩放和位移同一条曲线）；之后不动不呼吸；回扣时升回大标题，金粉扫走第一行 | P01、P64；让位 P08 P22 P29 P40 P61 | chime（样片返修时删了：开口就起，没有气口） | 扫字 1 次 + 回扣 1 次；第二行最多 9 字 |
| C02 金线字幕带 | `Subtitles.tsx` | `ep/cues`：`{zh,en,near,hl?,hlNear?,up?,end?}`；托板 α 读场地预设 | 中文一行 + 英文一行，硬现硬走、不带标点；强调词只换色，一条最多 1 个；纸面幕底自动换墨色；相邻两条只隔 ≤8 帧时自动接上（不闪空托板） | 全片 | 不配 | 升格 ≤4–6 次 |
| 顶底压暗 | `Scrims.tsx` | 场地预设 `scrims`；`EP.lifts` | 只压顶和底，不盖脸；上提时 6 帧到位 | 全片；上提 P02 P09 P37 P45 P59 | — | — |
| C04 升格问句 | `RiseQuestion.tsx` | `lines[{text,near,size,y,gold}]`、`mark{line,chars}`、`qmark` | 字随声出：每个字在自己的口播起点出现，8 帧 blur-slide；金线从顶牌竖条垂下（14 帧 ease-in，带亮笔头），拐弧甩成马克笔下划线（12 帧） | P02（P45 同类） | brush（下划线） | ≤4 |
| C05 金线吊坠 + C06 徽章翻面 | `Pendant.tsx` | `PendantSpec{cx,cy,d,phase,threadF,slideF,landF,front{src/art/q},back,flipF,tag{small,main,side,…},kicks,sink,still,swellF,bounceF}`、`fx{hidden,desat,lit}` | 线垂 12 帧；徽章滑入 14 帧，过冲 14px；阻尼摆 2.6°·e^(−1.8t)；常驻微摆 0.35°（三枚相位不同）。翻面：−10° 预备 4 帧 → 16 帧翻到 194° → 弹簧回 180°，侧棱受光带。可以沉进胸口（sink），也可以停死（still） | P04 P05 P07 P11 P26 P27 P29 P61 P62 | keys / clink / bell 落位，flip 翻面 | 一次在场 ≤12s；回扣间隔 ≥45s；翻面 ≤3 枚，错峰 5 帧 |
| C07 玻璃字框 | `GlassFrame.tsx` | `f0,dur,x,y,w,h,r,bg`，`blur`（默认 8）、`tipColor`、`shadow` | 描边带笔头（draw-svg-trace），画完才起 backdrop-blur 暗底、才出字 | P06 P63 | 不配 | 实拍一次 ≤6s |
| C08 刻度带急刹 | `GaugeTape.tsx` | `g{t0,dist,over,k,tt,tb}`、`y`、`ptrX`；`tickFrames(g)`、`stopFrame(g)` | 没有数字；指数减速冲过停点 10px，0.4s 缓回后锁死；>600px/s 加横向运动模糊 | P06 | tick 逐下排 + 刹停 | ≤2 |
| C10 人影图解的剪影 | `Silhouette.tsx` | `sil{fill,outline}`（tools/silhouette.py 出）、`f0,dur,rings,ringF,heart` | 「人变剪影」：12 帧叠化，画面上其他挂件一个像素都不动；同形轮廓由小到大逐圈画出 | P08 P27 P29 P61 | lyre（线亮） | 3–4 次，每次画的关系不同 |
| 夜青幕底 | `NightBackdrop.tsx` | `f, opacity` | 三团光斑漂移（周期互不相等）+ 金尘上飘 | 夜青镜 | — | — |
| 纸面 / 檀棕 / 戏台地面 | `Backdrops.tsx` | `PaperBackdrop` `UmberBackdrop` `StageFloor` | 纸面上金尘上飘；檀棕上树影 ±12px 晃，戏台区垫暖光 | 纸面、檀棕镜 | — | — |
| C21 小头像 | `Avatar.tsx` | `f0,f1,enter:'shrink'|'cut',exit:'cut'|'expand',toMs?,cam?` | 圆心 (160,1128)、直径 176，全片锁死。收：先收圆再缩内容，共 12 帧；放：10 帧；进场是硬切时金环胀一下。金环右侧 7 根声纹短条跟主音轨响度走。toMs：在圆里交叉淡化成中景，再放回成中景满幅 | P06 P17 P19 P31 P43 P47 P63 | cloth（收 / 放；返修时被人声盖住的那几处删了） | **整屏实拍必带**（用户定） |
| C22 圆窗 | `RoundWindow.tsx` | `cx,cy,d,cam,on,src?,exitF,popF` | 硬切进来，第一帧就在；位置锁死不漂；在暗底上外加 16px 暗晕；退场 6 帧缩到 0.9 | P10 P16 P18 P24 P32 P33 P36 P42 P48 P50 P60 | — | — |
| C23 皮影小人 | `ShadowFigure.tsx` | `x,y,h,pose,drawF,eye,handDot,gild,bands,edge,uid`；`lerpPose`、`figurePts`、`STAND` | 关节角度插值，不做逐帧手绘，没有五官；先描轮廓 14 帧再填实；2px 金边 | P24 P25 P32–P34 P36 P48 | step / creak | — |
| C24 纸签 | `PaperTag.tsx`；`kit.tsx` 的 `TagBody` / `HangTag` | `main,small,size,x|cx,y,rot,hang`；HangTag：`f0,x,y,mainF,slideDur` | 从上往下展开（scaleY 8 帧，轻微回弹）；挂签顺线滑下，过冲 10px | 很多镜（P23 P24 P30 P36 P48 P51…） | paper | — |
| C25 满屋金线 | `Threads.tsx` | `st(i)→{reveal,lit,cut,drop,dropF,swellF,alpha}`、`scrim`；13 根线的落点读场地预设 `ms_hang` | 五种状态：隐 / 显（从上往下）/ 亮 / 剪（在 y286 断开）/ 垂（阻尼摆）；任何一根都不碰脸和头发 | P41 P51 P58 | snip（剪线） | 显形当主角 1 次 |
| C26 节点网 | `NetGraph.tsx` + `netgraph.example.json` | `net`（tools/netgraph_layout.py 出）、`show,nodeF,edgeF,labels,pos` | 点亮照 radial-wave（过冲到 1.5 倍）；边 10 帧画出；`pos(i,f)` 让节点迁移（收成人形） | P14 P53 P55 P57 | drop / chime | 收成人形 1 次 |
| C28 回环 | `kit.tsx` `LoopTrack` | `cx,cy,r,w,draw,lead,dotA,glow` | 圈本身不转，只有金点匀速绕圈，每绕一圈轨道粗一档 | P38 P50 | — | 2 |
| C29 小金框牌 | `kit.tsx` `FramePlaque`（不给 `f,f0` = 静态） | `text,x,y,size,w,h,r,color` | 静态：深底 #1a0f08 + 2px 渐变金边 + 金字，切进来就在 | P24 戏台顶牌 | wood | — |
| C17 金框牌（C29 描框 / 大号） | `kit.tsx` `FramePlaque`（给 `f,f0` = 描框） | `f,f0,dur=10,text,sub,size,subSize,subLead,w,h,x,y,r,color,uid` | 3px 渐变金框从顶边中点顺时针一笔画完（inOutCubic，带笔头，精确闭合）；闭合前 2 帧框里起暗底 α0.38；主词 6 帧 blur-in（乳白 + 柔影，`color='gold'` 换亮金），小字（亮金 Bold）早 `subLead` 帧。默认小号 480×120 r16 字 84（宽按字数），大号照 SHOTBOOK 传 `w=860 h=420 size=120 sub=…`，配檀棕底 | P39（小号，配乐停 2.2s） | wood（木头轻叩） | 断语专用，一镜一块 |
| C11 引语纸条 | `QuoteSlip.tsx` | `f0,outF,lines[{text,frames,size,weight?,color?}],underline{line,from,to,f},x,y,w,h,quote` | 纸卡（默认 x110–970、y962–1232，r22）从下 40px 升起 10 帧；晚 6 帧大号金色上引号 0.6→1；逐字硬现（每字跟口播起点）+ 金色光标领先，打完 15 帧一闪；深金下划线 10 帧；退场下移 20px 淡出 8 帧。两行时第一行 Bold 60 ink2、第二行 Black 92 墨 | P09 | paper（纸条滑上来） | 中景上提胸前区；属于升格，和 C04 合算 ≤4–6 次 |
| C15 概念牌 | `ConceptPlaque.tsx` | `from,title,titleF,reveal:'spot'\|'blur',titleY,titleSize,lead,card{f,y,lines[{segs,size}]}` | `spot`（样片）：暗夜青、光斑钟摆 26 帧左→右→回中停住，字只在光斑里显，8 帧光圈张开，再 10 帧两侧金线画出，光斑里 14 粒浮尘；`blur`：夜青幕底，标题 10 帧 blur-slide；`card`：米白大卡 936×640 升起 10 帧，一行一行 blur-slide（墨 / 深金） | P22（spot、没有大卡） | switch（灯咔哒） | 光效（扫光 / 光斑）全片 ≤2；人物退场、顶牌让位 |
| C16 章节卡 | `ChapterCard.tsx`（光波单独是 `TealWave`） | `from,title,titleF,titleSize=132,y=600,sub,subFrames,subGold,backdrop,wave,waveY=1000` | 夜青 + 中部青绿粒子光波缓流（90 点三条正弦带，10 帧淡入）；短语每个字在裁切盒里从下 115% 升起，back.out(1.2) 15 帧、错峰 2 帧；末字落定后底线 3px 12 帧从中间画开；副句逐字硬现 + 光标、关键字亮金 | P40 | chime（章节起） | 每章 1 次；≤4s；短语 ≤8 字；人物退场、顶牌让位 |
| C18 两答纸条 | `TwoAnswers.tsx` | `layout:'lr'\|'tb'\|'diag',q{text,frames,size},a/b{main,sub,f},orF,or='还是',y=320,dark,outF,mainSize,subSize` | 问句字随声出；A 纸条展开 8 帧轻回弹 →「还是」blur-in → B 展开、A 同时 8 帧压到 60%；`tb` 横向展开，`diag` 两张各歪 −3° / +2°。纸条皮照 P46 天平下挂的纸条 | 样片三个拷问改做了天平 / 实拍字条 / 两人一线（C30 C31），本件照 SHOTBOOK 规格新做 | paper | 一期几个拷问轮换摆法，不连用同一种 |
| C20 金句卡 | `GlassFrame.tsx` `QuoteCard` | `f0,dur=24,outF,x=110,y=500,w=860,h=480,lines[{t,frames,size,weight,top?,gold?,hollow?}]` | = C07 玻璃字框（24 帧描框、乳白笔头、描边不带影）+ backdrop-blur 10 + 暗底 α0.5 + 字随声出（比框早到的字等框闭合再出）；`gold` 亮金、`hollow` 空心描边（「应该」）；6 帧淡出 | P63 | pencil（描框） | 全片 1 次、≥10s；升格；带小头像时框下沿 ≤y1000 |
| C34 词槽 | `SlotWord.tsx` | `words[{t,f}],size,lineH,color,ghostOut` | 句干钉住，槽里的词翻一格（8 帧，中间帧模糊）；最后一个词 back.out 落定；残影淡出 | P13 P59 | wood | — |
| C35 对开门 | `BarnDoor.tsx` | `f0,page`（旧页必须是只看 f 的纯函数画面），`uid` | 先描一道亮缝，再两扇各滑 ∓1000px（24 帧）；门后的人物 1.08→1；只裂图解，不裂人物那一屏 | P30 P58 | door | 2 |
| C36 线稿图标 | `LineIcons.tsx` | `kind`（house globe clock book cap briefcase family exam ruler cert bed bowl moon building tree）`,f0,dur,x,y,size,dark` | 一笔一笔画出（draw-on），一处金色点睛，画完各有一个小动作；图标里不写字、不写数字 | P10 P16 P26 P32–P34 P38 P60 | pencil | — |
| 字随声出 | `kit.tsx` `Chars` | `text,frames=charFrames(原话,秒),size,gold,dark` | 每个字用自己的口播起点，8 帧 blur-slide | 很多镜 | 不配 | — |
| 奖状 | `kit.tsx` `Cert` / `CertEdge` | `x,y,stampF,scale,rot` | 金色双线边 + 绶带；「认可」印盖下 4 帧 | P32–P36 | card / stamp | — |
| 金箭头 | `kit.tsx` `GoldArrow` | `x0,y0,x1,y1,p` | 一笔画出，带亮笔头 | P35 | — | — |
| 整屏实拍 | `kit.tsx` `BrollFull`、`Clip.tsx` | `src,from,dur,startFrom,scale,origin,topDark,topTo` | 包在 Sequence 里（不包会定格）；统一调色 + 顶底压暗；极缓推 | P06 P17 P19 P31 P43 P47 P63 | page 等实物声 | 一次 ≤6s |
| 动效小件 | `anim.tsx` | `blurIn` `Words` `Tip` `drawOn` `pointOn` `dampSwing` `idleSwing` `unfold` `backOut` `swell` | — | — | — | — |

**结构件冒烟**：`src/StructParts.tsx`（合成 `StructParts`，6 个结构件各 90 帧、假帧号）。改了这几个件后出一张拼图看：`node ../tools/stills_frames.mjs <输出目录> --comp StructParts 12 85 112 170 215 265 310 355 372 440 458 520 595 625 715 805 825 895`。上次的结果是 `样张-结构件.jpg`。

**样片里只做成场景、没抽成组件的**：做法看 `样片参考/SHOTBOOK.md` 的组件节和对应镜头。下期用到同类表达，要重新设计成不一样的形式。
- C09 实拍收成吊坠（反向光圈，见 `样片参考/scenes/BleedTape.tsx`，坑在下面）
- C12 三联竖卡、C13 人侧竖排字、C14 流程纸格
- C19 条件网收成人形（`样片参考/scenes/Net3.tsx` + `net3_layout.py`，用匈牙利配对）
- C27 路线纸卡、C30 金线天平、C31 答案条（焦点接力）、C32 发牌、C33 指南针吊坠

---

## 人物形态和双机位

**两个机位怎么分工**

| 机位 | 画面 | 用在哪些句子 |
|---|---|---|
| 中景 `ms` | 正对镜头 | 对观众说话：设问、「你看」「比如」、带吊坠 / 两侧字的镜头 |
| 近景 `cu` | 眼睛看画面右侧，像在想事情 | 铺垫、转折前缓一口气、自问、金句前 |

- 近景的脸占 y 440–1235，除了顶区一行字和字幕带，什么都放不下；叠层最少，一次 ≤6s。
- 切点放在句首前 1–3 帧，同一句中间不切。两次切换间隔 ≥2s。中景 → 近景是「收」，近景 → 中景是「放」。
- **中景晚开机那几帧不能用中景**（样片前 111 帧是黑的），粗剪交接会写清楚。

**七种形态**（`shots.json` 的 `host` 字段）

| 名 | 做法 | 能放东西的地方 |
|---|---|---|
| `FULL_CU` 近景满幅 | `ep/rows.ts`，原点 `52% 46%`，1.00↔1.03 | 顶区一行字（下沿 ≤ 场地预设 `cu_top_safe`） |
| `FULL_MS` 中景原幅 | 原点 `545px 790px`（头心），1.00→1.02 | 顶区、人两侧列、三枚吊坠落点 |
| `FULL_MSB` 中景上提 | 按底边放大 1.15→1.17 | 胸前区 y 940–1235（升格问句、引语纸条） |
| `ROUND` 圆窗 | 直径 248，圆心 (540,1070)，取中景 | 上方 y 290–900 整块给卡片 |
| `ARCH` 拱窗 | 580×660，顶部半圆，取近景 | 下方一排纸签 |
| `AVATAR` 小头像 | 直径 176，左下角 | 头像区 x 60–260、y 1028–1228；这一镜里别的字和框下沿不过 y 1000，或整体在 x 280 右边 |
| `HIDE` 退场 | 人不在画面 | 只给代码画的图解（夜青 / 檀棕）和章节卡用。单次 ≤10s，全片 ≤30%（样片 24%）；开场 3 秒和最后一镜不退 |

- **整屏实拍时人缩成小头像继续讲（用户定）**：用户原话「后面出全屏的 broll 的时候，可以让人物缩小成一个小头像在旁边讲」。实拍镜不再退场，全片 7 个实拍镜都带头像。
  - 从满幅进实拍用「收」，回近景满幅用「放」，其余硬切。
  - 头像不定格，不切走了再淡入，不挪位置。
- 推拉一律 ≤0.5%/s，相邻镜方向交替。原因：背景书架有印刷字，推快了 postcheck Q5 会报闪。
- 中景脸比近景亮约 15%，所以中景镜（包括圆窗、头像里的中景）统一加 `remotion_ms_filter`，让两机位脸部亮度差 ≤6%。
- 所有读人物视频的地方都用 `Host.tsx` 的 `HostVideo`，场景里不写 `<OffthreadVideo` 读人物（preflight P3 只豁免 Host.tsx）。

## 双语字幕规则
- 中文一行（Songti Bold 58）+ 英文一行（Georgia 34）。英文由分镜逐条写好，≤44 字符，是总控定的例外。除此以外，画面上不出英文装饰字。
- 每条一口气，最多 13 字（14–15 字自动降字号），按气口拆条。入点 = 首字 −2 帧，出点 = min(下一条入点, 末字 +0.25s)。字幕可以跨镜不断。
- **升格**（`up: true`）：这一条中文不在字幕带里出，改成画面上的大字或纸条，英文留着；字幕带上面那根金线隐去。全片 ≤6 次（样片 4 次）。
- **画面字和字幕整句重复时，那条字幕就升格（隐藏中文）**（样片审片挑出 P17 / P40 / P59 / P31 后定的）。
- 白 T 恤上字背后的亮度要 ≤95（取字行里 <170 的像素算中位数）。不够就加深托板（场地预设 `subtitle.plate_alpha`），不要把字改小改细。
- 纸面幕底自动换「纸面模式」：去掉托板，中文墨色，强调字深金。
- 金色标注和字幕里的金色强调同屏可以（审片看过不乱）。字幕强调一条只有一个词。

## 配乐和音效
- **配乐**：Mixkit「Piano Reflections」/ Ahjay Stelino（`public/audio/bgm.mp3`，3:19）。授权是 **Mixkit Stock Music Free License**：免费商用、免署名。来源 https://mixkit.co/free-stock-music/ （下载地址记在样片期目录 `SOURCE.md`）。
  - 用户听过 4 首试听后选的。调性：温暖钢琴，60–80 BPM，不要悬疑、滴答脉冲、史诗弦乐。
  - 曲子比片子短时分两遍，每遍都从曲子开头起。上一遍在句子说完的气口淡出，下一遍在章节卡进。样片第一遍在 f5440–5475 淡出，P39「仅此而已」2.2 秒不垫乐，第二遍在 P40 章节卡进。接法写在 `EP.bgm.passes`。
  - 电平：人声在时 0.035（比人声低约 18dB），字间气口 >0.4s 时抬 3dB，夜青 / 檀棕图解镜 +2dB，金句镜 +2dB（`extraUp`），片尾尾巴抬 4dB 再收。换曲子要重新量响度。
- **音效：真实拟音，少而准**。
  - 只给真实的物理动作配声：落位、翻面、盖章、剪线、开门、换片。字出现、标注出现、字幕都不配。
  - 20 秒内 6–8 处，音量 ≤0.35，同一帧只放一条，连发不升调。
  - 24 条裁好的采样和峰值位置在 `tools/sfx_clips.json`；Freesound CC0 来源在 `public/audio/sfx/FREESOUND-CREDITS.md` 和 `audio-manifest.json`。音效表里 `f = 动作帧 − 峰值帧`。
- **重点音效放进句间停顿**。
  - 样片第一版按动作落点排了 142 处，`sfx_check --mix` 判 66 处被人声盖住（MASKED）。
  - 返修时用 `tools/sfx_thin.py` 处理：被盖住的能在 −0.12～+0.30s 内挪进 ≥0.3s 的句间气口就挪，挪不动就删；听得见但仍被人声压着的（AUDIBLE）在 −0.10～+0.20s 内挪。结果写进 `ep/sfx_edit.json`，最后剩 73 处。
  - 分镜阶段就该把关键动作（剪线、落定、开门）的词锚放在气口前后。
- **sfx_check 结构性 FAIL 的原因**：它要求足够多的音效出现在完全没有人声的地方（UNMASKED ≥11）。可这种一镜到底、语速平稳的口播，全片 ≥0.5s 的气口只有 17 处，大多也没有对应动作，所以返修后仍是 UNMASKED 7 → FAIL。这一项是结构性的，看 MASKED 降没降就行（样片 66→1）。
- sfx_check 要对**未归一的混音**跑：成片 loudnorm 抬了约 10dB，人声参考没抬，分级会偏乐观。
- 我们听不到声音：新采样先做试听片给用户挑（`video-shotcraft` 的 `sfx-source.py` 搜，搜索词两个词以内）。

---

## 同场地预设（`场地预设.json`）
样片那个书房、两台 iPhone 竖拍的实测值都在这个文件里，每项带 `_说明` / `_怎么量`。Remotion 用 `src/venue.ts` 读工程上一级的 `../../场地预设.json`；新一期把它拷到期目录根，和 `remotion/` 同级。`_tools/dualcam/` 的脚本用 `--venue` 读。

| 节 | 内容（样片值） |
|---|---|
| `hlg_to_sdr` | iPhone HLG（arib-std-b67、bt2020、10bit）→ bt709：`zscale=t=linear:npl=100,…,tonemap=hable:desat=0,…` |
| `grade_ffmpeg` | 近景不调；中景 `colorchannelmixer=rr=1.03:bb=0.955,eq=gamma=0.86:saturation=0.85`（白 T 恤去偏蓝、压亮、降饱和） |
| `remotion_ms_filter` | 中景再压一层 `brightness(0.95) contrast(1.02) saturate(0.96)`，两机位脸部亮度差 ≤6% |
| `audio` | 主音轨用近景（领夹麦），+16dB，highpass 70Hz，每岛 8ms 淡入淡出 |
| `sync` | 中景 = 近景 − 8.2742s − 8.5e-6×(t−20)。中景晚开机 8.27s → 前 111 帧黑 |
| `face` | 近景脸 x 263–826、y 589–1234，头发顶 440；中景脸 x 349–771、y 620–1056，头发顶 500–520；上提后脸 y 449–926，下巴最低 897 |
| `cu_top_safe` | 近景镜画面字下沿 ≤420（片头标题两行下沿 414） |
| `ms_bottom_clutter` | 中景右下三角区：木桌面（源 y≥2250、右侧 60% 宽）、白线缆、黑色小物件（x 800–930、y>2500），左缘椅子扶手。全靠底部压暗和中景上提遮住 |
| `avatar` | 头像取景：近景 (560,837) 边长 860；中景 (500,770) 边长 660 |
| `round_window_src` | 圆窗取景：中景 (545,800) 边长 520 |
| `ms_hang` | 中景三枚吊坠落点 (190,628) / (890,628) / (540,372)；13 根金线的 x 和下端 y、显形顺序、剪断高度 |
| `scrims` / `subtitle` / `color_regions` | 压暗参数、字幕托 α0.62（白 T 恤）、调色量测区域 |

**换场地、换机位、换座位、换衣服时，带 ★ 的项要重新量，不能照搬。** 机位高度差几厘米，人脸位置、吊坠落点、头像取景就全变了。

### 每期必核（开工时、粗剪交接前）
1. `ffprobe` 看素材 `color_transfer`：HLG / PQ 才用 `hlg_to_sdr`，bt709 就填空字符串。
2. 两机位导 wav，跑 `_tools/dualcam/sync_offset.py --fit` 重测 `sync`（每次拍摄都不同）。粗剪打印的补黑帧数写进交接。
3. 两机位同一时刻各抽 5 帧，跑 `tools/color_stats.py` 核白 T 恤和木柜的颜色比、脸部亮度，调 `grade_ffmpeg.ms` 和 `remotion_ms_filter`。
4. `tools/face_env.py` 量两机位人脸和头发顶（取 20s 以上、人动得多的一段），更新 `face`、`cu_top_safe`，换算中景上提的下巴位置（决定 `scrims.lift.from_y`）。
5. 用量出来的脸位置核 `ms_hang`（吊坠、吊牌离脸和头发 ≥24px，线不经过脸），以及 `avatar`、`round_window_src` 的取景（出一张候选拼图目测头顶、下巴在不在圆里）。
6. 中景抽开头、中间、结尾 3 帧，看底部杂物范围，更新 `ms_bottom_clutter`；压暗不够就只在中景镜加深。
7. 渲几帧量字幕字背后的亮度（≤95），调 `subtitle.plate_alpha`。衣服换深色可以降回 0.46。
8. 近景推镜后标题、顶区字有没有压头发：核 `cu_top_safe`。

---

## 新一期怎么开工
```bash
P=<期目录>
cp -R $KIT/remotion $P/remotion && rm -f $P/remotion/node_modules
cp $KIT/场地预设.json $P/
mkdir -p $P/tools && cp $KIT/tools/* $P/tools/
bash $TALKCRAFT/runtime/link-runtime.sh $P            # node_modules 软链，不要 npm install
```
1. **粗剪**（双机位）：用 `_tools/dualcam/`（sync_offset → build_edl → render_rough）出 `host_cu.mp4`、`host_ms.mp4`、`narration.wav`。用硬链接 `ln` 放进 `remotion/public/host/host.mp4`、`host/host_ms.mp4`、`public/narration.wav`（不要软链）。
   - 字级时间：talkcraft `make_timing` 出 `remotion/src/ep/timing.json`。
   - 声纹：`$PY tools/voice_rms.py --wav remotion/public/narration.wav --out remotion/src/ep/voice_rms.json`。
2. **分镜**：
   - 视觉系统沿用本 README，只微调：配色、幕底、母题这期往哪推。
   - 逐镜写在 `tools/sb_data.py`（格式照 `样片参考/sb_data.example.py`）和 `tools/sb_tmpl/*.md`。
   - 跑 `$PY tools/sb_build.py --root $P`：一次出 SHOTBOOK 第 5 部分、`shots.json`、各幕 json、`sfx_plan.json`、`remotion/src/ep/shots.json` 和 `ep/cues.json`。脚本同时校验字幕拼接等于口播原文、画面字是口播原话。
   - 再跑 variety_lint。
3. **制作**：改 `remotion/src/ep/`（`★` 标的都要改；`Scenes.tsx` 里现在是 Demo，整份换掉），长片按幕拆成 `ep/` 或 `scenes/actN/`。
   - `EP.hostFrames` = 人物视频帧数（ffprobe nb_frames）。
   - 片尾有尾巴时写 `EP.tail`，并在 Root 里加 `preflight: host-tail=` 注释。
4. 渲染、自检、交付照工作台流程：talkcraft 的 `render_shots.mjs`、`tools/preflight.py` / `tools/postcheck.py`、`_tools/loudnorm.py`。

**Demo**（模板自带，8 秒，取样片开头）：
- 内容：顶牌扫字 → 升格问句 + 金线下划线 → 夜青上的小头像收进来 + 线稿吊坠，带双语字幕、两条音效。
- 怎么跑：
  1. 最省事：`bash setup/smoke_test.sh`（用合成的色块假人物，不需要真人素材）。用自己的素材时：`_tools/dualcam` 对原片出一个 8 秒粗剪，放进 `public/host/` 和 `public/narration.wav`。
  2. `npx remotion render src/index.ts Main out/demo.mp4`。
- 没有人物视频时，把 `EP.hostPlaceholder` 设成 `true`，用灰色占位人看版式。
- 2026-11-15 自测：在临时目录拷一份模板、放 8 秒真人素材渲出 240 帧，抽帧看过；没留下 `$TMPDIR/remotion-webpack-bundle-*`。

---

## 踩坑清单（样片各阶段交接整理，去重）
**素材和粗剪**
- iPhone 素材是 HLG HDR，直接 scale 不做色调映射，画面会灰、淡。粗剪前先 `ffprobe` 看 `color_transfer`。
- 双机位文件名和画面可能是反的；两台开机时间不同，晚开机的那条开头没有素材，要补黑并写清帧号，分镜别在这段切过去。
- 无线麦录得很小（−40 LUFS）时，`cutcheck.py` 的绝对 dB 阈值会全岛误报（已改成按 p90 平移）。
- 句中拼接光看 5ms 总能量不够：「呃」的浊音尾只有 −50dB 左右，看着像谷，拼上会被听成一个字。要分频看（80–1000Hz 浊音 vs 3–10kHz 擦音），擦音开头的字，入点要落在擦音里。
- zsh 里 `for r in "0 6"` 不会按空格拆参数；`prog -- node … $S` 也不拆，要用 `${=S}` 或 `prog --sh`。

**版式（竖屏）**
- 字幕固定在 y 1250–1400 以后，人脸必须在它上面，所以「卡在上、人在下」的分屏做不了。卡片只有三种放法：盖在胸前（中景上提）、人缩成圆窗、人退场。
- 近景的脸占 y 440–1235，带叠层的镜头只能用中景。中景按底边放大 1.15（上提），能腾出胸前区，又不露桌面和白线。
- 白衣服上乳白字看不清：草图阶段就拿真实帧试，字幕托加到 α0.62，升格时底部压暗上提。
- 竖屏做不了完整的「人后大字」：头占画面中间四成宽，只能把字放在头顶上方、字底压进头发 20px 左右（`tools/headtop_cut.py` 出头顶遮挡层）。这个遮挡层定稿清缓存时会被删掉，整片重渲前要重出。
- 对开门不能裂人物那一屏（脸会被劈成两半），只裂图解，人在门后；卡里的过曝光束也不要。
- 整屏实拍 + 小头像时，先把头像区留出来再排字（下沿 ≤y 1000，或整体在 x 280 右边）。
- 一张图解里挂多个件时，后加的会撞上先挂的。分镜阶段按坐标核一遍；「标注跟着节点走」时，迁移终点的标注位置要单独核。
- 镜尾那个词挂动画要倒着算：最后一个元素出现后到镜尾要 ≥0.7s，不够就让动画提前起跑。重要信息落定后停够 0.7–1s 再切（审片抓到好几处只亮 0.3–0.5s）。

**动效**
- 反向光圈（实拍收成圆）在圆心离画面边很近时，内容不能和半径一起从头缩，不然中途露出一块缩小的矩形。先只收圆，收到「圆心到最近画边的距离 × 缩放 ≥ 半径」以内，再让内容跟着缩。头像收进来同理。
- 欠阻尼弹簧的过冲顶点不在 π/ω：阻尼大时会提前，过冲也更大。要卡帧的急刹用「指数减速冲过 → 缓回」两段显式写（`GaugeTape`）。
- 金色渐变字（background-clip:text）不能继承 text-shadow，不然父级柔影会画在渐变上面、字发脏。要 `textShadow: none` + `filter: drop-shadow`。
- 线稿 path 不能带 `vector-effect: non-scaling-stroke`：Chrome 会把 pathLength 虚线按屏幕长度算，放大后只画到 75%。
- rack-focus（失焦接力）的 blur 8 / 亮度 0.6 只适合暗底；浅色书架、纸面上，失焦的乳白字基本消失（样片降到 blur 5 / 0.72）。
- 檀棕 / 纸面镜里「只画一根细线」的那几秒，postcheck Q1 会判静止：把幕底和图解组一起包进 ≤0.5%/s 的极缓推。
- 跨镜不动的东西必须逐像素不动（同一份配置、纯函数画面）：吊坠从人物镜切进图解、对开门的门板、网收成人形。
- 檀棕戏台上的小人太暗：填实后加一圈 2px 金边，戏台区垫暖光。金线在亮木书架前要 3.5px + 暗描边。
- 组件里的 SVG `<linearGradient id>` 不能写死：同一帧放两块描框牌，后一块会拿到前一块的渐变（id 撞名）。用 `React.useId()`，再去掉非字母数字（id 里的冒号 / 书名号放进 `url(#…)` 不稳），`FramePlaque` 已这样做；hook 要放在所有 early return 前面。
- SHOTBOOK 组件节和样片实拍有出入，抽组件时以场景代码为准、规格做成参数：C17 规格写 860×420，样片 P39 实际是 480×120 小号；C18 规格是两张纸条，样片三个拷问实际做成了天平 / 实拍字条 / 两人一线；C15 规格有米白大卡，样片 P22 只有聚光扫字的标题。镜头表里的 `FramePlaque` 指 P39 那块描框，原来模板里的 `FramePlaque` 是 P24 的静态小牌，现在合成一个件、用 `f/f0` 切。

**工程和检查**
- timing.json 里的字带标点：字幕和词锚都要在「去标点后的字序列」里找（`u.ts` 已处理）。词锚 near 要早于该词 0.3s 以内：口播里出现两次的词（真正的自由、选择），near 取字幕入点秒 −0.2。
- 圆窗、头像、拱窗都要按合成帧读人物视频（包 Sequence 反而错位），统一用 `HostVideo`。实拍短素材则必须包 Sequence，不然会定格。
- postcheck Q5 在中景满幅镜（有推拉、人在说话、吊坠在摆）会报 3–8 块：块在人脸、T 恤、书架上，逐帧差 <3 就判误报（`tools/q5_source.py` 拿源视频同一时间窗对照）。
- qa_motion 的 static 在「圆窗 + 纸面」镜几乎必报（人被 mask 掉了），以 postcheck 的 freezedetect 为准。
- `render_shots.mjs` 不删自己的打包目录，每次把整个 public/（两条人物视频 1.3GB）复制进 `$TMPDIR`，样片一期留下 28GB。按名字记下，交付时确认没有 Remotion 进程再删。`npx remotion render` 和 `tools/stills_frames.mjs` 会自己删。
- 改了音效或词锚常量要带 `--force-audio`：音轨指纹看不见场景文件里导出的帧常量。开渲前把 sfx 写完。
- 分幕草稿用 `<Sequence from={-N}><Main/></Sequence>`，帧号和音轨都和整片一致，分段可以直接硬链接进整片的 seg-dir 复用（整片从 9 分钟降到 2 分钟）。但 postcheck / qa 的镜头表要平移到本地时间轴。
- variety_lint 会把「同一组件回来做另一件事」算重复：回扣镜要么起不同的卡名并标 `motif`，要么间隔 ≥45s。截短的样段、单幕 json 会报退场占比和「最后一镜退场」，以全片 json 的结果为准。
- 长片分镜用生成器出帧号（`sb_build.py`）：几百个词锚帧号手敲一定出错，中途被打断也能重跑接上。
- Mixkit 免费档：五位数 id 的新素材基本只给 720p（HEAD 返回 200，真下载才 403），老素材多数有 4K。整屏用的空镜先试 `-2160.mp4`。

---

## 成本基线和下期做法
样片：**64 镜 / 351s / $172.4**（全程分阶段子代理）。

| 项 | 美元 |
|---|---|
| 主会话（总控） | 10.2 |
| 样段分镜（先做前 30 秒给用户看） | 18.2 |
| 全片分镜（Fable） | 37.6 |
| 制作（样段 + 一幕 + 二幕 + 三幕 + 返修） | 17.1 + 16.1 + 13.5 + 11.9 + 14.6 = 73.2 |
| 审片（三个，按幕） | 7.7 + 8.4 + 9.9 = 26.0 |
| 粗剪 | 5.0 |
| 找素材 | 1.4 |
| 交付 | 0.7 |

贵在三处：视觉系统和全部组件从零设计；先出样段再铺全片，等于分镜和制作各多一轮；21 个组件边做边改。

**用本模板的下期（目标约 $65–80）**

| 项 | 做法 | 预估 |
|---|---|---|
| 主会话 | 照旧只当总控 | 6–8 |
| 粗剪 | `_tools/dualcam` 直接用，同场地时预设不用重调，只核 sync 和颜色 | 3–4 |
| 找素材 | 空镜 8–12 段 | 1–2 |
| 分镜 | **不出样段**；Fable 只定或微调视觉系统（读本 README，不重写组件规格）；**逐镜按幕拆，交给 Opus**；`sb_build.py` 出帧号 | 18–25 |
| 制作 | 组件直接用，只写场景；按幕拆 2–3 个代理 + 一轮返修 | 28–35 |
| 审片 | **两个**（前半 / 后半） | 8–10 |
| 交付 | — | 1 |

另外几条：
- 分镜阶段先查组件目录：能用组件表达的就用；每期另做 3–5 种新形式，不要把组件目录当全片菜单。
- 音效分镜时就按「少而准」排（20 秒 ≤8 处，重点放进气口），省掉一轮 sfx_thin 返修。
- 跨幕共用的东西（剪影 json、节点网布局、吊坠配置）在第一幕就定好，放进 `ep/`。


## 只有一台机位时
这套默认双机位（近景 cu + 中景 ms）。只有一台机位时：
- `ep/episode.ts` 的 `files.ms` 改成和 `files.cu` 同一个文件，人物形态只用 `FULL_CU`（及推镜），别用 `FULL_MS` / `FULL_MSB`；小头像 `cam` 用 `cu`。
- 景别变化改靠推镜（`host_forms` 的 scale）和信息密时的图解镜，粗剪用工作台通用流程（不用 `_tools/dualcam`）。
- `场地预设.json` 里 ms 相关的项可以不管，cu 的取景和人脸位置照样要量。

## 模型分工（非 Claude 的智能体）
「成本基线」一节里写的 Fable / Opus 是 Claude 的模型名：Fable 用在分镜视觉系统和审片（审美判断），Opus 用在粗剪、逐镜分镜、制作。换成别家智能体时，前者用你能用的最强模型，后者用性价比高的编码模型即可。
