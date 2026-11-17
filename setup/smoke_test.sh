#!/usr/bin/env bash
# 冒烟测试：用合成的"假人物"（色块，不是真人）把风格H 自带的 8 秒 Demo 渲出来，验证整条渲染链路，也让人先看看这套风格长什么样。
#   bash setup/smoke_test.sh
# 产物：smoke/样片.mp4、smoke/样张.jpg（4 张关键帧拼图）。smoke/ 可以随时删掉。
# Demo 的字幕和标题是样片开头 8 秒的原话；人物是色块，口型和字幕不对应，这是正常的。
set -euo pipefail
KB="$(cd "$(dirname "$0")/.." && pwd)"
source "$KB/setup/paths.sh"
P="$KB/smoke"; R="$P/remotion"
rm -rf "$P"; mkdir -p "$P"
cp -R "$KB/_kit/风格H/remotion" "$R"; rm -rf "$R/node_modules"
cp "$KB/_kit/风格H/场地预设.json" "$P/"
bash "$TALKCRAFT/runtime/link-runtime.sh" "$P" >/dev/null

echo "== 1/4 合成假人物（近景 / 中景两条，1440×2560，8 秒）和静音口播"
mkdir -p "$R/public/host"
fake(){ ffmpeg -v error -y -f lavfi -i "color=c=$1:s=1440x2560:r=30:d=8" \
  -vf "drawbox=x=420:y=1500:w=600:h=1060:color=0xe8e4dc:t=fill,drawbox=x=$2:y=$3:w=$4:h=$5:color=0xc9a58a:t=fill,drawbox=x=0:y=0:w=1440:h=260:color=0x6b5440:t=fill,noise=alls=8:allf=t,format=yuv420p" \
  -frames:v 240 -c:v libx264 -crf 20 "$6"; }
fake 0x8a6a4a 560 760 320 420 "$R/public/host/host.mp4"       # 近景：脸大
fake 0x7a5e44 600 900 240 320 "$R/public/host/host_ms.mp4"    # 中景：脸小
ffmpeg -v error -y -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 8 "$R/public/narration.wav"
if [ ! -s "$R/public/audio/bgm.mp3" ]; then
  echo "   （没有配乐，垫一段静音）"
  ffmpeg -v error -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 8 -c:a libmp3lame -b:a 64k "$R/public/audio/bgm.mp3"
fi

echo "== 2/4 类型检查"
( cd "$R" && ./node_modules/.bin/tsc --noEmit -p . )

echo "== 3/4 渲染（首次打包 Remotion 要 1～3 分钟）"
( cd "$R" && ./node_modules/.bin/remotion render src/index.ts Main "$P/样片.mp4" --log=error )

echo "== 4/4 关键帧拼图"
ffmpeg -v error -y -i "$P/样片.mp4" -vf "select='eq(n\,40)+eq(n\,110)+eq(n\,170)+eq(n\,225)',scale=360:-1,tile=4x1" -frames:v 1 -update 1 "$P/样张.jpg"
echo "完成：$P/样片.mp4、$P/样张.jpg"
echo "（Remotion 可能在 \$TMPDIR 留下 remotion-webpack-bundle-* 临时目录；确认没有别的渲染在跑后可以删掉）"
