const fs = require('fs');
const d = __dirname;
let html = fs.readFileSync(d + '/vigie-proto.html', 'utf8');
const world = fs.readFileSync(d + '/world_compact.js', 'utf8');
const font = fs.readFileSync(d + '/manrope.b64', 'utf8').trim();
html = html.replace('//WORLD_DATA', world).replace('__MANROPE_B64__', font);
fs.writeFileSync(d + '/vigie.html', html);
console.log('vigie.html:', (html.length / 1024).toFixed(0) + ' KB',
  '| world:', html.includes('const WORLD='), '| font:', !html.includes('__MANROPE_B64__'));
