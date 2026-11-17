#!/usr/bin/env bash
# 环境体检：逐项打勾，缺什么告诉你怎么补。只读，不改任何东西。
#   bash setup/check_env.sh
KB="$(cd "$(dirname "$0")/.." && pwd)"
source "$KB/setup/paths.sh"
fail=0
ok(){ printf '  [好] %s\n' "$*"; }
no(){ printf '  [缺] %s\n' "$1"; [ -n "${2:-}" ] && printf '       → %s\n' "$2"; fail=1; }
warn(){ printf '  [提示] %s\n' "$*"; }

echo "命令行工具（缺了跑 bash setup/install.sh，会用 Homebrew 自动装）"
git --version >/dev/null 2>&1 && ok "git" || no "git" "bash setup/install.sh"
for c in ffmpeg ffprobe node uv; do command -v $c >/dev/null && ok "$c" || no "$c" "bash setup/install.sh"; done
if command -v node >/dev/null; then nv=$(node -p 'process.versions.node.split(".")[0]'); [ "$nv" -ge 22 ] && ok "node 版本 $nv" || no "node 版本 $nv 太旧（要 22+）" "brew upgrade node 或用 nvm 换 22+"; fi

echo "剪辑技能"
[ -f "$TALKCRAFT/SKILL.md" ] && ok "video-talkcraft（$TALKCRAFT）" || no "video-talkcraft" "bash setup/install.sh"
[ -f "$SHOTCRAFT/SKILL.md" ] && ok "video-shotcraft（$SHOTCRAFT）" || no "video-shotcraft" "bash setup/install.sh"
[ -d "$TALKCRAFT/runtime/node_modules/remotion" ] && ok "Remotion 共享依赖" || no "Remotion 共享依赖" "bash $TALKCRAFT/runtime/check-runtime.sh"

echo "Python（$PY）"
if [ -x "$PY" ]; then
  "$PY" - <<'PYEOF' || fail=1
import importlib.util
mods = ['funasr','torch','numpy','soundfile','cv2','PIL','sherpa_onnx','zhconv','pypinyin']
bad = [m for m in mods if importlib.util.find_spec(m) is None]
print('  [好] Python 包齐全' if not bad else f'  [缺] Python 包：{" ".join(bad)}\n       → bash setup/install.sh')
raise SystemExit(1 if bad else 0)
PYEOF
else
  no "Python 环境" "bash setup/install.sh（或 export PY=已有环境的 python）"
fi

echo "模型"
compgen -G "$HOME/.cache/modelscope/models/iic--speech_*paraformer*" >/dev/null || compgen -G "$HOME/.cache/modelscope/hub/*/iic/speech_*paraformer*" >/dev/null || compgen -G "$HOME/.cache/modelscope/hub/iic/speech_*paraformer*" >/dev/null \
  && ok "FunASR 模型" || no "FunASR 模型" "bash setup/install.sh（第 5 步会下载）"
[ -s "$HOME/.cache/koubo/face_detection_yunet_2023mar.onnx" ] && ok "YuNet 人脸模型" || no "YuNet 人脸模型" "bash setup/install.sh"
compgen -G "$HOME/.cache/koubo/sherpa-onnx-fire-red-asr2*" >/dev/null && ok "FireRedASR 时间戳模型" || warn "没找到 FireRedASR 时间戳模型，按 talkcraft 的 SKILL.md 下载，或改用 --backend whisper"

echo "字体（宋体衬线 + Georgia，用系统字体）"
if [ "$(uname)" = Darwin ]; then
  [ -f /System/Library/Fonts/Supplemental/Songti.ttc ] && ok "macOS：Songti SC" || warn "没找到 Songti SC：装思源宋体（Source Han Serif SC，含 Heavy）"
elif fc-list 2>/dev/null | grep -qiE "Source Han Serif|Noto Serif (CJK )?SC"; then ok "思源宋体"
else warn "没找到思源宋体：Windows / Linux 请装 Source Han Serif SC 或 Noto Serif SC（免费商用，要含 Heavy 字重），不然标题粗字出不来"; fi

echo "音效和配乐"
n=$(ls "$KB/_kit/风格H/remotion/public/audio/sfx/"*.mp3 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 24 ] && ok "音效 $n 条（Freesound CC0，随包自带）" || no "音效只有 $n 条" "重新解压工作台"
[ -s "$KB/_kit/风格H/remotion/public/audio/bgm.mp3" ] && ok "配乐 bgm.mp3" || warn "没有配乐：按 _kit/风格H/README.md「环境」一节自己下载放进去（冒烟测试会自动垫静音，不拦开工）"

echo
[ $fail = 0 ] && echo "全部通过，可以开工：bash setup/new_episode.sh <期名>（想先看样片：bash setup/smoke_test.sh）" || echo "有缺项，按上面的 → 补齐后再跑一次。"
exit $fail
