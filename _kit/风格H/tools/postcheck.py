"""渲染后自检：成片交付前跑，FAIL 不交。
用法：$PY <kit>/tools/postcheck.py <成片.mp4> [shots.json]

  Q1 静止：freezedetect（n=0.001, d=1.0）不能有 ≥1 秒的静止段（人物缩圆章 + 卡片落定的镜头要包 Drift）
  Q2 实拍在动：shots.json 里带 "clip": [x, y, w, h] 的镜头，在镜头中点前后各 0.5 秒取两帧，
     该区域平均像素差 < 3 判定为定格（freezedetect 抓不到，因为人物和字幕还在动）
  Q3 响度：整片 -14 ± 0.5 LUFS
  Q5 文字闪：每镜镜尾取 9 帧，切成 160×90 的块；块里深色笔画的质心若一帧往东一帧往西地来回跳（0.15～2px、8 步里 ≥6 步反向），
     判定为亚像素闪烁（2026-11-04 结尾评论气泡就是这样，用户说"字在抖"）。常见原因：玻璃外层套 opacity、坐标 / 缩放停在小数上
  Q4 时长 / 黑帧：成片时长和 shots.json 最后一镜的 out 相差 < 0.2s；开头 / 结尾 1 秒不能是纯黑
  Q6 丰富度（richness.py，移植自 dashi-animationstyle 的丰富度检查）：每 2.5 秒一格，相邻格画面差 < 4 算「几乎没变」
     （= 这 2.5 秒除了人在说话没有新东西）。2026-11-05 用 5 条已交付成片 + 1 条粗剪标定：
     成片平均 16～68、几乎没变占 0～20%、最长连续 4 格；纯口播粗剪平均 3.4、占 67%。
     FAIL：平均 < 10，或几乎没变 > 30%，或连续 ≥ 5 格（12.5 秒）没变——基本等于没包装
     WARN：连续 ≥ 2 格（5 秒）没新东西、近乎静止 > 2 秒——列出来参考，不拦交付
"""
import json, re, subprocess, sys
import numpy as np

V = sys.argv[1]
S = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else None
fails, info, warns = [], [], []
# 画幅按成片实际尺寸读（2026-11-08 第九期 4:3 = 1440×1080，之前写死 1920 会直接报错）
_wh = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', V], capture_output=True, text=True).stdout.strip().split(',')
VW, VH = int(_wh[0]), int(_wh[1])

def run(args):
    return subprocess.run(args, capture_output=True, text=True)

def crop(t, box):
    x, y, w, h = box
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', V, '-frames:v', '1', '-vf', f'crop={w}:{h}:{x}:{y},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).astype(float)

# Q1
fr = run(['ffmpeg', '-v', 'info', '-i', V, '-vf', 'freezedetect=n=0.001:d=1.0', '-an', '-f', 'null', '-']).stderr
starts = re.findall(r'freeze_start: ([\d.]+)', fr)
durs = re.findall(r'freeze_duration: ([\d.]+)', fr)
for s, d in zip(starts, durs):
    fails.append(f'Q1 {float(s):.2f}s 起静止 {float(d):.2f}s——这一镜的卡片组包 <Drift>')
info.append(f'静止段 {len(starts)} 处')

# Q2
if S:
    for sh in S['shots']:
        box = sh.get('clip')
        if not box:
            continue
        mid = (sh['in'] + sh['out']) / 2
        d = np.abs(crop(mid - 0.5, box) - crop(mid + 0.5, box)).mean()
        if d < 3:
            fails.append(f"Q2 {sh['id']}（{sh['in']}–{sh['out']}s）实拍区域 1 秒内像素差 {d:.1f}，像是定格了——查是不是没用 <Clip>")
        else:
            info.append(f"{sh['id']} 实拍在动（差 {d:.1f}）")

