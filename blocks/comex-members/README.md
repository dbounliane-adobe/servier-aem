# comex-members

Custom **comex-members** block. Purpose: team-grid.

## Authoring (Document Authoring)

Model: `key-value`

Single block table. Content: key-value config: members (ordered multi reference to COMEX CF pages or CF paths in the DAM comex folder), readMore label, linkedinLabel; card data fetched at runtime from each member page .plain.html comex-profile block.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- Key-value model `comex-members` (title **Servier COMEX Members**):
  - `members` — aem-content, `multi: true`, ordered references; display order = authored order.
  - `readMore` — optional, default "En savoir plus" (EN "Read more").
  - `linkedinLabel` — optional, default "Logo de LinkedIn" (EN "LinkedIn logo").

## Member references

Accepted forms (same origin only; anything else is skipped with a console warning):

- CF page URL `/groupe/comex/<slug>` (also `.html`, `.plain.html`, trailing slash, or the AEM Sites form
  `/content/<site>/groupe/comex/<slug>.html`).
- CF path `/content/dam/<site>/comex/<slug>` → mapped to `/groupe/comex/<slug>`, mirroring the
  `public.json` path mapping `/content/dam/<site>/comex/:/groupe/comex/` (constants `CF_FOLDER` and
  `PAGE_PREFIX` at the top of `comex-members.js`).

## Data loading

- **EDS (aem.page / aem.live / local `aem up`)**: each member page is fetched as
  `/groupe/comex/<slug>.plain.html`, in parallel (locally, when the page itself is served under
  `/content/`, `/content/groupe/comex/<slug>.plain.html` is tried next). Its `comex-profile` block is read
  with `parseComexProfile` (row contract: `blocks/comex-profile/README.md`). Relative photo URLs are
  resolved against the member page.
- **AEM author (`*.adobeaemcloud.*`, Universal Editor)**: the json2html overlay is not rendered on
  author, so the block reads the overlay's own data source, the Assets HTTP API
  `/api/assets/<site>/comex/<slug>.json` (`properties.elements.<field>.value`, same origin, author
  session). `<site>` comes from the CF path, else from the current page path `/content/<site>/…`.
  Assumptions: the author can read the CF folder; photo values are DAM paths served by author;
  "En savoir plus" links keep the public `/groupe/comex/<slug>` path (a CF has no Sites page on
  author, so that link only resolves on EDS).
- A failing member (HTTP error, no `comex-profile` block, no name) is skipped and logged; with no member
  left an empty-state message is shown (`role=status`).

## Rendering

`<ul>` of `<li>` cards: decorative photo (`alt=""`, 520×600 crop), `<h3>` name, small position, then an
small outline button (`a.comex-members-more`, not the global `a.button` pill; accessible name
"En savoir plus – <name>") and a 43px LinkedIn square link pushed to the card's right edge
(`target=_blank`, `rel="noopener noreferrer"`, aria-label "Logo de LinkedIn – <name>"; the coral icon is
the block-local `linkedin.svg`, drawn as a CSS background). 1 column (cards max 520px) below 782px,
3 columns (32px gutter, 28px row gap) from 782px, as on servier.com. No member data is hardcoded.
