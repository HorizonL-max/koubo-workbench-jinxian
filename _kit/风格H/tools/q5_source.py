"""postcheck Q5（文字逐帧来回闪）误报核对：同一时间窗、同一判据，跑在源人物视频（缩到 1080×1920，不加任何包装）上。
源素材上也报的块 = 人在动 / 实拍噪声造成的质心来回跳，不是包装层的亚像素闪。
用法：python tools/q5_source.py <源视频> <成片> 秒 [秒…]"""
import sys, subprocess, numpy as np
def frames(V, t0, n=9):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', V, '-frames:v', str(n), '-vf', 'scale=1080:1920,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080).astype(float)
def bad(F):
    out = []
    for by in range(0, 1920 - 90, 45):
        for bx in range(0, 1080 - 160, 80):
            ink = F[:, by:by + 90, bx:bx + 160] < 110
            if ink.sum(axis=(1, 2)).min() < 40: continue
            for ax in (0, 1):
                d = np.diff([np.nonzero(m)[ax].mean() for m in ink])
                if sum(1 for a, b in zip(d, d[1:]) if a * b < 0 and 0.15 < abs(a) < 3 and 0.15 < abs(b) < 3) >= 6:
                    out.append((bx, by)); break
    return out
src, out = sys.argv[1], sys.argv[2]
for t in map(float, sys.argv[3:]):
    a, b = bad(frames(src, t)), bad(frames(out, t))
    print(f'{t:.1f}s  源 {len(a)} 块 {a[:6]}  成片 {len(b)} 块 {b[:6]}  重合 {len(set(a) & set(b))}')
