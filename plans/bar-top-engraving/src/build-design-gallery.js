const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const tavern = JSON.parse(fs.readFileSync(path.join(root, 'tavern-botanicals', 'design.json'), 'utf8'));
const master = JSON.parse(fs.readFileSync(path.join(root, 'master-botanicals', 'design.json'), 'utf8'));
assert.deepEqual(tavern.sections.map(s => s.key), ['wine', 'beer', 'gin', 'whiskey', 'oak']);
const designs = [
  {
    id: 'concept', title: 'Original room concept', tab: '1. Room concept', type: 'image',
    proof: 'references/room-concept.png',
    description: 'The first room visualization. This is an artistic concept, not a measured layout; it simplifies the stepped top.',
    sections: [],
  },
  {
    id: 'holiday-simple', title: 'Holiday - restrained line garland', tab: '2. Simple holiday', type: 'svg',
    proof: 'measured-oak-garland-proof.svg',
    paths: 'holiday-garland-paths.svg', guides: 'holiday-garland-with-guides.svg',
    description: 'The first measured SVG: a narrow, sparse pine / holly / berry garland. Retained unchanged for comparison.',
    sections: [
      { key: 'repeat', title: 'Pine / holly / berries', viewBox: [31.5, 5.95, 12, 3.4], rotate: 0 },
      { key: 'corner', title: 'Lower corner and miter', viewBox: [18.7, 15.1, 6.2, 5.4], rotate: 0 },
    ],
  },
  {
    id: 'holiday-full', title: 'Holiday - fuller botanical garland', tab: '3. Full holiday', type: 'svg',
    proof: 'revision-2/measured-oak-garland-proof.svg',
    paths: 'revision-2/holiday-garland-paths.svg', guides: 'revision-2/holiday-garland-with-guides.svg',
    description: 'White pine, pine cones, holly and berries, mistletoe, and poinsettia. Fuller foliage with hidden lines removed from the actual paths.',
    sections: [
      { key: 'repeat', title: 'All six holiday motifs', viewBox: [24.5, 5.15, 17.5, 3.5], rotate: 0 },
      { key: 'corner', title: 'Lower turn and poinsettia', viewBox: [18.7, 15.1, 6.2, 5.4], rotate: 0 },
    ],
  },
  {
    id: 'tavern', title: 'The plants behind the pour', tab: '4. US / UK tavern', type: 'svg',
    proof: 'tavern-botanicals/measured-oak-garland-proof.svg',
    paths: 'tavern-botanicals/tavern-botanicals-paths.svg',
    guides: 'tavern-botanicals/tavern-botanicals-with-guides.svg',
    description: 'Non-seasonal US / UK drinks: grape / wine, hops and barley / beer, juniper / gin, rye and corn / whiskey and bourbon, then white oak and acorns. Irregular placement and overlapping transitions, not a repeated mixed-symbol strip.',
    sections: tavern.sections,
  },
  {
    id: 'master', title: 'Layered botanical frieze - reordered v3', tab: '5. Layered engraving', type: 'svg',
    proof: 'master-botanicals/measured-oak-garland-proof.svg',
    paths: 'master-botanicals/master-botanicals-paths.svg',
    guides: 'master-botanicals/master-botanicals-with-guides.svg',
    description: 'New order, starting at the short-arm end: whiskey / rye and corn, then gin / juniper, beer / hops and barley, wine / grape vine, and white oak / acorns. The existing detailed motifs, layered oak ending and measured board layout are retained. The beer grouping is fitted about 10% along the route, with no change in band height. Plants interleave at all four new handoffs. The previous layered arrangement remains in the bar-top-origin-encoding-v2 Git tag; designs 1-4 are unchanged.',
    sections: master.sections,
  },
];
for (const design of designs) {
  for (const asset of [design.proof, design.paths, design.guides].filter(Boolean)) {
    assert(fs.existsSync(path.resolve(root, asset)), `Missing gallery asset: ${asset}`);
  }
  if (design.type === 'svg') {
    const proof = fs.readFileSync(path.resolve(root, design.proof), 'utf8');
    assert(proof.includes('viewBox="-5 -5 74.125 31"'), 'Gallery proofs must share the same physical coordinate system');
  }
}

