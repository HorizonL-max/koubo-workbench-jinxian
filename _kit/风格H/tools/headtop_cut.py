"""「人后大字」的头顶遮挡层：一段人物视频的人像遮罩 × 只留画布 y ≤ keep_y（再往下 feather 像素羽化）的一条 → 带 alpha 的 VP9 webm。
Remotion 里和 Host 用同一个推镜和中景滤镜叠在大字上面，大字底边就压进头发后面（样片 P13「独立」，字底压进头发约 20px）。
步骤：1) 从人物视频截出那一段（帧 k = 合成帧 f0+k）：ffmpeg -ss <f0/30> -i host_ms.mp4 -frames:v <n> work/seg.mp4
      2) 人像遮罩：_tools/matte_video work/seg.mp4 work/masks（出 m0000.png …）
      3) python headtop_cut.py --seg work/seg.mp4 --masks work/masks --out remotion/public/host/headtop.webm [--keep-y 600 --feather 60]
注意：定稿清缓存时这个文件会跟着 public/host/ 一起删，整片重渲前要重出（preflight 会报缺文件）。"""
import argparse, os, subprocess, shutil, tempfile, cv2, numpy as np
ap = argparse.ArgumentParser()
ap.add_argument('--seg', required=True); ap.add_argument('--masks', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--keep-y', type=int, default=600); ap.add_argument('--feather', type=int, default=60)
ap.add_argument('--lo', type=float, default=0.38); ap.add_argument('--hi', type=float, default=0.69)
A = ap.parse_args()
tmp = tempfile.mkdtemp(prefix='headtop_')
y = np.arange(1920, dtype=np.float32)
band = np.clip((A.keep_y + A.feather - y) / A.feather, 0, 1)[:, None]
cap = cv2.VideoCapture(A.seg); k = 0
while True:
    ok, im = cap.read()
    if not ok: break
    mp = f'{A.masks}/m{k:04d}.png'
    if not os.path.exists(mp): break
    im = cv2.resize(im, (1080, 1920), interpolation=cv2.INTER_AREA)
    m = cv2.resize(cv2.imread(mp, 0), (1080, 1920), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
    m = np.clip((m - A.lo) / (A.hi - A.lo), 0, 1)  # 和 make_cut 同一道硬阈值（96→0、176→255）
    cv2.imwrite(f'{tmp}/f{k:04d}.png', np.dstack([im, (m * band * 255).astype(np.uint8)]))
    k += 1
print('frames', k)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', f'{tmp}/f%04d.png', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '18', '-row-mt', '1', '-auto-alt-ref', '0', A.out], check=True)
shutil.rmtree(tmp)
print('done', A.out)
