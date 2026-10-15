# article-feed

Custom **article-feed** block. Purpose: newsroom-listing.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: configuration cells: source index, path prefix, category, limit, all-categories label, empty/error messages.

To display the site's existing dossiers, set `source` to `/query-index.json`
and `prefix` to `/newsroom/dossiers/`. The prefix accepts plain text or a
same-site link, with or without a trailing slash. Leave `category` empty to
include all categories. Pages must be previewed to appear in the preview index
and published to appear in the live index.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
