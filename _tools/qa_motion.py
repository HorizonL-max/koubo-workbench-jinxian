"""审片机检：逐帧比较成片，找出整屏静止过久、黑帧、闪帧、画面突变的时刻。

用法：
  $PY $KB/_tools/qa_motion.py <成片.mp4> [--mask x0,y0,x1,y1 ...] [--static 1.5] [--thr 0.15]

  --mask    排除的区域（成片原始像素），可写多个：人物片窗、字幕区。人在说话、字幕在变不算画面在动。
            例（风格G 4:3，人物右下片窗 + 字幕区）：--mask 860,470,1440,920 --mask 0,920,1440,1080
  --static  连续静止多少秒以上报出来（默认 1.5，对应「1.5 秒以上整屏不动」的规矩）
  --thr     判定静止的平均像素差阈值（0～255 灰度，默认 0.15）

输出只有结论行（每类最多 30 行），按时间排序：
  static  起-止  时长      整屏（去掉 mask）几乎不动
  black   秒数            近黑帧（平均亮度 < 3）
  flash   秒数            单帧亮度突跳又回落（闪帧）
  jump    秒数            整帧突变（硬切或跳帧，硬切正常，跳帧要看）
2026-11-15 由「剪辑视频五步」审片代理临时写的 motion.py 通用化。
"""
import argparse, subprocess
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('--mask', action='append', default=[])
ap.add_argument('--static', type=float, default=1.5); ap.add_argument('--thr', type=float, default=0.15)
a = ap.parse_args()

info = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
                       '-of', 'default=nw=1', a.src], capture_output=True, text=True).stdout
kv = dict(l.split('=', 1) for l in info.split() if '=' in l)
W0, H0 = int(kv['width']), int(kv['height'])
num, den = kv['r_frame_rate'].split('/'); fps = float(num) / float(den)
W = 360; H = round(H0 * W / W0); H += H % 2
sx, sy = W / W0, H / H0

mask = np.ones((H, W), bool)
for m in a.mask:
    x0, y0, x1, y1 = map(int, m.split(','))
    mask[int(y0 * sy):int(y1 * sy), int(x0 * sx):int(x1 * sx)] = False

p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', a.src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                     stdout=subprocess.PIPE)
prev = None; diffs, lum, full = [], [], []
while True:
    b = p.stdout.read(W * H)
    if len(b) < W * H:
        break
    f = np.frombuffer(b, np.uint8).reshape(H, W).astype(np.int16)
    lum.append(f.mean())
    if prev is None:
        diffs.append(0.0); full.append(0.0)
    else:
        d = np.abs(f - prev); diffs.append(d[mask].mean()); full.append(d.mean())
    prev = f
p.wait()
diffs, lum, full = map(np.array, (diffs, lum, full))

out = {'static': [], 'black': [], 'flash': [], 'jump': []}
run, start = 0, 0
for k, d in enumerate(list(diffs) + [999]):
    if d < a.thr:
        if run == 0: start = k
        run += 1
    else:
        if run / fps >= a.static:
            out['static'].append(f'static {start / fps:7.2f}-{k / fps:7.2f}  {run / fps:.2f}s')
        run = 0
for k in range(1, len(lum) - 1):
    if lum[k] < 3:
        out['black'].append(f'black  {k / fps:7.2f}  亮度 {lum[k]:.1f}')
    if abs(lum[k] - lum[k - 1]) > 12 and abs(lum[k] - lum[k + 1]) > 12:
        out['flash'].append(f'flash  {k / fps:7.2f}  {lum[k - 1]:.0f}→{lum[k]:.0f}→{lum[k + 1]:.0f}')
    if full[k] > 18:
        out['jump'].append(f'jump   {k / fps:7.2f}  差 {full[k]:.0f}')

print(f'{len(diffs)} 帧 {len(diffs) / fps:.1f}s {fps:.2f}fps  mask {len(a.mask)} 块  静止阈值 {a.thr} / {a.static}s')
for k, rows in out.items():
    print(f'[{k}] {len(rows)} 处' + ('' if rows else '：无'))
    for r in rows[:30]:
        print('  ' + r)
    if len(rows) > 30:
        print(f'  …另有 {len(rows) - 30} 处')
