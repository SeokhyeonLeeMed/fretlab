# Reference drawings

The instrument graphics are built from layered SVG drawings supplied with this
project, one folder per instrument:

| Folder | Instrument | Strings |
| --- | --- | --- |
| `Stratocaster/` | Stratocaster-style electric guitar | 6 |
| `Precision Bass/` | Precision-Bass-style electric bass | 4 |

Each folder holds the whole instrument (`Full Guitar.svg`) plus one file per
part — body, pickguard, bridge, head, neck, frets, tuning machine and so on.

## How they become artwork

`node tools/extract-artwork.mjs` regenerates
`src/components/fretboard/artwork.ts` from these files. It does two things.

**It puts the parts back in one coordinate system.** Each part file is cropped
to its own bounds, so its position within the whole drawing is lost. A shape's
*size* does not change when it is moved, so every part shape is matched to the
whole drawing's shape of the same size and the difference in position gives the
offset. Taking the commonest answer across all of a part's shapes makes this
immune to a coincidental match.

**It finds the instrument frame.** The drawing's own fret lines are measured
and the equal-tempered fret rule is fitted to them, which recovers the nut
position and the scale length in drawing units. Both drawings fit to better
than one part in a thousand of the scale length. Everything is then
re-expressed with the nut at the origin and the scale length exactly 1000
units, so FretLab's computed fret positions land on the drawn frets.

Every shape is used exactly as drawn. That includes the headstock logo, which
is upside down in the drawings on purpose and is left that way.

## What FretLab draws itself

Only the instrument is artwork. The strings, the note markers, the fret numbers
and every musical decision are computed from the selected tuning, which is why
they stay correct for any tuning. The drawn frets and inlays are used as they
are, since the frame is fitted to them.

## Levelling

The drawings as supplied were a little tilted, each by its own amount: the
guitar by 0.634 degrees and the bass by 0.089. `node tools/level-reference.mjs`
turned every file in each folder -- the whole instrument and each part -- by
that instrument's angle, so the files here are level. Nothing inside a drawing
was rewritten: its contents are wrapped in one `<g transform="rotate(...)">`,
marked `data-levelled`, and the viewBox widened just enough to hold the turned
artwork. Removing that group and restoring the old viewBox gives back the file
as supplied.

`tools/extract-artwork.mjs` still measures the neck's axis and corrects any
tilt that remains, so a new drawing added later is levelled the same way. On
these files it now measures less than a thousandth of a degree.
