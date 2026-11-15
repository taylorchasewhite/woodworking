const assert = require('node:assert/strict');

module.exports = function drawMaster(api) {
  const { motifPath, transform, totalLength, mapPoint } = api;
  const seed = 200731;
  const motifScale = 1.4;
  let state = seed;
  const foregroundIds = new Set();
  const metadata = new Map();
  const shapes = [];
  const structuralSupports = [];
  const grainHeadCounts = new Map();
  let serial = 0;
  function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  const range = (a, b) => a + random() * (b - a);
  const sections = [
    { key: 'whiskey', title: 'Whiskey / bourbon - rye stalks and husked corn', start: 0, end: 19, sourceStart: 43.5, stationScale: 1, description: 'Fewer, larger rye heads and leaves accompany two enlarged corn ears on the short arm. The ears lean at different angles to fit the existing band; raised kernels and peeled husks retain their form.' },
    { key: 'gin', title: 'Gin - juniper berries on leafy branches', start: 19, end: 29.5, sourceStart: 34.5, stationScale: 1, description: 'Whorled juniper sprays and berries follow the bend on simple single-line stems. Bark marks, parallel twig outlines and interior stem grooves are omitted; the connections remain largely concealed by foliage.' },
    { key: 'beer', title: 'Beer - hops on bines and barley stalks', start: 29.5, end: 43.2, sourceStart: 19.3, stationScale: 13.7 / 15.2, description: 'Fewer enlarged hop leaves, cones and barley heads bridge juniper and wine on their connected bine and culms. The section retains its established route span and overlaps at both ends.' },
    { key: 'wine', title: 'Wine - grapes and leaves on a flowing vine', start: 43.2, end: 62.5, sourceStart: 0, stationScale: 1, description: 'Larger palmate leaves and larger individual grapes form fewer hanging bunches along the woody vine. The vine still fills the long-arm section and interleaves with the oak.' },
    { key: 'oak', title: 'White oak - layered leaves and angled acorns', start: 62.5, end: totalLength, sourceStart: 62.5, stationScale: 1, description: 'Fewer enlarged Quercus alba leaves and four enlarged acorns occupy the same ending. Forward and backward leaves join woody twigs; selected foreground leaves partly hide angled fruit.' },
  ];
  const botanicalSections = Object.fromEntries([
    ['rye', 'whiskey'], ['corn', 'whiskey'], ['juniper', 'gin'],
    ['hops', 'beer'], ['barley', 'beer'], ['grape', 'wine'], ['oak', 'oak'],
  ].map(([plant, key]) => [plant, sections.find(section => section.key === key)]));
  function placedStation(kind, s) {
    const section = botanicalSections[kind.split('-')[0]];
    assert(section, `Unknown botanical family: ${kind}`);
    return section.start + (s - section.sourceStart) * section.stationScale;
  }

  function spline(points, closed = false) {
    const commands = [['M', ...points[0]]];
    for (let i = 0; i < (closed ? points.length : points.length - 1); i++) {
      const p0 = points[closed ? (i - 1 + points.length) % points.length : Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[closed ? (i + 2) % points.length : Math.min(points.length - 1, i + 2)];
      commands.push(['C',
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        ...p2,
      ]);
    }
    if (closed) commands.push(['Z']);
    return commands;
  }

  function object(kind, s, y, angle, scale, contour, layer = shapes.length) {
    const id = `${kind}-${++serial}`;
    const section = botanicalSections[kind.split('-')[0]];
    const station = placedStation(kind, s);
    const controlNumbers = contour.flatMap(([, ...values]) => values);
    const rotated = transform(contour, 0, 0, angle, scale);
    const ys = rotated.flatMap(([, ...values]) => values.filter((_, i) => i % 2 === 1));
    const xs = rotated.flatMap(([, ...values]) => values.filter((_, i) => i % 2 === 0));
    const extentY = Math.max(...ys.map(Math.abs));
    const usableY = 1.48 - Math.abs(y);
    assert(usableY > 0 && scale > 0, `Invalid object scale or offset: ${id}`);
    const fit = extentY > usableY ? usableY / extentY : 1;
    scale *= fit;
    assert(controlNumbers.every(Number.isFinite));
    assert(placedStation(kind, s + Math.min(...xs) * fit) >= 0.02 &&
      placedStation(kind, s + Math.max(...xs) * fit) <= totalLength - 0.02, `Object outside station range: ${id}`);
    const shape = { id, z: layer, s, y, angle, scale, contourId: `${id}-silhouette`, contour };
    shapes.push(shape);
    function emit(suffix, commands, detail = false, weight = 'outline') {
      const pathId = `${id}-${suffix}`;
      // Move connected motifs in route space before projection and hidden-line removal.
      const positioned = transform(commands, 0, y, angle, scale).map(([command, ...values]) =>
        [command, ...values.map((value, i) => i % 2 ? value : value * section.stationScale)]);
      motifPath(pathId, station, positioned, true);
      metadata.set(pathId, { owner: shape.id, z: shape.z, station, section: section.key, keepInside: detail, weight });
      return pathId;
    }
    emit('silhouette', contour);
    foregroundIds.add(shape.contourId);
    shape.emit = emit;
    return shape;
  }

  function leaf(kind, s, y, angle, scale, oak = false, small = false) {
    const phase = range(-0.18, 0.18);
    const outlinePoints = [
      [0, 0], [0.25, -0.15], [0.16, -0.34], [0.42, -0.28],
      [0.39, -0.57], [0.61, -0.49], [0.72, -0.81], [0.87, -0.69],
      [1.03, -0.86], [1.05, -0.63], [1.23, -0.52], [1.44, -0.62],
      [1.42, -0.36], [1.66, -0.28], [1.87, 0], [1.67, 0.23],
      [1.58, 0.43], [1.33, 0.38], [1.27, 0.62], [1.08, 0.54],
      [0.98, 0.82], [0.80, 0.66], [0.60, 0.69], [0.55, 0.40],
      [0.28, 0.38], [0.34, 0.20],
    ];
    const points = outlinePoints.map(([x, y], i) => [
      x * (1 + 0.026 * Math.sin(i * 0.92 + phase)),
      y * (1 + 0.075 * Math.cos(i * 0.7 + phase)),
    ]);
    const oakContour = [
      ['M', 0, 0],
      ['C', 0.12, -0.035, 0.20, -0.08, 0.24, -0.18],
      ['C', 0.13, -0.29, 0.11, -0.43, 0.26, -0.47],
      ['C', 0.43, -0.52, 0.47, -0.39, 0.50, -0.20],
      ['C', 0.53, -0.15, 0.59, -0.16, 0.61, -0.23],
      ['C', 0.50, -0.37, 0.49, -0.59, 0.68, -0.64],
      ['C', 0.86, -0.69, 0.94, -0.58, 0.90, -0.38],
      ['C', 0.89, -0.28, 0.95, -0.24, 1.00, -0.25],
      ['C', 1.07, -0.27, 1.05, -0.48, 1.19, -0.57],
      ['C', 1.40, -0.69, 1.54, -0.55, 1.49, -0.40],
      ['C', 1.47, -0.32, 1.46, -0.22, 1.53, -0.18],
      ['C', 1.59, -0.12, 1.71, -0.34, 1.87, -0.26],
      ['C', 2.07, -0.20, 2.08, 0.16, 1.92, 0.24],
      ['C', 1.77, 0.33, 1.63, 0.15, 1.56, 0.17],
      ['C', 1.47, 0.18, 1.53, 0.46, 1.35, 0.56],
      ['C', 1.11, 0.68, 1.00, 0.53, 1.08, 0.34],
      ['C', 1.14, 0.20, 0.99, 0.21, 0.95, 0.22],
      ['C', 0.92, 0.24, 0.94, 0.47, 0.81, 0.57],
      ['C', 0.58, 0.72, 0.47, 0.53, 0.55, 0.37],
      ['C', 0.60, 0.22, 0.52, 0.16, 0.47, 0.17],
      ['C', 0.42, 0.20, 0.42, 0.36, 0.31, 0.42],
      ['C', 0.13, 0.52, 0.09, 0.31, 0.20, 0.19],
      ['C', 0.15, 0.08, 0.06, 0.04, 0, 0], ['Z'],
    ].map(([command, ...values]) => [command, ...values.map((v, i) =>
      v * (1 + (i % 2 ? 0.035 : 0.018) * Math.sin(phase * 7 + v * 2)))]);
    const shape = object(kind, s, y, angle, scale, oak ? oakContour : spline(points, true));
    const bend = range(-0.06, 0.07);
    shape.emit('midrib', [['M', -0.04, 0], ['C', 0.48, bend, 1.12, bend * 2, 1.87, 0]], true, 'vein');
    shape.emit('midrib-shadow', [['M', 0.02, 0.036], ['C', 0.50, bend + 0.036, 1.12, bend * 2 + 0.025, 1.74, 0.014]], true, 'hatch');
    const rays = oak
      ? [[0.28, -0.43], [0.70, -0.59], [1.29, -0.53], [1.84, -0.13], [0.27, 0.38], [0.70, 0.54], [1.29, 0.50], [1.83, 0.15]]
      : [[0.43, -0.48], [0.96, -0.77], [1.70, -0.18], [0.54, 0.52], [1.02, 0.73], [1.65, 0.22]];
    rays.forEach(([tx, ty], i) => {
      const root = oak ? tx * 0.56 : 0.25;
      shape.emit(`primary-vein-${i}`, [['M', root, bend], ['Q', tx * 0.65, ty * 0.33 + bend, tx, ty]], true, 'vein');
      for (let j = 0; j < (small ? 2 : 4); j++) {
        const t = 0.30 + j * 0.15;
        const x = root + (tx - root) * t;
        const vy = ty * t * t + bend;
        shape.emit(`secondary-${i}-${j}`, [
          ['M', x, vy],
          ['Q', x + 0.08, vy + ty * 0.16, x + (i % 2 ? 0.16 : -0.13), vy + ty * 0.30],
        ], true, 'hatch');
      }
    });
    const shadeCount = small ? 26 : 46;
    for (let i = 0; i < shadeCount; i++) {
      const x = -0.06 + i * (2.02 / shadeCount);
      const jitter = range(-0.010, 0.010);
      const startY = 0.025 + 0.055 * Math.sin(i * 0.53 + phase) ** 2;
      const height = (oak ? 0.24 : 0.30) + 0.24 * Math.sin(i * 0.27 + phase) ** 2;
      shape.emit(`underside-hatch-${i}`, [
        ['M', x, startY], ['C', x - 0.12, 0.18, x + jitter - 0.12, height * 0.85, x + jitter + 0.055, height],
      ], true, 'hatch');
    }
    for (let i = 0; i < 19; i++) {
      const x = 0.12 + i * 0.085;
      shape.emit(`edge-shadow-${i}`, [
        ['M', x, -0.88], ['Q', x - 0.075, -0.64, x - 0.11, -0.43 - 0.10 * Math.sin(i * 0.5)],
      ], true, 'hatch');
    }
    if (!small && !oak) {
      shape.emit('turned-edge', [['M', 1.08, -0.48], ['C', 1.20, -0.34, 1.41, -0.17, 1.69, -0.075]], true, 'vein');
      for (let i = 0; i < 10; i++) {
        const x = 1.07 + i * 0.06;
        shape.emit(`fold-shadow-${i}`, [['M', x, -0.65], ['Q', x + 0.03, -0.40, x + 0.10, -0.22 + i * 0.012]], true, 'hatch');
      }
    }
    if (!small && !oak && serial % 3 !== 1) {
      const curl = object(`${kind}-turned-lobe`, s, y, angle, shape.scale, [
        ['M', 1.05, -0.58], ['C', 1.15, -0.40, 1.29, -0.25, 1.61, -0.11],
        ['C', 1.46, -0.14, 1.39, -0.15, 1.28, -0.20],
        ['C', 1.10, -0.26, 1.03, -0.37, 1.05, -0.58], ['Z'],
      ]);
      for (let i = 0; i < 11; i++) {
        const x = 1.055 + i * 0.036;
        curl.emit(`curl-hatch-${i}`, [['M', x, -0.54], ['Q', x + 0.01, -0.30, x + 0.09, -0.17]], true, 'hatch');
      }
    }
    return shape;
  }

  function grapeLeaf(kind, s, y, angle, scale, folded) {
    const points = [
      [0, 0], [-0.18, -0.12], [-0.32, -0.32], [-0.23, -0.36],
      [-0.30, -0.51], [-0.12, -0.48], [-0.05, -0.63], [0.08, -0.59],
      [0.15, -0.79], [0.27, -0.64], [0.35, -0.56], [0.59, -0.92],
      [0.67, -0.78], [0.87, -0.82], [0.87, -0.62], [0.78, -0.43],
      [1.03, -0.48], [1.24, -0.70], [1.26, -0.52], [1.44, -0.51],
      [1.43, -0.29], [1.65, -0.22], [1.76, 0], [1.61, 0.14],
      [1.58, 0.30], [1.42, 0.28], [1.34, 0.47], [1.18, 0.43],
      [1.14, 0.63], [0.97, 0.49], [0.77, 0.36], [0.87, 0.62],
      [0.70, 0.73], [0.62, 0.94], [0.48, 0.77], [0.30, 0.78],
      [0.29, 0.61], [0.08, 0.62], [-0.10, 0.74], [-0.09, 0.53],
      [-0.29, 0.50], [-0.22, 0.31], [-0.38, 0.23], [-0.18, 0.11],
    ];
    const phase = range(-0.4, 0.4);
    const shape = object(kind, s, y, angle, scale, spline(points.map(([x, y], i) =>
      [x * (1 + 0.022 * Math.sin(i + phase)), y * (1 + 0.04 * Math.cos(i * 0.6 + phase))]), true));
    for (const [i, [tx, ty]] of [[0.54, -0.83], [1.20, -0.60], [1.65, 0], [1.10, 0.52], [0.53, 0.81]].entries()) {
      shape.emit(`palmate-vein-${i}`, [['M', 0, 0], ['Q', tx * 0.45, ty * 0.32, tx, ty]], true, 'vein');
      for (let j = 0; j < 3; j++) {
        const t = 0.36 + j * 0.19;
        const x = tx * t, vy = ty * t * t;
        shape.emit(`vein-branch-${i}-${j}`, [['M', x, vy], ['Q', x + 0.05, vy + ty * 0.15, x + 0.16, vy + ty * 0.25 + (i === 2 ? 0.11 : 0)]], true, 'hatch');
      }
    }
    for (let i = 0; i < 24; i++) {
      const x = 0.06 + i * 0.064, depth = 0.22 + 0.17 * Math.sin(i * 0.3 + phase) ** 2;
      shape.emit(`lower-surface-hatch-${i}`, [['M', x, 0.10], ['C', x - 0.06, 0.19, x - 0.09, depth * 0.9, x + 0.035, depth]], true, 'hatch');
    }
    if (folded) {
      shape.emit('small-leaf-fold', [['M', 1.04, 0.34], ['Q', 1.28, 0.21, 1.60, 0.12]], true, 'vein');
      for (let i = 0; i < 7; i++) {
        const x = 1.04 + i * 0.064;
        shape.emit(`fold-shade-${i}`, [['M', x, 0.44], ['Q', x - 0.025, 0.29, x + 0.02, 0.19]], true, 'hatch');
      }
    }
    return shape;
  }

  function shoot(kind, from, to, width = 0.026, layer) {
    width *= motifScale;
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const bend = dy * 0.28;
    const shape = object(kind, from[0], 0, 0, 1, transform([
      ['M', 0, -width],
      ['C', dx * 0.30, bend - width, dx * 0.72, dy * 0.82 - width, dx, dy - width * 0.60],
      ['L', dx, dy + width * 0.60],
      ['C', dx * 0.72, dy * 0.82 + width, dx * 0.30, bend + width, 0, width], ['Z'],
    ], 0, from[1]), layer);
    assert.equal(shape.scale, 1, `Attachment rescaled away from its node: ${shape.id}`);
    const centerline = transform([['M', 0, 0], ['C', dx * 0.30, bend, dx * 0.72, dy * 0.82, dx, dy]], 0, from[1]);
    if (kind.startsWith('juniper-')) {
      metadata.get(shape.contourId).maskOnly = true;
      shape.emit('stem-centerline', centerline, true, 'vein');
    } else {
      shape.emit('shoot-groove', centerline, true, 'hatch');
    }
    shape.pointAt = t => {
      const u = 1 - t;
      return [from[0] + dx * (3 * u * u * t * 0.30 + 3 * u * t * t * 0.72 + t ** 3),
        from[1] + 3 * u * u * t * bend + 3 * u * t * t * dy * 0.82 + t ** 3 * dy];
    };
    return shape;
  }

  function posePoint(s, y, angle, scale, x, offset) {
    const p = transform([['M', x, offset]], 0, y, angle, scale)[0];
    return [s + p[1], p[2]];
  }

  function vineY(s) {
    return -0.16 + 0.20 * Math.sin(s * 0.47 - 0.65) + 0.05 * Math.sin(s * 1.02 + 0.3);
  }

  function grapeVine() {
    return support('grape-woody-vine', 0.45, 20.8, vineY, 0.041);
  }

  function support(kind, start, end, yAt, halfWidth) {
    halfWidth *= motifScale;
    const top = [], bottom = [];
    const steps = Math.ceil((end - start) / 0.28);
    for (let i = 0; i <= steps; i++) {
      const s = start + i * (end - start) / steps;
      const width = 0.009 + (halfWidth - 0.009) * Math.sin(Math.PI * i / steps);
      top.push([s - start, yAt(s) - width]);
      bottom.unshift([s - start, yAt(s) + width]);
    }
    const branch = object(kind, start, 0, 0, 1, spline([...top, ...bottom], true));
    if (kind.startsWith('juniper-')) {
      // Keep the closed envelope for layering, but engrave only the stem's centerline.
      metadata.get(branch.contourId).maskOnly = true;
      branch.emit('branch-centerline', spline(top.map(([x]) => [x, yAt(start + x)])), true, 'vein');
    } else {
      for (let s = start + 0.25, i = 0; s < end - 0.65; s += 0.96, i++) {
        branch.emit(`bark-${i}`, spline([[s - start, yAt(s) + 0.009],
          [s + 0.26 - start, yAt(s + 0.26) + 0.012],
          [s + 0.51 - start, yAt(s + 0.51) + 0.006]]), true, 'hatch');
      }
    }
    const samples = Math.ceil((end - start) / 0.035);
    structuralSupports.push({ kind, contourId: branch.contourId, sourceStart: start, sourceEnd: end,
      points: Array.from({ length: samples + 1 }, (_, i) => {
        const s = start + (end - start) * i / samples;
        return mapPoint(placedStation(kind, s), yAt(s));
      }) });
    return branch;
  }

  const hopsY = s => -0.39 + 0.18 * Math.sin((s - 18.2) * 0.66);
  const juniperY = s => -0.18 + 0.10 * Math.sin((s - 33.4) * 0.75);
  const oakY = s => -0.10 + 0.12 * Math.sin((s - 60.4) * 0.9);

  function round(kind, s, x, y, r, zVariation = 0) {
    const k = r * 0.5522847498;
    const shape = object(kind, s + x, y, zVariation, 1, [
      ['M', r, 0], ['C', r, k, k, r, 0, r], ['C', -k, r, -r, k, -r, 0],
      ['C', -r, -k, -k, -r, 0, -r], ['C', k, -r, r, -k, r, 0], ['Z'],
    ]);
    for (let i = 0; i < 9; i++) {
      const x = -r * 0.8 + i * r * 0.16;
      const yMax = Math.sqrt(Math.max(0, r * r - x * x)) * 0.90;
      const bottom = Math.max(0, 0.10 * r + (i - 3) * 0.026);
      shape.emit(`round-shade-${i}`, [
        ['M', x, bottom], ['C', x - r * 0.16, yMax * 0.42, x - r * 0.08, yMax * 0.73, x + r * 0.12, yMax],
      ], true, 'hatch');
    }
    shape.emit('rim-shadow', [['M', -r * 0.81, 0], ['Q', -r * 0.73, r * 0.73, r * 0.25, r * 0.81]], true, 'hatch');
    return shape;
  }

  function grapeBunch(node, size = motifScale) {
    const s = node - 0.42 * size, y = vineY(node) + 0.40 * size;
    shoot('grape-bunch-stalk', [node, vineY(node)], [s, y - 0.35 * size], 0.028 * size);
    const berries = [];
    for (let row = 0; row < 4; row++) {
      const count = [3, 3, 2, 1][row];
      for (let j = 0; j < count; j++) {
        berries.push({
          x: ((j - (count - 1) / 2) * 0.24 + range(-0.045, 0.045)) * size,
          y: y + (-0.40 + row * 0.205 + range(-0.035, 0.035)) * size,
          r: range(0.140, 0.175) * size,
        });
      }
    }
    berries.forEach(b => round('grape-fruit', s, b.x, b.y, b.r));
  }
  function tendril(s, y, scale) {
    const shape = object('grape-curled-tendril', s, y, range(-0.25, 0.25), scale, [
      ['M', -0.15, 0.04], ['C', 0.25, -0.13, 0.51, -0.42, 0.84, -0.37],
      ['C', 1.24, -0.33, 1.13, 0.19, 0.88, 0.12],
      ['C', 0.61, 0.08, 0.73, -0.17, 0.91, -0.14],
      ['C', 0.99, -0.12, 1.00, -0.02, 0.90, 0.01],
      ['C', 1.01, 0.03, 1.05, -0.22, 0.87, -0.24],
      ['C', 0.43, -0.21, 0.35, 0.01, -0.15, 0.04], ['Z'],
    ]);
    return shape;
  }

  function blade(kind, s, y, angle, scale, width = 0.18) {
    const shape = object(kind, s, y, angle, scale, [
      ['M', -0.16, 0], ['C', 0.20, -width, 0.78, -width * 1.9, 1.57, -0.03],
      ['C', 1.04, -0.04, 0.49, width * 0.6, -0.16, 0], ['Z'],
    ]);
    shape.emit('blade-rib', [['M', -0.12, -0.012], ['Q', 0.72, -width * 0.93, 1.41, -0.04]], true, 'vein');
    for (let i = 0; i < 16; i++) {
      const x = 0.02 + i * 0.082;
      shape.emit(`blade-shade-${i}`, [['M', x, width * 0.2], ['Q', x - 0.055, -width * 0.35, x + 0.018, -width * 0.82]], true, 'hatch');
    }
  }

  function grainHead(kind, s, y, angle, size, barley = false) {
    const root = posePoint(s, y, angle, size, -0.10, 0);
    const base = posePoint(s, y, angle, size, -1.15, 0.06);
    const culm = shoot(`${kind}-culm`, base, root, 0.012, 0);
    const index = grainHeadCounts.get(kind) || 0;
    grainHeadCounts.set(kind, index + 1);
    if (index % 2 === 0) {
      const p = culm.pointAt(0.45);
      blade(`${kind}-attached-alternate-leaf`, p[0], p[1], angle + (index % 4 ? -0.17 : 0.22), size * 0.82, 0.18);
    }
    const shape = object(`${kind}-rachis`, s, y, angle, size, [
      ['M', -0.12, -0.012], ['Q', 0.7, -0.034, 1.56, -0.01],
      ['L', 1.56, 0.018], ['Q', 0.7, 0.004, -0.12, 0.012], ['Z'],
    ]);
    const count = barley ? 6 : 8;
    const spacing = (barley ? 6 * 0.18 : 9 * 0.125) / (count - 1);
    for (let i = 0; i < count; i++) {
      for (const side of [-1, 1]) {
        const x = 0.21 + i * spacing;
        const y = side * (barley ? 0.125 : 0.085);
        const offset = transform([['M', x, y]], 0, shape.y, angle, size)[0];
        const grain = object(`${kind}-grain`, s + offset[1], offset[2], angle + side * 0.31, size, [
          ['M', -0.09, 0], ['C', -0.07, -0.065, 0.08, -0.095, 0.16, -0.008],
          ['C', 0.09, 0.066, -0.04, 0.059, -0.09, 0], ['Z'],
        ]);
        grain.emit('grain-groove', [['M', -0.055, 0], ['Q', 0.035, -0.024, 0.126, -0.007]], true, 'hatch');
        grain.emit('grain-shadow', [['M', -0.05, 0.028], ['Q', 0.02, 0.036, 0.10, 0.015]], true, 'hatch');
        const awnLength = barley ? range(0.34, 0.51) : range(0.16, 0.27);
        blade(`${kind}-awn`, s + offset[1] + 0.11 * size, offset[2], angle + side * 0.24, awnLength * size / 1.57, 0.015);
      }
    }
  }

  function hopCone(s, y, angle, size = 1) {
    const rows = [[-0.53, [0]], [-0.31, [-0.17, 0.17]], [-0.10, [-0.26, 0, 0.26]], [0.14, [-0.22, 0.22]], [0.37, [-0.12, 0.12]], [0.55, [0]]];
    for (const [rowY, centers] of rows) {
      for (const x of centers) {
        const pos = transform([['M', x, rowY]], 0, y, angle, size)[0];
        const scale = size * (rowY > 0.3 ? 0.77 : 1);
        const bract = object('hops-overlapping-bract', s + pos[1], pos[2], angle + range(-0.17, 0.17), scale, [
          ['M', -0.19, -0.13], ['C', -0.26, -0.24, 0.13, -0.25, 0.20, -0.11],
          ['C', 0.26, 0.08, 0.10, 0.26, 0, 0.38],
          ['C', -0.15, 0.19, -0.28, 0.02, -0.19, -0.13], ['Z'],
        ]);
        bract.emit('bract-crease', [['M', -0.015, -0.11], ['Q', 0.04, 0.13, 0, 0.32]], true, 'vein');
        for (let j = 0; j < 7; j++) {
          const x = -0.17 + j * 0.045;
          bract.emit(`bract-shadow-${j}`, [['M', x, -0.14], ['Q', x + 0.09, 0.05, x * 0.20, 0.19 + Math.abs(x) * 0.30]], true, 'hatch');
        }
      }
    }
  }

  function juniperSpray(s, y, side, length) {
    const twig = shoot('juniper-side-twig', [s, juniperY(s)], [s + length, y], 0.020, juniperSupport.z + 0.25);
    for (let i = 0; i < 7; i++) {
      const t = 0.10 + i * 0.133, p = twig.pointAt(t);
      const before = twig.pointAt(t - 0.01), after = twig.pointAt(t + 0.01);
      const tangent = Math.atan2(after[1] - before[1], after[0] - before[0]);
      for (const [j, angle] of [-0.78, 0, 0.70].entries()) {
        const taper = Math.max(0.60, Math.min(1, (p[0] - 33.3) / 1.8, (47.5 - p[0]) / 2.0));
        const length = range(0.32, 0.46) * taper * motifScale, lean = tangent + side * angle + range(-0.085, 0.085);
        const needle = object(`juniper-whorled-needle-${j}`, p[0], p[1], lean, length / 0.43, [
          ['M', 0, 0], ['C', 0.10, -0.018, 0.29, -0.023, 0.43, -0.003],
          ['C', 0.27, 0.009, 0.08, 0.013, 0, 0], ['Z'],
        ]);
        metadata.get(needle.contourId).weight = 'hatch';
      }
    }
  }
  function juniperCluster(s, y) {
    for (const [localX, localY] of [[-0.15, -0.05], [0.11, -0.14], [0.27, 0.11], [-0.035, 0.18]]) {
      const x = localX * motifScale, by = localY * motifScale;
      shoot('juniper-berry-pedicel', [s - 0.13, juniperY(s - 0.13)], [s + x, y + by], 0.012, juniperSupport.z + 0.25);
      const b = round('juniper-seed-cone', s, x, y + by, range(0.123, 0.145) * motifScale);
      b.emit('three-part-scar', transform([['M', -0.045, 0.010], ['L', 0, -0.042], ['L', 0.047, 0.016]], 0, 0, 0, motifScale), true, 'hatch');
    }
  }

  function cornEar(s, y, angle, size = motifScale) {
    object('corn-ear-shank', s, y, angle, size, [
      ['M', -0.02, 0.62], ['C', 0.02, 0.89, 0.01, 1.06, 0.08, 1.20],
      ['L', 0.12, 1.18], ['C', 0.055, 1.00, 0.07, 0.87, 0.025, 0.62], ['Z'],
    ]);
    const stemLeaf = posePoint(s, y, angle, size, 0.055, 1.02);
    blade('corn-attached-stalk-leaf', stemLeaf[0], stemLeaf[1], angle - 1.17, 0.92 * size, 0.22);
    const back = object('corn-enclosing-back-husk', s, y, angle, size, [
      ['M', -0.06, 0.72], ['C', -0.22, 0.40, -0.36, 0.12, -0.55, -0.12],
      ['C', -0.69, 0.30, -0.50, 0.62, -0.06, 0.72], ['Z'],
    ]);
    for (let i = 0; i < 9; i++) {
      back.emit(`back-husk-fibre-${i}`, [['M', -0.07 - i * 0.024, 0.70],
        ['C', -0.39 - i * 0.007, 0.47, -0.51 - i * 0.006, 0.25, -0.53 - i * 0.005, 0.01]], true, 'hatch');
    }
    object('corn-inner-cob', s, y, angle, size, [
      ['M', 0, -0.70], ['C', -0.10, -0.68, -0.18, -0.36, -0.17, 0.28],
      ['Q', -0.15, 0.61, 0, 0.69], ['Q', 0.17, 0.55, 0.17, 0.21],
      ['C', 0.18, -0.37, 0.10, -0.68, 0, -0.70], ['Z'],
    ]);
    // Project crowns outside a narrower cylindrical cob; side walls give each kernel relief.
    for (let row = 0; row < 10; row++) {
      const t = row / 9, cy = -0.67 + row * 0.14;
      const radius = row === 0 ? 0.085 : 0.14 + 0.052 * Math.sin(Math.PI * Math.min(0.94, t + 0.08));
      const outer = radius + (row === 0 ? 0.045 : 0.070);
      const bend = 0.015 * Math.sin(t * Math.PI);
      const columns = row === 0 ? [-0.88, 0.88, 0] : [-1.15, 1.15, -0.575, 0.575, 0];
      for (const theta of columns) {
        const phi = theta + 0.035 * Math.sin(row * 1.65);
        const spread = row === 0 ? 0.38 : 0.265;
        const xl = bend + outer * Math.sin(phi - spread), xr = bend + outer * Math.sin(phi + spread);
        const rl = bend + radius * Math.sin(phi - spread), rr = bend + radius * Math.sin(phi + spread);
        const w = xr - xl, h = row === 0 ? 0.095 : 0.115;
        const top = cy - h * 0.52, bottom = cy + h * 0.43;
        const root = bottom + 0.036 * (0.6 + 0.4 * Math.cos(phi));
        const kernel = object('corn-raised-kernel', s, y, angle, size, [
          ['M', xl + w * 0.12, top],
          ['C', xl - w * 0.035, top + h * 0.10, xl - w * 0.10, bottom - h * 0.08, xl + w * 0.10, bottom],
          ['L', rl, root], ['Q', (rl + rr) / 2, root + 0.009, rr, root],
          ['L', xr - w * 0.08, bottom],
          ['C', xr + w * 0.09, bottom - h * 0.15, xr + w * 0.05, top + h * 0.12, xr - w * 0.12, top],
          ['Q', (xl + xr) / 2, top - h * 0.14, xl + w * 0.12, top], ['Z'],
        ]);
        kernel.emit('kernel-side-face', [['M', xl + w * 0.10, bottom],
          ['Q', (xl + xr) / 2, bottom + 0.008, xr - w * 0.08, bottom]], true, 'vein');
        kernel.emit('crown-turn', [['M', xl + w * 0.18, bottom - 0.032],
          ['C', xl + w * 0.12, bottom - 0.003, xl + w * 0.53, bottom - 0.002, xl + w * 0.70, bottom - 0.013]], true, 'hatch');
        for (let j = 1; j <= 3; j++) {
          const f = j / 4, frontX = xl + w * f, rootX = rl + (rr - rl) * f;
          kernel.emit(`kernel-side-shade-${j}`, [['M', frontX, bottom + 0.006],
            ['Q', (frontX + rootX) / 2 + 0.004, (bottom + root) / 2, rootX, root - 0.004]], true, 'hatch');
        }
      }
    }
    const front = object('corn-wrapped-front-husk', s, y, angle, size, [
      ['M', -0.12, 0.72], ['C', -0.29, 0.56, -0.19, 0.30, -0.03, 0.20],
      ['C', -0.055, 0.38, 0.05, 0.54, 0.30, 0.54],
      ['Q', 0.08, 0.85, -0.12, 0.72], ['Z'],
    ]);
    for (let i = 0; i < 10; i++) {
      const x = -0.14 + i * 0.019;
      front.emit(`wrapped-husk-fibre-${i}`, [['M', x, 0.71],
        ['C', -0.23 + i * 0.010, 0.52, -0.13 + i * 0.007, 0.38, -0.03, 0.24 + i * 0.009]], true, 'hatch');
    }
    front.emit('rolled-margin', [['M', -0.11, 0.66], ['C', -0.22, 0.49, -0.13, 0.33, -0.035, 0.25]], true, 'vein');
  }

  function acorn(s, y, angle, size = motifScale) {
    const stalk = object('oak-acorn-peduncle', s, y, angle, size, [
      ['M', -0.025, -0.245], ['C', -0.026, -0.32, -0.075, -0.37, -0.035, -0.45],
      ['Q', 0.007, -0.478, 0.042, -0.455], ['C', 0.003, -0.393, 0.047, -0.33, 0.033, -0.24], ['Z'],
    ]);
    stalk.emit('stalk-groove', [['M', 0.004, -0.25], ['Q', -0.037, -0.36, 0.010, -0.44]], true, 'hatch');
    const nut = object('oak-acorn-nut', s, y, angle, size, [
      ['M', -0.28, 0], ['C', -0.35, 0.33, -0.22, 0.61, 0.02, 0.75],
      ['C', 0.24, 0.55, 0.33, 0.21, 0.27, -0.02], ['Q', 0, 0.08, -0.28, 0], ['Z'],
    ]);
    for (let i = 0; i < 13; i++) {
      const x = -0.25 + i * 0.027;
      nut.emit(`nut-shade-${i}`, [['M', x, -0.02], ['C', x - 0.045, 0.21, x - 0.01, 0.43, x * 0.22 + 0.02, 0.65]], true, 'hatch');
    }
    const cap = object('oak-acorn-cup', s, y, angle, size, [
      ['M', -0.30, 0.015], ['C', -0.35, -0.12, -0.23, -0.26, -0.005, -0.27],
      ['C', 0.23, -0.25, 0.36, -0.10, 0.30, 0.015], ['Q', 0, 0.08, -0.30, 0.015], ['Z'],
    ]);
    for (let row = 0; row < 4; row++) {
      for (let j = 0; j < 6; j++) {
        const x = -0.30 + j * 0.104 + (row % 2) * 0.052;
        const y = -0.23 + row * 0.066;
        cap.emit(`cup-scale-${row}-${j}`, [['M', x - 0.06, y], ['Q', x, y + 0.070, x + 0.06, y]], true, 'hatch');
      }
    }
    cap.emit('cap-lip', [['M', -0.28, -0.014], ['Q', 0, 0.072, 0.28, -0.014]], true, 'vein');
    return { nutContourId: nut.contourId, capContourId: cap.contourId };
  }

  // The back rank establishes foliage masses; the later ranks cut away hidden paths.
  const grapeSupport = grapeVine();
  const grapeNodes = [1.3, 4.25, 7.2, 10.25, 13.3, 16.35, 19.35];
  const grapeLeaves = [];
  for (const [i, s] of grapeNodes.entries()) {
    const side = i % 2 ? 1 : -1;
    const root = [s + 0.28, vineY(s) + side * 0.18];
    shoot('grape-leaf-petiole', [s, vineY(s)], root);
    grapeLeaves.push({ s: root[0], y: root[1], angle: side * range(0.27, 0.40), scale: range(0.63, 0.78) * motifScale, front: true, folded: i % 4 === 2 });
    if (i % 3 !== 2) {
      const back = [s + 0.12, vineY(s) - side * 0.17];
      shoot('grape-back-petiole', [s, vineY(s)], back, 0.022);
      grapeLeaves.push({ s: back[0], y: back[1], angle: -side * range(0.22, 0.34), scale: range(0.44, 0.57) * motifScale, front: false, folded: false });
    }
    if (i % 3 === 1) {
      const tip = [s + 1.10, vineY(s) - side * 0.32];
      shoot('grape-tendril-shoot', [s, vineY(s)], tip, 0.020);
      tendril(tip[0], tip[1], 0.51 * motifScale);
    }
  }
  for (const [i, s] of [3.0, 8.8, 12.0, 17.8].entries()) {
    const side = i % 2 ? -1 : 1;
    const root = [s + 0.16, vineY(s) + side * 0.13];
    shoot('grape-fill-petiole', [s, vineY(s)], root, 0.023);
    grapeLeaves.push({ s: root[0], y: root[1], angle: side * range(0.22, 0.34),
      scale: range(0.65, 0.79) * motifScale, front: false, folded: false });
  }
  for (const plan of grapeLeaves.filter(p => !p.front)) grapeLeaf('grape-back-leaf', plan.s, plan.y, plan.angle, plan.scale, false);
  const grapeBunchNodes = [2.0, 6.4, 10.8, 15.3];
  for (const s of grapeBunchNodes) grapeBunch(s);
  grapeBunchNodes.push(20.10);
  grapeBunch(20.10, 1.0);
  for (const plan of grapeLeaves.filter(p => p.front)) grapeLeaf('grape-front-leaf', plan.s, plan.y, plan.angle, plan.scale, plan.folded);
  for (const plan of [
    { s: 6.97, angle: -0.20, scale: 0.58 * motifScale },
    { s: 15.98, angle: 0.22, scale: 0.60 * motifScale },
  ]) {
    const y = vineY(plan.s) + 0.11;
    const node = plan.s - 0.28;
    shoot('grape-gap-petiole', [node, vineY(node)], [plan.s, y], 0.023, grapeSupport.z + 0.25);
    grapeLeaf('grape-front-leaf', plan.s, y, plan.angle, plan.scale, false);
    grapeLeaves.push({ ...plan, y, front: true, folded: false });
  }

  // Independent section seeds keep the composition reproducible.
  state = 507810563;
  const hopsSupport = support('hops-twining-bine', 18.2, 36.6, hopsY, 0.023);
  for (let i = 0, s = 18.7; s < 36; s += range(1.95, 2.65), i++) {
    const y = range(-0.17, 0.21), angle = range(-0.24, 0.25), scale = range(0.67, 0.82) * motifScale;
    shoot('hops-back-petiole', [s - 0.24, hopsY(s - 0.24)], [s, y], 0.018, hopsSupport.z + 0.25);
    leaf('hops-back-leaf', s, y, angle, scale, false, true);
  }
  for (let i = 0, s = 18.0; s < 35.5; s += range(2.20, 2.80), i++) {
    blade('barley-folded-leaf', s, range(-0.25, 0.25), (i % 2 ? -1 : 1) * range(0.10, 0.24), range(0.83, 1.16) * motifScale, 0.21);
    grainHead('barley', s + 0.18, range(-0.25, 0.25), range(-0.18, 0.18), 0.86 * motifScale, true);
  }
  for (const [i, s] of [21.0, 27.0, 32.8].entries()) {
    const at = s + range(-0.15, 0.15), y = i % 2 ? -0.15 : 0.12, angle = range(-0.20, 0.22);
    shoot('hops-cone-peduncle', [at - 0.3, hopsY(at - 0.3)], posePoint(at, y, angle, motifScale, 0, -0.58), 0.018, hopsSupport.z + 0.25);
    hopCone(at, y, angle, motifScale);
  }
  for (const s of [19.8, 25.0, 30.2, 34.7]) {
    const y = range(-0.15, 0.15), angle = range(-0.38, 0.37);
    shoot('hops-front-petiole', [s - 0.28, hopsY(s - 0.28)], [s, y], 0.018, hopsSupport.z + 0.25);
    leaf('hops-front-leaf', s, y, angle, 0.70 * motifScale, false, true);
  }
  shoot('hops-transition-petiole', [35.3, hopsY(35.3)], [35.55, -0.06], 0.016, hopsSupport.z + 0.25);
  leaf('hops-transition-leaf', 35.55, -0.06, 0.44, 0.48 * motifScale, false, true);
  shoot('hops-transition-cone-peduncle', [35.9, hopsY(35.9)], posePoint(36.2, 0.08, -0.26, 0.60 * motifScale, 0, -0.58), 0.016, hopsSupport.z + 0.25);
  hopCone(36.2, 0.08, -0.26, 0.60 * motifScale);

  const juniperSupport = support('juniper-primary-branch', 33.4, 46.6, juniperY, 0.030);
  for (let i = 0, s = 33.6; s < 46.3; s += range(0.80, 1.16), i++) {
    juniperSpray(s, (i % 2 ? -1 : 1) * range(0.39, 0.70), i % 2 ? -1 : 1, range(1.13, 1.48) * motifScale);
  }
  for (const s of [34.7, 36.8, 39.0, 41.2, 43.4, 45.5]) juniperCluster(s, range(-0.16, 0.20));
  for (let s = 34.1; s < 45.7; s += 1.43) juniperSpray(s, juniperY(s + 1.72), random() > 0.5 ? 1 : -1, 1.72);

  state = 1093289987;
  for (let i = 0, s = 43.9; s < 64; s += range(1.35, 2.15), i++) {
    blade('rye-ribbon-leaf', s, range(-0.25, 0.25), (i % 2 ? -1 : 1) * range(0.10, 0.20), range(0.92, 1.20) * motifScale, 0.24);
  }
  for (let s = 45.55; s < 62.8; s += range(1.75, 2.60)) grainHead('rye', s, range(-0.25, 0.25), range(-0.20, 0.18), 0.93 * motifScale);
  for (const p of [
    { s: 44.8, y: 0.10, angle: -0.22, size: 0.70 },
    { s: 53.2, y: 0.10, angle: -0.22, size: 0.90 },
    { s: 63.05, y: 0.13, angle: -0.17, size: 0.70 },
  ]) grainHead('rye', p.s, p.y, p.angle, p.size * motifScale);
  const cornEars = [{ s: 49.6, y: 0.02, angle: -1.25 }, { s: 57.6, y: -0.07, angle: 1.37 }];
  for (const p of cornEars) cornEar(p.s, p.y, p.angle);

  support('oak-primary-branch', 60.4, totalLength - 0.43, oakY, 0.035);
  const oakFruit = [
    { s: 63.35, y: 0.02, angle: -0.55 },
    { s: 65.95, y: -0.08, angle: 0.03 },
    { s: 67.00, y: 0.10, angle: 0.47 },
    { s: 69.65, y: 0.05, angle: -0.25 },
  ];
  const oakLeaves = [];
  const oakNodes = [60.95, 62.45, 64.0, 65.6, 67.2, 68.8, 70.1];
  const oakAngles = [-0.24, 0.31, -0.22, 0.37, -0.33, 0.27, Math.PI - 0.25];
  const oakScales = [0.52, 0.75, 0.87, 0.79, 0.71, 0.89, 0.76];
  for (const [i, node] of oakNodes.entries()) {
    oakLeaves.push({ node, s: node + 0.20, y: oakY(node) + (i % 2 ? 1 : -1) * 0.19,
      angle: oakAngles[i], scale: oakScales[i] * motifScale, small: false, foreground: false });
  }
  for (const [i, node] of [62.0, 64.6, 67.2, 70.3].entries()) {
    const backward = i % 2 === 1;
    oakLeaves.push({ node, s: node + 0.12, y: oakY(node) + (i % 2 ? -1 : 1) * 0.18,
      angle: backward ? Math.PI + (i === 1 ? 0.28 : -0.33) : 0.30,
      scale: [0.54, 0.63, 0.57, 0.69][i] * motifScale, small: true, foreground: false });
  }
  for (const [i, node] of [61.5, 65.2, 68.9].entries()) {
    oakLeaves.push({ node, s: node + 0.12, y: oakY(node) + 0.045,
      angle: [0.11, -0.12, 0.06][i],
      scale: 0.62 * motifScale, small: true, foreground: false });
  }
  oakLeaves.push(
    { node: 63.22, s: 63.50, y: 0.15, angle: 0.25, scale: 0.63 * motifScale, small: false, foreground: true },
    { node: 65.78, s: 66.55, y: 0.20, angle: 0.12, scale: 0.72 * motifScale, small: false, foreground: true },
    { node: 69.37, s: 69.75, y: 0.17, angle: -0.17, scale: 0.65 * motifScale, small: false, foreground: true },
  );
  for (const p of oakLeaves) shoot('oak-leaf-petiole', [p.node, oakY(p.node)], [p.s, p.y], 0.021);
  for (const p of oakFruit) shoot('oak-fruit-twig', [p.s - 0.38, oakY(p.s - 0.38)],
    posePoint(p.s, p.y, p.angle, motifScale, 0.01, -0.455), 0.023);
  for (const p of oakLeaves.filter(p => !p.foreground)) leaf(p.small ? 'oak-middle-leaf' : 'oak-back-leaf', p.s, p.y, p.angle, p.scale, true, p.small);
  const oakAcorns = oakFruit.map(p => ({ ...acorn(p.s, p.y, p.angle), angle: p.angle }));
  for (const p of oakLeaves.filter(p => p.foreground)) leaf('oak-foreground-leaf', p.s, p.y, p.angle, p.scale, true, p.small);

  const transitionSections = [
    { key: 'whiskey-gin-transition', title: 'Transition - rye into juniper', stationWindow: [17.3, 21.8], description: 'Late rye heads overlap the first smaller juniper sprays as the engraving approaches the bend. The grains keep their individual culms beside the woody juniper branch.' },
    { key: 'gin-beer-transition', title: 'Transition - juniper into hops and barley', stationWindow: [27.8, 32.2], description: 'Ending juniper sprays interleave with the first hop leaves and barley stalks. Each plant retains its own concealed support.' },
    { key: 'beer-wine-transition', title: 'Transition - hops and barley into grape vine', stationWindow: [41.5, 46.5], description: 'Smaller late hop leaves and a cone overlap the beginning grape vine, broad palmate leaves and first hanging bunches.' },
    { key: 'wine-oak-transition', title: 'Transition - grape vine into white oak', stationWindow: [60.2, 65.0], description: 'The ending grape bunch and enlarged palmate foliage recede beneath the first oak leaves, leading into fewer, larger leaves and acorns.' },
  ];
  const closeSections = [
    { key: 'corn-close', title: 'Close-up - corn with raised kernels and peeled husks', stationWindow: [placedStation('corn', 48.8), placedStation('corn', 59.0)], description: 'Two enlarged ears lie at different angles among fewer, larger rye heads. The kernel crowns, side faces and peeled husks are enlarged together, not merely drawn with thicker strokes.' },
    { key: 'gin-close', title: 'Close-up - leafy juniper branch and berries', stationWindow: [placedStation('juniper', 35.8), placedStation('juniper', 41.5)], description: 'Single-line branch, twig and berry-stem connections replace the previous parallel contours, bark marks and interior stem grooves. The needles and berries remain unchanged apart from the wider band.' },
    { key: 'wine-close', title: 'Close-up - grapes growing on a vine', stationWindow: [placedStation('grape', 2.2), placedStation('grape', 7.6)], description: 'Two attached leaves shorten the longest exposed vine stretches without eliminating the flowing stem entirely. The enlarged leaves and grape bunches fill a five-percent-wider band.' },
    { key: 'oak-close', title: 'Close-up - naturally layered oak and angled acorns', viewBox: [52.0, 4.3, 10.4, 3.8], rotate: 0, description: 'Larger white-oak leaves and acorns grow at varied angles from connected twigs. The ending stays in the same area, with foreground foliage still partly concealing selected fruit.' },
  ];
  for (const section of [...sections, ...transitionSections, ...closeSections.filter(section => section.stationWindow)]) {
    const [start, end] = section.stationWindow || [section.start, section.end];
    const points = [];
    for (let s = start; s <= end; s += 0.12) points.push(mapPoint(s, 0));
    points.push(mapPoint(end, 0));
    const margin = section.key.endsWith('-transition') ? 1.6 : 1.9;
    const minX = Math.min(...points.map(p => p[0])) - margin;
    const maxX = Math.max(...points.map(p => p[0])) + margin;
    const minY = Math.min(...points.map(p => p[1])) - margin;
    const maxY = Math.max(...points.map(p => p[1])) + margin;
    section.viewBox = [minX, minY, maxX - minX, maxY - minY].map(n => Number(n.toFixed(4)));
    section.rotate = section.viewBox[3] > section.viewBox[2] ? -90 : 0;
  }
  const cornCenter = mapPoint(placedStation('corn', cornEars[0].s), cornEars[0].y);
  sections.unshift(
    ...closeSections,
    { key: 'corn-kernel-close', title: 'Detail - raised corn kernels and side faces', viewBox: [cornCenter[0] - 1.15, cornCenter[1] - 1.10, 2.3, 2.2], rotate: 0, description: 'A tighter view of the first ear shows the rounded kernel crowns, shaded lower side walls and projecting edge kernels. The smooth inner cob is beneath the kernel layer, not the outer silhouette.' },
    ...transitionSections,
  );
  function masksFor(item, foreground) {
    const own = metadata.get(item.id);
    assert(own, `Unclassified master path: ${item.id}`);
    return foreground.filter(mask => {
      const other = metadata.get(mask.id);
      return other.z > own.z;
    });
  }
  function keepInsideFor(item, foreground) {
    const own = metadata.get(item.id);
    if (!own.keepInside) return undefined;
    return foreground.find(mask => metadata.get(mask.id).owner === own.owner);
  }
  return {
    seed, sections, foregroundIds, metadata, masksFor, keepInsideFor, structuralSupports, oakAcorns,
    stats: {
      layoutVersion: 'bar-top-refinements-v6',
      juniperStemStyle: 'single-line',
      motifScaleTarget: motifScale,
      plantOrder: ['whiskey', 'gin', 'beer', 'wine', 'oak'],
      layeredObjects: shapes.length, noGenericGarlandSpine: true,
      botanicalStructure: {
        oakLeafSpecies: 'Quercus alba', oakLobesPerLeaf: 7,
        acornPeduncles: shapes.filter(s => s.id.startsWith('oak-acorn-peduncle-')).length,
        woodyGrapeVines: 1, grapeLeafPetioles: grapeLeaves.length, hangingGrapeBunches: grapeBunchNodes.length,
        woodyOakBranches: 1, oakLeafPetioles: oakLeaves.length, oakFruitTwigs: oakFruit.length,
        foregroundOakLeaves: oakLeaves.filter(p => p.foreground).length,
        acornAnglesDegrees: oakFruit.map(p => Math.round(p.angle * 180 / Math.PI)),
        juniperPrimaryBranches: 1, juniperBerryPedicels: shapes.filter(s => s.id.startsWith('juniper-berry-pedicel-')).length,
        hopsBines: 1, barleyCulms: shapes.filter(s => s.id.startsWith('barley-culm-')).length,
        ryeCulms: shapes.filter(s => s.id.startsWith('rye-culm-')).length,
        angledCornEars: cornEars.length,
        cornAnglesDegrees: cornEars.map(p => Math.round(p.angle * 180 / Math.PI)),
        raisedCornKernels: shapes.filter(s => s.id.startsWith('corn-raised-kernel-')).length,
      },
    },
  };
};
