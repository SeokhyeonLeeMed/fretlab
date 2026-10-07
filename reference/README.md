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
`src/components/fretboard/artwork.ts` from these files. It does three things.

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

**It corrects the headstock logo.** The drawings are laid out with the bass side
downwards, which is how FretLab reads a fretboard but leaves the logo upside
down; the logo glyphs alone are turned back the right way up.

## What FretLab draws itself

Only the instrument is artwork. The strings, the note markers, the fret numbers
and every musical decision are computed from the selected tuning, which is why
they stay correct for any tuning. The drawn frets and inlays are used as they
are, since the frame is fitted to them.

## Levelling

The drawings are a little tilted, each by its own amount (the guitar by 0.63
degrees, the bass by 0.09). `tools/extract-artwork.mjs` fits a line through the
middle of each fretboard and rotates the whole drawing about the nut by that
angle, so the neck is horizontal in the application. The files here are left
exactly as supplied; the rotation is applied when `artwork.ts` is generated.
