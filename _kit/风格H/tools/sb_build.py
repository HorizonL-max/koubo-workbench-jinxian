"""SHOTBOOK 生成器（金线讲堂；样片 2026-11-15 第 5 部分 293 个词锚帧号、166 条字幕入点、112 处音效落点都是它算的）。
数据和引擎分开：本期的镜头表 / 字幕表 / 画面字表写在 <期目录>/tools/sb_data.py（格式照 样片参考/sb_data.example.py），
逐镜正文写在 <期目录>/tools/sb_tmpl/*.md（带占位符），这个脚本只负责算帧号、校验、写文件。

用法：python sb_build.py [--root <期目录>，默认当前目录] [check]
- 读 <root>/timestamps.json，把模板里的词锚占位符换成帧号，写进 SHOTBOOK.md 的 <!-- FULL:BEGIN --> … <!-- FULL:END --> 之间（可重复跑）
- 写 <root>/shots.json（全片）、shots.act<N>.json（各幕）、sfx_plan.json；
  有 <root>/remotion/src/ep/ 时同时写 ep/shots.json（Remotion 镜头表）和 ep/cues.json（字幕表）
- 校验：字幕分条拼起来必须等于口播原文；LABELS 里的画面字必须是口播原话的连续片段；中文 ≤15 字、英文 ≤44 字符
占位符：
  {{9|好}} / {{9|好|3}}      → S9「好」f1838        （第 9 句里第 3 个「好」的起点帧）
  {{f:9|好|3|8}}             → f1846               （同上再 +8 帧；次数、偏移可省）
  {{H:P16}}                  → 镜头标题行（时间、帧、时长、TITLES 里的标题）
  {{TABLE:rhythm:1}} {{TABLE:cues:1}} → 第 1 幕的版式节奏表 / 字幕分条表
  {{n}}                      → 音效序号（自动接着往下排）
  [[SFX:1]]                  → 第 1 幕音效汇总表（从正文里「#序号 f帧 采样名 0.音量（动作）」抽）
"""
import argparse, importlib.util, json, math, re, sys, pathlib

ap = argparse.ArgumentParser(); ap.add_argument('mode', nargs='?', default='build'); ap.add_argument('--root', default='.')
ap.add_argument('--data'); ap.add_argument('--tmpl')
A = ap.parse_args()
ROOT = pathlib.Path(A.root).resolve()
spec = importlib.util.spec_from_file_location('sb_data', A.data or ROOT / 'tools' / 'sb_data.py')
D = importlib.util.module_from_spec(spec); spec.loader.exec_module(D)
TS = json.load(open(ROOT / 'timestamps.json', encoding='utf-8'))
SENT = TS['sentences']
FPS = 30
fr = lambda t: int(math.floor(t * FPS + 0.5 + 1e-9))  # 和工程里的 Math.round 一致
TOTAL_F = getattr(D, 'TOTAL_F', None) or fr(SENT[-1]['end'] + 0.3)
SH, WIPES, TITLES, CUES, LABELS = D.SH, getattr(D, 'WIPES', []), getattr(D, 'TITLES', {}), D.CUES, getattr(D, 'LABELS', {})
CUE0 = getattr(D, 'CUE0', 1)
CUE_SENTS = getattr(D, 'CUE_SENTS', sorted({c[0] for c in CUES}))
TEMPLATES = getattr(D, 'TEMPLATES', ['head.md', 'act1.md', 'act2.md', 'act3.md', 'tail.md'])
SFX_N = [getattr(D, 'SFX_START', 0)]
EXTRA = getattr(D, 'EXTRA', {})  # {'P06': {'clip': [...]}}：额外写进 shots.json 的字段
NOTE = getattr(D, 'NOTE', '')
TMPL = pathlib.Path(A.tmpl) if A.tmpl else ROOT / 'tools' / 'sb_tmpl'


def chars(i):
    return SENT[i]['words']


def find(i, sub, occ=1):
    ws = chars(i)
    s = ''.join(w['text'] for w in ws)
    pos = -1
    for _ in range(occ):
        pos = s.find(sub, pos + 1)
        if pos < 0:
            raise SystemExit(f'词锚找不到：S{i}「{sub}」第 {occ} 次（句子：{s}）')
    acc = 0
    for w in ws:
        if acc + len(w['text']) > pos:
            return w['start']
        acc += len(w['text'])
    raise SystemExit('unreachable')


PUNC = '，。？！、：；“”‘’ ,.?!'
plain = lambda i: ''.join(c for c in SENT[i]['text'] if c not in PUNC)


