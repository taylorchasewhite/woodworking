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
  assert.equal(manifest.layoutVersion, 'bar-top-order-v3');
  assert.deepEqual(manifest.plantOrder, ['whiskey', 'gin', 'beer', 'wine', 'oak']);
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
    const families = { whiskey: ['rye', 'corn'], gin: ['juniper'], beer: ['hops', 'barley'], wine: ['grape'], oak: ['oak'] };
    for (const cut of cuts) assert(families[batch.section].includes(cut.id.split('-')[0]), `Wrong plant in ${batch.filename}: ${cut.id}`);
    combined.push(...cuts);
  }
  assert.equal(new Set(combined.map(item => item.id)).size, full.length);
  const sort = items => [...items].sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(sort(combined), sort(full));
});

test('all metadata-defined gallery regions retain their measured coordinate system', () => {
  const design = JSON.parse(read(path.join('master-botanicals', 'design.json')));
  assert.deepEqual(design.sections.filter(section => Number.isFinite(section.start)).map(section => section.key),
    ['whiskey', 'gin', 'beer', 'wine', 'oak']);
  assert.deepEqual(design.sections.filter(section => section.key.endsWith('-transition')).map(section => section.key),
    ['whiskey-gin-transition', 'gin-beer-transition', 'beer-wine-transition', 'wine-oak-transition']);
  for (const section of design.sections) {
    assert.equal(section.viewBox.length, 4);
    assert(section.viewBox.every(Number.isFinite));
    assert(section.viewBox[2] > 0 && section.viewBox[3] > 0);
  }
  for (const botanical of ['grape-', 'hops-', 'barley-', 'juniper-', 'rye-', 'corn-raised-kernel-', 'oak-acorn-']) {
    assert(read(path.join('master-botanicals', 'master-botanicals-paths.svg')).includes(botanical));
  }
});

test('actual cut coordinates place the botanical families in the requested physical order', t => {
  const route = [];
  function add(x, y) {
    const last = route.at(-1);
    route.push({ x, y, station: last ? last.station + Math.hypot(x - last.x, y - last.y) : 0 });
  }
  for (let i = 0; i <= 186; i++) add(1 + 18.525 * i / 186, 17.8);
  for (let i = 1; i <= 30; i++) {
    const a = Math.PI / 2 * (1 - i / 30);
    add(19.525 + 1.65 * Math.cos(a), 16.15 + 1.65 * Math.sin(a));
  }
  for (let i = 1; i <= 82; i++) add(21.175, 16.15 - 8.2 * i / 82);
  for (let i = 1; i <= 30; i++) {
    const a = Math.PI + Math.PI / 2 * i / 30;
    add(22.825 + 1.65 * Math.cos(a), 7.95 + 1.65 * Math.sin(a));
  }
  for (let i = 1; i <= 403; i++) add(22.825 + 40.3 * i / 403, 6.3);
  const expected = [
    { key: 'whiskey', families: ['rye', 'corn'], range: [0, 19] },
    { key: 'gin', families: ['juniper'], range: [19, 29.5] },
    { key: 'beer', families: ['hops', 'barley'], range: [29.5, 43.2] },
    { key: 'wine', families: ['grape'], range: [43.2, 62.5] },
    { key: 'oak', families: ['oak'], range: [62.5, 72.21] },
  ];
  const stations = new Map(expected.map(section => [section.key, []]));
  for (const item of paths(read(path.join('master-botanicals', 'master-botanicals-paths.svg')))) {
    const [x, y] = item.d.match(/-?\d+(?:\.\d+)?/g).slice(0, 2).map(Number);
    const closest = route.reduce((a, b) => Math.hypot(x - a.x, y - a.y) <= Math.hypot(x - b.x, y - b.y) ? a : b);
    const section = expected.find(section => section.families.includes(item.id.split('-')[0]));
    assert(section, `Unknown physical plant: ${item.id}`);
    stations.get(section.key).push(closest.station);
  }
  let previous = -Infinity;
  for (const section of expected) {
    const values = stations.get(section.key).sort((a, b) => a - b);
    assert(values.length > 100, `Missing physical section: ${section.key}`);
    const median = values[Math.floor(values.length / 2)];
    assert(median > previous && median > section.range[0] && median < section.range[1],
      `Misplaced ${section.key}: median station ${median}`);
    previous = median;
    t.diagnostic(`${section.key}: median cut station ${median.toFixed(2)} in`);
  }
  const design = JSON.parse(read(path.join('master-botanicals', 'design.json')));
  const transitions = design.sections.filter(section => section.key.endsWith('-transition'));
  for (let i = 0; i < transitions.length; i++) {
    const [start, end] = transitions[i].stationWindow;
    for (const section of expected.slice(i, i + 2)) {
      assert(stations.get(section.key).filter(s => s >= start && s <= end).length >= 10,
        `Missing ${section.key} interleaving in ${transitions[i].key}`);
    }
  }
});

test('sampled cut geometry stays inside the same measured oak outline with edge clearance', t => {
  const wood = [[14.875, 0], [64.125, 0], [64.125, 8.5], [23.375, 8.5],
    [23.375, 20], [0, 20], [0, 11.5], [14.875, 11.5]];
  const edges = wood.map((a, i) => [a, wood[(i + 1) % wood.length]]);
  let count = 0, minimum = Infinity;
  function check([x, y]) {
    let inside = false;
    for (const [a, b] of edges) {
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
      minimum = Math.min(minimum, Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy));
    }
    assert(inside, `Engraving outside oak at ${x}, ${y}`);
    count++;
  }
  for (const item of paths(read(path.join('master-botanicals', 'master-botanicals-paths.svg')))) {
    let previous, first;
    for (const [, command, numbers] of item.d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
      const values = (numbers.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      if (command === 'Z') { check(first); previous = first; continue; }
      const points = Array.from({ length: values.length / 2 }, (_, i) => [values[i * 2], values[i * 2 + 1]]);
      if (command === 'M') { [previous] = points; first = previous; check(previous); continue; }
      const polygon = [previous, ...points];
      const length = polygon.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - polygon[i][0], p[1] - polygon[i][1]), 0);
      const steps = Math.max(1, Math.ceil(length / 0.025));
      for (let i = 1; i <= steps; i++) {
        let level = polygon;
        const u = i / steps;
        while (level.length > 1) level = level.slice(1).map((p, j) =>
          [level[j][0] * (1 - u) + p[0] * u, level[j][1] * (1 - u) + p[1] * u]);
        check(level[0]);
      }
      previous = points.at(-1);
    }
  }
  assert(minimum > 0.70, `Insufficient centerline edge clearance: ${minimum}`);
  t.diagnostic(`${count} curve samples; minimum centerline edge clearance ${minimum.toFixed(4)} in`);
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
