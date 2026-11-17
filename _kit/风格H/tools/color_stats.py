"""两机位调色对比：color_stats.py <帧目录> [前缀 …] [--venue 场地预设.json]
帧目录里放 <前缀>_t*.png（canvas 1080×1920，例 cu_t12.png / ms_t12.png，各取 5 帧）；区域读场地预设 color_regions（前缀里含 cu / ms 决定用哪组）。
输出各区域平均 RGB、亮度 Y、R/G、B/G（取所有帧均值）。目标见场地预设 grade_ffmpeg / remotion_ms_filter 的 _怎么量。"""
import argparse, glob, json, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('pre', nargs='*', default=['cu', 'ms']); ap.add_argument('--venue', default='场地预设.json')
A = ap.parse_args()
R = {k: v for k, v in json.load(open(A.venue, encoding='utf-8'))['color_regions'].items() if not k.startswith('_')}
for p in A.pre:
    cam = 'cu' if 'cu' in p else 'ms'
    fs = sorted(glob.glob(f'{A.dir}/{p}_t*.png')); acc = {}
    for f in fs:
        a = np.asarray(Image.open(f).convert('RGB')).astype(float)
        for k, (x0, y0, x1, y1) in R[cam].items(): acc.setdefault(k, []).append(a[y0:y1, x0:x1].reshape(-1, 3).mean(0))
        acc.setdefault('all', []).append(a.reshape(-1, 3).mean(0))
    print(p, len(fs), 'frames')
    for k, v in acc.items():
        m = np.mean(v, 0); Y = m @ [0.2126, 0.7152, 0.0722]
        print(f'  {k:6s} RGB {m[0]:6.1f} {m[1]:6.1f} {m[2]:6.1f}  Y {Y:6.1f}  R/G {m[0]/m[1]:.3f}  B/G {m[2]/m[1]:.3f}')
