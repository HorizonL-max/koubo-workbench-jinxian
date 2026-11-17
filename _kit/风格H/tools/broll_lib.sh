#!/bin/bash
# 空镜预处理小函数（source 进本期的 prep_broll.sh 用）：横拍 4K → 吊坠用的方块 / 整屏用的竖条，统一 30fps；短素材 1s 交叉淡化接成循环（不跳帧）。
#   source _kit/风格H/tools/broll_lib.sh
#   SRC=<素材文件夹>/剪辑缓存/空镜  OUT=remotion/public/broll
#   loop_xfade "$SRC/家_1.mp4" 13.9 "crop=2160:2160:760:0,scale=600:600:flags=lanczos,fps=30" "$OUT/b01_home.mp4"
#   cut_clip   "$SRC/婚戒_1.mp4" 1.5 7.2 "crop=1400:1400:1090:300,scale=600:600:flags=lanczos,fps=30" "$OUT/b02_ring.mp4"
# 竖裁整屏：crop=<源高×9/16>:<源高>:<x>:0,scale=1080:1920；720p 素材竖裁要放大 2.67 倍会发软（样片 B08/B09），能下 4K 就下 4K（Mixkit 老素材四位数 id 多数有 2160p）。
# 徽章（吊坠圆相片）只露中间约 60%，主体放正中；整屏实拍左下角（小头像位）别有主体。
BROLL_ENC="-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -an -movflags +faststart"
# loop_xfade <src> <dur秒> <vf> <out>：同一段接自己，1s 交叉淡化，总长 2*dur-1
loop_xfade() {
  local src="$1" dur="$2" vf="$3" out="$4"
  local off=$(python3 -c "print(round($dur-1.0,3))")
  ffmpeg -y -v error -i "$src" -i "$src" -filter_complex \
    "[0:v]$vf,settb=AVTB[a];[1:v]$vf,settb=AVTB[b];[a][b]xfade=transition=fade:duration=1:offset=$off,format=yuv420p[v]" \
    -map "[v]" $BROLL_ENC "$out"
}
# cut_clip <src> <起秒> <长秒> <vf> <out>
cut_clip() { ffmpeg -y -v error -ss "$2" -i "$1" -t "$3" -vf "$4" $BROLL_ENC "$5"; }
# 打印输出的尺寸 / 帧数 / 帧率核一遍
broll_report() { for f in "$@"; do echo "$(basename "$f") $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,r_frame_rate -of csv=p=0 "$f")"; done; }
