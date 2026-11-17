"""渲染前自检（风格A，其他风格的 Remotion 工程也能用）：把踩过的坑变成机器检查，FAIL 不渲。
用法（Remotion 工程传 remotion/ 目录；OpenFilm 工程传工程根目录，它也含 src/ 和 public/）：
  $PY <kit>/tools/preflight.py <remotion 目录> [shots.json]

检查项（每条后面是当初踩坑的出处）：
  P1 词锚：场景里所有 A('词') / AE('词', n) 都能在 timing.json 找到（找不到渲染时才报错，白等打包）
  P2 卡片亮太短：入场挂在 A('词') 上、离本镜 OUT 不到 0.8 秒的（长版「色彩」只亮 0.4 秒）
  P3 实拍定格：场景 / 卡片里直接写 <OffthreadVideo 而不是 <Clip（长版 5 段实拍全成静止图）
  P4 素材在不在：staticFile / src 引用的 public 文件都存在；人物视频帧数 = Root 的 durationInFrames（别的会话清理过素材）
  P5 白色小件：fill / background 用纯白半透明画"占位小人 / 占位条"的，提醒改浅墨色（长版人群看不见）
  P6 放大镜 / 圆框：带 backdropFilter 的元素里又放了 Img（镜片被整块模糊）
  P7 外层淡入：包着 <Glass 的外层 div 写了 opacity 动画（截断玻璃模糊）——只提醒
  P8 防重复：给了 shots.json 就跑 variety_lint
  P9 OpenFilm 工程（有 film.config.json）：dist/ 打包产物不能比 src/ 旧；public 里的视频都标了 sRGB 传递特性；shots.json 的每镜在 film.html 里都有片段
"""
import json, os, re, subprocess, sys

R = sys.argv[1].rstrip('/')
SRC = R + '/src'
PUB = R + '/public'
shots_json = sys.argv[2] if len(sys.argv) > 2 else None
fails, warns = [], []

files = []
for d, _, fs in os.walk(SRC):
    files += [os.path.join(d, f) for f in fs if f.endswith(('.tsx', '.ts'))]
def strip_comments(s):
    s = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), s, flags=re.S)  # 保留行号
    return re.sub(r'(?m)(^|[^:])//.*$', r'\1', s)
code = {f: strip_comments(open(f, encoding='utf-8').read()) for f in files}

# P1 / P2 词锚
tj = json.load(open(SRC + '/timing.json'))
chars = [c for s in tj['scenes'] for c in s['chars']]
txt = ''.join(c['ch'] for c in chars)
def find(w, n=0):
    i = -1
    for _ in range(n + 1):
        i = txt.find(w, i + 1)
        if i < 0:
            return None
    return chars[i]['t']
for f, s in code.items():
    if '/scenes/' not in f and not f.endswith('sfx.ts'):
        continue
    for m in re.finditer(r"\bA[E]?\('([^']+)'(?:,\s*(\d+))?\)", s):
        if find(m.group(1), int(m.group(2) or 0)) is None:
            fails.append(f"P1 词锚找不到：{m.group(0)}（{os.path.basename(f)}）")
    # P2：每个场景函数里 IN/OUT 常量 + 入场 A()
    for blk in re.finditer(r"const (\w+): React\.FC = \(\) => \{(.*?)\n(?=const |export )", s, re.S):
        name, body = blk.group(1), blk.group(2)
        mo = re.search(r"OUT = ([\d.]+)", body) or re.search(r"gate\(t, [\d.]+, ([\d.]+)\)", body)
        if not mo:
            continue
        OUT = float(mo.group(1))
        for m in re.finditer(r"(?:glassIn|slabIn|popIn|FocusText[^>]*at=\{|at=\{)\s*\(?\s*t?,?\s*A\('([^']+)'(?:,\s*(\d+))?\)\s*([+-]\s*[\d.]+)?", body):
            t0 = find(m.group(1), int(m.group(2) or 0))
            if t0 is None:
                continue
            t0 += float((m.group(3) or '0').replace(' ', ''))
            if 0 < OUT - t0 < 0.8:
                warns.append(f"P2 {name}：A('{m.group(1)}') 入场在 {t0:.2f}s，离镜尾 {OUT}s 只有 {OUT - t0:.2f}s，基本看不到——挂到句子前半段的词上")

# P3 实拍定格
for f, s in code.items():
    base = os.path.basename(f)
    if base in ("Host.tsx", "kit.tsx", "host.tsx"):
        continue
    for m in re.finditer(r"<OffthreadVideo", s):
        if '<Sequence' in s[max(0, m.start() - 200):m.start()]:
            continue  # 外面已经包了 Sequence from=…，会从入场开始播
        line = s[:m.start()].count('\n') + 1
        fails.append(f"P3 {base}:{line} 直接用了 <OffthreadVideo>：会按整片时间取素材帧、短素材定格——改用 kit 的 <Clip src at from>")

# P4 素材在不在
refs = set()
for f, s in code.items():
    refs |= set(re.findall(r"staticFile\(['`]([^'`$]+)['`]\)", s))
    refs |= set(re.findall(r"src(?:=|:\s*)[\"']((?:broll|product|samples|host|audio|pages)/[^\"']+)[\"']", s))
