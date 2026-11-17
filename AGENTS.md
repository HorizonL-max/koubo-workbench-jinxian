# 口播剪辑工作台 · 风格H 金线讲堂

本文件是工作台的唯一约定，适用于任何能读文件、能跑终端命令的编程智能体（Claude Code、Codex、Cursor、Gemini CLI、OpenCode、WorkBuddy 等）。`CLAUDE.md`、`GEMINI.md` 只是指向本文件的入口。

每次剪辑都把**本文件夹**作为工作目录打开，不要打开素材文件夹。素材路径由用户在对话里给出。

下文 `$KB` = 本文件夹，`$PY` = 装好依赖的 Python（默认 `$KB/.venv/bin/python`，由 `setup/install.sh` 建好）。

## 技能在哪、怎么用
技能就是一份 `SKILL.md` 说明书加配套文件。你的工具会自动加载技能就让它自动加载；**不会自动加载的话，按下表在做对应的事之前手动把那份 `SKILL.md` 读完**：

| 什么时候 | 读哪份 |
|---|---|
| 第一次用、配环境、缺依赖报错 | `skills/koubo-setup/SKILL.md` |
| 剪口播、开新一期、做包装 | `skills/koubo-jinxian/SKILL.md`，再读 `_kit/风格H/README.md` |
| 字级时间戳、SHOTBOOK、字幕、机器闸 | video-talkcraft 的 `SKILL.md` |
| 镜头卡、运镜、转场、音效选材、BGM 卡拍 | video-shotcraft 的 `SKILL.md` |

- 本工作台的两个技能（koubo-jinxian、koubo-setup）在 `skills/`；`.claude/skills/`、`.agents/skills/` 是指向它的软链，方便会扫这两个目录的工具自动发现。
- 外部的两个技能（video-talkcraft、video-shotcraft）放在哪：跑 `bash setup/paths.sh` 会打印出来。查找顺序是环境变量 `TALKCRAFT` / `SHOTCRAFT` → `$KB/vendor/` → `~/.claude/skills/` → `~/.agents/skills/`；都没有时 `setup/install.sh` 会克隆到 `$KB/vendor/`。
- 外部技能的说明是按 Claude Code 写的，里面提到的子代理、内置浏览器等功能，你的工具有同类功能就用同类功能，没有就自己按它的清单做。

## 开工前
- 本工作台要用到这几样基础工具：**git、ffmpeg、node（22+）、uv**，另外还有 Python 依赖、模型、两个外部技能。缺什么由你（智能体）自己装：`bash setup/install.sh` 会自动装好基础工具（Mac 用 Homebrew，Windows 用 winget，装完要重开终端再跑一次），再装其余部分，不要只把清单丢给用户。只有 Mac 上连 Homebrew 都没有时，才请用户本人在终端运行一次 Homebrew 安装命令，因为要输电脑密码，脚本会打印这条命令。Windows 上用 WorkBuddy 实测可以跑通。字体：macOS 用自带的宋体（Songti SC）；Windows / Linux 要装免费的思源宋体（Source Han Serif SC 或 Noto Serif SC，含 Heavy 字重），`check_env.sh` 会提示。
- 第一次用、或不确定环境好不好：先跑 `bash setup/check_env.sh`，有缺项就跑 `bash setup/install.sh`。
- 想先看看这套风格长什么样：`bash setup/smoke_test.sh`，8 秒样片出在 `smoke/`。
- 装完或改过工作台后想确认一切正常：`bash setup/selftest.sh`，在临时副本里跑体检 + 脱敏检查 + 冒烟测试，只打印一张通过 / 失败汇总表（约 3～5 分钟）。
- 新建一期：`bash setup/new_episode.sh <账号>-<拍摄日期>-<主题>`。

