---
name: koubo-setup
description: 口播剪辑工作台（风格H 金线讲堂）的环境安装与体检：git / ffmpeg / Node / uv 基础工具（缺了自动装）、video-talkcraft 与 video-shotcraft 两个技能、Remotion 共享依赖、Python 环境（FunASR 等）、模型、字体、音效配乐。用户第一次使用这个工作台、说"帮我配环境""检查环境""装依赖"，或者转写 / 渲染因为缺依赖报错时使用。
---

# 工作台环境安装与体检

1. 先体检（只读）：`bash setup/check_env.sh`。逐项给出 [好] / [缺] / [提示]。
2. 有 [缺] 就跑安装：`bash setup/install.sh`。它会按顺序做六步，可重复执行，已装好的会跳过：
   1) 查 git / ffmpeg / node（22+）/ uv，缺的自动装：Mac 用 `brew install`，Windows 用 `winget install`（装完脚本以 exit 3 退出，要重开终端或重启会话让 PATH 生效，再跑一次 `install.sh`）。**这一步由你直接跑，不要只把命令丢给用户**；只有 Mac 上连 Homebrew 都没有时，脚本会停下并打印 Homebrew 的安装命令（要输电脑密码），这时请用户本人在终端运行，装完你再接着跑 `install.sh`；
   2) 找 video-talkcraft / video-shotcraft（`~/.claude/skills/`、`~/.agents/skills/` 里已有就直接用），都没有就从 GitHub 克隆到工作台的 `vendor/`；顺手补齐 `.claude/skills`、`.agents/skills` 两处软链；
   3) 跑 talkcraft 的 `runtime/check-runtime.sh` 装 Remotion 共享依赖；
   4) 用 uv 在工作台里建 `.venv`（Python 3.12）并装包；用户已有环境时先 `export PY=...` 就不新建；
   5) 下载 FunASR 模型（约 1GB）和 YuNet 人脸模型；
   6) 确认音效（24 条 Freesound CC0，随包自带）；配乐不随包，提醒用户按 `_kit/风格H/README.md` 自己下载放进去。
   安装要下载几个 GB、耗时较长，放后台跑，并先告诉用户大概要多久。
3. 装完再跑一次体检，全部 [好] 才开工。想确认整套通不通，跑 `bash setup/selftest.sh`（3～5 分钟，在临时副本里跑体检 + 脱敏检查 + 冒烟渲染，只打印汇总表；你只需要读最后几行）。各路径在哪可以跑 `bash setup/paths.sh` 看。
4. [提示] 项不拦开工，但要转告用户：
   - FireRedASR 时间戳模型：按 talkcraft SKILL.md 的说明下载，或改用 `--backend whisper`。
   - 字体：macOS 用自带的 Songti SC；Windows / Linux 要装免费的思源宋体（Source Han Serif SC / Noto Serif SC，含 Heavy），不然标题粗字出不来。
   - 配乐：没有 `bgm.mp3` 不拦开工，但交付前要有。

注意：
- 不需要密码的安装（`brew install`、`uv`、`git clone`、下载模型）你直接做；需要管理员密码的（`sudo`、装 Homebrew 本身）不要替用户执行，把命令给用户，让他们自己跑。
