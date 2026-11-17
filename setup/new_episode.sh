#!/usr/bin/env bash
# 新建一期工程：从风格H 复制 remotion 工程、脚本和场地预设，接上 Remotion 共享依赖。
#   bash setup/new_episode.sh 心理-20261201-某某主题
set -euo pipefail
KB="$(cd "$(dirname "$0")/.." && pwd)"
source "$KB/setup/paths.sh"
NAME="${1:?用法: new_episode.sh <账号>-<拍摄日期>-<主题>}"
SRC="$KB/_kit/风格H"; P="$KB/$NAME"
[ -e "$P" ] && { echo "$P 已存在，换个名字"; exit 1; }
mkdir -p "$P"/{audio,asr,handoff,tools}
cp -R "$SRC/remotion" "$P/remotion"; rm -rf "$P/remotion/node_modules"
cp "$SRC/tools/"* "$P/tools/"; cp "$SRC/场地预设.json" "$P/"
bash "$TALKCRAFT/runtime/link-runtime.sh" "$P"
[ -s "$P/remotion/public/audio/bgm.mp3" ] || echo "提醒：还没有配乐，按 _kit/风格H/README.md「环境」一节放 remotion/public/audio/bgm.mp3"
echo "已建好 $P。下一步按 _kit/风格H/README.md 的「新一期怎么开工」走；换了场地 / 机位，先按「每期必核」重量 场地预设.json。"
