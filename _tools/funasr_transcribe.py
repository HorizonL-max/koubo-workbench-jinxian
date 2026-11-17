"""FunASR paraformer-zh 转写：每个 16k wav → 字级时间戳 JSON（{text, words:[{text,start,end}], sentences:[...]}）。"""
import json, sys
from pathlib import Path
from funasr import AutoModel

model = AutoModel(model="paraformer-zh", vad_model="fsmn-vad", punc_model="ct-punc",
                  disable_update=True, disable_pbar=True)
for wav in sys.argv[1:]:
    res = model.generate(input=wav, batch_size_s=300, sentence_timestamp=True)[0]
    out = {"text": res["text"], "sentences": []}
    for s in res.get("sentence_info", []):
        out["sentences"].append({"text": s["text"], "start": s["start"] / 1000, "end": s["end"] / 1000,
                                 "ts": [[a / 1000, b / 1000] for a, b in s.get("timestamp", [])]})
    # 扁平字级：raw_text 无标点逐 token 对应 timestamp
    toks = res.get("raw_text", res["text"]).split() if " " in res.get("raw_text", "") else list(res.get("raw_text", ""))
    out["words"] = [{"text": t, "start": a / 1000, "end": b / 1000} for t, (a, b) in zip(toks, res["timestamp"])]
    p = Path(wav).with_suffix("").with_suffix(".funasr.json")
    p.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(Path(wav).name, len(out["words"]), "tokens |", res["text"][:60])
