#!/usr/bin/env bash
# 风格H 金线讲堂工作台：一键装环境（macOS / Apple Silicon 实测；Windows 用 WorkBuddy 实测可运行）。可重复执行，已装好的步骤会跳过。
#   bash setup/install.sh
# 想用已有的 Python 环境：先 export PY=/path/to/python，再跑本脚本，就不会新建 .venv。
# 两个外部技能已装在 ~/.claude/skills 或 ~/.agents/skills 的会直接用；都没有就克隆到工作台的 vendor/。
set -euo pipefail
KB="$(cd "$(dirname "$0")/.." && pwd)"
source "$KB/setup/paths.sh"
say(){ printf '\n== %s\n' "$*"; }

say "1/6 命令行工具 git / ffmpeg / node / uv（缺的自动装：Mac 用 Homebrew，Windows 用 winget）"
need=()
git --version >/dev/null 2>&1 || need+=(git)
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null || need+=(ffmpeg)
command -v node >/dev/null || need+=(node)
command -v uv >/dev/null || need+=(uv)
if [ ${#need[@]} -gt 0 ] && case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) true;; *) false;; esac; then
  # Windows（Git Bash 等）：用 winget 装，装完要重开终端 PATH 才生效
  echo "缺：${need[*]}（Windows，用 winget 装）"
  command -v winget >/dev/null || command -v winget.exe >/dev/null || { echo "没有 winget：请从微软商店安装「应用安装程序」（App Installer），或手动装 Git / FFmpeg / Node.js 22+ / uv 后再跑本脚本"; exit 2; }
  for t in "${need[@]}"; do
    case $t in git) id=Git.Git;; ffmpeg) id=Gyan.FFmpeg;; node) id=OpenJS.NodeJS.LTS;; uv) id=astral-sh.uv;; esac
    winget install --id "$id" -e --silent --accept-source-agreements --accept-package-agreements || echo "（$id 安装失败或已装，继续）"
  done
  echo "装好了。Windows 要重开终端（或重启智能体）新装的工具才能用，然后再跑一次：bash setup/install.sh"
  exit 3
fi
if [ ${#need[@]} -gt 0 ]; then
  echo "缺：${need[*]}"
  if ! command -v brew >/dev/null; then
    for b in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)" && break; done
  fi
  if ! command -v brew >/dev/null; then
    cat <<'MSG'
没有 Homebrew，装不了上面这些工具。
Homebrew 需要在终端里输一次电脑开机密码，智能体替不了，请用户本人打开「终端」运行下面这行：
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
按提示输密码、回车，装完（会顺带装苹果命令行工具，10 分钟左右）后再跑一次：bash setup/install.sh
MSG
    exit 2
  fi
  brew install "${need[@]}"
fi
nv=$(node -p 'process.versions.node.split(".")[0]')
[ "$nv" -ge 22 ] || { echo "node 版本 $nv 太旧，要 22+：brew upgrade node（用 nvm 的话 nvm install 22）"; exit 1; }
echo "git / ffmpeg / node $nv / uv 都在"

say "2/6 两个剪辑技能（已装在 ~/.claude/skills 或 ~/.agents/skills 的直接用，否则克隆到 vendor/）"
for d in "$TALKCRAFT" "$SHOTCRAFT"; do
  if [ ! -f "$d/SKILL.md" ]; then
    n=$(basename "$d"); echo "装 $n 到 $d"
    git clone --depth 1 "https://github.com/Vincentwei1021/$n.git" "$d"
  fi
done
echo "talkcraft：$TALKCRAFT"; echo "shotcraft：$SHOTCRAFT"
# 工作台自己的技能：补齐 .claude/skills、.agents/skills 两处软链（Windows 解压或某些下载方式会把软链变成普通文件）
for t in .claude .agents; do
  mkdir -p "$KB/$t/skills"
  for s in koubo-jinxian koubo-setup; do
    [ -L "$KB/$t/skills/$s" ] || { rm -rf "$KB/$t/skills/$s"; ln -s "../../skills/$s" "$KB/$t/skills/$s"; }
  done
done

say "3/6 Remotion 共享依赖（装在 talkcraft 的 runtime 里，各期工程只建软链）"
bash "$TALKCRAFT/runtime/check-runtime.sh"

say "4/6 Python 环境"
if [ "$PY" = "$KB/.venv/bin/python" ] && [ ! -x "$PY" ]; then
  uv venv --python 3.12 "$KB/.venv"
fi
VIRTUAL_ENV="$(dirname "$(dirname "$PY")")" uv pip install --python "$PY" \
  funasr modelscope torch torchaudio numpy soundfile opencv-python-headless pillow \
  sherpa-onnx zhconv pypinyin playwright librosa
"$PY" -m playwright install chromium

say "5/6 模型（FunASR 三件套约 1GB，首次要下载几分钟）"
"$PY" - <<'PYEOF'
from funasr import AutoModel
AutoModel(model="paraformer-zh", vad_model="fsmn-vad", punc_model="ct-punc", disable_update=True, log_level="ERROR")
print("FunASR 模型就绪")
PYEOF
mkdir -p "$HOME/.cache/koubo"
Y="$HOME/.cache/koubo/face_detection_yunet_2023mar.onnx"
[ -s "$Y" ] || curl -L -o "$Y" "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
echo "人脸模型就绪：$Y"
echo "（字级时间戳用的 FireRedASR 模型按 talkcraft 的 SKILL.md 下载）"

say "6/6 音效和配乐"
echo "24 条 Freesound CC0 音效随包自带；配乐不随包（Mixkit 不允许再分发），按 _kit/风格H/README.md 自己放到 remotion/public/audio/bgm.mp3"

say "完成。跑一次体检：bash setup/check_env.sh"
echo "路径一览：bash setup/paths.sh"