def validate():
    errs, by = [], {}
    for c in CUES:
        s, zh, en, em = c[0], c[1], c[2], c[3]
        by.setdefault(s, []).append(zh)
        if len(en) > 44: errs.append(f'英文超 44 字符（{len(en)}）：{en}')
        if len(zh) > 15: errs.append(f'中文超 15 字：{zh}')
        if em and em not in zh: errs.append(f'强调词不在本条里：{zh} / {em}')
    for s in CUE_SENTS:
        got = ''.join(by.get(s, []))
        if got != plain(s): errs.append(f'S{s} 字幕拼接不等于口播：\n   口播 {plain(s)}\n   字幕 {got}')
    allp = ''.join(plain(i) for i in range(len(SENT)))
    for sid, labs in LABELS.items():
        for lab in labs:
            if lab not in allp: errs.append(f'{sid} 画面字「{lab}」不是口播原话的连续片段')
    return errs


def shot_rows():
    rows = []
    for k, sh in enumerate(SH):
        f1 = SH[k + 1][1] if k + 1 < len(SH) else TOTAL_F
        rows.append(dict(id=sh[0], f0=sh[1], f1=f1, host=sh[2], bg=sh[3], cam=sh[4], card=sh[5], entry=sh[6], motif=bool(sh[7]), act=sh[8], sents=sh[9]))
    return rows


ROWS = shot_rows(); RB = {r['id']: r for r in ROWS}
ACTS = sorted({r['act'] for r in ROWS})


def cue_rows():
    out, n, used = [], CUE0, {}
    for c in CUES:
        s, zh, en, em, note = c[:5]
        opts = c[5] if len(c) > 5 else {}
        k = used.get(s, 0); ws = chars(s)
        flat = [w['start'] for w in ws for _ in w['text']]
        t0 = flat[k]
        t1 = ws[-1]['end'] if k + len(zh) >= len(flat) else flat[k + len(zh)]
        used[s] = k + len(zh)
        out.append(dict(n=n, s=s, zh=zh, en=en, em=em, note=note, opts=opts, t=t0, f=fr(t0) - 2, tnext=t1)); n += 1
    return out


CR = cue_rows()


def shot_of_frame(f):
    for r in ROWS:
        if r['f0'] <= f < r['f1']: return r
    return ROWS[-1]


def table_rhythm(act):
    L = ['| 镜 | 时间（帧） | 句 | 人物形态 | 幕底 | 主卡 | 主动作 |', '|---|---|---|---|---|---|---|']
    for r in ROWS:
        if r['act'] != act: continue
        s = '、'.join(f'S{x}' for x in r['sents'])
        L.append(f"| {r['id']} | {r['f0'] / FPS:.2f}–{r['f1'] / FPS:.2f}（{r['f0']}–{r['f1']}） | {s} | {r['host']} | {r['bg']} | {r['card']}{'（回扣）' if r['motif'] else ''} | {r['entry']} |")
    return '\n'.join(L)


def table_cues(act):
    L = ['| 条 | 镜 | 中文 | 英文 | 入点（帧） | 强调 | 备注 |', '|---|---|---|---|---|---|---|']
    for c in CR:
        r = shot_of_frame(c['f'] + 2)
        if r['act'] != act: continue
        L.append(f"| c{c['n']} | {r['id']} | {c['zh']} | {c['en']} | S{c['s']}「{c['zh'][0]}」f{c['f']} | {c['em'] or '—'} | {c['note'] or ''} |")
    return '\n'.join(L)


def expand(text):
    def rep(m):
        body = m.group(1)
        if body == 'n':
            SFX_N[0] += 1; return f'#{SFX_N[0]}'
        if body.startswith('H:'):
            sid = body[2:]; r = RB[sid]
            return f"### {sid}　{r['f0'] / FPS:.3f}–{r['f1'] / FPS:.3f}（f{r['f0']}–{r['f1']}，{(r['f1'] - r['f0']) / FPS:.1f}s）　{TITLES.get(sid, '')}"
        if body.startswith('TABLE:'):
            _, kind, act = body.split(':')
            return table_rhythm(int(act)) if kind == 'rhythm' else table_cues(int(act))
        if body.startswith('f:'):
            p = body[2:].split('|'); s, sub = int(p[0]), p[1]
            occ = int(p[2]) if len(p) > 2 and p[2] else 1; off = int(p[3]) if len(p) > 3 else 0
            return f'f{fr(find(s, sub, occ)) + off}'
        p = body.split('|'); s, sub = int(p[0]), p[1]
        occ = int(p[2]) if len(p) > 2 and p[2] else 1
        return f'S{s}「{sub}」f{fr(find(s, sub, occ))}'
    return re.sub(r'\{\{([^{}]+)\}\}', rep, text)


def pack(rows, wipes, note, scope):
    return {'_note': note, 'fps': FPS, 'size': [1080, 1920], 'scope': scope, 'shakes': [],
            'wipes': [{'at': round(f / FPS, 3), 'f': f, 'kind': k, 'note': n} for f, k, n in wipes],
            'shots': [{'id': r['id'], 'in': round(r['f0'] / FPS, 3), 'out': round(r['f1'] / FPS, 3), 'f': [r['f0'], r['f1']],
                       'sents': r['sents'], 'act': r['act'], 'cam': r['cam'], 'host': r['host'], 'bg': r['bg'],
                       'card': r['card'], 'entry': r['entry'], 'motif': r['motif'], **EXTRA.get(r['id'], {})} for r in rows]}


