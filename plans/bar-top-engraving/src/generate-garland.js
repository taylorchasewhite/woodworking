const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const isMaster = process.argv.includes('--master');
const isTavern = isMaster || process.argv.includes('--tavern');
const baseOutput = path.resolve(__dirname, '..');
const output = path.join(baseOutput, isMaster ? 'master-botanicals' : isTavern ? 'tavern-botanicals' : 'revision-2');
const designTitle = isMaster ? 'Layered botanical engraving - Whiskey Gin Beer Wine Oak - larger motifs v5' : isTavern ? 'US / UK tavern botanicals' : 'Detailed holiday garland - revision 2';
const pathFilename = isMaster ? 'master-botanicals-paths.svg' : isTavern ? 'tavern-botanicals-paths.svg' : 'holiday-garland-paths.svg';
const guideFilename = isMaster ? 'master-botanicals-with-guides.svg' : isTavern ? 'tavern-botanicals-with-guides.svg' : 'holiday-garland-with-guides.svg';
const dimensions = { short: 23.375, bend: 20, long: 49.25, width: 8.5 };
const { short: S, bend: B, long: L, width: W } = dimensions;
const left = S - W;
const right = left + L;
const inset = isMaster ? 2.2 : 1.75;
const radius = isMaster ? 1.65 : 1.4;
const flattenStep = isMaster ? 0.006 : 0.012;
const minimumFragment = isMaster ? 0.018 : 0.025;
const yShort = B - inset;
const yLong = W - inset;
const xBend = S - inset;
const fmt = n => Number(n.toFixed(5)).toString();
const xy = p => p.map(fmt).join(' ');
const outline = `M${fmt(left)} 0 H${fmt(right)} V${W} H${S} V${B} H0 V${fmt(B - W)} H${fmt(left)} Z`;
const boards = [
  { id: 'long-board', d: `M${left} 0 H${right} V${W} H${S} Z`, x: left, y: 0, width: L, height: W },
  { id: 'bend-board', d: `M${left} 0 L${S} ${W} V${B} L${left} ${B - W} Z`, x: left, y: 0, width: W, height: B },
  { id: 'short-board', d: `M0 ${B - W} H${left} L${S} ${B} H0 Z`, x: 0, y: B - W, width: S, height: W },
];
const texture = fs.readFileSync(path.join(baseOutput, 'references', 'oak-texture.png')).toString('base64');
fs.mkdirSync(output, { recursive: true });

const segments = [
  { type: 'line', from: [1, yShort], to: [xBend - radius, yShort] },
  { type: 'arc', center: [xBend - radius, yShort - radius], fromAngle: Math.PI / 2, toAngle: 0 },
  { type: 'line', from: [xBend, yShort - radius], to: [xBend, yLong + radius] },
  { type: 'arc', center: [xBend + radius, yLong + radius], fromAngle: Math.PI, toAngle: Math.PI * 1.5 },
  { type: 'line', from: [xBend + radius, yLong], to: [right - 1, yLong] },
];
let totalLength = 0;
for (const segment of segments) {
  segment.start = totalLength;
  segment.length = segment.type === 'line'
    ? Math.hypot(segment.to[0] - segment.from[0], segment.to[1] - segment.from[1])
    : Math.abs(segment.toAngle - segment.fromAngle) * radius;
  totalLength += segment.length;
}

function station(s) {
  assert(s >= -1e-8 && s <= totalLength + 1e-8, `Station out of bounds: ${s}`);
  const segment = segments.find(item => s <= item.start + item.length + 1e-8) || segments.at(-1);
  const t = Math.max(0, Math.min(1, (s - segment.start) / segment.length));
  if (segment.type === 'line') {
    const tangent = segment.to.map((value, i) => (value - segment.from[i]) / segment.length);
    return { point: segment.from.map((value, i) => value + t * (segment.to[i] - value)), tangent };
  }
  const angle = segment.fromAngle + t * (segment.toAngle - segment.fromAngle);
  const sign = Math.sign(segment.toAngle - segment.fromAngle);
  return {
    point: [segment.center[0] + radius * Math.cos(angle), segment.center[1] + radius * Math.sin(angle)],
    tangent: [-Math.sin(angle) * sign, Math.cos(angle) * sign],
  };
}

function wave(s) {
  if (isTavern) return 0.09 * Math.sin(s * 0.61) + 0.055 * Math.sin(s * 1.71 + 0.6);
  return 0.105 * Math.sin(s * Math.PI / 3);
}

function mapPoint(s, offset) {
  const { point, tangent } = station(s);
  const y = offset + wave(s);
  return [point[0] - tangent[1] * y, point[1] + tangent[0] * y];
}

const engraving = [];
function motifPath(id, start, commands, followCurve = false) {
  const anchor = mapPoint(start, 0);
  const { tangent } = station(start);
  const d = commands.map(([command, ...numbers]) => {
    const points = [];
    for (let i = 0; i < numbers.length; i += 2) {
      const x = numbers[i];
      const y = numbers[i + 1];
      points.push(xy(followCurve ? mapPoint(start + x, y) :
        [anchor[0] + tangent[0] * x - tangent[1] * y, anchor[1] + tangent[1] * x + tangent[0] * y]));
    }
    return command + points.join(' ');
  }).join(' ');
  engraving.push({ id, d });
}

function transform(commands, x, y, angle = 0, scale = 1) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return commands.map(([command, ...numbers]) => {
    const points = [];
    for (let i = 0; i < numbers.length; i += 2) {
      points.push(x + scale * (numbers[i] * c - numbers[i + 1] * s));
      points.push(y + scale * (numbers[i] * s + numbers[i + 1] * c));
    }
    return [command, ...points];
  });
}

