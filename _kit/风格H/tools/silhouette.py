"""人影图解的剪影：切点那一帧的人像遮罩（_tools/matte_video 或 make_cut 出的 alpha png）→ 画布坐标的 SVG 路径 json（parts/Silhouette.tsx 读）。
画布坐标 = 源 1440×2560 × 0.75，再套切点那一帧的人物推镜（--scale / --origin，和 rows 里那一行的缩放、原点一致），和切点逐像素对上。
fill：整个人形（底边延到画布外）；outline：只取 y ≤ cut_y 的上半轮廓（开放路径，两端落在 y=cut_y），给「由小到大几圈同形轮廓」用。
用法：python silhouette.py <mask.png> --out remotion/src/ep/silhouette.json [--scale 1.012] [--origin 545,790] [--cut-y 1250] [--note '中景 f671']"""
import argparse, json, cv2, numpy as np
ap = argparse.ArgumentParser()
ap.add_argument('mask'); ap.add_argument('--out', required=True)
ap.add_argument('--scale', type=float, default=1.0); ap.add_argument('--origin', default='545,790')
ap.add_argument('--cut-y', type=float, default=1250.0); ap.add_argument('--note', default='')
ap.add_argument('--src-size', default='1440x2560')
A = ap.parse_args()
SW, SH = map(int, A.src_size.split('x')); K = 1080 / SW
S = A.scale; OX, OY = map(float, A.origin.split(','))
m = cv2.imread(A.mask, cv2.IMREAD_UNCHANGED)
if m.ndim == 3: m = m[:, :, 3] if m.shape[2] == 4 else cv2.cvtColor(m, cv2.COLOR_BGR2GRAY)
m = cv2.resize(m, (SW, SH), interpolation=cv2.INTER_CUBIC)
m = cv2.GaussianBlur(m, (0, 0), 3)
b = (m > 128).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(b)
b = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
b = cv2.morphologyEx(b, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = cv2.approxPolyDP(max(cs, key=cv2.contourArea), 2.0, True)[:, 0, :].astype(float)
x, y = c[:, 0] * K, c[:, 1] * K
pc = np.stack([OX + (x - OX) * S, OY + (y - OY) * S], 1)
fmt = lambda p: f'{p[0]:.1f},{p[1]:.1f}'
fill = 'M' + ' L'.join(fmt(p) for p in pc) + ' Z'
Y = A.cut_y
i0 = int(np.argmax(~(pc[:, 1] <= Y)))
r = np.roll(pc, -i0, 0); segs, cur = [], []
for p, ok in zip(r, r[:, 1] <= Y):
    if ok: cur.append(p)
    elif cur: segs.append(cur); cur = []
if cur: segs.append(cur)
seg = np.array(max(segs, key=len))
seg = np.vstack([[seg[0][0], Y], seg, [seg[-1][0], Y]])
outline = 'M' + ' L'.join(fmt(p) for p in seg)
out = {'fill': fill, 'outline': outline, 'bbox': [round(pc[:, 0].min()), round(pc[:, 1].min()), round(pc[:, 0].max()), round(pc[:, 1].max())],
       'outlineEnds': [fmt(seg[0]), fmt(seg[-1])], 'note': 'tools/silhouette.py 生成' + ('，' + A.note if A.note else '')}
json.dump(out, open(A.out, 'w'))
print('pts', len(pc), 'outline pts', len(seg), 'bbox', out['bbox'])
