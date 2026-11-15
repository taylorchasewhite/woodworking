# Putting the botanical engraving on Shaper Origin

Research checked against official Shaper documentation on 2026-11-08.

## Important correction

The original exported cut colors were reversed. **Use this repository's corrected
files, not the `bar-top-art-baseline-v1` tag or the previous chat downloads.**
Earlier PNG screenshots and independent-review baseline images are visual-history
references, not authoritative cutting/color instructions.

Shaper's [cut-type encoding](https://support.shapertools.com/hc/en-us/articles/115002721473-Cut-Type-Encoding)
is **gray stroke = on-line engraving** and **blue stroke = non-cutting guide**.
Both open and closed paths can be on-line cuts. SVG stroke width does not control
the width of the routed groove.

## Current arrangement: version 4, reduced-detail review

Starting at the free end of the short arm, the sequence is now
**Whiskey / rye and corn > Gin / juniper > Beer / hops and barley >
Wine / grapes > White oak / acorns**.

Following a physical test, the user reported a groove about 1.5 to 2 times wider
than the illustrated lines and chose **25 percent fewer cuts overall**.
Version 4 removes **3,118 of 12,472 paths**, leaving **9,354**. Those removals
are about half of the 6,205 fine texture paths; all **6,267 structural paths**
remain at their exact v3 coordinates. Outlines, juniper needles, main veins,
corn-kernel side faces, plant count, layering, transitions and placement are
unchanged. Whole texture strokes are thinned evenly in drawing order; all
visible fragments of a clipped stroke are removed or retained together.

The whiskey plants still occupy the short arm; juniper follows the bend, then
beer and wine lead into the oak ending. Oak texture is lighter, but its shapes
and overlaps are unchanged. The existing beer grouping remains fitted about
10 percent lengthwise without reducing foliage height.

The reduced version has approximately **1,952 inches (163 feet)** of engraving
lines, versus about 2,346 inches in v3. The 25 percent reduction refers to cut
path count, not total line length or a guaranteed amount of cutting time.
This is an ambitious hand-guided tracing job, not one automatically executed
continuous toolpath. Disconnected shading marks add substantial selection,
plunge/retract and travel work. Splitting files does not reduce that workload.

Compare gallery tabs **5. Layered v3 (before)** and **6. Reduced detail v4**.
They retain the same illustrative line weights and share the selected zoom.
The saved v3 proof is for visual comparison only, not a cutting import.

The v2 release remains the old wine-first arrangement; v3 is the denser
whiskey-first arrangement. Use files from **one version only**. Never combine
v3 and v4 cuts, which would duplicate retained paths, or mix their shading
batches expecting the reduced appearance.

## Which files to transfer

