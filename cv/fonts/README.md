# CV fonts

The Latin fonts match the embedded font names in the supplied Keiichi Ihara CV:

- `Cochineal-Roman.otf`, `Cochineal-Bold.otf`, `Cochineal-Italic.otf`, `Cochineal-BoldItalic.otf`: body text, dates, and citations. [Cochineal](https://ctan.org/pkg/cochineal), `OFL-Cochineal.txt`.
- `Cabin-Bold.otf`: the name and headings. [Cabin](https://ctan.org/pkg/cabin), `OFL-Cabin.txt`.
- `Inconsolatazi4-Regular.otf`: contact information. [Inconsolata](https://ctan.org/pkg/inconsolata), `OFL-Inconsolata.txt`.

These full OpenType fonts come from the installed TeX Live 2022 distribution,
not from the PDF's embedded subsets. The supplied PDF was also produced with
TeX Live 2022.

`NotoSerifJP.ttf` provides Japanese characters absent from those Latin fonts.
It is from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/notoserifjp),
with `OFL-NotoSerifJP.txt`. The supplied reference does not contain Japanese text.

These fonts are bundled under the SIL Open Font License so that local generation
does not depend on installed fonts or a network connection. Japanese paper titles
and author names retain their original characters. Typst embeds font subsets in
the PDF; the full font files are not downloaded by website visitors.
