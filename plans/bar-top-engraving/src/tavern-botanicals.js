module.exports = function drawTavern(api) {
  const { motifPath, transform, circle: drawCircle, stemSection, totalLength, mapPoint } = api;
  const foregroundIds = new Set();
  const backgroundIds = new Set();
  const seed = 73149;
  let state = seed;
  function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  const between = (a, b) => a + random() * (b - a);
  const sections = [
    { key: 'wine', title: 'Wine - grape vine', start: 0, end: 19.3, description: 'Palmate grape leaves, irregular hanging bunches and curled tendrils.' },
    { key: 'beer', title: 'Beer - hops and barley', start: 19.3, end: 34.5, description: 'Hop bracts and lobed leaves weave into barley heads with long awns.' },
    { key: 'gin', title: 'Gin - common juniper', start: 34.5, end: 45, description: 'Short needle whorls and berry-like seed cones; not generic cedar foliage.' },
    { key: 'whiskey', title: 'American whiskey / bourbon - rye and corn', start: 45, end: 62.5, description: 'Slender rye heads and corn ears with husks: rye whiskey and the signature grain of bourbon.' },
    { key: 'oak', title: 'White oak - leaf and acorn tribute', start: 62.5, end: totalLength, description: 'Rounded white-oak lobes and capped acorns, honoring the wood and barrel-aged spirits.' },
  ];

  function draw(id, s, commands, role = 'detail', followCurve = false) {
    motifPath(id, s, commands, followCurve);
    if (role === 'foreground') foregroundIds.add(id);
    if (role === 'background') backgroundIds.add(id);
  }
  function placed(id, s, commands, x, y, angle, scale, role = 'detail') {
    draw(id, s, transform(commands, x, y, angle, scale), role);
  }
  function berry(id, s, x, y, radius) {
    drawCircle(id, s, x, y, radius);
    foregroundIds.add(id);
  }
  function twig(id, s, side, length = 1.1) {
    draw(id, s, [
      ['M', -0.08, 0],
      ['C', length * 0.25, side * 0.03, length * 0.64, side * 0.22, length, side * 0.40],
    ], 'background', true);
  }

  function grapeLeaf(id, s, side, scale) {
    const angle = side * between(0.22, 0.37);
    const outline = [
      ['M', 0, 0],
      ['Q', 0.12, -0.09, 0.08, -0.23], ['L', 0.28, -0.18],
      ['Q', 0.27, -0.33, 0.20, -0.44], ['L', 0.44, -0.38],
      ['Q', 0.43, -0.57, 0.48, -0.66], ['L', 0.61, -0.50],
      ['Q', 0.69, -0.65, 0.84, -0.72],
      ['Q', 0.76, -0.47, 1.10, -0.48],
      ['Q', 1.00, -0.27, 1.25, -0.20], ['L', 1.11, 0],
      ['Q', 1.27, 0.16, 1.13, 0.20],
      ['Q', 1.02, 0.25, 1.03, 0.42], ['L', 0.84, 0.36],
      ['Q', 0.87, 0.55, 0.71, 0.62], ['L', 0.58, 0.47],
      ['Q', 0.55, 0.65, 0.41, 0.60], ['L', 0.39, 0.36],
      ['Q', 0.22, 0.45, 0.16, 0.35], ['L', 0.25, 0.22],
      ['Q', 0.09, 0.23, 0, 0], ['Z'],
    ];
    placed(`${id}-outline`, s, outline, 0, side * 0.08, angle, scale, 'foreground');
    for (const [i, tip] of [[1.04, 0], [0.79, -0.56], [0.42, -0.38], [0.76, 0.48], [0.38, 0.29]].entries()) {
      placed(`${id}-vein-${i + 1}`, s, [['M', 0.08, 0], ['Q', tip[0] * 0.48, tip[1] * 0.30, ...tip]], 0, side * 0.08, angle, scale);
    }
  }
  function grapes(id, s, side) {
    const y = side < 0 ? -0.75 : -0.16;
    const centers = [
      [-0.21, 0], [0.03, -0.015], [0.27, 0.02],
      [-0.34, 0.23], [-0.10, 0.23], [0.14, 0.24], [0.38, 0.25],
      [-0.22, 0.47], [0.02, 0.47], [0.26, 0.49],
      [-0.10, 0.70], [0.14, 0.72], [0.02, 0.93],
    ];
    draw(`${id}-stalk`, s, [['M', 0, 0], ['Q', -0.07, y - 0.10, 0.02, y - 0.10]], 'background');
    centers.forEach(([x, cy], i) => berry(`${id}-berry-${i + 1}`, s, x, y + cy, between(0.096, 0.109)));
  }
  function tendril(id, s, side) {
    draw(id, s, [
      ['M', 0, 0], ['C', 0.16, side * 0.06, 0.29, side * 0.40, 0.57, side * 0.47],
      ['C', 0.90, side * 0.59, 1.00, side * 0.20, 0.76, side * 0.19],
      ['C', 0.53, side * 0.18, 0.58, side * 0.39, 0.77, side * 0.35],
    ], 'background', true);
  }

  function hopLeaf(id, s, side) {
    const leaf = [
      ['M', 0, 0], ['Q', 0.17, -0.10, 0.13, -0.28], ['L', 0.30, -0.22],
      ['Q', 0.29, -0.40, 0.39, -0.51], ['L', 0.55, -0.35],
      ['Q', 0.82, -0.34, 1.09, 0],
      ['Q', 0.84, 0.33, 0.55, 0.35], ['L', 0.39, 0.51],
      ['Q', 0.28, 0.38, 0.30, 0.22], ['L', 0.13, 0.28],
      ['Q', 0.16, 0.09, 0, 0], ['Z'],
    ];
    const angle = side * between(0.30, 0.43);
    placed(`${id}-outline`, s, leaf, 0, 0, angle, 0.88, 'foreground');
    for (const [i, y] of [-0.33, 0, 0.33].entries()) {
      placed(`${id}-vein-${i}`, s, [['M', 0.08, 0], ['Q', 0.45, y * 0.38, y ? 0.48 : 0.98, y]], 0, 0, angle, 0.88);
    }
  }
  function hopCone(id, s) {
    const offset = -0.19;
    placed(`${id}-contour`, s, [
      ['M', 0, -0.38], ['C', -0.48, -0.17, -0.49, 0.38, -0.22, 0.72],
      ['Q', 0, 0.94, 0.22, 0.72], ['C', 0.50, 0.37, 0.48, -0.16, 0, -0.38], ['Z'],
    ], 0, offset, 0, 1, 'foreground');
    for (let r = 0; r < 4; r++) {
      const width = r === 3 ? 0.26 : 0.33;
      const centers = r === 3 ? [0] : r % 2 ? [-0.18, 0.18] : [-0.21, 0, 0.21];
      centers.forEach((x, i) => placed(`${id}-bract-${r}-${i}`, s, [
        ['M', x, r * 0.21 - 0.14],
        ['Q', x - width * 0.65, r * 0.21 - 0.22, x - width / 2, r * 0.21 + 0.015],
        ['Q', x - width * 0.23, r * 0.21 + 0.13, x, r * 0.21 + 0.24],
        ['Q', x + width * 0.23, r * 0.21 + 0.13, x + width / 2, r * 0.21 + 0.015],
        ['Q', x + width * 0.65, r * 0.21 - 0.22, x, r * 0.21 - 0.14], ['Z'],
      ], 0, offset, 0, 0.92));
    }
    draw(`${id}-stalk`, s, [['M', 0, offset - 0.38], ['Q', 0.03, offset - 0.56, 0.17, offset - 0.62]], 'background');
  }
  function barley(id, s, side) {
    const angle = side * between(0.12, 0.21);
    placed(`${id}-axis`, s, [['M', -0.14, 0], ['Q', 0.72, 0.025, 1.69, 0]], 0, 0, angle, 1, 'background');
    for (let i = 0; i < 7; i++) {
      for (const side of [-1, 1]) {
        const x = 0.33 + i * 0.18;
        placed(`${id}-grain-${i}-${side}`, s, [
          ['M', x - 0.06, 0], ['Q', x - 0.065, side * 0.15, x + 0.14, side * 0.19],
          ['Q', x + 0.22, side * 0.04, x - 0.06, 0], ['Z'],
        ], 0, 0, angle, 1, 'foreground');
        placed(`${id}-awn-${i}-${side}`, s, [
          ['M', x + 0.14, side * 0.19],
          ['Q', x + 0.37, side * 0.32, x + 0.52, side * (0.45 + 0.04 * Math.sin(i))],
        ], 0, 0, angle, 1, 'background');
      }
    }
  }

  function juniper(id, s, side) {
    twig(`${id}-twig`, s, side, 1.24);
    for (let i = 0; i < 5; i++) {
      const x = 0.20 + i * 0.18;
      const y = side * (0.02 + i * 0.065);
      for (const [j, [dx, dy]] of [[0.09, 0.23], [0.31, 0.17], [0.28, -0.07]].entries()) {
        draw(`${id}-needle-${i}-${j}`, s, [['M', x, y], ['Q', x + dx * 0.35, y + side * dy * 0.8, x + dx, y + side * dy]], 'background', true);
      }
    }
    const centers = [[0.47, side * 0.18], [0.70, side * 0.31], [0.93, side * 0.18]];
    centers.forEach(([x, y], i) => {
      berry(`${id}-berry-${i + 1}`, s, x, y, 0.104);
      draw(`${id}-cone-scar-${i + 1}`, s, [['M', x - 0.039, y + 0.025], ['L', x, y - 0.035], ['L', x + 0.039, y + 0.025]]);
    });
  }
  function rye(id, s, side) {
    const angle = side * between(0.18, 0.30);
    placed(`${id}-axis`, s, [['M', -0.15, 0], ['Q', 0.76, -0.015, 1.73, 0]], 0, 0, angle, 1, 'background');
    for (let i = 0; i < 9; i++) {
      const x = 0.32 + i * 0.15;
      for (const side of [-1, 1]) {
        placed(`${id}-grain-${i}-${side}`, s, [
          ['M', x - 0.04, 0], ['Q', x - 0.02, side * 0.105, x + 0.17, side * 0.115],
          ['Q', x + 0.20, side * 0.025, x - 0.04, 0], ['Z'],
        ], 0, 0, angle, 1, 'foreground');
        placed(`${id}-awn-${i}-${side}`, s, [
          ['M', x + 0.17, side * 0.115], ['Q', x + 0.31, side * 0.18, x + 0.43, side * 0.245],
        ], 0, 0, angle, 1, 'background');
      }
    }
  }
  function corn(id, s, angle) {
    placed(`${id}-cob`, s, [
      ['M', 0, -0.73], ['C', -0.30, -0.65, -0.31, -0.18, -0.24, 0.32],
      ['Q', -0.20, 0.54, 0, 0.64], ['Q', 0.20, 0.54, 0.24, 0.32],
      ['C', 0.31, -0.18, 0.30, -0.65, 0, -0.73], ['Z'],
    ], 0, 0, angle, 1, 'foreground');
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * 0.135;
        const y = -0.49 + row * 0.16;
        placed(`${id}-kernel-${row}-${col}`, s, [
          ['M', x - 0.052, y - 0.057], ['Q', x, y - 0.074, x + 0.052, y - 0.057],
          ['Q', x + 0.068, y, x + 0.050, y + 0.062], ['Q', x, y + 0.078, x - 0.050, y + 0.062],
          ['Q', x - 0.066, y, x - 0.052, y - 0.057], ['Z'],
        ], 0, 0, angle, 1);
      }
    }
    for (const side of [-1, 1]) {
      placed(`${id}-husk-${side}`, s, [
        ['M', 0, 0.67], ['C', side * 0.16, 0.38, side * 0.43, 0.06, side * 0.68, -0.43],
        ['C', side * 0.56, 0.10, side * 0.38, 0.59, 0, 0.67], ['Z'],
      ], 0, 0, angle, 1, 'foreground');
      placed(`${id}-husk-vein-${side}`, s, [['M', side * 0.11, 0.52], ['Q', side * 0.35, 0.25, side * 0.58, -0.22]], 0, 0, angle, 1);
    }
  }

  function oakLeaf(id, s, side) {
    const angle = side * between(0.35, 0.55);
    const leaf = [
      ['M', 0, 0],
      ['C', 0.14, -0.10, 0.02, -0.30, 0.22, -0.28],
      ['C', 0.39, -0.25, 0.24, -0.45, 0.43, -0.43],
      ['C', 0.62, -0.40, 0.49, -0.49, 0.69, -0.42],
      ['C', 0.85, -0.40, 0.76, -0.43, 0.96, -0.34],
      ['C', 1.09, -0.25, 1.04, -0.18, 1.25, -0.15],
      ['C', 1.45, -0.09, 1.44, 0.10, 1.25, 0.16],
      ['C', 1.07, 0.19, 1.10, 0.29, 0.96, 0.34],
      ['C', 0.77, 0.42, 0.84, 0.40, 0.69, 0.43],
      ['C', 0.47, 0.49, 0.63, 0.40, 0.43, 0.43],
      ['C', 0.23, 0.43, 0.38, 0.24, 0.22, 0.28],
      ['C', 0.03, 0.31, 0.13, 0.11, 0, 0], ['Z'],
    ];
    placed(`${id}-outline`, s, leaf, 0, 0, angle, 0.83, 'foreground');
    placed(`${id}-midrib`, s, [['M', 0.09, 0], ['Q', 0.67, 0.015, 1.27, 0]], 0, 0, angle, 0.83);
    for (let i = 0; i < 4; i++) {
      const x = 0.27 + i * 0.22;
      for (const side of [-1, 1]) {
        placed(`${id}-vein-${i}-${side}`, s, [['M', x - 0.07, 0], ['Q', x, side * 0.09, x + 0.09, side * 0.23]], 0, 0, angle, 0.83);
      }
    }
  }
  function acorn(id, s, angle) {
    placed(`${id}-body`, s, [
      ['M', -0.25, 0], ['C', -0.27, 0.28, -0.18, 0.56, 0, 0.66],
      ['C', 0.18, 0.56, 0.27, 0.28, 0.25, 0], ['Q', 0, 0.09, -0.25, 0], ['Z'],
    ], 0, -0.07, angle, 1, 'foreground');
    placed(`${id}-cap`, s, [
      ['M', -0.28, 0], ['C', -0.32, -0.14, -0.22, -0.30, 0, -0.31],
      ['C', 0.22, -0.30, 0.32, -0.14, 0.28, 0], ['Q', 0, 0.10, -0.28, 0], ['Z'],
    ], 0, -0.07, angle, 1, 'foreground');
    placed(`${id}-stem`, s, [['M', 0, -0.31], ['Q', 0, -0.47, 0.12, -0.48]], 0, -0.07, angle, 1, 'background');
    for (let i = 0; i < 4; i++) {
      const x = -0.19 + i * 0.115;
      placed(`${id}-cap-scale-${i}`, s, [['M', x - 0.045, -0.13], ['Q', x, -0.04, x + 0.07, -0.13]], 0, -0.07, angle, 1);
    }
  }

  stemSection(0, totalLength, 'tavern-vine-spine');
  backgroundIds.add('tavern-vine-spine');
  let i = 0;
  for (let s = 0.9; s < 20.5; s += between(1.75, 2.55)) {
    grapeLeaf(`grape-leaf-${++i}`, s, random() < 0.5 ? -1 : 1, between(0.70, 0.78));
  }
  for (const [i, s] of [3.35, 8.75, 14.45, 18.7].entries()) grapes(`grape-bunch-${i + 1}`, s + between(-0.24, 0.24), i === 1 ? -1 : 1);
  for (let i = 0, s = 0.45; s < 21; s += between(0.95, 1.65), i++) tendril(`grape-tendril-${i + 1}`, s, random() < 0.48 ? -1 : 1);

  for (let i = 0, s = 18.2; s < 35.0; s += between(2.25, 3.1), i++) hopLeaf(`hops-leaf-${i + 1}`, s, i % 2 ? 1 : -1);
  for (const [i, s] of [21.4, 27.7, 32.75].entries()) hopCone(`hops-cone-${i + 1}`, s + between(-0.26, 0.26));
  for (let i = 0, s = 18.4; s < 34.3; s += between(1.45, 2.2), i++) barley(`barley-ear-${i + 1}`, s, i % 2 ? -1 : 1);

  for (let i = 0, s = 33.5; s < 46.0; s += between(0.90, 1.65), i++) juniper(`juniper-spray-${i + 1}`, s, i % 2 ? -1 : 1);
  for (let i = 0, s = 44.0; s < 63.0; s += between(1.85, 2.80), i++) rye(`rye-ear-${i + 1}`, s, i % 2 ? -1 : 1);
  for (const [i, s] of [47.6, 53.4, 60.0].entries()) corn(`corn-ear-${i + 1}`, s + between(-0.17, 0.17), between(-0.18, 0.22));
  for (let i = 0, s = 61.2; s < totalLength - 1.45; s += between(1.20, 1.95), i++) oakLeaf(`oak-leaf-${i + 1}`, s, i % 2 ? 1 : -1);
  for (const [i, s] of [64.0, 67.4, 70.4].entries()) acorn(`oak-acorn-${i + 1}`, s + between(-0.20, 0.20), between(-0.22, 0.26));
  for (let i = 0, s = 62.0; s < totalLength - 1.4; s += between(1.2, 1.9), i++) twig(`oak-twig-${i + 1}`, s, i % 2 ? -1 : 1, 0.9);

  for (const section of sections) {
    const points = [];
    for (let s = section.start; s <= section.end; s += 0.12) points.push(mapPoint(s, 0));
    points.push(mapPoint(section.end, 0));
    const minX = Math.min(...points.map(p => p[0])) - 1.65;
    const maxX = Math.max(...points.map(p => p[0])) + 1.65;
    const minY = Math.min(...points.map(p => p[1])) - 1.65;
    const maxY = Math.max(...points.map(p => p[1])) + 1.65;
    section.viewBox = [minX, minY, maxX - minX, maxY - minY].map(n => Number(n.toFixed(4)));
    section.rotate = section.viewBox[3] > section.viewBox[2] ? -90 : 0;
  }
  function masksFor(item, foreground) {
    if (backgroundIds.has(item.id)) return foreground;
    if (/^(?:grape-leaf|hops-leaf|barley-ear|rye-ear|oak-leaf)-/.test(item.id)) {
      return foreground.filter(mask =>
        /^grape-bunch-.*-berry-/.test(mask.id) ||
        /^hops-cone-.*-contour$/.test(mask.id) ||
        /^juniper-spray-.*-berry-/.test(mask.id) ||
        /^corn-ear-.*-(?:cob|husk--?1)$/.test(mask.id) ||
        /^oak-acorn-.*-(?:body|cap)$/.test(mask.id));
    }
    if (/^corn-ear-.*-(?:cob|kernel-)/.test(item.id)) {
      const family = item.id.match(/^corn-ear-\d+/)[0];
      return foreground.filter(mask => mask.id.startsWith(`${family}-husk-`));
    }
    return [];
  }
  return { seed, sections, foregroundIds, backgroundIds, masksFor };
};