for r in sorted(refs):
    if not os.path.exists(f'{PUB}/{r}'):
        fails.append(f"P4 public/{r} 不存在（可能被别的会话清理了，按 EDL / 素材重出）")
root = code.get(SRC + '/Root.tsx', '')
m = re.search(r"durationInFrames=\{(\d+)\}", root)
# OpenFilm 工程（_kit/风格A/openfilm/）：帧数在 film.config.json；dist/ 是 src/ 打包出来的，比 src 旧就是忘了重新 build
fcfg = R + '/film.config.json'
if os.path.exists(fcfg):
    m = re.match(r"(\d+)", str(json.load(open(fcfg))['durationInFrames']))
    dist = [R + '/dist/stage.js', R + '/dist/subs.js', R + '/dist/cues.json']
    newest_src = max(os.path.getmtime(f) for f in files + [SRC + '/timing.json'])
    for d in dist:
        if not os.path.exists(d) or os.path.getmtime(d) < newest_src:
            fails.append(f"P9 {os.path.relpath(d, R)} 比 src/ 旧或不存在：先跑 node $KB/_kit/风格A/openfilm/build.mjs <工程> 再 make_film.mjs")
            break
    untagged = []
    for d, _, fs in os.walk(PUB):
        for f in fs:
            if f.endswith('.mp4') and not f.startswith('._'):
                tc = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=color_transfer', '-of', 'csv=p=0', os.path.join(d, f)], capture_output=True, text=True).stdout.strip()
                if tc != 'iec61966-2-1':
                    untagged.append(os.path.relpath(os.path.join(d, f), PUB))
    if untagged:
        fails.append(f"P9 这些视频没标 sRGB，浏览器会把暗部提亮、画面发灰：{', '.join(untagged[:6])}——跑 zsh $KB/_kit/风格A/openfilm/tag_videos.sh <工程>")
    fh = R + '/film.html'
    if shots_json and os.path.exists(fh):
        ids = [s['id'] for s in json.load(open(shots_json))['shots']]
        html = open(fh, encoding='utf-8').read()
        lost = [i for i in ids if f'id="{i}"' not in html]
        if lost:
            warns.append(f"P9 film.html 里找不到这些镜头片段：{', '.join(lost[:8])}（Studio 里删过 / 改过 id，或 shots.json 改了没重跑 make_film.mjs）")
host = PUB + '/host/host.mp4'
if os.path.exists(host) and m:
    n = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', host], capture_output=True, text=True).stdout.strip()
    n = n.split(',')[0].strip()  # 竖拍素材带 side data 时 csv 输出末尾多一个逗号（2026-11-10）
    # 片尾故意比人物视频长（口播后加尾巴、人物定格）时，在 Root.tsx 里写 `preflight: host-tail=<帧数>` 声明（2026-11-15 心理那期返修加）
    tail = re.search(r"preflight:\s*host-tail=(\d+)", open(SRC + '/Root.tsx', encoding='utf-8').read() if os.path.exists(SRC + '/Root.tsx') else '')  # 声明写在注释里，读原文
    tail = int(tail.group(1)) if tail else 0
    if n and int(n) + tail != int(m.group(1)):
        fails.append(f"P4 人物视频 {n} 帧{f' + 声明的片尾 {tail} 帧' if tail else ''} ≠ Root durationInFrames {m.group(1)}")
    elif tail:
        warns.append(f"P4 片尾比人物视频长 {tail} 帧（Root.tsx 声明 host-tail；那段人物要自己定格，别让 OffthreadVideo 读到视频外）")
elif not os.path.exists(host):
    fails.append("P4 public/host/host.mp4 不存在")

# P5 白色小件
for f, s in code.items():
    for m in re.finditer(r"fill=\{[^}]*'rgba\(255,\s*255,\s*255,\s*\.[0-7]\d*\)'", s):
        line = s[:m.start()].count('\n') + 1
        warns.append(f"P5 {os.path.basename(f)}:{line} 用半透明白填充图形，浅色幕底上会看不见——占位件改 rgba(6,18,43,.2)")

# P6 backdrop + Img 同一元素
for f, s in code.items():
    for m in re.finditer(r"backdropFilter:[^}]*\}\}>\s*\n?\s*<Img", s):
        line = s[:m.start()].count('\n') + 1
        fails.append(f"P6 {os.path.basename(f)}:{line} 带 backdropFilter 的元素里直接放 Img：图会被整块模糊")

# P7 外层 opacity 包 Glass
for f, s in code.items():
    for m in re.finditer(r"<AbsoluteFill style=\{\{opacity: [^}]*\}\}>\s*\n?\s*<Glass", s):
        line = s[:m.start()].count('\n') + 1
        warns.append(f"P7 {os.path.basename(f)}:{line} 外层 opacity 包着 Glass：淡入期间玻璃模糊不到后面的东西（只在 ≤0.3s 出场可接受）")

# P8 防重复
if shots_json:
    lint = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'variety_lint.py')
    r = subprocess.run([sys.executable, lint, shots_json], capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode:
        fails.append('P8 variety_lint 不通过（见上）')

for w in warns:
    print('WARN', w)
for f in fails:
    print('FAIL', f)
print('PREFLIGHT PASS' if not fails else f'PREFLIGHT {len(fails)} FAIL')
sys.exit(1 if fails else 0)