## 目录约定
- 每期工程放在 `$KB/<账号>-<拍摄日期>-<主题>/`，只放代码、分镜、字幕、时间戳、小音频这类小文件。
- **大文件放素材盘**：转码副本、分段、粗剪、草稿渲染等 ffmpeg 产物写到 `<素材文件夹>/剪辑缓存/`。
- **成片**导出到 `<素材文件夹>/剪辑输出/`。
- 例外：`remotion/public/` 里的人物视频必须是放在内置盘的真实文件。软链到外置盘会导致渲染 404。
- 外置盘如果是 ExFAT：建不了软链，还会生成 `._` 文件。不要在上面建 Remotion 工程或 node_modules。
- 要复用的脚本不要写进系统临时目录（重启就没了）。通用脚本放 `_tools/`，本期专用的放 `<期名>/tools/`。

## 环境
- Python 一律用 `$PY`，不要用系统自带的 `python3`。缺包时 `VIRTUAL_ENV=$(dirname $(dirname $PY)) uv pip install <包>`。
- 转写默认用 FunASR（paraformer + fsmn-vad + ct-punc），模型缓存在 `~/.cache/modelscope`。人脸检测模型在 `~/.cache/koubo/face_detection_yunet_2023mar.onnx`。
- macOS 没有 `timeout` 命令。需要超时控制时，改成后台运行，或用 Python subprocess 的 timeout 参数。
- Remotion 依赖共用 video-talkcraft 的 `runtime/node_modules`，工程里只建软链（`new_episode.sh` 会做），不要在工程里跑 `npm install`。

## 流程
- 粗剪、字幕、动效包装、配乐全部在本地用 ffmpeg + Remotion 完成。
- **video-talkcraft 和 video-shotcraft 两个都加载，结合起来用**：
  - talkcraft 管口播管线：字级时间戳、SHOTBOOK、字幕、人物形态、机器闸。
  - shotcraft 管镜头语言：镜头卡、2.5D 运镜、冲击反馈、转场、Freesound 音效选材、BGM 卡拍，以及审美准则 `references/aesthetic-rules.md`。
  - 选卡时两边都查：talkcraft 看 `references/taxonomy.md`，shotcraft 看 `references/shots/` 的 frontmatter。用 shotcraft 的卡时，要读卡片全文和它对应的 demo 源码。
  - shotcraft 的 Ink Press 模板、宣传片三种模式询问、交付后的推广话术都不适用于口播，不要照搬。
- 包装从 `_kit/风格H/` 起步，按 `skills/koubo-jinxian/SKILL.md` 和风格 README 走。
- 剪辑和字幕以实际口播为准，保留临场发挥。卡片文字只用口播原话。
- Remotion 每次渲染都会把整个 `public/` 复制到系统临时目录，而且经常不清理（每次几百 MB）。渲染结束、确认没有渲染进程后，删掉 `$TMPDIR/remotion-webpack-bundle-*`。**几条会话同时剪时不要删**：这个目录是共享的，删了会让别的会话正在跑的渲染报 404。删之前先用 `pgrep -fl remotion` 确认整台机器上没有任何 Remotion 进程。
- 耗时几分钟以上的渲染或转码放后台跑。

## 双机位
- 本风格默认两台机位同时拍（近景 + 中景），粗剪用 `_tools/dualcam/` 按声音对齐，出两条帧级同步的人物视频，包装时按句切机位；整屏实拍空镜时人缩成左侧金边小头像继续讲。
- iPhone 素材常是 HLG HDR（`ffprobe` 看 `color_transfer=arib-std-b67`），不转 SDR 画面会发灰，`dualcam` 已处理。
- 晚开机的那台开头没有画面，会补黑，包装时这段只能用另一台。
- 只有一台机位：见 `_kit/风格H/README.md`「只有一台机位时」。

## 粗剪：按音频切素材时的检查
ASR 只给字的起止时间，听不出打嗝、咳嗽和重说。按 ASR 时间戳切岛时，下面三种情况最容易漏进成片：
- **打嗝、咳嗽**：常紧贴在句尾或句首，中间没有静音。每个岛的入点和出点都要用 20ms 能量包络核一遍，切点落在能量谷里；谷之后 0.5s 内若有短促爆发（短于 0.3s、高于 -20dB），就是打嗝、咳嗽或下一遍的起音，切点要提到谷里。`_tools/cutcheck.py` 是这条的机器版。
- **间隔很近的两段重拍有重叠词**：第一遍说到一半马上重说时，第一遍的尾巴会被包进第二遍的岛，或者第二遍开头的词和第一遍重复（如连着两个「但是」）。把相邻两个岛的衔接处各取前后 1～2 个字对比，出现重复字或残字就收紧切点；对不上时用 `_tools/chars.py` 看那几百毫秒的字。
- 粗剪拼好后，再整条转写一遍，查连续重复的字词（「但是但是」「我们我们」）和句中多出来的单字，逐处修掉再进包装。

