"""C26 节点网布局（一期一份，几处共用）：N 个点散在给定范围里、固定种子，按距离连边（每点 2–3 条）。
样片：33 点散在 x 100–980、y 420–1180，上半张（y ≤ 900）22 个点给第一章只露一半；3 个大节点写死在 (250,560)/(560,470)/(830,600)，
两根金线的接点 (466,880)/(614,860) 也写死（--fixed 传）。大节点和接点要避开这期中景人脸（场地预设 face），先 face_env 量。
输出 json：nodes[{x,y,r,big,top,anchor}]、edges[[i,j]]、big[下标]、anchors[下标]，给 parts/NetGraph.tsx 的 net prop。
用法：python netgraph_layout.py --out remotion/src/ep/netgraph.json [--seed 20261115] [--n 33] [--top-n 22] [--split-y 900]
       [--fixed '250,560,big;560,470,big;830,600,big;466,880,anchor;614,860,anchor']"""
import argparse, json, random, math
ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True); ap.add_argument('--seed', type=int, default=20261115)
ap.add_argument('--n', type=int, default=33); ap.add_argument('--top-n', type=int, default=22); ap.add_argument('--split-y', type=float, default=900)
ap.add_argument('--x', default='110,970'); ap.add_argument('--y-top', default='420,890'); ap.add_argument('--y-bot', default='940,1180')
ap.add_argument('--fixed', default='250,560,big;560,470,big;830,600,big;466,880,anchor;614,860,anchor')
A = ap.parse_args()
random.seed(A.seed)
fixed = [(float(a), float(b), k) for a, b, k in (s.split(',') for s in A.fixed.split(';') if s)]
X = tuple(map(float, A.x.split(','))); YT = tuple(map(float, A.y_top.split(','))); YB = tuple(map(float, A.y_bot.split(',')))
pts = [(x, y) for x, y, _ in fixed]
ok = lambda x, y, d: all(math.hypot(x - a, y - b) >= d for a, b in pts)
while sum(1 for x, y in pts if y <= A.split_y) < A.top_n:
    x, y = random.uniform(*X), random.uniform(*YT)
    if ok(x, y, 112): pts.append((x, y))
while len(pts) < A.n:
    x, y = random.uniform(*X), random.uniform(*YB)
    if ok(x, y, 120): pts.append((x, y))
nodes = []
for i, (x, y) in enumerate(pts):
    kind = fixed[i][2] if i < len(fixed) else ''
    nodes.append({'x': round(x, 1), 'y': round(y, 1), 'r': 14 if kind == 'big' else round(random.uniform(5, 9), 1), 'big': kind == 'big', 'anchor': kind == 'anchor', 'top': y <= A.split_y})
E = set()
for i, a in enumerate(nodes):
    ds = sorted((math.hypot(a['x'] - b['x'], a['y'] - b['y']), j) for j, b in enumerate(nodes) if j != i)
    for d, j in ds[:2 + (i % 2)]:
        E.add((min(i, j), max(i, j)))
edges = sorted(E, key=lambda e: math.hypot(nodes[e[0]]['x'] - nodes[e[1]]['x'], nodes[e[0]]['y'] - nodes[e[1]]['y']))
out = {'note': f'tools/netgraph_layout.py 生成（种子 {A.seed}）', 'nodes': nodes, 'edges': [list(e) for e in edges],
       'big': [i for i, n in enumerate(nodes) if n['big']], 'anchors': [i for i, n in enumerate(nodes) if n['anchor']]}
json.dump(out, open(A.out, 'w'))
print('nodes', len(nodes), 'top', sum(n['top'] for n in nodes), 'edges', len(edges))
