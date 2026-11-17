#!/usr/bin/env bash
# 统一找两个外部技能和 Python。被其他 setup 脚本 source；直接运行时打印结果。
#   bash setup/paths.sh
# 查找顺序：环境变量 → $KB/vendor/ → ~/.claude/skills/ → ~/.agents/skills/
KB="${KB:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
# 刚装完 Homebrew 还没把它加进 PATH 时，这里补上（Apple Silicon 在 /opt/homebrew，Intel 在 /usr/local）
if ! command -v brew >/dev/null 2>&1; then
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)" && break; done
fi
find_skill(){  # $1 = 技能名；找不到时返回 vendor 下的默认安装位置
  local d
  for d in "$KB/vendor/$1" "$HOME/.claude/skills/$1" "$HOME/.agents/skills/$1"; do
    [ -f "$d/SKILL.md" ] && { echo "$d"; return; }
  done
  echo "$KB/vendor/$1"
}
TALKCRAFT="${TALKCRAFT:-$(find_skill video-talkcraft)}"
SHOTCRAFT="${SHOTCRAFT:-$(find_skill video-shotcraft)}"
PY="${PY:-$KB/.venv/bin/python}"
export KB TALKCRAFT SHOTCRAFT PY
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  echo "KB=$KB"; echo "TALKCRAFT=$TALKCRAFT"; echo "SHOTCRAFT=$SHOTCRAFT"; echo "PY=$PY"
fi