## 提速与质量
- **复用风格库，分镜重新设计**：组件、卡片皮肤、音效、流程脚本直接用；SHOTBOOK、选卡、版式、文案、场景代码每期重新设计，且每期至少 3～5 种新包装形式。
- **选卡看风格 README 里的卡片目录**，不要把技能 references 和卡片源码整份读进上下文。要用某张卡时只读参数部分。
- **审片只做一轮**：机器检查和独立审片各一次（工具支持子代理就交给一个没参与制作的子代理审，不支持就自己按 `_kit/风格H/README.md` 的「已知注意点」逐条审），一次修完所有问题。修改后只重渲改过的镜头（talkcraft 的 `render_shots.mjs --only`，带上相邻镜头），最后整片渲染一次。
- **具体物体画出来**：文案里出现电池、镜头、手机、充电宝这类能画的东西，用图形 + 动画表现，文字只做标注，不要整屏字卡。写 SHOTBOOK 时逐句标出可画的物体，库里没有就新画并补进风格库。
- **长片防重复**：3～5 分钟的片子，写完 SHOTBOOK 先填 `shots.json`，再跑 `tools/variety_lint.py`，不过不渲。用到的实拍空镜、配乐，来源和授权记进期目录 `SOURCE.md`。
- **渲染前后自检**：渲染前跑 `tools/preflight.py <remotion目录> shots.json`，交付前跑 `tools/postcheck.py <成片> shots.json`，FAIL 不渲、不交。踩到新坑当场写进经验：能自动查的加进脚本，查不了的补进 `_kit/风格H/README.md` 的「已知注意点」。
- 镜头检查攒几个一起看：每写完 4～5 个镜头出一张拼图，不要每个镜头都单独截图。

## 交付与清理
- 成片交付到 `剪辑输出/`，交付前用 `_tools/loudnorm.py` 响度归一到 -14 LUFS。
- **画幅和清晰度**：竖屏 9:16，成片 1080×1920；粗剪人物视频出 **1440×2560**（`_tools/dualcam/render_rough.py`），Remotion 编码 CRF 12（`remotion.config.ts` 已设）。人物要推镜放大，1080p 素材放大后发软。交付前用 ffprobe 看一眼码率，成片约 7～8 Mbps。
- **竖屏安全区**：底部约 20%、右侧一列（点赞 / 评论按钮）会被平台 UI 盖住，字幕和关键信息放中上部。
- 用户确认定稿后，删除 `<素材文件夹>/剪辑缓存/`、`<期名>/remotion/public/` 里的人物视频和 `remotion/out/` 里的草稿。代码和分镜保留。

## 可复用脚本（`_tools/`）
- `funasr_transcribe.py`：转写音频，输出字级时间戳。
- `funasr_align.py`：把转写结果和口播稿对齐（借用 talkcraft 的 `timestamps_cpu`）。
- `chars.py`：查看某段时间里的字。
- `cutcheck.py`：粗剪切点能量核查。
- `loudnorm.py`：成片两遍 loudnorm 到 -14 LUFS，视频流直接拷贝，交付前用这个。
- `dualcam/`：双机位粗剪（按声音对齐两台机位、HLG→SDR、两机位调色对齐，出两条帧级同步的人物视频 + 主音轨），用法见 `_tools/dualcam/README.md`。
- `qa_frames.py` / `qa_grid.py` / `qa_motion.py`：审片材料（每秒一帧拼图、按秒抽帧拼图、静止 / 黑帧 / 闪帧机检）。
