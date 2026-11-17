"""只重出片尾几个岛的人物画面（定稿后返修、粗剪缓存已删时用）：和 render_rough.py 同一套调色 / 编码 / 同步模型，
前面的岛用同编码的黑帧占位，总帧数 = edl['frames']，帧号和粗剪时间轴严格对齐。输出 <out>/host_{cam}_tail.mp4。
用法：python render_tail.py <从第几个岛起> --edl edl.json --cu <近景素材> --ms <中景素材> --out <dir> --venue 场地预设.json [cu ms]
（等价于 render_rough.py --from-island K；放进 remotion/public/host/ 时用硬链接 ln，不要软链）
样片用法：最后一镜改机位，只真出岛 26–27（f9856 起），再从 f(那一镜的镜头起点) 重渲成片尾段、和旧成片 concat。"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_rough

if len(sys.argv) < 2 or not sys.argv[1].isdigit():
    raise SystemExit(__doc__)
k0 = sys.argv[1]
rest = sys.argv[2:]
cams = [a for a in rest if a in ('cu', 'ms')] or ['cu', 'ms']
opts = [a for a in rest if a not in ('cu', 'ms')]
render_rough.main(cams + opts + ['--from-island', k0])
