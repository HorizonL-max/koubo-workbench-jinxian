# 双机位粗剪（_tools/dualcam）

两台机位同时拍同一段口播（例：近景 + 中景，iPhone 竖拍 HLG），按声音对齐后出两条**帧级同步**的人物视频 + 一条主音轨。样片那期（风格H 金线讲堂）里用过，参数存在 `_kit/风格H/场地预设.json`（`hlg_to_sdr` / `grade_ffmpeg` / `audio` / `sync` 四节），脚本都能用 `--venue` 读它，也都能用命令行参数覆盖。

| 脚本 | 做什么 |
|---|---|
| `sync_offset.py ref.wav other.wav --fit` | 两机位声音互相关：粗偏移 + 8 个窗口细求 + 线性拟合，打印可填进场地预设 `sync` 的 offset_s / drift_per_s |
| `build_edl.py --asr … --range a b [--cut a b …] --venue …` | 以主机位 ASR 字时间列岛、压停顿、吸附帧网格，每岛写 `in`（近景）和 `ms_in`（中景）→ `edl.json` |
| `render_rough.py --edl … --cu … --ms … --out … --venue … [audio cu ms]` | 出 `host_cu.mp4` / `host_ms.mp4`（1440×2560、CRF15、无音轨）和 `narration.wav`；HLG→SDR、中景调色、晚开机补黑、段缓存复用 |
| `render_tail.py K …` | 同上，只真出第 K 个岛起（前面黑帧占位、总帧数不变），缓存删了以后补片尾 |

## 一期的顺序
```bash
# 0) 看素材是不是 HLG（arib-std-b67 / smpte2084 才要转；bt709 就给 --tonemap ''）
ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer,r_frame_rate -of csv=p=0 <素材>
# 1) 两机位各导一条 wav，求偏移
ffmpeg -i cu.mov -map 0:a:0 -ac 1 -ar 48000 work/cu.wav; ffmpeg -i ms.mov -map 0:a:0 -ac 1 -ar 48000 work/ms.wav
python _tools/dualcam/sync_offset.py work/cu.wav work/ms.wav --fit      # 结果填进期目录的 场地预设.json 的 sync
# 2) 主机位转写（_tools/funasr_transcribe.py）→ asr/cu.json，定 --range / --cut（切点按 CLAUDE.md 的「按音频切素材时的检查」核）
python _tools/dualcam/build_edl.py --asr asr/cu.json --range 4.60 375.20 --cut 142.40 143.00 --venue 场地预设.json
# 3) 出片（几分钟，后台跑）
prog -l "双机位粗剪" -- python _tools/dualcam/render_rough.py --edl edl.json --cu <近景.mov> --ms <中景.mov> --out <素材>/剪辑缓存/rough --venue 场地预设.json
```
Python 用工作台的 venv（numpy、soundfile）；`ffmpeg` 要带 zscale（libzimg）。

## 注意
- **文件名和画面可能是反的**（样片：「正面 2.mov」是近景、「侧面 2.mov」是中景），按画面认。
- **晚开机**：中景比近景晚开 8.27s，`ms_in` 开头是负的 → 前 111 帧黑。脚本会打印补了几帧，写进粗剪交接，分镜那段只能用近景。
- **主音轨**选底噪低的机位（领夹麦），录得很小时加固定增益到约 −24 LUFS，交付再 loudnorm。
- 偏移是线性模型；6 分钟漂移约 3ms（远小于一帧），拟合残差超过 10ms 时检查是不是有一台中途丢帧。
- 成片抽帧对口型确认两机位嘴型一致。
- 放进 Remotion：`ln <out>/host_cu.mp4 remotion/public/host/host.mp4`（硬链接，同一 APFS 卷；**不要软链**，渲染会 404）。
