# Maison Neue font files

Drop the licensed `.woff2` (preferred) and `.woff` files in this folder. The CSS expects these names:

```
MaisonNeue-Book.woff2          (weight 400)
MaisonNeue-BookItalic.woff2    (weight 400 italic)
MaisonNeue-Medium.woff2        (weight 500)
MaisonNeue-Demi.woff2          (weight 600)
MaisonNeue-Bold.woff2          (weight 700)
MaisonNeueMono-Regular.woff2   (mono, weight 400)
```

`.woff` versions with the same names are loaded as a secondary source for older browsers.

Until the files are dropped here, the site falls back to Helvetica Neue / Arial.

**Do not commit the actual font files** — they are licensed to Rigby & Rigby and should be added at deploy time, not pushed to GitHub.