function circle(id, start, x, y, r) {
  const k = r * 0.5522847498;
  motifPath(id, start, [
    ['M', x + r, y],
    ['C', x + r, y + k, x + k, y + r, x, y + r],
    ['C', x - k, y + r, x - r, y + k, x - r, y],
    ['C', x - r, y - k, x - k, y - r, x, y - r],
    ['C', x + k, y - r, x + r, y - k, x + r, y],
    ['Z'],
  ]);
}

function whitePine(id, start, side) {
  motifPath(`${id}-branch`, start, [
    ['M', -0.16, 0],
    ['C', 0.3, side * 0.03, 0.9, side * 0.31, 1.42, side * 0.57],
  ], true);
  for (let i = 0; i < 3; i++) {
    const x = 0.25 + i * 0.37;
    const y = side * (0.045 + i * 0.145);
    for (let needle = 0; needle < 5; needle++) {
      const spread = (needle - 2) * 0.18;
      const tipX = x + 0.40 + needle * 0.075;
      const tipY = y + side * (0.37 - spread);
      motifPath(`${id}-fascicle-${i + 1}-needle-${needle + 1}`, start, [
        ['M', x, y],
        ['C', x + 0.08, y + side * 0.08, tipX - 0.16, tipY - side * 0.04, tipX, tipY],
      ], true);
    }
  }
}

function hollyLeaf(id, start, x, y, angle, scale = 1) {
  const raw = [
    ['M', 0, 0],
    ['Q', 0.14, -0.04, 0.14, -0.20],
    ['Q', 0.32, -0.08, 0.36, -0.31],
    ['Q', 0.47, -0.15, 0.61, -0.33],
    ['Q', 0.69, -0.16, 0.88, -0.25],
    ['Q', 0.89, -0.09, 1.13, 0],
    ['Q', 0.91, 0.08, 0.88, 0.25],
    ['Q', 0.68, 0.15, 0.61, 0.33],
    ['Q', 0.45, 0.14, 0.36, 0.31],
    ['Q', 0.29, 0.08, 0.14, 0.20],
    ['Q', 0.15, 0.045, 0, 0],
    ['Z'],
  ];
  motifPath(`${id}-outline`, start, transform(raw, x, y, angle, scale));
  motifPath(`${id}-midrib`, start, transform([['M', 0.09, 0], ['Q', 0.56, -0.015, 1.035, 0]], x, y, angle, scale));
  for (const [index, vx] of [0.31, 0.56, 0.78].entries()) {
    for (const side of [-1, 1]) {
      motifPath(`${id}-vein-${index}-${side < 0 ? 'a' : 'b'}`, start, transform([
        ['M', vx - 0.06, 0],
        ['Q', vx + 0.02, side * 0.08, vx + 0.085, side * 0.17],
      ], x, y, angle, scale));
    }
  }
}

function hollyCluster(id, start) {
  hollyLeaf(`${id}-leaf-upper`, start, -0.07, -0.08, -0.67, 0.94);
  hollyLeaf(`${id}-leaf-lower`, start, 0.18, 0.13, 2.55, 0.82);
  const centers = [[0.17, -0.10], [0.40, -0.10], [0.52, 0.10], [0.30, 0.20], [0.10, 0.13]];
  centers.forEach(([x, y], i) => circle(`${id}-holly-berry-${i + 1}`, start, x, y, 0.079));
}

function mistletoe(id, start) {
  motifPath(`${id}-stem`, start, [['M', -0.12, 0], ['C', 0.31, 0.04, 0.7, -0.02, 1.09, -0.10]]);
  const leaf = [
    ['M', 0, 0],
    ['C', 0.14, -0.22, 0.57, -0.20, 0.73, -0.035],
    ['Q', 0.78, 0.025, 0.72, 0.065],
    ['C', 0.52, 0.23, 0.18, 0.20, 0, 0],
    ['Z'],
  ];
  for (const [index, x] of [0.12, 0.55].entries()) {
    for (const side of [-1, 1]) {
      const angle = side * (index === 0 ? 1.14 : 0.9);
      const name = `${id}-paired-leaf-${index + 1}-${side < 0 ? 'a' : 'b'}`;
      motifPath(`${name}-outline`, start, transform(leaf, x, -0.025, angle, 0.82));
      motifPath(`${name}-midrib`, start, transform([['M', 0.10, 0], ['Q', 0.36, 0.015, 0.62, 0.015]], x, -0.025, angle, 0.82));
    }
  }
  circle(`${id}-white-berry-1`, start, 1.01, -0.22, 0.084);
  circle(`${id}-white-berry-2`, start, 1.20, -0.105, 0.084);
  circle(`${id}-white-berry-3`, start, 1.01, 0.01, 0.084);
}

function pineCone(id, start) {
  const y = -0.27;
  const contour = [
    ['M', -0.10, -0.35],
    ['C', -0.50, -0.29, -0.64, 0.11, -0.56, 0.43],
    ['C', -0.49, 0.75, -0.22, 1.01, 0, 1.18],
    ['C', 0.24, 1.01, 0.49, 0.75, 0.56, 0.43],
    ['C', 0.65, 0.10, 0.51, -0.30, 0.10, -0.35],
    ['Q', 0.01, -0.42, -0.10, -0.35],
    ['Z'],
  ];
  motifPath(`${id}-contour`, start, transform(contour, 0, y));
  motifPath(`${id}-stalk`, start, [['M', 0, y - 0.35], ['Q', -0.03, y - 0.49, 0.06, y - 0.56]]);
  const rows = [
    { y: -0.14, centers: [-0.16, 0.16], width: 0.29 },
    { y: 0.08, centers: [-0.32, 0, 0.32], width: 0.28 },
    { y: 0.30, centers: [-0.32, 0, 0.32], width: 0.29 },
    { y: 0.52, centers: [-0.24, 0.12], width: 0.30 },
    { y: 0.72, centers: [-0.12, 0.16], width: 0.25 },
    { y: 0.93, centers: [0], width: 0.22 },
  ];
  rows.forEach((row, r) => row.centers.forEach((x, c) => {
    const w = row.width;
    motifPath(`${id}-scale-${r + 1}-${c + 1}`, start, transform([
      ['M', x - w / 2, row.y],
      ['Q', x, row.y - 0.09, x + w / 2, row.y],
      ['Q', x + w * 0.30, row.y + 0.13, x, row.y + 0.19],
      ['Q', x - w * 0.30, row.y + 0.13, x - w / 2, row.y],
      ['Z'],
    ], 0, y));
  }));
}

