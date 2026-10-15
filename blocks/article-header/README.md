# article-header

Custom **article-header** block. Purpose: article-title.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1 content (category, heading H1, standfirst); row 2 meta (ISO date rendered as <time>, author, reading time); row 3 media (cover image + alt). On newsroom dossiers only heading + date are filled.

## Rendering

- The category (any paragraph before the heading) is kept in the DOM with class `article-header-category` but hidden, as on servier.com dossiers.
- The ISO date is rendered as `<time class="article-header-date">` in the page locale (`6 octobre 2026`) and displayed uppercase via CSS, as on the source.
- Empty rows get `article-header-empty` and are hidden.
- The H1 (800) and date (700) need Poppins 700/800 font faces in the theme.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
