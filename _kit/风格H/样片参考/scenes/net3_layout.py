"""第三幕条件网布局（P53 / P55 / P57 共用）：从一幕的 netgraph.json（33 点 51 边）出发，
- 30 个小点：原位，少数避让 P53 / P55 的标注和中心隔离圈（NUDGE 表）；
- 3 个大点：P54 头顶三点 (290,400) / (540,330) / (790,400)（P54→P55 匹配剪辑，逐像素一致）；
- 左簇 / 右簇各 8 点（P55「成长经历」「现实环境」）；
- 人形目标：silhouette2.json 的外轮廓按弧长取 24 点 + 里面 6 点，3 个大点落头 / 胸口 / 右肩；小点和目标用匈牙利算法配对（总位移最小，迁移时线不乱穿）；
- 边：原 51 边 + 簇到大点的 6 条牵线 + 轮廓链 23 条。
输出 remotion/src/scenes/act3/net3.json。用法：python tools/net3_layout.py"""
import json, os, re
import numpy as np
from scipy.optimize import linear_sum_assignment

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'remotion', 'src')
NG = json.load(open(os.path.join(ROOT, 'netgraph.json')))
SIL = json.load(open(os.path.join(ROOT, 'silhouette2.json')))
nodes = [dict(n) for n in NG['nodes']]
BIG_P54 = {0: (290, 400), 1: (540, 330), 2: (790, 400)}  # 观念 / 情绪 / 行为
BIG_HUMAN = {0: (545, 700), 1: (545, 1130), 2: (760, 1160)}
# 避让：中心隔离圈 r100@(540,760)、「孤立」690–810×730–800、「共同影响」428–652×880–950、「各种条件」412–668×330–400、
# P55「相互作用」428–652×740–810、「成长经历」120–330×1166–1226、「现实环境」700–910×1166–1226、P54 三个大点的标注
NUDGE = {
    15: (468, 640), 6: (800, 676), 16: (648, 684), 3: (382, 912), 4: (694, 952), 14: (398, 452),
    20: (196, 520), 10: (896, 520), 27: (124, 1112), 26: (310, 1120), 24: (420, 1150), 31: (958, 1128),
}
for k, (x, y) in NUDGE.items():
    nodes[k]['x'], nodes[k]['y'] = x, y
for k, (x, y) in BIG_P54.items():
    nodes[k]['x'], nodes[k]['y'] = x, y
LEFT = [17, 23, 26, 27, 29, 24, 3, 11]
RIGHT = [8, 19, 28, 30, 31, 32, 25, 4]
nodes[11]['x'], nodes[11]['y'] = 262, 900  # 并进左簇
for i, n in enumerate(nodes):
    n['cl'] = 'L' if i in LEFT else 'R' if i in RIGHT else ''

# 人形目标：外轮廓按弧长取 24 点（两端 y≤1230）
pts = [tuple(map(float, p.split(','))) for p in re.findall(r'[-\d.]+,[-\d.]+', SIL['outline'])]
P = np.array(pts)
seg = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]
def at(s):
    k = np.searchsorted(seg, s) - 1
    k = max(0, min(k, len(P) - 2))
    u = (s - seg[k]) / max(1e-6, seg[k + 1] - seg[k])
    return P[k] + u * (P[k + 1] - P[k])
# 起止都离开字幕带上沿：只在 y<=1230 的那段弧上取
ok = [s for s in np.linspace(0, seg[-1], 4000) if at(s)[1] <= 1230]
s0, s1 = ok[0], ok[-1]
contour = [tuple(np.round(at(s0 + (s1 - s0) * (i / 23)), 1)) for i in range(24)]
inner = [(470, 800), (620, 800), (545, 960), (390, 1150), (680, 1040), (440, 1050)]
targets = contour + inner
small = [i for i in range(len(nodes)) if i not in BIG_P54]
C = np.array([[np.hypot(nodes[i]['x'] - tx, nodes[i]['y'] - ty) for (tx, ty) in targets] for i in small])
r, c = linear_sum_assignment(C)
for a, b in zip(r, c):
    i = small[a]
    nodes[i]['tx'], nodes[i]['ty'] = targets[b]
    nodes[i]['ci'] = int(b) if b < 24 else -1
for k, (x, y) in BIG_HUMAN.items():
    nodes[k]['tx'], nodes[k]['ty'] = x, y
    nodes[k]['ci'] = -1
order = sorted([i for i in small if nodes[i]['ci'] >= 0], key=lambda i: nodes[i]['ci'])
chain = [[order[k], order[k + 1]] for k in range(len(order) - 1)]
# 簇到三个大点的牵线：每簇取离各大点最近的一个点
used = set()
def nearest(cl, big):
    bx, by = BIG_P54[big]
    i = min([i for i in cl if i not in used], key=lambda i: (nodes[i]['x'] - bx) ** 2 + (nodes[i]['y'] - by) ** 2)
    used.add(i)
    return i
# 每簇三条，簇端各不相同（左簇先连「观念」，右簇先连「行为」）
ties = [[nearest(LEFT, b), b] for b in (0, 1, 2)] + [[nearest(RIGHT, b), b] for b in (2, 1, 0)]
out = {
    'note': 'tools/net3_layout.py 生成：P53/P55/P57 共用。x,y = P53/P55 位置；tx,ty = P55 收成人形的目标；cl = L/R 簇；ci = 轮廓序号（-1 = 里面的点）',
    'nodes': [{k: n[k] for k in ('x', 'y', 'r', 'big', 'cl', 'tx', 'ty', 'ci')} for n in nodes],
    'edges': NG['edges'], 'ties': ties, 'chain': chain, 'big': [0, 1, 2],
}
os.makedirs(os.path.join(ROOT, 'scenes', 'act3'), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, 'scenes', 'act3', 'net3.json'), 'w'), ensure_ascii=False, indent=0)
print('contour', contour[:3], '...', contour[-2:])
print('ties', ties)
for i, n in enumerate(nodes):
    print(i, n['cl'] or '-', (n['x'], n['y']), '->', (n['tx'], n['ty']), n['ci'])