function poinsettia(id, start) {
  for (const [layer, count, size, offset] of [['outer', 7, 1, 0.11], ['inner', 5, 0.60, 0.47]]) {
    for (let i = 0; i < count; i++) {
      const angle = offset + i * Math.PI * 2 / count + 0.035 * Math.sin(i * 1.7);
      const length = size * (i % 2 === 0 ? 1 : 0.94);
      const base = layer === 'outer' ? 0.34 : 0.20;
      const bract = [
        ['M', base, 0],
        ['C', 0.46, -0.23, 0.80, -0.34, 1.04, 0],
        ['C', 0.79, 0.32, 0.46, 0.27, base, 0],
        ['Z'],
      ];
      motifPath(`${id}-${layer}-bract-${i + 1}`, start, transform(bract, 0, 0, angle, length));
      const veinStart = layer === 'outer' ? 0.66 : 0.24;
      motifPath(`${id}-${layer}-vein-${i + 1}`, start, transform([
        ['M', veinStart, 0], ['Q', 0.80, -0.012, 0.94, 0],
      ], 0, 0, angle, length));
    }
  }
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    circle(`${id}-floret-${i + 1}`, start, 0.13 * Math.cos(angle), 0.13 * Math.sin(angle), 0.051);
  }
}

const flowers = isTavern ? [] : [10, segments[1].start + segments[1].length / 2, segments[4].start + 7.8, segments[4].start + 26.2];
const accents = [];
for (let i = 0, s = 1.8; !isTavern && s < totalLength - 1.4; i++, s += 3) {
  if (flowers.some(flower => Math.abs(s - flower) < 1.35)) continue;
  accents.push({ station: s, type: ['holly', 'pine-cone', 'mistletoe'][i % 3] });
}
function stemSection(start, end, id) {
  if (end - start < 0.025) return;
  const points = [];
  for (let i = 0, count = Math.ceil((end - start) / 0.075); i <= count; i++) {
    points.push(mapPoint(start + (end - start) * i / count, 0));
  }
  let d = `M${xy(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = p1.map((value, axis) => value + (p2[axis] - p0[axis]) / 6);
    const c2 = p2.map((value, axis) => value - (p3[axis] - p1[axis]) / 6);
    d += ` C${xy(c1)} ${xy(c2)} ${xy(p2)}`;
  }
  engraving.push({ id, d });
}
let tavern;
if (isTavern) {
  tavern = require(isMaster ? './master-botanicals' : './tavern-botanicals')({ motifPath, transform, circle, stemSection, totalLength, mapPoint });
} else {
  stemSection(0, totalLength, 'garland-stem');
  for (let i = 0, s = 0.3; s < totalLength - 1.85; i++, s += 1.22) {
    whitePine(`white-pine-${i + 1}`, s, i % 2 === 0 ? -1 : 1);
  }
  accents.forEach((item, i) => {
    const id = `${item.type}-${i + 1}`;
    if (item.type === 'holly') hollyCluster(id, item.station);
    if (item.type === 'pine-cone') pineCone(id, item.station);
    if (item.type === 'mistletoe') mistletoe(id, item.station);
  });
  flowers.forEach((s, i) => poinsettia(`poinsettia-${i + 1}`, s));
}

function flatten(d) {
  const tokens = d.match(/[MCQLZ]|-?\d+(?:\.\d+)?/g);
  const points = [];
  let previous;
  for (let i = 0; i < tokens.length;) {
    const command = tokens[i++];
    if (command === 'Z') {
      points.push(points[0]);
      continue;
    }
    const count = { M: 2, L: 2, Q: 4, C: 6 }[command];
    assert(count, `Unsupported path command: ${command}`);
    const values = tokens.slice(i, i + count).map(Number);
    i += count;
    const controls = Array.from({ length: count / 2 }, (_, n) => [values[2 * n], values[2 * n + 1]]);
    if (command === 'M' || command === 'L') {
      previous = controls[0];
      points.push(previous);
      continue;
    }
    const polygon = [previous, ...controls];
    const polygonLength = polygon.slice(1).reduce((sum, p, n) => sum + Math.hypot(p[0] - polygon[n][0], p[1] - polygon[n][1]), 0);
    const steps = Math.max(4, Math.ceil(polygonLength / flattenStep));
    for (let n = 1; n <= steps; n++) {
      const t = n / steps;
      let level = polygon;
      while (level.length > 1) {
        level = level.slice(1).map((p, j) => [
          level[j][0] * (1 - t) + p[0] * t,
          level[j][1] * (1 - t) + p[1] * t,
        ]);
      }
      points.push(level[0]);
    }
    previous = controls.at(-1);
  }
  return points;
}

function bounds(points) {
  return {
    minX: Math.min(...points.map(p => p[0])), maxX: Math.max(...points.map(p => p[0])),
    minY: Math.min(...points.map(p => p[1])), maxY: Math.max(...points.map(p => p[1])),
  };
}

function inside(point, mask) {
  const [x, y] = point;
  if (x < mask.box.minX || x > mask.box.maxX || y < mask.box.minY || y > mask.box.maxY) return false;
  let result = false;
  for (let i = 0, j = mask.points.length - 1; i < mask.points.length; j = i++) {
    const a = mask.points[i];
    const b = mask.points[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}

const foreground = engraving.filter(item => isTavern ? tavern.foregroundIds.has(item.id) :
  /(?:-contour|-outline|-outer-bract-\d+|-inner-bract-\d+|-floret-\d+|-holly-berry-\d+|-white-berry-\d+)$/.test(item.id)
).map(item => {
  const points = flatten(item.d);
  return { id: item.id, points, box: bounds(points) };
});
if (isMaster) {
  const motifFamilies = {
    grapeLeaves: /^grape-(?:front|back)-leaf-\d+-silhouette$/,
    grapes: /^grape-fruit-\d+-silhouette$/,
    hopLeaves: /^hops-(?:back|front|transition)-leaf-\d+-silhouette$/,
    hopBracts: /^hops-overlapping-bract-\d+-silhouette$/,
    juniperNeedles: /^juniper-whorled-needle-\d+-\d+-silhouette$/,
    juniperBerries: /^juniper-seed-cone-\d+-silhouette$/,
    barleyGrains: /^barley-grain-\d+-silhouette$/,
    ryeGrains: /^rye-grain-\d+-silhouette$/,
    cornKernels: /^corn-raised-kernel-\d+-silhouette$/,
    oakLeaves: /^oak-(?:back|middle|foreground)-leaf-\d+-silhouette$/,
    acorns: /^oak-acorn-nut-\d+-silhouette$/,
  };
  tavern.stats.motifMetrics = Object.fromEntries(Object.entries(motifFamilies).map(([family, pattern]) => {
    const areas = foreground.filter(mask => pattern.test(mask.id)).map(mask => {
      const sum = mask.points.reduce((total, point, i, points) => {
        const next = points[(i + 1) % points.length];
        return total + point[0] * next[1] - next[0] * point[1];
      }, 0);
      return Math.abs(sum) / 2;
    }).sort((a, b) => a - b);
    assert(areas.length > 0 && areas.every(area => area > 0), `Missing or invalid motif silhouettes: ${family}`);
    const middle = Math.floor(areas.length / 2);
    const median = areas.length % 2 ? areas[middle] : (areas[middle - 1] + areas[middle]) / 2;
    return [family, { count: areas.length, medianSilhouetteAreaSquareInches: Number(median.toFixed(6)) }];
  }));
}
let trimmedPaths = 0;
let hiddenPaths = 0;
let discardedFragments = 0;
const visible = [];
for (const item of engraving) {
  let masks;
  if (isTavern) {
    masks = tavern.masksFor(item, foreground);
  } else if (item.id.startsWith('white-pine-') || item.id.startsWith('garland-stem')) {
    masks = foreground;
  } else if (/^poinsettia-/.test(item.id) && !/-floret-/.test(item.id)) {
    const family = item.id.match(/^poinsettia-\d+/)[0];
    masks = foreground.filter(mask => mask.id.startsWith(`${family}-`) &&
      (mask.id.includes('-floret-') || (/-outer-(?:bract|vein)-/.test(item.id) && mask.id.includes('-inner-bract-'))));
  } else if (/^(?:holly|mistletoe)-/.test(item.id) && !/-berry-/.test(item.id)) {
    const family = item.id.match(/^(?:holly|mistletoe)-\d+/)[0];
    masks = foreground.filter(mask => mask.id.startsWith(`${family}-`) && /-berry-/.test(mask.id));
  } else {
    visible.push(item);
    continue;
  }
  const points = flatten(item.d);
  const box = bounds(points);
  const keepInside = isMaster ? tavern.keepInsideFor(item, foreground) : undefined;
  const isHidden = point => (keepInside && !inside(point, keepInside)) || masks.some(mask => inside(point, mask));
  masks = masks.filter(mask => mask.id !== item.id && mask.box.maxX >= box.minX && mask.box.minX <= box.maxX &&
    mask.box.maxY >= box.minY && mask.box.minY <= box.maxY);
  if (!points.some(isHidden)) {
    visible.push(item);
    continue;
  }
  trimmedPaths++;
  const runs = [];
  let run = [];
  for (const point of points) {
    if (isHidden(point)) {
      if (run.length > 1) runs.push(run);
      run = [];
    } else {
      run.push(point);
    }
  }
  if (run.length > 1) runs.push(run);
  const usableRuns = runs.filter(points => {
    const length = points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - points[i][0], point[1] - points[i][1]), 0);
    if (length >= minimumFragment) return true;
    discardedFragments++;
    return false;
  });
  if (usableRuns.length === 0) hiddenPaths++;
  usableRuns.forEach((points, index) => visible.push({
    id: `${item.id}-visible-${index + 1}`,
    d: `M${xy(points[0])} ` + points.slice(1).map(point => `L${xy(point)}`).join(' '),
    sourceId: item.id,
  }));
}
engraving.splice(0, engraving.length, ...visible);

if (isMaster) {
  const textureSources = new Map();
  for (const item of engraving) {
    const sourceId = item.sourceId || item.id;
    const metadata = tavern.metadata.get(sourceId);
    // Needle silhouettes use the lightest weight, but are foliage, not disposable shading.
    if (metadata.weight !== 'hatch' || tavern.foregroundIds.has(sourceId)) continue;
    if (!textureSources.has(sourceId)) textureSources.set(sourceId, []);
    textureSources.get(sourceId).push(item);
  }
  const baselinePaths = engraving.length;
  const texturePaths = [...textureSources.values()].reduce((sum, items) => sum + items.length, 0);
  const targetRemovedPaths = Math.round(baselinePaths * 0.25);
  assert(targetRemovedPaths < texturePaths, 'Insufficient fine texture to simplify without changing plant structure');
  const removalFraction = targetRemovedPaths / texturePaths;
  const removedSources = new Set();
  let consideredPaths = 0, removedPaths = 0;
  for (const [sourceId, items] of textureSources) {
    consideredPaths += items.length;
    const target = consideredPaths * removalFraction;
    // Thin evenly in drawing order and keep all clipped fragments of a stroke together.
    if (Math.abs(removedPaths + items.length - target) <= Math.abs(removedPaths - target)) {
      removedSources.add(sourceId);
      removedPaths += items.length;
    }
  }
  assert(Math.abs(removedPaths / baselinePaths - 0.25) < 0.001, 'Detail reduction missed the 25 percent overall target');
  const sectionReductions = tavern.sections.filter(section => Number.isFinite(section.start)).map(section => {
    const sources = [...textureSources].filter(([id]) => tavern.metadata.get(id).section === section.key);
    const before = sources.reduce((sum, [, items]) => sum + items.length, 0);
    const removed = sources.reduce((sum, [id, items]) => sum + (removedSources.has(id) ? items.length : 0), 0);
    return { section: section.key, texturePathsBefore: before, texturePathsRemoved: removed };
  });
  engraving.splice(0, engraving.length, ...engraving.filter(item => !removedSources.has(item.sourceId || item.id)));
  tavern.stats.detailReduction = {
    baselineVersion: tavern.stats.layoutVersion, baselineDescription: 'Same scene before fine-texture thinning', targetOverallFraction: 0.25,
    baselinePaths, retainedPaths: engraving.length, removedPaths,
    overallReductionFraction: Number((removedPaths / baselinePaths).toFixed(5)),
    texturePathsBefore: texturePaths, texturePathsRemoved: removedPaths,
    textureReductionFraction: Number((removedPaths / texturePaths).toFixed(5)),
    protectedPaths: baselinePaths - texturePaths, sectionReductions,
  };
}

let occlusionVerification;
if (isMaster) {
  let checkedPoints = 0;
  let totalPathLength = 0;
  let exposedSpinePaths = 0;
  const footprint = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const item of engraving) {
    const source = { id: item.sourceId || item.id };
    const points = flatten(item.d);
    const box = bounds(points);
    const masks = tavern.masksFor(source, foreground).filter(mask =>
      mask.box.maxX >= box.minX && mask.box.minX <= box.maxX &&
      mask.box.maxY >= box.minY && mask.box.minY <= box.maxY);
    if (/(?:spine|garland-stem|vine-spine)/.test(item.id)) exposedSpinePaths++;
    for (let i = 0; i < points.length; i++) {
      if (i) totalPathLength += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      // Rounding SVG coordinates can shift an occlusion boundary by a few microns.
      const p = points[i];
      footprint.minX = Math.min(footprint.minX, p[0]);
      footprint.maxX = Math.max(footprint.maxX, p[0]);
      footprint.minY = Math.min(footprint.minY, p[1]);
      footprint.maxY = Math.max(footprint.maxY, p[1]);
      const margin = 0.00003;
      for (const mask of masks) {
        if (inside(p, mask) &&
          [[p[0] - margin, p[1]], [p[0] + margin, p[1]], [p[0], p[1] - margin], [p[0], p[1] + margin]].every(q => inside(q, mask))) {
          assert.fail(`Visible line runs under a foreground object: ${item.id} / ${mask.id}`);
        }
      }
      checkedPoints++;
    }
  }
  assert.equal(exposedSpinePaths, 0);
  const structuralCoverage = tavern.structuralSupports.map(support => {
    const foliage = tavern.masksFor({ id: support.contourId }, foreground).filter(mask =>
      /leaf|grape-fruit|juniper-whorled-needle|juniper-seed-cone|hops-overlapping-bract|(?:barley|rye)-grain/.test(mask.id));
    const hidden = support.points.filter(p => foliage.some(mask => inside(p, mask))).length;
    const hiddenFraction = hidden / support.points.length;
    assert(hiddenFraction >= 0.5, `Structural branch too exposed: ${support.kind} / ${hiddenFraction}`);
    return { kind: support.kind, sampledPoints: support.points.length, hiddenByFoliageFraction: Number(hiddenFraction.toFixed(3)) };
  });
  const oakLayering = tavern.oakAcorns.map(acorn => {
    const nut = foreground.find(mask => mask.id === acorn.nutContourId);
    assert(nut, `Missing acorn silhouette: ${acorn.nutContourId}`);
    const leaves = tavern.masksFor({ id: nut.id }, foreground).filter(mask => mask.id.startsWith('oak-foreground-leaf-'));
    const hidden = nut.points.filter(p => leaves.some(mask => inside(p, mask))).length;
    const retainedNutFragments = engraving.filter(item => (item.sourceId || item.id) === nut.id).length;
    const retainedCupFragments = engraving.filter(item => (item.sourceId || item.id) === acorn.capContourId).length;
    assert(retainedNutFragments > 0 && retainedCupFragments > 0, `Acorn lost beneath foreground leaves: ${nut.id}`);
    return { nutId: nut.id, angleDegrees: Math.round(acorn.angle * 180 / Math.PI),
      foregroundLeafOutlineConcealmentFraction: Number((hidden / nut.points.length).toFixed(3)),
      retainedNutFragments, retainedCupFragments };
  });
  assert(oakLayering.filter(nut => nut.foregroundLeafOutlineConcealmentFraction > 0.02 &&
    nut.foregroundLeafOutlineConcealmentFraction < 0.95).length >= 2, 'Oak needs partially leaf-hidden acorns');
  assert(oakLayering.some(nut => nut.foregroundLeafOutlineConcealmentFraction === 0), 'Oak needs an acorn clear of foreground leaves');
  const visibleCornSideFaces = engraving.filter(item => item.id.includes('-kernel-side-face')).length;
  assert(visibleCornSideFaces >= 20, `Insufficient visible raised-kernel side faces: ${visibleCornSideFaces}`);
  assert(!engraving.some(item => item.id.startsWith('corn-tapered-ear-') || item.id.startsWith('corn-curved-kernel-')));
  tavern.stats.engravingFootprint = Object.fromEntries(Object.entries(footprint).map(([key, value]) => [key, Number(value.toFixed(5))]));
  occlusionVerification = { checkedPoints, exposedSpinePaths, structuralCoverage, oakLayering, visibleCornSideFaces,
    approximateEngravedLineLengthInches: Number(totalPathLength.toFixed(1)) };
}

const pathMarkup = (color, strokeWidth, prefix = '', illustrateWeights = false, items = engraving) => items.map(item => {
  const weight = isMaster ? tavern.metadata.get(item.sourceId || item.id).weight : undefined;
  const width = illustrateWeights ? ({ outline: 0.012, vein: 0.010, hatch: 0.0075 }[weight] || strokeWidth) : strokeWidth;
  return `<path id="${prefix}${item.id}" d="${item.d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}).join('\n');
const drawing = prefix => `<g id="${prefix}-engraving-preview">${pathMarkup('#553822', 0.022, `${prefix}-`, isMaster)}</g>`;
const machinePaths = pathMarkup('#808080', 0.01);
const exportSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${right}in" height="${B}in" viewBox="0 0 ${right} ${B}">
<title>${designTitle} - engraving paths only</title>
<desc>One SVG unit equals one inch. Stepped top: short arm 23 3/8 in, bend 20 in, long arm 49 1/4 in; all boards 8 1/2 in wide. Gray strokes encode on-line cuts. Coordinates match the measured proof; empty artboard space is not a registration guide. Cutter diameter and depth are not specified. Confirm dimensions and placement on-tool and test on scrap before cutting.</desc>
${machinePaths}
</svg>`;
fs.writeFileSync(path.join(output, pathFilename), exportSvg);

function wood(prefix) {
  return `<defs>
${boards.map(board => `<clipPath id="${prefix}-clip-${board.id}"><path d="${board.d}"/></clipPath>`).join('\n')}
<image id="${prefix}-oak-photo" href="data:image/png;base64,${texture}" width="1" height="1" preserveAspectRatio="none"/>
</defs>
<g id="${prefix}-wood-boards">
${boards.map(board => `<g clip-path="url(#${prefix}-clip-${board.id})">
<path d="${board.d}" fill="${isMaster ? '#d2b68b' : '#c69d69'}"/>
${board.id === 'bend-board'
    ? `<use href="#${prefix}-oak-photo" transform="translate(${S} 0) rotate(90) scale(${B} ${W})"${isMaster ? ' opacity="0.58"' : ''}/>`
    : `<use href="#${prefix}-oak-photo" transform="translate(${board.x} ${board.y}) scale(${board.width} ${board.height})"${isMaster ? ' opacity="0.58"' : ''}/>`}
<path d="${board.d}" fill="#b87936" opacity="0.10"/>
</g>`).join('\n')}
<path id="${prefix}-board-outline" d="${outline}" fill="none" stroke="#785738" stroke-width="0.055"/>
<path d="M${left} 0 L${S} ${W} M${left} ${B - W} L${S} ${B}" fill="none" stroke="#896747" stroke-width="0.033"/>
</g>`;
}

function dimension(x1, y1, x2, y2, label, vertical = false) {
  const x = (x1 + x2) / 2;
  const y = (y1 + y2) / 2;
  return `<g class="dimension">
<path d="M${x1} ${y1} L${x2} ${y2}" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
<text x="${x}" y="${y - 0.34}" text-anchor="middle"${vertical ? ` transform="rotate(-90 ${x} ${y})"` : ''}>${label}</text>
</g>`;
}

const plan = `<svg xmlns="http://www.w3.org/2000/svg" id="measured-plan" width="74.125in" height="31in" viewBox="-5 -5 74.125 31" role="img" aria-labelledby="plan-title plan-desc">
<title id="plan-title">Measured oak top - ${designTitle}</title>
<desc id="plan-desc">True-scale top-down stepped layout. Long arm 49 1/4 inches, connector 20 inches, short arm 23 3/8 inches, all 8 1/2 inches wide. Both 45-degree miter seams are shown. Engraving follows the exposed continuous front edge.</desc>
<defs><marker id="arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="#5d6663"/></marker></defs>
<style>
.dimension path{fill:none;stroke:#5d6663;stroke-width:0.035}
.dimension text{fill:#394440;font-family:Arial,sans-serif;font-size:0.70px;paint-order:stroke;stroke:#faf8f3;stroke-width:0.23px;stroke-linejoin:round}
.extension{fill:none;stroke:#9ba39e;stroke-width:0.022}
.note{font-family:Arial,sans-serif;fill:#6b756d;font-size:0.57px}
</style>
<rect x="-5" y="-5" width="74.125" height="31" rx="0.5" fill="#faf8f3"/>
${wood('plan')}
${drawing('plan')}
<g class="extension">
<path d="M${left} 0 V-2.9 M${right} 0 V-2.9 M0 ${B} V23.1 M${S} ${B} V23.1"/>
<path d="M${left} 0 H-3.3 M0 ${B} H-3.3 M${right} 0 H67.2 M${right} ${W} H67.2"/>
</g>
${dimension(left, -2.1, right, -2.1, '49 1/4 in - long arm')}
${dimension(0, 22.3, S, 22.3, '23 3/8 in - short arm')}
${dimension(-2.8, 0, -2.8, B, '20 in - bend (long points)', true)}
${dimension(66.5, 0, 66.5, W, '8 1/2 in', true)}
<text class="note" x="40" y="2.2" text-anchor="middle">BACK / WALL SIDE</text>
<text class="note" x="44" y="10.9" text-anchor="middle">EXPOSED FRONT EDGE - ENGRAVING ON THE TOP FACE</text>
<text class="note" x="4.8" y="13.1" text-anchor="middle">BACK / WALL SIDE</text>
<text class="note" x="32.5" y="15.3">All three boards: 8 1/2 in wide</text>
<text class="note" x="32.5" y="16.5">Both miter joints: 45 degrees</text>
<text class="note" x="32.5" y="17.7">Overall extent: 64 1/8 x 20 in (derived)</text>
<text class="note" x="32.5" y="19">${isMaster ? 'Whiskey + bourbon / gin / beer / wine / oak - v5' : isTavern ? 'Wine / beer / gin / rye whiskey + bourbon / oak' : 'White pine, pine cones, holly leaves + berries,'}</text>
<text class="note" x="32.5" y="20.2">${isMaster ? 'Larger motifs, fewer plants; same engraving band.' : isTavern ? 'Distinct sections with softly overlapping transitions.' : 'mistletoe and poinsettia - denser botanical clusters.'}</text>
<text class="note" x="0" y="25">TRUE PROPORTIONS - one drawing unit = one inch. Proof only: do not import this annotated wood layout as a cut file.</text>
</svg>`;
fs.writeFileSync(path.join(output, 'measured-oak-garland-proof.svg'), `<?xml version="1.0" encoding="UTF-8"?>\n${plan}`);

const registrationGuides = `<path id="board-registration-guide" d="${outline}" fill="none" stroke="#0000ff" stroke-width="0.01"/>
<path id="miter-registration-guides" d="M${left} 0 L${S} ${W} M${left} ${B - W} L${S} ${B}" fill="none" stroke="#0000ff" stroke-width="0.01"/>`;
const originLayout = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${right}in" height="${B}in" viewBox="0 0 ${right} ${B}">
<title>${designTitle} - non-cutting board registration guides</title>
<desc>Gray paths: on-line engraving. Blue paths: non-cutting reference geometry. One unit equals one inch. Confirm guide placement against the actual wood before cutting. Bit diameter and depth are not specified.</desc>
${registrationGuides}
${machinePaths}
</svg>`;
fs.writeFileSync(path.join(output, guideFilename), originLayout);

if (isMaster) {
  const regions = tavern.sections.filter(section => Number.isFinite(section.start));
  const batches = regions.flatMap(section => ['linework', 'shading'].map(pass => ({
    section: section.key, pass, filename: `${section.key}-${pass}.svg`, items: [],
  })));
  for (const item of engraving) {
    const source = tavern.metadata.get(item.sourceId || item.id);
    const section = regions.find(region => source.section === region.key);
    assert(section, `Unknown batch section: ${item.id}`);
    const pass = source.weight === 'hatch' ? 'shading' : 'linework';
    batches.find(batch => batch.section === section.key && batch.pass === pass).items.push(item);
  }
  const batchDirectory = path.join(output, 'origin-batches');
  fs.mkdirSync(batchDirectory, { recursive: true });
  const manifest = batches.map(({ section, pass, filename, items }) => {
    assert(items.length > 0, `Empty Origin batch: ${filename}`);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${right}in" height="${B}in" viewBox="0 0 ${right} ${B}">
<title>${designTitle} - ${section} ${pass}</title>
<desc>Gray: on-line cuts. Blue: non-cutting board and miter guides. Exact unchanged paths from the complete design, not a rescaled crop. Align the full board guide identically for every batch in the same scanned workspace. Some connected branches span botanical boundaries. Do not cut the registration guides. Bit and depth remain unset; test on scrap.</desc>
${registrationGuides}
${pathMarkup('#808080', 0.01, '', false, items)}
</svg>`;
    fs.writeFileSync(path.join(batchDirectory, filename), svg);
    return { section, pass, filename, pathCount: items.length, bytes: Buffer.byteLength(svg) };
  });
  assert.equal(manifest.reduce((n, batch) => n + batch.pathCount, 0), engraving.length);
  fs.writeFileSync(path.join(batchDirectory, 'manifest.json'), JSON.stringify({
    encoding: { onLine: '#808080', guide: '#0000ff' },
    widthInches: right, heightInches: B, totalPaths: engraving.length,
    layoutVersion: tavern.stats.layoutVersion,
    plantOrder: tavern.stats.plantOrder,
    detailReduction: tavern.stats.detailReduction,
    placement: 'All files use the same full-board guides and coordinates. Never scale individual batches.',
    batches: manifest,
  }, null, 2));
}

function detail(viewBox, name, prefix) {
  const [, , width, height] = viewBox.split(' ').map(Number);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 100}" height="${height * 100}" viewBox="${viewBox}" role="img" aria-label="${name}">${wood(prefix)}${drawing(prefix)}</svg>`;
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${designTitle} - measured oak proof</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:26px;background:#eae6dd;color:#28352e;font-family:Arial,sans-serif}
#sheet{max-width:1720px;margin:auto;background:#faf8f3;padding:30px 38px;border-radius:12px}
header{display:flex;justify-content:space-between;align-items:start;gap:24px;margin-bottom:12px}
h1{font-family:Georgia,serif;font-weight:normal;font-size:34px;margin:0 0 8px}
p{margin:0;color:#69756b;font-size:15px;line-height:1.5}.badge{font-size:12px;border:1px solid #b5bcaf;border-radius:20px;padding:8px 12px;white-space:nowrap}
#measured-plan{display:block;width:100%;height:auto}
.details{margin-top:2px}
.details figure{margin:0;min-width:0}.details svg{display:block;width:${isMaster ? 'min(100%, 954px)' : '100%'};height:${isMaster ? 'auto' : '310px'};overflow:hidden;border:1px solid #d8cbb5;border-radius:5px}
figcaption{font-size:14px;font-weight:bold;margin:0 0 9px}small{display:block;font-weight:normal;font-size:12px;color:#718071;margin-top:4px}
footer{border-top:1px solid #d8ddcf;margin-top:23px;padding-top:17px;display:flex;justify-content:space-between;gap:30px;font-size:13px;line-height:1.5}
footer p{font-size:13px;max-width:62%}a{color:#426247}nav{white-space:nowrap}
@media(max-width:850px){body{padding:8px}#sheet{padding:18px}h1{font-size:27px}.details{grid-template-columns:1fr}footer{display:block}footer p{max-width:none}nav{margin-top:12px}}
</style></head>
<body><main id="sheet">
<header><div><h1>${isMaster ? 'Layered foliage - an engraved botanical frieze' : isTavern ? 'The plants behind the pour' : 'A fuller botanical holiday garland'}</h1><p>23 3/8 in short arm &middot; 20 in bend &middot; 49 1/4 in long arm &middot; 8 1/2 in width throughout</p></div><span class="badge">${isMaster ? 'LAYERED / HATCHED' : isTavern ? 'US / UK BOTANICALS' : 'REVISION 2'} &nbsp; / &nbsp; TOP-DOWN PROOF</span></header>
${plan}
<section class="details">
<figure><figcaption>Botanical detail, enlarged<small>${isMaster ? 'Version 5 enlarges the individual motifs by about 40% and uses fewer leaves, berries, cones and grain heads within the existing engraving band. Fine texture is still thinned. The wood dimensions and whiskey / gin / beer / wine / oak order remain unchanged. Compare v4 and v5 in the gallery.' : isTavern ? 'Common juniper transitions into rye and corn. Explore all five sections on the comparison page.' : 'The same engraving paths: layered pine-cone scales, veined holly, five-needle white-pine bundles, berries, paired mistletoe leaves and a layered poinsettia.'}</small></figcaption>${detail(isMaster ? tavern.sections.find(section => section.key === 'wine-close').viewBox.join(' ') : '24.5 5.15 17.5 3.5', 'Enlarged detailed botanical garland', 'repeat')}</figure>
</section>
<footer><p><strong>Design proof, not a cut-depth prescription.</strong> ${isMaster ? 'The foliage occupies roughly a 3 in band centered 2.2 in from the exposed edge. Depth is suggested by actual overlapping outlines and hatch paths, not raster shadows or relief. Preview line weights are illustrative, not selected cutter widths; fine shading requires bit/depth selection and a physical sample.' : 'The botanical band is roughly 2 in wide; its center is 1.75 in inside the exposed edge. Stem lines stop beneath the main clusters instead of running through their centers. Fine botanical details require an appropriate bit and scrap test; cutter and depth remain unset.'} The oak grain comes from your photo. Gray SVG strokes encode on-line engraving; blue strokes are non-cutting guides.</p>
<nav>${isTavern ? `<a href="../design-gallery.html#${isMaster ? 'master' : 'tavern'}">Compare all designs</a><br>` : ''}<a href="measured-oak-garland-proof.svg" download>Measured proof SVG</a><br><a href="${pathFilename}" download>Engraving paths SVG</a><br><a href="${guideFilename}" download>Origin SVG with blue board guides</a><br>${isMaster ? '<a href="../SHAPER-ORIGIN.md">Import, batch files and scrap-test guide</a><br>' : ''}<a href="https://support.shapertools.com/hc/en-us/articles/115002721473-Cut-Type-Encoding">Shaper cut-color reference</a></nav></footer>
</main></body></html>`;
fs.writeFileSync(path.join(output, 'garland-preview.html'), html);

assert.equal(right, 64.125);
assert.equal(boards[0].width, 49.25);
assert.equal(boards[1].height, 20);
assert.equal(boards[2].width, 23.375);
assert.equal(boards[2].height, 8.5);
assert(engraving.every(item => /^M/.test(item.d)));
assert.equal(new Set(engraving.map(item => item.id)).size, engraving.length);
for (const motif of isTavern ? ['grape-', 'hops-', 'barley-', 'juniper-', 'rye-', 'corn-', 'oak-'] : ['white-pine-', 'pine-cone-', 'holly-', 'mistletoe-', 'poinsettia-']) {
  assert(engraving.some(item => item.id.startsWith(motif)), `Missing motif: ${motif}`);
}
if (isTavern) {
  assert(!engraving.some(item => /^(?:agave|apple|cider)-/.test(item.id)));
  assert.equal(tavern.sections.filter(section => Number.isFinite(section.start)).length, 5);
  fs.writeFileSync(path.join(output, 'design.json'), JSON.stringify({ title: designTitle, seed: tavern.seed, sections: tavern.sections, stats: tavern.stats }, null, 2));
} else {
  assert(engraving.some(item => item.id.includes('-holly-berry-')));
  assert(new Set(engraving.filter(item => item.id.includes('-outer-bract-')).map(item => item.id.replace(/-visible-\d+$/, ''))).size >= flowers.length * 7);
  assert(new Set(engraving.filter(item => item.id.includes('-inner-bract-')).map(item => item.id.replace(/-visible-\d+$/, ''))).size >= flowers.length * 5);
}
const coordinatePairs = engraving.flatMap(item => {
  const numbers = item.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  assert.equal(numbers.length % 2, 0);
  return Array.from({ length: numbers.length / 2 }, (_, i) => [numbers[i * 2], numbers[i * 2 + 1]]);
});
for (const [x, y] of coordinatePairs) {
  assert(Number.isFinite(x) && Number.isFinite(y));
  assert(x >= 0.5 && x <= right - 0.5 && y >= 0.5 && y <= B - 0.5, 'An engraving control point approaches an end edge');
  assert((y <= W && x >= left) || (x >= left && x <= S) || (y >= B - W && x <= S), 'An engraving control point leaves the board');
}
console.log(JSON.stringify({
  output, dimensions, assembledExtent: [right, B], pathCount: engraving.length,
  stationLength: Number(totalLength.toFixed(3)), testedControlPoints: coordinatePairs.length,
  motifs: { flowers: flowers.length, accents: accents.length, whitePineBranches: new Set(engraving.filter(item => /^white-pine-/.test(item.id)).map(item => item.id.match(/^white-pine-\d+/)[0])).size },
  hiddenLineRemoval: { trimmedPaths, hiddenPaths, discardedFragments, samplingStepInches: flattenStep },
  layeredDesign: isMaster ? tavern.stats : undefined,
  occlusionVerification,
  files: fs.readdirSync(output),
}, null, 2));
