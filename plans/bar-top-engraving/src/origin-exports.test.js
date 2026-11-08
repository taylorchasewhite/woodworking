const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
function paths(svg) {
  return [...svg.matchAll(/<path\b[^>]*>/g)].map(([tag]) =>
    Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])));
}
function assertCutSvg(svg) {
  assert.match(svg, /width="64\.125in" height="20in" viewBox="0 0 64\.125 20"/);
  assert.doesNotMatch(svg, /<(?:image|mask|clipPath|use)\b|\btransform=/);
  for (const item of paths(svg)) {
    assert.equal(item.fill, 'none');
    assert.equal(item.stroke, item.id.includes('registration-guide') ? '#0000ff' : '#808080');
    assert.match(item.d, /^M/);
  }
}

for (const [directory, prefix] of [
  ['', 'holiday-garland'],
  ['revision-2', 'holiday-garland'],
  ['tavern-botanicals', 'tavern-botanicals'],
  ['master-botanicals', 'master-botanicals'],
]) {
  test(`${directory || 'initial holiday'} uses correct colors and unchanged proof geometry`, () => {
    const cut = read(path.join(directory, `${prefix}-paths.svg`));
    const guides = read(path.join(directory, `${prefix}-with-guides.svg`));
    assertCutSvg(cut);
    assertCutSvg(guides);
    const engraving = paths(cut);
    assert(engraving.length > 0);
    assert.equal(new Set(engraving.map(item => item.id)).size, engraving.length);
    assert.deepEqual(paths(guides).filter(item => item.stroke === '#808080'), engraving);
    assert.doesNotMatch(read(path.join(directory, 'garland-preview.html')),
      /Blue SVG strokes encode on-line|gray (?:strokes|board guides)[^.]*non-cutting/);
    const proofPaths = new Set(paths(read(path.join(directory, 'measured-oak-garland-proof.svg'))).map(item => item.d));
    for (const item of engraving) assert(proofPaths.has(item.d), `Cut path missing from proof: ${item.id}`);
  });
}

test('ten batches partition the complete design exactly without scaling or duplicated cuts', () => {
  const directory = 'master-botanicals';
  const manifest = JSON.parse(read(path.join(directory, 'origin-batches', 'manifest.json')));
  assert.deepEqual(manifest.encoding, { onLine: '#808080', guide: '#0000ff' });
  assert.equal(manifest.batches.length, 10);
  const full = paths(read(path.join(directory, 'master-botanicals-paths.svg')));
  assert.equal(manifest.totalPaths, full.length);
  const referenceGuides = paths(read(path.join(directory, 'master-botanicals-with-guides.svg')))
    .filter(item => item.stroke === '#0000ff');
  const combined = [];
  for (const batch of manifest.batches) {
    const svg = read(path.join(directory, 'origin-batches', batch.filename));
    assertCutSvg(svg);
    assert.equal(Buffer.byteLength(svg), batch.bytes);
    const contents = paths(svg);
    assert.deepEqual(contents.filter(item => item.stroke === '#0000ff'), referenceGuides);
    const cuts = contents.filter(item => item.stroke === '#808080');
    assert.equal(cuts.length, batch.pathCount);
    assert(cuts.length > 0);
    combined.push(...cuts);
  }
  assert.equal(new Set(combined.map(item => item.id)).size, full.length);
  const sort = items => [...items].sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(sort(combined), sort(full));
});

test('all metadata-defined gallery regions retain their measured coordinate system', () => {
  const design = JSON.parse(read(path.join('master-botanicals', 'design.json')));
  assert.equal(design.sections.filter(section => Number.isFinite(section.start)).length, 5);
  assert.equal(design.sections.filter(section => section.key.endsWith('-transition')).length, 4);
  for (const section of design.sections) {
    assert.equal(section.viewBox.length, 4);
    assert(section.viewBox.every(Number.isFinite));
    assert(section.viewBox[2] > 0 && section.viewBox[3] > 0);
  }
  for (const botanical of ['grape-', 'hops-', 'barley-', 'juniper-', 'rye-', 'corn-raised-kernel-', 'oak-acorn-']) {
    assert(read(path.join('master-botanicals', 'master-botanicals-paths.svg')).includes(botanical));
  }
});

test('published reference JPEGs retain only an orientation EXIF entry', () => {
  const references = path.join(root, 'references');
  for (const filename of fs.readdirSync(references).filter(name => name.endsWith('.jpeg'))) {
    const data = fs.readFileSync(path.join(references, filename));
    assert.equal(data.readUInt16BE(0), 0xffd8);
    let offset = 2;
    while (offset < data.length) {
      assert.equal(data[offset], 0xff);
      let markerOffset = offset + 1;
      while (data[markerOffset] === 0xff) markerOffset++;
      const marker = data[markerOffset];
      if (marker === 0xda) break;
      const length = data.readUInt16BE(markerOffset + 1);
      const end = markerOffset + 1 + length;
      assert(end <= data.length);
      assert(marker !== 0xed && marker !== 0xfe, 'Unexpected photo metadata');
      if (marker === 0xe1) {
        assert.equal(length, 34);
        const exif = data.subarray(markerOffset + 3, end);
        assert.equal(exif.toString('ascii', 0, 6), 'Exif\0\0');
        assert.equal(exif.toString('ascii', 6, 8), 'II');
        assert.equal(exif.readUInt16LE(14), 1);
        assert.equal(exif.readUInt16LE(16), 0x112);
        assert(exif.readUInt16LE(24) >= 1 && exif.readUInt16LE(24) <= 8);
      }
      offset = end;
    }
  }
});
