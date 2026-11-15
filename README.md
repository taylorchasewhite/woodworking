# Woodworking

Versioned woodworking plans, measurements, reference photos, design sources and
fabrication files.

## Plans

- [Oak bar-top botanical engraving](plans/bar-top-engraving/design-gallery.html):
  measured holiday and US/UK drinking-botanical designs. The current layered
  design follows **Whiskey > Gin > Beer > Wine > Oak**, starting at the short arm.

Download or clone the repository, then open the gallery locally. GitHub's file
viewer does not run the interactive HTML.

The current **v4 review** removes exactly 25% of v3's engraving paths
(12,472 down to 9,354), solely by thinning fine texture. Outlines, needles, main
veins, layered shapes and placement are unchanged. Compare **5. Layered v3
(before)** and **6. Reduced detail v4** in the gallery; the selected zoom follows
between the two. Both previews retain the same illustrative line weights,
not a calibrated cutter-width simulation.

## Origin compatibility

See [import instructions and fabrication cautions](plans/bar-top-engraving/SHAPER-ORIGIN.md).
Current exports encode **gray on-line engraving** and **blue non-cutting guides**.
The `bar-top-art-baseline-v1` tag preserves the pre-correction design with reversed
colors and **must not be used for cutting**. Never import the annotated wood proof.
The [Origin encoding v2 release](https://github.com/taylorchasewhite/woodworking/releases/tag/bar-top-origin-encoding-v2)
preserves the previous **Wine > Beer > Gin > Whiskey > Oak** arrangement.
The [reordered v3 release](https://github.com/taylorchasewhite/woodworking/releases/tag/bar-top-order-v3)
preserves the denser, pre-simplification design. It does **not** contain the v4
review files now generated under `master-botanicals/`. Do not mix v2, v3 and v4
files or recut an earlier test with both versions placed together. Extract any
transfer ZIP before copying SVGs onto a USB drive.

## Rebuilding

Install Node.js 18 or newer; there are no third-party dependencies.

```powershell
npm run build:bar-top
npm test
```

The build regenerates the latest layered SVG design, ten exact-geometry Origin
working batches and the comparison gallery. It does not regenerate the earlier
design variants or PNG screenshots. The other botanical generators are included
for historical designs. `npm run prepare:bar-top-details` creates ignored HTML
pages for rendering detail screenshots; the gallery itself needs no build server.

## Versioning

Keep each woodworking project under `plans/`. Commit the design sources together
with their generated SVGs and updated documentation. Preserve prior commits and
use project-specific Git tags for milestones; do not overwrite a released design
without a new commit. Original source photographs remain untouched outside this
repository; published reference copies omit identifying photo metadata.
