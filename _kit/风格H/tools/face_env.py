"""人脸包络（canvas 1080 宽坐标；源 1440×2560 时 ×0.75）：给场地预设 face 节、吊坠 / 金线 / 标注避脸用。
用法：python face_env.py <人物视频> <f0> <f1> [--step 6] [--model <face_detection_yunet_2023mar.onnx>] [--canvas-w 1080]
  --model 不给时读环境变量 KOUBO_YUNET（本机路径见风格H README「本机环境」）。
另外用亮度阈值估头发顶（脸框上方中间 60% 宽的列里，暗像素（灰度<70）占比 >35% 的最高行）——浅色背景、深色头发时可信，换场地先目测核一次。"""
import argparse, os, cv2, numpy as np
ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('f0', type=int); ap.add_argument('f1', type=int)
ap.add_argument('--step', type=int, default=6); ap.add_argument('--model', default=os.environ.get('KOUBO_YUNET'))
ap.add_argument('--canvas-w', type=int, default=1080); ap.add_argument('--dark', type=int, default=70)
A = ap.parse_args()
if not A.model or not os.path.exists(A.model): raise SystemExit('要给 --model <yunet.onnx> 或设 KOUBO_YUNET')
cap = cv2.VideoCapture(A.video); W, H = int(cap.get(3)), int(cap.get(4)); S = A.canvas_w / W
det = cv2.FaceDetectorYN.create(A.model, '', (W // 2, H // 2), 0.6)
rows = []
for fr in range(A.f0, A.f1, A.step):
    cap.set(cv2.CAP_PROP_POS_FRAMES, fr); ok, im = cap.read()
    if not ok: continue
    sm = cv2.resize(im, (W // 2, H // 2)); _, faces = det.detect(sm)
    if faces is None: continue
    x, y, w, h = faces[0][:4] * 2
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    xa, xb = int(x + w * 0.2), int(x + w * 0.8); top = int(y)
    for yy in range(int(y), max(0, int(y - h)), -2):
        if (g[yy, xa:xb] < A.dark).mean() > 0.35: top = yy
    rows.append((fr, x * S, y * S, (x + w) * S, (y + h) * S, top * S))
if not rows: raise SystemExit('这段没检出人脸')
a = np.array(rows)
print(f'{os.path.basename(A.video)} f{A.f0}-{A.f1} n={len(a)}  face x {a[:,1].min():.0f}-{a[:,3].max():.0f}  y {a[:,2].min():.0f}-{a[:,4].max():.0f}'
      f'  median x {np.median(a[:,1]):.0f}-{np.median(a[:,3]):.0f} y {np.median(a[:,2]):.0f}-{np.median(a[:,4]):.0f}  hairTop min {a[:,5].min():.0f} med {np.median(a[:,5]):.0f}')
for r in rows[:: max(1, len(rows) // 8)]:
    print('  f%d face (%.0f,%.0f)-(%.0f,%.0f) hair %.0f' % r)
