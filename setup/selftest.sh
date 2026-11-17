#!/usr/bin/env bash
# 一键自检：把工作台复制到临时目录，在干净副本里依次跑 环境体检 → 脱敏检查 → 冒烟测试（含类型检查和 8 秒渲染）→ 核样片，
# 最后只打印一张汇总表；详细输出写进 selftest.log。不改动工作台本身（只把样片和拼图拷回 smoke/）。
#   bash setup/selftest.sh
# 前提：已经跑过 setup/install.sh（或 export PY=已有 Python 环境）。约 3～5 分钟。
set -uo pipefail
KB="$(cd "$(dirname "$0")/.." && pwd)"
source "$KB/setup/paths.sh"            # 先在原工作台里定好 PY / 两个技能的位置，副本沿用
LOG="$KB/selftest.log"; : > "$LOG"
T="$(mktemp -d)/工作台副本"
rsync -a --exclude .venv --exclude vendor --exclude smoke --exclude selftest.log "$KB/" "$T/"
rows=(); fail=0
step(){ local name="$1"; shift; echo "######## $name" >>"$LOG"
  local t0=$SECONDS
  if "$@" >>"$LOG" 2>&1; then rows+=("通过  $name（$((SECONDS-t0))s）"); else rows+=("失败  $name（$((SECONDS-t0))s，看 selftest.log）"); fail=1; fi; }
scrub(){ local hits  # 查本机用户目录；/home/linuxbrew 是 Homebrew 的标准安装位置，不算
  hits=$(grep -rIn -E "/Users/[A-Za-z]|/home/[a-z]+/|\.venvs/" "$T" --exclude-dir=node_modules --exclude-dir=smoke --exclude=selftest.sh | grep -v "/home/linuxbrew/")
  [ -z "$hits" ] || { echo "$hits"; return 1; }; }
frames(){ local n; n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$T/smoke/样片.mp4"); echo "样片帧数 $n"; [ "$n" = 240 ]; }
step "环境体检（check_env.sh）" bash "$T/setup/check_env.sh"
step "脱敏检查（包里没有本机路径）" scrub
step "冒烟测试（类型检查 + 8 秒渲染）" bash "$T/setup/smoke_test.sh"
step "样片 240 帧" frames
mkdir -p "$KB/smoke"; cp "$T/smoke/样片.mp4" "$T/smoke/样张.jpg" "$KB/smoke/" 2>/dev/null
echo; echo "===== 自检结果 ====="; printf '%s\n' "${rows[@]}"
[ $fail = 0 ] && echo "全部通过。样片：smoke/样片.mp4，拼图：smoke/样张.jpg" || echo "有失败项，详细输出在 $LOG"
rm -rf "$(dirname "$T")"
exit $fail
