"""审片材料：成片按固定间隔抽帧（全尺寸存 <out>/frames/tNNNN.N.jpg，文件名是成片秒数），再按 cols×rows 拼成拼图（<out>/sheets/，每格标秒数）。

用法（在期目录下）：
  $PY $KB/_tools/qa_frames.py <成片.mp4> [--out qa] [--every 1] [--cols 4] [--rows 3] [--w 480]

只打印一行摘要。2026-11-15 由「剪辑视频五步」那期的 tools/qa_frames.py 通用化（自动按成片画幅算格子高度）。
"""
import argparse, glob, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('--out', default='qa')
ap.add_argument('--every', type=float, default=1.0, help='抽帧间隔（秒）')
ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--rows', type=int, default=3)
ap.add_argument('--w', type=int, default=480, help='拼图里每格宽度')
a = ap.parse_args()

fr, sh = os.path.join(a.out, 'frames'), os.path.join(a.out, 'sheets')
os.makedirs(fr, exist_ok=True); os.makedirs(sh, exist_ok=True)
for f in glob.glob(os.path.join(fr, '*.jpg')) + glob.glob(os.path.join(sh, '*.jpg')):
    os.remove(f)

info =subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration',
                       '-of', 'default=nw=1', a.src], capture_output=True, text=True).stdout
kv = dict(l.split('=', 1) for l in info.split() if '=' in l)
W0, H0, dur = int(kv['width']), int(kv['height']), float(kv['duration'])

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.src, '-vf', f'fps=1/{a.every}', '-q:v', '3',
                os.path.join(fr, 'f%04d.jpg')], check=True)
named = []
for k, f in enumerate(sorted(glob.glob(os.path.join(fr, 'f*.jpg')))):
    t = (k + 0.5) * a.every  # ffmpeg fps 滤镜的第 k 张约在区间中点
    nf = os.path.join(fr, f't{t:06.1f}.jpg'); os.rename(f, nf); named.append((t, nf))

try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
except OSError:
    font = ImageFont.load_default()
W = a.w; H = round(W * H0 / W0); per = a.cols * a.rows
for s in range(0, len(named), per):
    chunk = named[s:s + per]
    rows = (len(chunk) + a.cols - 1) // a.cols
    S = Image.new('RGB', (a.cols * W, rows * (H + 28)), 'white'); d = ImageDraw.Draw(S)
    for i, (t, f) in enumerate(chunk):
        x, y = (i % a.cols) * W, (i // a.cols) * (H + 28)
        S.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y))
        d.text((x + 6, y + H + 2), f'{t:.1f}s', fill='black', font=font)
    S.save(os.path.join(sh, f's{s // per + 1:02d}_{chunk[0][0]:.0f}-{chunk[-1][0]:.0f}s.jpg'), quality=88)

print(f'{len(named)} 帧 → {fr}/；{(len(named) + per - 1) // per} 张拼图 → {sh}/；成片 {W0}×{H0} {dur:.1f}s')
