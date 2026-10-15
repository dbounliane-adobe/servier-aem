# campaign-hero

Custom **hero** block. Purpose: hero-campaign-video.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1 poster image (+alt); row 2 heading (h1), description, link; row 3 MP4 video URL; row 4 (optional) search: link to the search results page + placeholder text.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `search_action` (optional): search results URL. When set, a `<form role="search">` with an `s` query field is rendered under the description (e.g. `https://servier.com/` submits to `https://servier.com/?s=<query>`). Empty = no search field.
- `search_placeholder` (optional): input placeholder; defaults to "Rechercher…" / "Search…" from the page language.
