// 按帧号出全尺寸 png（f<帧号>.png），只打包一次，打包目录用完即删（不留 $TMPDIR/remotion-webpack-bundle-*）。返修时和旧成片同一帧比对用。
// 用法（在 remotion/ 下）：node ../tools/stills_frames.mjs <输出目录> [--comp Main] <帧号> [帧号...]
import path from 'node:path';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(path.resolve('package.json'));
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill} = require('@remotion/renderer');
const args = process.argv.slice(2);
let comp = 'Main';
const ci = args.indexOf('--comp');
if (ci >= 0) { comp = args[ci + 1]; args.splice(ci, 2); }
const [out, ...frames] = args;
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
try {
  const c = await selectComposition({serveUrl, id: comp, inputProps: {}});
  let i = 0;
  for (const fr of frames) {
    await renderStill({composition: c, serveUrl, output: path.join(out, `f${fr}.png`), frame: Number(fr), imageFormat: 'png', scale: 1, inputProps: {}});
    console.log('PROGRESS', ++i + '/' + frames.length, fr);
  }
} finally {
  fs.rmSync(serveUrl, {recursive: true, force: true});
}
