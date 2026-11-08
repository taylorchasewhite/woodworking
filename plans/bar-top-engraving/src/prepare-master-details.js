const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..', 'master-botanicals');
const proof = fs.readFileSync(path.join(root, 'measured-oak-garland-proof.svg'), 'utf8');
const source = proof.slice(proof.indexOf('<svg'));
const design = JSON.parse(fs.readFileSync(path.join(root, 'design.json'), 'utf8'));
for (const [key, sectionKey, title, caption] of [
  ['wine', 'wine-close', 'Lusher grapes on a flowing vine - engraving close-up', 'More overlapping palmate leaves and hanging grape bunches; the connected vine is mostly concealed. All lines are actual SVG engraving paths.'],
  ['oak', 'oak-close', 'Natural white-oak layers and angled acorns', 'Selected foreground leaves partly hide the acorns; other fruit remains clear. Forward, backward and sideways leaves join woody twigs. All overlaps remove hidden engraving lines.'],
  ['gin', 'gin-close', 'Juniper sprays and berries on a woody branch', 'Common juniper grows on woody branches, not vines. Needle whorls, lateral shoots and berry pedicels connect beneath the lush sprays.'],
  ['corn', 'corn-close', 'Corn with raised kernel crowns and peeled husks', 'Kernels project beyond the inner cob; crowns, shaded side walls and bumpy outer contours describe relief. Differently angled ears sit among fuller rye stalks. All marks are actual engraving paths.'],
  ['corn-kernel', 'corn-kernel-close', 'Raised corn kernels - crown and side-face detail', 'Rounded crowns project beyond their narrower attachment roots. Side walls, underside hatching and individual edge kernels create the relief using engraving paths alone.'],
]) {
  const section = design.sections.find(s => s.key === sectionKey);
  assert(section, `Missing detail section: ${sectionKey}`);
  const coordinates = section.viewBox;
  const box = coordinates.join(' ');
  const height = 1800 * coordinates[3] / coordinates[2];
  const svg = source.replace('width="74.125in" height="31in" viewBox="-5 -5 74.125 31"',
    `width="1800" height="${height}" viewBox="${box}"`);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>*{box-sizing:border-box}body{padding:28px;margin:0;background:#faf8f3;color:#423424;font-family:Arial,sans-serif}h1{font:32px Georgia,serif;margin:0 0 12px}p{font-size:14px;color:#73634e;margin:0 0 22px}svg{display:block;width:100%;height:auto;border:1px solid #ceb68f;border-radius:6px}</style></head>
<body><h1>${title}</h1><p>${caption}</p>${svg}</body></html>`;
  fs.writeFileSync(path.join(__dirname, `master-${key}-detail.html`), html);
}
const proofUrl = '../master-botanicals/measured-oak-garland-proof.svg';
const transitions = design.sections.filter(s => s.key.endsWith('-transition'));
assert.equal(transitions.length, 4);
const panels = transitions.map(section => {
  const [x, y, w, h] = section.viewBox, cx = x + w / 2, cy = y + h / 2;
  const box = section.rotate ? [cx - h / 2, cy - w / 2, h, w] : [x, y, w, h];
  return `<section><h2>${section.title}</h2><p>${section.description}</p>
<svg viewBox="${box.join(' ')}"><g transform="rotate(${section.rotate} ${cx} ${cy})"><image href="${proofUrl}" x="-5" y="-5" width="74.125" height="31" preserveAspectRatio="none"/></g></svg></section>`;
}).join('');
fs.writeFileSync(path.join(__dirname, 'master-transitions-detail.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Four botanical handoffs</title>
<style>*{box-sizing:border-box}body{margin:28px;background:#faf8f3;color:#423424;font-family:Arial,sans-serif}h1{font:32px Georgia,serif}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}h2{font:24px Georgia,serif}p{font-size:14px;line-height:1.4;min-height:40px}svg{width:100%;height:auto;display:block;border:1px solid #ceb68f}</style></head><body><h1>Gentler botanical handoffs - actual measured engraving</h1><main>${panels}</main></body></html>`);
console.log('Prepared wine, oak, juniper, corn and kernel-detail close-ups using the same SVG path geometry.');