The [v3 release](https://github.com/taylorchasewhite/woodworking/releases/tag/bar-top-order-v3)
contains the **older, denser** transfer ZIP, not the current v4 review. Use the
matching v4 files below when testing this simplification.

- **Complete design with placement references:**
  [master-botanicals-with-guides.svg](master-botanicals/master-botanicals-with-guides.svg).
- **Smaller working files:** the ten SVGs in
  [origin-batches](master-botanicals/origin-batches/), described below.
- **Without registration references:**
  [master-botanicals-paths.svg](master-botanicals/master-botanicals-paths.svg).
  Its empty artboard margins alone are not a dependable placement reference.
- **Never use as a cut file:** the annotated, photo-textured
  [measured proof](master-botanicals/measured-oak-garland-proof.svg).

Download the actual SVG file, not GitHub's HTML file-view page. A downloaded ZIP
must be extracted first. Do not upload this repository's annotated proofs to your
Origin file library along with the cutting files.

### USB route (simplest)

1. Copy the corrected SVG(s) onto a FAT32 USB drive.
2. Connect the drive to Origin.
3. In Design Mode, select **Import > USB** and choose the SVG.
4. Place it in your scanned workspace as described below.

See Shaper's [USB download instructions](https://support.shapertools.com/hc/en-us/articles/4407905514651-Download-a-ShaperHub-project-Origin-owners)
and [import/placement instructions](https://support.shapertools.com/hc/en-us/articles/360000282573-Placing-a-Design-in-a-Scanned-Workspace).
Do not reformat a drive containing files you need.

### Shaper account route

Upload the corrected SVGs to **My Files** in your Shaper account; connect Origin
to Wi-Fi and log into the same account. On-tool use **Import > My Files**.
For a ShaperHub project, **Sync to My Files** transfers its SVGs into your account.
GitHub does not synchronize directly to Origin.

See [Transferring Designs from ShaperHub to your Origin](https://support.shapertools.com/hc/en-us/articles/1260803562470-Transferring-Designs-from-ShaperHub-to-your-Origin).

## Placement on this top

Confirmed boards:

| Part | Outside / long-point dimension |
| --- | --- |
| Short arm | 23 3/8 in |
| Bend | 20 in |
| Long arm | 49 1/4 in |
| All board widths | 8 1/2 in |
| Assembled overall extent | 64 1/8 x 20 in |

Every guide-equipped file and every batch has the **same complete blue board
outline and miter guides**, inch units, `64.125in x 20in` dimensions, and identical
global coordinates. The SVG origin is the top-left of the overall drawing's
bounding rectangle, not necessarily an accessible physical corner of the wood.

1. Secure the assembled top on a stable bench with all engraving surfaces flush.
   Use coplanar auxiliary support boards where needed to keep the tool base fully
   supported, especially along the narrow exposed edge and around the turns.
2. Arrange sufficient ShaperTape on stationary, coplanar surfaces outside the
   cutting route. Shaper recommends strips at least 18 inches long and no more
   than four inches apart. Scan the full intended workspace.
3. Establish a repeatable grid/reference from accessible physical board edges.
   Use Anchor/Position as available on your tool. Do not use a random freehand
   placement independently for each batch.
4. Confirm the **blue outline's** displayed overall dimensions are
   **64.125 x 20 inches**, with correct rotation and proportional scale. Do not
   resize a botanical batch to the dimensions of its visible foliage.
5. Match the guides against multiple actual edges and both miters. Check both
   distant ends, not only one corner. Match the exposed/front side to the proof.
6. For each batch use the **same workspace, grid, anchor, position and rotation**.
   The guides are references only; they must not be assigned a cutting operation.
   Avoid leaving multiple copies of the same cutting batch placed together.
7. Travel the whole intended cut route with the spindle off before starting.
   Confirm tracking coverage, stable support and clearance from clamps.

See [workspace setup recommendations](https://support.shapertools.com/hc/en-us/articles/115002790173-Dos-Don-ts-of-Workspace-Setups).

The v4 geometry test sampled 274,681 points along the actual exported curves;
none were outside the measured wood, with about **1.04 inches minimum centerline
edge clearance**. A separate coordinate-based test confirms the plant order and
the presence of both neighboring plant families at each new transition.
This does not certify real placement, cutter footprint or finished-top accuracy.

## Complexity and working batches

The complete cut export remains a multi-megabyte SVG before external compression.
I could not verify a current official maximum SVG byte size or hard path/node
limit; do not treat that size as certified compatible. Test import and selection
responsiveness on your actual Origin before starting the bar top.

Each botanical region has a `linework` file (outlines/veins) and a `shading` file
(hatching/fine needles). These are partitions of the **exact same paths**, not
simplified or rescaled artwork. Some support-branch fragments span section
boundaries; batches are workflow groupings, not hard botanical boundaries.
Each batch is assigned by its botanical family, even where foliage interleaves.

- [Whiskey linework](master-botanicals/origin-batches/whiskey-linework.svg) /
  [whiskey shading](master-botanicals/origin-batches/whiskey-shading.svg)
- [Gin linework](master-botanicals/origin-batches/gin-linework.svg) /
  [gin shading](master-botanicals/origin-batches/gin-shading.svg)
- [Beer linework](master-botanicals/origin-batches/beer-linework.svg) /
  [beer shading](master-botanicals/origin-batches/beer-shading.svg)
- [Wine linework](master-botanicals/origin-batches/wine-linework.svg) /
  [wine shading](master-botanicals/origin-batches/wine-shading.svg)
- [Oak linework](master-botanicals/origin-batches/oak-linework.svg) /
  [oak shading](master-botanicals/origin-batches/oak-shading.svg)

[manifest.json](master-botanicals/origin-batches/manifest.json) records exact
counts and sizes. The tests verify every complete-design path appears once,
unchanged, across these ten files. Try linework first on scrap. If shading proves
unmanageable, make a new version with deliberately reduced shading; do not silently
skip it and expect the full illustrated appearance.

Shaper's [SVG guidance](https://support.shapertools.com/hc/en-us/articles/115002735274-SVG-Files-Basics)
supports real-world units and RGB color coding. Our cutting files contain explicit
paths with no raster textures, live clipping, masks or transforms.

## Stock engraving bit and the essential oak scrap test

The tool was reported as model S02. Its electrical label does not identify the
installed software version. No
generation-specific SVG change was identified; verify normal software updates
through your tool's settings.

If using Shaper's stock **SE1-2500-V60E**, it is a **60-degree V-bit with a
1/4-inch shank**, not a constant-width engraving cutter. Confirm the actual bit
before choosing depth. Official references:

- [60-degree engraving bit specifications](https://www.shapertools.com/en-us/store/product/1-4-in-60-deg-engraving-router-bit)
- [Guide to stock bits](https://support.shapertools.com/hc/en-us/articles/115002985634-Guide-to-Stock-Bits)

For an ideal sharp 60-degree V-tip, the estimated groove width is
`2 x depth x tan(30 degrees)`, approximately **1.155 x depth**:

| Illustrative depth | Ideal groove width |
| --- | --- |
| 0.005 in | 0.0058 in |
| 0.010 in | 0.0115 in |
| 0.020 in | 0.0231 in |

These are geometric examples, **not selected cutting settings**. Tip flatness,
runout, wood grain and the actual surface level affect the result. Deep cuts can
merge neighboring hatch marks, and this artwork intentionally has intersections
and converging lines. There is no claimed global minimum line spacing.

The illustrative proof uses widths of 0.012 in (outlines), 0.010 in (veins) and
0.0075 in (fine shading). The exports do not prescribe corresponding depths.
Batching separates fine shading, but outlines and veins still share the linework
batch; precise multi-depth treatment would need another version after testing.

Before the bar:

1. Use flat oak scrap prepared like the finished top. Install and Z-touch the
   actual bit according to Origin's instructions.
2. Test a leaf's contours and converging hatches, acorn cap, corn kernels and
   juniper needles at actual scale, not just a large isolated outline.
3. Begin shallow and compare incremental depths on separate trial marks.
   Shaper's stock-bit guide suggests spindle setting **3** as a starting point
   for this V-bit in wood; adjust to the actual cut quality and material.
4. Inspect tear-out, grain-following, line merging, tool responsiveness and the
   time spent selecting and tracing disconnected lines. Retract while stationary.
5. Check the intended finish on a sample too; sanding/finish can diminish very
   shallow details. Record the chosen bit, depths and results in a new commit.

The user has performed an initial physical test of v3; v4 responds to its
wider-groove feedback but has not yet been physically tested. The actual groove
width in inches, bit and depth remain unspecified. This simplification is **not
a cutter-clearance guarantee**: intersections and converging lines remain, and
there is no new minimum-spacing claim. Repeat the actual-size scrap test before
committing to the bar top.

## Version history

- `bar-top-art-baseline-v1`: original visual design and exports, **wrong cut colors**.
- `bar-top-origin-encoding-v2`: corrected colors, unchanged art geometry,
  portable sources, validation and exact-geometry working batches.
- `bar-top-order-v3`: Whiskey > Gin > Beer > Wine > Oak, with the original oak
  geometry, refreshed transitions/crops and regenerated Origin batches.
- `bar-top-detail-v4`: review revision with 25 percent fewer paths, removed only
  from fine texture, and an unchanged v3 proof for before/after comparison.

Future shape, spacing, depth or workload changes should be committed with their
matching exports and measurements. Keep the current version recoverable.
