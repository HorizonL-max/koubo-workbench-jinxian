"""返修前后对比拼图：同一秒从两条成片各抽一帧，左旧右新，每行 N 对。
用法：python tools/ab_sheet.py <旧.mp4> <新.mp4> <输出.jpg> <秒> [秒…] [--w 300] [--cols 3]"""
import subprocess
import sys
import io
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
w = 300
cols = 3
if '--w' in args:
    i = args.index('--w'); w = int(args[i + 1]); del args[i:i + 2]
if '--cols' in args:
    i = args.index('--cols'); cols = int(args[i + 1]); del args[i:i + 2]
old, new, out, *secs = args


def grab(src, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    return im.resize((w, int(im.height * w / im.width)))


pairs = [(float(s), grab(old, s), grab(new, s)) for s in secs]
h = pairs[0][1].height
rows = (len(pairs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (2 * w + 12), rows * h), 'black')
d = ImageDraw.Draw(sheet)
try:
    fnt = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 18)
except Exception:
    fnt = None
for k, (t, a, b) in enumerate(pairs):
    x, y = (k % cols) * (2 * w + 12), (k // cols) * h
    sheet.paste(a, (x, y)); sheet.paste(b, (x + w, y))
    d.rectangle([x, y, x + 120, y + 24], fill='black'); d.text((x + 4, y + 2), f'{t:.2f} 旧', fill='yellow', font=fnt)
    d.rectangle([x + w, y, x + w + 60, y + 24], fill='black'); d.text((x + w + 4, y + 2), '新', fill='lime', font=fnt)
sheet.save(out, quality=82)
print(out)