def write_shots():
    note = NOTE or f'全片 {len(ROWS)} 镜（粗剪时间轴 0–{TOTAL_F / FPS:.3f}s，{TOTAL_F} 帧）。由 tools/sb_build.py 生成，改分镜改 tools/sb_data.py。'
    full = pack(ROWS, WIPES, note, 'full')
    json.dump(full, open(ROOT / 'shots.json', 'w'), ensure_ascii=False, indent=1)
    if len(ACTS) > 1:
        for a in ACTS:
            rs = [r for r in ROWS if r['act'] == a]
            ws = [w for w in WIPES if rs[0]['f0'] <= w[0] < rs[-1]['f1']]
            json.dump(pack(rs, ws, f'第 {a} 幕（{rs[0]["id"]}–{rs[-1]["id"]}，f{rs[0]["f0"]}–{rs[-1]["f1"]}）。给这一幕的制作 / preflight / 分段渲染用；variety_lint 以全片 shots.json 为准。', f'act{a}'),
                      open(ROOT / f'shots.act{a}.json', 'w'), ensure_ascii=False, indent=1)
    ep = ROOT / 'remotion' / 'src' / 'ep'
    if ep.is_dir():
        json.dump(full, open(ep / 'shots.json', 'w'), ensure_ascii=False, indent=1)
        cues = []
        for c in CR:
            d = {'zh': c['zh'], 'en': c['en'], 'near': round(max(0.0, c['t'] - 0.1), 2)}
            if c['em']: d['hl'] = c['em']
            if c['opts'].get('up') or '升格' in (c['note'] or ''): d['up'] = True
            for k in ('hlNear', 'end'):
                if k in c['opts']: d[k] = c['opts'][k]
            cues.append(d)
        json.dump(cues, open(ep / 'cues.json', 'w'), ensure_ascii=False, indent=1)
        print(f'→ remotion/src/ep/shots.json（{len(ROWS)} 镜）、ep/cues.json（{len(cues)} 条）')


def main():
    errs = validate()
    for e in errs: print('ERR', e)
    if A.mode == 'check':
        write_shots(); print('check done', len(errs)); return
    if errs: sys.exit(1)
    write_shots()
    parts = []
    for name in TEMPLATES:
        p = TMPL / name
        if p.exists(): parts.append(expand(p.read_text(encoding='utf-8')))
        else: print('（缺模板）', name)
    body = '\n\n'.join(parts)
    plan = []
    for m in re.finditer(r'#(\d+) f(\d+) ([a-z_]+) (0\.\d+)(?:（([^）]*)）)?', body):
        n, f = int(m.group(1)), int(m.group(2)); r = shot_of_frame(f)
        plan.append(dict(n=n, f=f, t=round(f / FPS, 3), shot=r['id'], act=r['act'], sample=m.group(3), vol=float(m.group(4)), what=m.group(5) or ''))
    plan.sort(key=lambda c: c['f'])
    for a, b in zip(plan, plan[1:]):
        if b['f'] - a['f'] < 2: print(f"WARN 音效 #{a['n']} 和 #{b['n']} 只隔 {b['f'] - a['f']} 帧")
    for k in range(len(plan)):
        win = [c for c in plan if plan[k]['f'] <= c['f'] < plan[k]['f'] + 20 * FPS]
        if len(win) > 8: print(f"WARN 音效 {plan[k]['t']:.1f}s 起 20 秒里有 {len(win)} 处（规矩 6–8）"); break
    json.dump(plan, open(ROOT / 'sfx_plan.json', 'w'), ensure_ascii=False, indent=1)
    for act in ACTS:
        L = ['| # | 帧 | 秒 | 镜 | 采样 | 音量 | 动作 |', '|---|---|---|---|---|---|---|']
        L += [f"| {c['n']} | f{c['f']} | {c['t']:.2f} | {c['shot']} | {c['sample']} | {c['vol']:.2f} | {c['what']} |" for c in plan if c['act'] == act]
        body = body.replace(f'[[SFX:{act}]]', '\n'.join(L))
    sbp = ROOT / 'SHOTBOOK.md'
    sb = sbp.read_text(encoding='utf-8') if sbp.exists() else ''
    B, E = '<!-- FULL:BEGIN -->', '<!-- FULL:END -->'
    sb = sb[:sb.index(B)] + B + '\n' + body + '\n' + E + sb[sb.index(E) + len(E):] if B in sb else sb.rstrip() + '\n\n' + B + '\n' + body + '\n' + E + '\n'
    sbp.write_text(sb, encoding='utf-8')
    hid = sum(r['f1'] - r['f0'] for r in ROWS if r['host'] == 'HIDE') / FPS
    print(f'OK：{len(ROWS)} 镜，字幕 c{CUE0}–c{CR[-1]["n"] if CR else CUE0}，音效 {len(plan)} 处，退场 {hid:.1f}s（{hid / (TOTAL_F / FPS):.1%}）')


main()