const data = JSON.stringify(designs).replace(/</g, '\\u003c');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bar-top engraving - design comparison</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eae6dd;color:#29372f;font:15px Arial,sans-serif;padding:24px}
#sheet{max-width:1720px;margin:auto;padding:28px 36px;background:#faf8f3;border-radius:12px}
h1{font:34px Georgia,serif;margin:0 0 9px}.intro{color:#687569;line-height:1.5;margin:0 0 19px}
.tabs{display:flex;gap:9px;flex-wrap:wrap;border-bottom:1px solid #ced5c8;padding-bottom:16px}
button,select{font:inherit;border:1px solid #b8c3b3;border-radius:5px;background:#fffdf8;color:#304334;padding:9px 13px}
button{cursor:pointer}button[aria-selected=true]{background:#35513e;border-color:#35513e;color:white}
button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #b58143;outline-offset:3px}
.caption{display:flex;align-items:start;justify-content:space-between;gap:20px;margin:21px 0 0}
h2{font:26px Georgia,serif;margin:0 0 7px}#description{max-width:1100px;line-height:1.5;color:#657163;margin:0}
.actions{display:flex;gap:8px;white-space:nowrap}
#error{background:#fff0e6;color:#84341c;border:1px solid #cf8e70;padding:12px;margin-top:16px}
#full-plan{display:block;width:100%;height:auto}#full-plan.concept{max-width:750px;max-height:1040px;object-fit:contain;margin:20px auto}
.zoom-tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:5px 0 11px}
#section-description{font-size:13px;color:#6c796d;line-height:1.5;margin:0 0 11px}
#detail-svg{display:block;width:100%;height:310px;background:#f5f0e5;border:1px solid #d7c8b1;border-radius:6px}
.downloads{display:flex;gap:19px;flex-wrap:wrap;margin-top:17px}a{color:#35593d}
footer{border-top:1px solid #d3dacd;margin-top:24px;padding-top:17px;font-size:13px;line-height:1.55;color:#6e796c}
.review{border-top:1px solid #d3dacd;margin-top:20px;padding-top:18px;font-size:14px;line-height:1.5}.review summary{cursor:pointer;font-weight:bold;color:#35513e}.review table{border-collapse:collapse;width:100%;font-size:13px}.review th,.review td{padding:10px;text-align:left;vertical-align:top;border-bottom:1px solid #d3dacd}.review-scroll{overflow-x:auto}
.dimensions{font-size:12px;letter-spacing:0.02em;color:#78816f;margin:15px 0 0}
[hidden]{display:none!important}
@media(max-width:850px){body{padding:8px}#sheet{padding:19px}h1{font-size:27px}.caption{display:block}.actions{margin-top:13px}#detail-svg{height:250px}.tabs button{font-size:13px;padding:8px}.zoom-tools select{max-width:100%}}
</style></head><body><main id="sheet">
<h1>Bar-top engraving design notebook</h1>
<p class="intro">Switch designs instantly, then inspect a section below. Earlier designs are preserved; future revisions can update their linked SVGs here.</p>
<div class="tabs" role="tablist" aria-label="Engraving designs">
${designs.map(d => `<button id="tab-${d.id}" type="button" role="tab" aria-selected="${d.id === 'master'}" aria-controls="design-panel" tabindex="${d.id === 'master' ? 0 : -1}" data-design="${d.id}">${d.tab}</button>`).join('')}
</div>
<section id="design-panel" role="tabpanel" aria-labelledby="tab-master">
<div class="caption"><div><h2 id="design-title"></h2><p id="description"></p></div><div class="actions"><button id="previous" type="button">Previous</button><button id="next" type="button">Next</button><button id="refresh" type="button">Refresh artwork</button></div></div>
<p class="dimensions" id="dimensions">CONFIRMED OAK: 23 3/8 in short arm / 20 in bend / 49 1/4 in long arm / 8 1/2 in wide throughout</p>
<div id="error" role="alert" hidden></div>
<img id="full-plan" alt="" decoding="sync">
<section id="zoom-panel">
<div class="zoom-tools"><label for="section-select"><strong>Inspect section:</strong></label><select id="section-select"></select><span id="rotation-note"></span></div>
<p id="section-description"></p>
<svg xmlns="http://www.w3.org/2000/svg" id="detail-svg" viewBox="0 0 1 1" role="img" aria-label="Enlarged engraving detail"><g id="detail-group"><image id="detail-image" x="-5" y="-5" width="74.125" height="31" preserveAspectRatio="none"/></g></svg>
</section>
<nav class="downloads" id="downloads" aria-label="Selected design files"><a id="proof-link" download>Measured SVG proof</a><a id="path-link" download>Engraving paths SVG</a><a id="guide-link" download>Origin SVG with non-cutting guides</a></nav>
</section>
<footer><strong>Review stage:</strong> The preview and engraving exports use the same paths. SVG units are inches; the wood-textured proof is not a cut file. Gray means on-line engraving; blue means non-cutting guides. The pre-correction baseline tag uses reversed colors and must not be cut. Fine outlines and hatching have illustrative weights, not chosen tool widths or cut depths. Bit diameter, depth and on-tool registration still need selection and a scrap test. <a href="SHAPER-ORIGIN.md">Origin import and batch-file instructions</a><br>
<strong>Plant notes:</strong> Rye represents American rye whiskey; corn is bourbon's defining grain. Barley also connects beer with malt whisky. Common juniper (<em>Juniperus communis</em>) is the gin plant; some other junipers are called cedar, but they are not true cedars.
<a href="https://www.theginguild.com/ginopedia/gin-botanicals/juniper/">Juniper reference</a> &middot; <a href="https://plants.ces.ncsu.edu/plants/juniperus-virginiana/">Redcedar / juniper reference</a> &middot; <a href="https://plants.ces.ncsu.edu/plants/quercus-alba/">White oak reference</a></footer>
<details class="review" id="independent-review"><summary>Independent visual review - before this revision</summary>
<p>A separate agent inspected the previous wine close-up, oak close-up and whole-layout PNG without receiving the specific requested corrections. This is its baseline review, not an independent approval of the revised artwork. Responses below describe the changes made here.</p>
<p>Reviewed images: <a href="review-baseline/wine-closeup.png">previous wine detail</a> &middot; <a href="review-baseline/oak-closeup.png">previous oak detail</a> &middot; <a href="review-baseline/layered-preview.png">previous whole layout</a>.</p>
<div class="review-scroll"><table><thead><tr><th>Priority</th><th>Independent observation</th><th>Response / decision still open</th></tr></thead><tbody>
<tr><td>1 - anatomy</td><td>Grape leaves need a basal sinus and major veins radiating from the petiole; the earlier pointed, elongated shapes were not convincing.</td><td>Rebuilt as broader serrated, palmate leaves. Most leaves remain unfolded as recognition anchors.</td></tr>
<tr><td>2 - anatomy</td><td>White-oak lobes were too angular, and acorn cups looked too deep.</td><td>Replaced with seven rounded fingerlike lobes and deep sinuses; flattened the scaly cups and added short peduncles.</td></tr>
<tr><td>3 - growth clarity</td><td>Fruit and foliage overlapped without enough readable attachment routes.</td><td>Grapes, oak, juniper and hops now have connected, largely concealed support stems appropriate to each plant. Barley and rye have individual culms; acorn stalks and woody fruit twigs are connected.</td></tr>
<tr><td>4 - line hierarchy</td><td>Dense hatch knots and repeated curled edges competed for attention.</td><td>Reduced wine hatching and limited folds to selected leaves. Further simplification elsewhere remains a discussion, followed by actual-size and scrap tests.</td></tr>
<tr><td>5 - subjective rhythm</td><td>The wine and oak sections were denser than the long arm; similarly upright corn motifs repeated conspicuously.</td><td>Added small rye fans around the retained grain-head placements. Corn now has two different angles, raised kernel crowns, shaded side faces and partially peeled husks. Oak fruit angles and foreground leaf overlap are deliberately varied.</td></tr>
<tr><td>6 - subjective transitions</td><td>Some changes between plant sections read abruptly rather than as gentle handoffs.</td><td>Version 3 reorders the detailed plant groups: whiskey to gin, gin to beer, beer to wine, and wine to oak. Four updated transition zooms show the interleaving at these new handoffs. Each plant keeps its own support; the earlier review did not inspect this rearrangement.</td></tr>
</tbody></table></div>
<p><strong>Strengths noted:</strong> generous clear tabletop space and coherent edge-following placement; curved hatching already gives useful volume through lines alone.</p>
<p><strong>Next decisions:</strong> botanical fidelity versus ornamental folds; deliberately different sectional densities versus a smoother rhythm; how much shading stays readable at actual size and with the chosen bit.</p>
</details>
</main>
<script>
const designs = ${data};
const byId = new Map(designs.map(d => [d.id, d]));
const selectedSections = new Map();
let selected;
const fullPlan = document.getElementById('full-plan');
const error = document.getElementById('error');
const sectionSelect = document.getElementById('section-select');
function report(message) { error.textContent = message; error.hidden = false; console.error(message); }
fullPlan.addEventListener('error', () => report('Could not load this design: ' + fullPlan.getAttribute('src') + '. Check that the linked SVG/image still exists.'));
fullPlan.addEventListener('load', () => { error.hidden = true; });
function zoom(key) {
  const section = selected.sections.find(s => s.key === key);
  if (!section || !section.viewBox.every(Number.isFinite) || section.viewBox[2] <= 0 || section.viewBox[3] <= 0) {
    report('The selected section has no valid zoom geometry.'); return;
  }
  selectedSections.set(selected.id, key);
  sectionSelect.value = key;
  const [x,y,w,h] = section.viewBox;
  const cx=x+w/2, cy=y+h/2, rotate=section.rotate || 0;
  const viewport = rotate ? [cx-h/2,cy-w/2,h,w] : section.viewBox;
  const svg = document.getElementById('detail-svg');
  svg.setAttribute('viewBox', viewport.join(' '));
  svg.setAttribute('aria-label', section.title + ' - enlarged engraving detail');
  const ratio = viewport[2] / viewport[3];
  const height = 420;
  const width = Math.min(1648, height * ratio);
  svg.setAttribute('width', width);
  svg.setAttribute('height', width / ratio);
  svg.style.width = 'min(100%, ' + width + 'px)';
  svg.style.height = 'auto';
  document.getElementById('detail-group').setAttribute('transform', rotate ? 'rotate('+rotate+' '+cx+' '+cy+')' : '');
  document.getElementById('rotation-note').textContent = rotate ? 'Bend detail rotated for easier viewing' : '';
  document.getElementById('section-description').textContent = section.description || 'Same actual engraving paths as the measured plan above.';
}
function render(id) {
  const design = byId.get(id);
  if (!design) { report('Unknown design bookmark: ' + id); return; }
  selected = design;
  error.hidden = true;
  for (const tab of document.querySelectorAll('[data-design]')) {
    const active = tab.dataset.design === id;
    tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
  }
  document.getElementById('design-panel').setAttribute('aria-labelledby', 'tab-' + id);
  document.getElementById('design-title').textContent = design.title;
  document.getElementById('description').textContent = design.description;
  document.getElementById('dimensions').hidden = design.type !== 'svg';
  fullPlan.classList.toggle('concept', design.type === 'image');
  fullPlan.alt = design.title + (design.type === 'svg' ? ' - measured oak engraving layout' : ' - artistic room visualization');
  fullPlan.src = design.proof;
  document.getElementById('zoom-panel').hidden = design.type !== 'svg';
  document.getElementById('downloads').hidden = design.type !== 'svg';
  sectionSelect.replaceChildren();
  for (const section of design.sections) {
    const option = document.createElement('option'); option.value = section.key; option.textContent = section.title; sectionSelect.append(option);
  }
  if (design.type === 'svg') {
    document.getElementById('proof-link').href = design.proof;
    document.getElementById('path-link').href = design.paths;
    document.getElementById('guide-link').href = design.guides;
    document.getElementById('detail-image').setAttribute('href', design.proof);
    zoom(selectedSections.get(id) || design.sections[0].key);
  }
}
function choose(id, focus=false) {
  if (!byId.has(id)) { report('Unknown design: ' + id); return; }
  if (location.hash.slice(1) !== id) location.hash = id;
  else render(id);
  if (focus) document.getElementById('tab-' + id).focus();
}
for (const tab of document.querySelectorAll('[data-design]')) {
  tab.addEventListener('click', () => choose(tab.dataset.design));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const index = designs.findIndex(d => d.id === selected.id);
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? designs.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + designs.length) % designs.length;
    choose(designs[target].id, true);
  });
}
document.getElementById('previous').addEventListener('click', () => {
  const index=designs.findIndex(d=>d.id===selected.id); choose(designs[(index+designs.length-1)%designs.length].id);
});
document.getElementById('next').addEventListener('click', () => {
  const index=designs.findIndex(d=>d.id===selected.id); choose(designs[(index+1)%designs.length].id);
});
document.getElementById('refresh').addEventListener('click', () => location.reload());
sectionSelect.addEventListener('change', () => zoom(sectionSelect.value));
addEventListener('hashchange', () => render(location.hash.slice(1) || 'master'));
render(location.hash.slice(1) || 'master');
</script></body></html>`;
fs.writeFileSync(path.join(root, 'design-gallery.html'), html);
console.log(JSON.stringify({ gallery: path.join(root, 'design-gallery.html'), designs: designs.map(d => d.id), tavernSections: tavern.sections.map(s => s.key), layeredSections: master.sections.map(s => s.key) }, null, 2));
