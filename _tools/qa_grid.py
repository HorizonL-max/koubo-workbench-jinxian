"""审片补帧：从成片按给定秒数抽帧，可选裁一块区域放大，拼成一张标好秒数的图。一次命令出一张图，不用逐帧渲染。

用法：
  $PY $KB/_tools/qa_grid.py <成片.mp4> <输出.jpg> <秒> [秒 ...] [--crop x0,y0,x1,y1] [--cols 3] [--w 640]

  --crop  按成片原始像素裁剪（看小字、遮挡、叠字时用）；不写就是整帧
  --w     每格输出宽度；裁剪后的小区域会被放大到这个宽度
例：查 18.0～19.7 秒右下角的字有没有压进人物片窗
  qa_grid.py v1.mp4 /private/tmp/qa_x/g1.jpg 18.0 18.3 18.6 18.9 19.2 19.7 --crop 860,470,1440,920 --cols 3

只打印一行：输出路径和尺寸。抽出的单帧放在输出图旁边的 <输出名>_frames/ 里，需要看全尺寸时直接读。
2026-11-15 由「剪辑视频五步」审片代理临时写的 grid.py 通用化。
"""
import argparse, os, subprocess
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('secs', nargs='+', type=float)
ap.add_argument('--crop'); ap.add_argument('--cols', type=int, default=3); ap.add_argument('--w', type=int, default=640)
a = ap.parse_args()

fdir = os.path.splitext(a.out)[0] + '_frames'
os.makedirs(fdir, exist_ok=True)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 20)
except OSError:
    font = ImageFont.load_default()

tiles = []
for s in a.secs:
    f = os.path.join(fdir, f't{s:07.2f}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s:.3f}', '-i', a.src, '-frames:v', '1', f], check=True)
    im = Image.open(f).convert('RGB')
    if a.crop:
        x0, y0, x1, y1 = map(int, a.crop.split(','))
        im = im.crop((x0, y0, x1, y1))
    h = round(im.height * a.w / im.width)
    im = im.resize((a.w, h))
    d = ImageDraw.Draw(im)
    lab = f'{s:.2f}s'
    d.rectangle((0, 0, 12 * len(lab) + 12, 26), fill=(255, 230, 0))
    d.text((6, 3), lab, fill=(0, 0, 0), font=font)
    tiles.append(im)

w, h = tiles[0].size
rows = (len(tiles) + a.cols - 1) // a.cols
G = Image.new('RGB', (w * min(a.cols, len(tiles)), h * rows), (255, 255, 255))
for i, im in enumerate(tiles):
    G.paste(im, ((i % a.cols) * w, (i // a.cols) * h))
G.save(a.out, quality=88)
print(f'{a.out}  {G.size[0]}×{G.size[1]}  {len(tiles)} 格  单帧在 {fdir}/')