# Q5 文字闪（阈值在 2026-11-04 长版上标定：结尾气泡命中 18 块，其余静止文字 0 块）
def frames(t0, n=9):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-i', V, '-frames:v', str(n), '-vf', 'format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, VH, VW).astype(float)
if S:
    for sh in S['shots']:
        t0 = sh['out'] - 1.2  # 避开镜尾淡出 / 擦屏
        if t0 <= sh['in'] + 0.3:
            continue
        F = frames(t0)
        bad = []
        for by in range(0, VH - 90, 45):
            for bx in range(0, VW - 160, 80):
                ink = F[:, by:by + 90, bx:bx + 160] < 110
                if ink.sum(axis=(1, 2)).min() < 40:
                    continue
                for ax in (0, 1):
                    d = np.diff([np.nonzero(m)[ax].mean() for m in ink])
                    if sum(1 for a, b in zip(d, d[1:]) if a * b < 0 and 0.15 < abs(a) < 3 and 0.15 < abs(b) < 3) >= 6:
                        bad.append((bx, by))
                        break
        if len(bad) >= 3:
            fails.append(f"Q5 {sh['id']}（{t0:.1f}s 起）有 {len(bad)} 块文字逐帧来回闪，如 {bad[:3]}——查外层 opacity / 小数坐标 / 小数缩放")

# Q6 丰富度
from richness import richness, FLAT
R = richness(V)
flags = [d < FLAT for _, _, d in R['pairs']]
runs, k = [], 0
while k < len(flags):
    if flags[k]:
        j = k
        while j < len(flags) and flags[j]: j += 1
        runs.append((R['pairs'][k][0], R['pairs'][j - 1][1], j - k)); k = j
    else: k += 1
ratio = sum(flags) / max(1, len(flags))
info.append(f"丰富度：相邻格平均 {R['avg']:.1f}，几乎没变 {sum(flags)}/{len(flags)}（{ratio:.0%}），最长连续 {max([r[2] for r in runs], default=0)} 格，最长静止 {R['longest']:.2f}s")
if R['avg'] < 10: fails.append(f"Q6 相邻格平均 {R['avg']:.1f} < 10，画面基本没换——像是没包装")
if ratio > 0.3: fails.append(f'Q6 几乎没变的格占 {ratio:.0%} > 30%——大段只有人在说话')
for a, b, n in runs:
    if n >= 5: fails.append(f'Q6 {a:.1f}–{b:.1f}s 连续 {n} 格没新东西（≥12.5 秒）——这段要补包装或拆镜')
    elif n >= 2: warns.append(f'Q6 {a:.1f}–{b:.1f}s 连续 {n} 格没新东西——同一张卡讲太久？考虑加变化或人物退场换版式')
if R['longest'] > 2: warns.append(f"Q6 {R['longest_at']:.1f}s 起近乎静止 {R['longest']:.1f}s——加次要动作（Drift、粒子、慢推）")

# Q3
lu = run(['ffmpeg', '-i', V, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-']).stderr
m = re.findall(r'I:\s+(-?[\d.]+) LUFS', lu)
if m:
    I = float(m[-1])
    info.append(f'响度 {I} LUFS')
    if abs(I + 14) > 0.5:
        fails.append(f'Q3 响度 {I} LUFS，不在 -14±0.5（跑 _tools/loudnorm.py）')

# Q4
dur = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', V]).stdout.strip())
if S and abs(dur - S['shots'][-1]['out']) > 0.2:
    fails.append(f"Q4 成片 {dur:.2f}s 和镜头表 {S['shots'][-1]['out']}s 对不上")
for t in (0.5, dur - 0.6):
    if crop(t, (0, 0, VW, VH)).mean() < 8:
        fails.append(f'Q4 {t:.1f}s 是黑帧')

for i in info:
    print('INFO', i)
for w in warns:
    print('WARN', w)
for f in fails:
    print('FAIL', f)
print('POSTCHECK PASS' if not fails else f'POSTCHECK {len(fails)} FAIL')
sys.exit(1 if fails else 0)
