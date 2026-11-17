"""小头像声纹弧（C21）用的主音轨逐帧响度：narration.wav → voice_rms.json（每帧一个 0–1 值）。
每帧取一帧长的窗算 RMS → dB，−50dB→0、−14dB→1 线性映射。
用法：python voice_rms.py --wav remotion/public/narration.wav --out remotion/src/ep/voice_rms.json [--fps 30]"""
import argparse, json, numpy as np, soundfile as sf
ap = argparse.ArgumentParser(); ap.add_argument('--wav', required=True); ap.add_argument('--out', required=True); ap.add_argument('--fps', type=int, default=30)
A = ap.parse_args()
x, sr = sf.read(A.wav, dtype='float32')
if x.ndim > 1: x = x.mean(1)
n = int(round(len(x) / sr * A.fps)); hop = sr / A.fps
v = []
for i in range(n):
    s = x[int(i * hop): int((i + 1) * hop)]
    db = 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9) if len(s) else -90
    v.append(round(float(np.clip((db + 50) / 36, 0, 1)), 3))
json.dump({'fps': A.fps, 'v': v}, open(A.out, 'w'))
print('frames', n, 'mean', round(float(np.mean(v)), 3), 'p90', round(float(np.percentile(v, 90)), 3))
