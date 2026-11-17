# 口播剪辑工作台 · 风格H 金线讲堂

一个给 AI 编程智能体用的**竖屏口播**剪辑模板，只带一套包装风格：**金线讲堂**——宋体衬线、香槟金细线、米白纸卡、夜青 / 檀棕两种暗场，母题是挂在金线上的吊坠；中英双语字幕；整屏实拍空镜时人物缩成左侧金边小头像继续讲。知性、温暖、克制，适合心理学、人生观点、成长、关系、知识讲堂类口播。

把真人出镜的中文口播素材（默认两台机位：近景 + 中景，也支持单机位）交给智能体，它会完成**双机位对齐粗剪 → 字级双语字幕 → 动效包装 → 音效配乐 → 自检 → 响度归一**，在本地用 ffmpeg + Remotion 出 1080×1920 成片。

适用于能读文件、能跑终端命令的智能体：Claude Code、Codex、Cursor、Gemini CLI、OpenCode、WorkBuddy 等。约定写在 `AGENTS.md`，技能是通用的 `SKILL.md` 格式。

## 需要什么
- macOS（Apple Silicon 实测）；Windows / Linux 理论可用（安装脚本沿用风格A 那版，Windows 上用 WorkBuddy 跑通过风格A）
- 一个编程智能体，能力越强越好：流程长，要写 Remotion 场景代码
- 基础工具 `git`、`ffmpeg`、`node`（22+）、[`uv`](https://docs.astral.sh/uv/)：**不用自己装**，智能体跑 `setup/install.sh` 时会自动装（Mac 用 Homebrew，Windows 用 winget）。Mac 上连 Homebrew 都没有时，需要你本人在终端运行一次 Homebrew 的安装命令（要输开机密码），智能体会把命令给你。
- 磁盘约 5GB（Python 依赖 + 模型 + Remotion 依赖）
- **字体**：macOS 自带的宋体（Songti SC）即可；Windows / Linux 请装免费商用的**思源宋体**（Source Han Serif SC / Noto Serif SC，含 Heavy 字重）
- **配乐要自己下载**：样片用的是 Mixkit 免费曲「Piano Reflections」，授权不允许随模板再分发，见 `_kit/风格H/README.md`「环境」一节
- 依赖两个开源剪辑技能，安装脚本会自动装：[video-talkcraft](https://github.com/Vincentwei1021/video-talkcraft)（**非商用许可**）、[video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)

## 下载
三种方式任选一种：

- **让智能体帮你下**（最省事）：对它说「把 https://github.com/HorizonL-max/koubo-workbench-jinxian 克隆到本地」。
- **自己用 git**：
  ```bash
  git clone https://github.com/HorizonL-max/koubo-workbench-jinxian.git
  ```
- **不用 git**：在本页点绿色的 **Code → Download ZIP**，解压即可。解压出来的文件夹名会多一个 `-main` 后缀，不影响使用。

**以后怎么更新**：用 git 下载的，对智能体说「git pull 更新工作台」就能拿到最新修复；你自己剪的每期工程（`<账号>-<日期>-<主题>/`）不进版本库，更新不会动它们。下载 ZIP 的，重新下载一份新的，再把自己的每期工程文件夹挪过去。

> Windows 用户：`.claude/skills/`、`.agents/skills/` 是软链接，Windows 上可能变成普通文本文件，工具就不会自动发现技能。不影响使用——第一句话让智能体「先读 AGENTS.md」，它会按 AGENTS.md 直接去 `skills/` 找。

## 上手
1. 把下载好的整个文件夹放到内置盘上，用你的智能体**以这个文件夹为工作目录**打开。
2. 对它说「先读 AGENTS.md，然后帮我配环境」。它会跑 `setup/check_env.sh` 体检，再跑 `setup/install.sh` 自动补齐缺项（首次要下载几个 GB）。
3. 说「跑一下自检」，或自己跑 `bash setup/selftest.sh`：在临时副本里跑体检、脱敏检查、冒烟渲染，3～5 分钟后打印一张通过 / 失败表；`smoke/样片.mp4` 是一段 8 秒样片（人物是合成的色块占位，字幕是样片开头的原话）。
4. 说「剪这期口播，素材在 /path/to/素材文件夹」。两台机位的话告诉它哪条是近景、哪条是中景。

> 各家工具读约定文件的方式不同：Claude Code 读 `CLAUDE.md`（已指向 `AGENTS.md`），Gemini CLI 读 `GEMINI.md`（同上），Codex、Cursor、OpenCode 等直接读 `AGENTS.md`。拿不准时，第一句话让它「先读 AGENTS.md」最稳。

## 目录
```
AGENTS.md                 工作台约定（唯一一份）
CLAUDE.md / GEMINI.md     指向 AGENTS.md 的入口
skills/
  koubo-jinxian/          风格H 怎么用：判断题材、开新期、硬规
  koubo-setup/            装环境、体检
.claude/skills/ .agents/skills/   指向 skills/ 的软链
_kit/风格H/
  README.md               风格说明书：视觉 token、组件目录、人物形态、双语字幕、配乐音效、每期必核、开工步骤、踩坑清单、成本基线
  场地预设.json            同场地参数（两机位调色、遮挡区、人脸位置、小头像取景……），换场地按「每期必核」重量
  remotion/               Remotion 工程：src/parts 组件、src/ep 每期配置（自带 8 秒 Demo）、24 条 CC0 音效
  tools/                  分镜生成、人脸包络、声纹、音效精简、防重复检查、渲染前后自检
  样片参考/                样片的分镜和几个代表场景，只看写法
_tools/                   通用脚本：转写、对齐、查字、切点核查、响度归一、审片拼图，dualcam/ 双机位粗剪
setup/                    install / check_env / new_episode / smoke_test / selftest / paths
<账号>-<日期>-<主题>/       每期工程（new_episode.sh 生成）
```
大文件（转码、粗剪、草稿）写到素材文件夹的 `剪辑缓存/`，成片在 `剪辑输出/`。

## 许可
本模板按 PolyForm Noncommercial 1.0.0 提供（源自 video-talkcraft），非商业用途免费；用它做出的视频归你所有。音效、配乐、字体、模型的来源与许可见 [NOTICE.md](NOTICE.md)。
