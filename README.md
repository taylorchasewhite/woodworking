# Woodworking

Versioned woodworking plans, measurements, reference photos, design sources and
fabrication files.

## Plans

- [Oak bar-top botanical engraving](plans/bar-top-engraving/design-gallery.html):
  measured holiday and US/UK drinking-botanical designs. The current layered
  design follows **Whiskey > Gin > Beer > Wine > Oak**, starting at the short arm.

Download or clone the repository, then open the gallery locally. GitHub's file
viewer does not run the interactive HTML.

The current **v6 review** keeps v5's larger, fewer motifs and simplifies juniper
branches, twigs and berry stems to single lines: 121 stem cuts instead of 382.
Two attached grape leaves shorten the longest bare vine stretches from 1.05 to
0.56 inches and 0.77 to 0.32 inches. The foliage band is **5% wider**, from a
nominal 2.96 to 3.108 inches, without lengthwise stretching or changing the wood.
Fine texture remains thinned, with 5,810 total cuts.
Compare **7. Larger motifs v5** and **8. Refined v6** in the gallery; the selected
zoom follows between them. Both use the same illustrative line weights, not a
calibrated cutter-width simulation. V3 and v4 remain in tabs 5 and 6.

## Origin compatibility

See [import instructions and fabrication cautions](plans/bar-top-engraving/SHAPER-ORIGIN.md).
Current exports encode **gray on-line engraving** and **blue non-cutting guides**.
The `bar-top-art-baseline-v1` tag preserves the pre-correction design with reversed
colors and **must not be used for cutting**. Never import the annotated wood proof.
The [Origin encoding v2 release](https://github.com/taylorchasewhite/woodworking/releases/tag/bar-top-origin-encoding-v2)
preserves the previous **Wine > Beer > Gin > Whiskey > Oak** arrangement.
The [reordered v3 release](https://github.com/taylorchasewhite/woodworking/releases/tag/bar-top-order-v3)
preserves the denser, pre-simplification design. It does **not** contain the v6
review files now generated under `master-botanicals/`. Do not mix versions
or recut an earlier test with both versions placed together. Extract any
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
