# Reference photographs

FretLab's body, pickguard, hardware and headstock outlines are traced from two
photographs of real instruments on Wikimedia Commons:

| File | Instrument | Author | Licence |
| --- | --- | --- | --- |
| `strat.png` | Fender Custom Shop Stratocaster | AvR | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `jazz.jpg` | Fender Jazz Bass, 1966 | Freebird | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5/) |

Sources:
<https://commons.wikimedia.org/wiki/File:Fender_Stratocaster_Relic_FCS_AvR.png> and
<https://commons.wikimedia.org/wiki/File:Fenderjazzbass1966.jpg>.

Both licences permit reuse and adaptation with attribution, which is given here
and in the application's footer. The derived outlines are a transformation of
these photographs and carry the same share-alike obligation where it applies.

## How the tracing works

`trace/` holds the pipeline; `python trace/run.py` reproduces it end to end.

1. **Segment** the instrument from its background — by alpha channel for the
   guitar, by backdrop colour for the bass — and lay the neck horizontal.
2. **Find the frets.** A fret is a bright line spanning the whole neck, which
   distinguishes it from an inlay dot or a patch of grain. The equal-tempered
   fret rule is then fitted to the detected lines, which recovers the nut
   position and the scale length in pixels. Both photographs fit to within
   about one pixel, and the recovered nut widths come out at 1.64" and 1.48"
   against real specifications of 1.650" and 1.500" — so the photographs are
   accurate to about one percent, and the geometry derived from them is sound.
3. **Rectify** into the instrument frame: origin at the nut, +x along the
   strings, scale length exactly 1000 units.
4. **Trace each part.** The body is the silhouette past the horn tips; the
   pickguard is the region enclosed by its own black edge ply; pickups come
   from their pole pieces; knobs from a circle fit.

Only the outlines are used. The neck, frets, inlays and strings in the
photographs are discarded: FretLab computes those from the tuning and from
equal-tempered fret spacing, which is why they stay correct for any tuning and
any number of strings.

Fender, Stratocaster and Jazz Bass are trademarks of Fender Musical Instruments
Corporation. FretLab is an independent learning tool, not affiliated with or
endorsed by Fender.
