# comex-profile

Custom **comex-profile** block. Purpose: person-profile.

## Authoring (Document Authoring)

Model: `key-value`

Single block table, one key/value row per field: photo, firstname, lastname, position, linkedin (link), biography (rich text). Rendered from COMEX Content Fragments by cf-templates/comex-member.html; parsed by comex-members from the member page .plain.html.

## Supported variations

No variations.

## Universal Editor fields

Key-value model `comex-profile` (title **Servier COMEX Profile**), so the block can also be authored by
hand if ever needed:

| Field | Component | Notes |
| --- | --- | --- |
| `photo` | reference | portrait image |
| `photoAlt` | text | collapses into the image alt; leave empty (the name is shown next to the photo) |
| `firstname` | text | includes the title, e.g. `Dr Claude` |
| `lastname` | text | |
| `position` | text | |
| `linkedin` | aem-content | LinkedIn profile URL, optional |
| `biography` | richtext | first paragraph is shown next to the photo |

## `.plain.html` contract (stable — parsed by `comex-members`)

The block is normally **not authored by hand**: `cf-templates/comex-member.html` renders it for every
COMEX Content Fragment (`/content/dam/<site>/comex/<slug>` → `/groupe/comex/<slug>`). Each row is
`key cell | value cell`; the template always outputs the six rows below, in this order, and an empty
value keeps its row with an empty value cell:

| Key | Value cell |
| --- | --- |
| `photo` | `<picture><img src alt></picture>` (alt empty: the name is adjacent); may be empty |
| `firstname` | text, including the title (`Dr Claude`) |
| `lastname` | text |
| `position` | text |
| `linkedin` | `<a href="https://…">` (or a bare `https://` URL); empty when unknown |
| `biography` | rich text, one `<p>` per paragraph (`<em>`, `<sup>` allowed) |

```html
<div class="comex-profile">
  <div><div>photo</div><div><picture><img src="./media_….png" alt=""></picture></div></div>
  <div><div>firstname</div><div>Olivier</div></div>
  <div><div>lastname</div><div>Laureau</div></div>
  <div><div>position</div><div>Président de Servier et …</div></div>
  <div><div>linkedin</div><div><a href="https://www.linkedin.com/in/olivierlaureau/">…</a></div></div>
  <div><div>biography</div><div><p>…</p><p>…</p></div></div>
</div>
```

Rows are matched by key (case/punctuation-insensitive), so order and missing rows are tolerated and
unknown keys are ignored. Rows with a single cell are read positionally in the order above.
`parseComexProfile(block)` (exported by `comex-profile.js`) is the single reader of this contract;
other blocks import it instead of re-parsing rows. Do not rename keys without updating the template,
this parser and existing pages together. Member pages also carry `firstname`, `lastname`, `position`
and `linkedin` page metadata (`template = comex-member`).

## Rendering

Photo left, H2 "Firstname Lastname" (800) + red bold position + first biography paragraph on the right,
bottom-aligned (two equal columns, 32px gap, from 782px; stacked below with the photo capped at 520px),
remaining paragraphs full width below, then the LinkedIn link: the source's 48x48 coral tile
(`blocks/comex-profile/linkedin.svg`, block-local so the shared `/icons/linkedin.svg` used by
`comex-members` is untouched), `target=_blank`, `rel="noopener noreferrer"`, aria-label
"Logo de LinkedIn – <name>". Typography: H2 28/35px → 35/43.75px from 768px; paragraphs
15/24px → 18/32px from 1024px, 16px bottom margin. The indigo background and vertical padding come
from the section style `soft`, not from the block.
