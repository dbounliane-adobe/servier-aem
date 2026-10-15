# Header in AEM Sites with Universal Editor: Plan

Goal: the header delivered from AEM Sites (edited in Universal Editor) looks and behaves exactly like the current local preview. Today that preview reads a migrated file, `content/nav.plain.html`. The nav content will move to AEM through an **AEM content package** (your choice), and editors fine-tune it in Universal Editor afterwards.

> This is a plan only. Running it needs Execute mode.

## How it works today and in AEM

| | Local preview (today) | AEM Sites + Universal Editor (target) |
|---|---|---|
| Nav content | `content/nav.plain.html` file | AEM page `/content/servier-aem/nav`, built from sections and Text/Image components |
| Delivered as | `/content/nav.plain.html` | `/nav.plain.html` on aem.page/aem.live (through the `/content/servier-aem/:/` mapping); `/content/servier-aem/nav.plain.html` on the author instance (inside Universal Editor) |
| Styling | header block + Servier theme | same code. The theme only loads when the page has `theme = servier` |

The header code reads the nav as 4 sections, in order:

1. **Logo:** a link with the white logo, plus the dark logo for the sticky white bar.
2. **Menu:** a "Ouvrir le menu" label and the main list. A nested list under an item becomes its dropdown.
3. **Search:** the search link and icon, then the placeholder, submit label and close label.
4. **Utility:** the language list (fr/en), then the Presse / Contactez-nous / Mediator list.

## Problems found that would break the header in AEM

1. **Logo and search icon get lost.** The code expects an image inside a link. Universal Editor can't put a link on an image. The existing AEM export in the repo (`migration-work/jcr-content/nav.xml`) already dropped both logos and kept only an empty button.
2. **Dropdown labels break.** AEM's rich-text editor wraps list text in a paragraph (`<li><p><a>`). The code only finds links placed directly in the list item, so the top-level links would lose their styling and the dropdown toggles would have no label.
3. **The header is empty inside Universal Editor.** On the author instance, the two addresses the code tries don't exist; the nav lives at `/content/servier-aem/nav.plain.html`.
4. **Language detection falls back to the text.** Rich text drops the `hreflang` attribute. The code then reads "fr"/"en" from the link text, which works as long as editors keep those labels.
5. **SVG logos from Assets (DAM) are a risk.** Delivery of SVG images from Assets has to be checked. If they don't render, the fallback is to keep the logos in the code repo's icons folder and reference them by name in the nav.
6. **Site set-up.** Every page using the Servier look needs `theme = servier` and `language = fr` in its page properties. The site's content source must point to AEM author, not DA.

## Approach

- Make `blocks/header/header.js` accept the structure AEM actually produces: logos as standalone images next to a link, list items wrapped in paragraphs, and the extra author-instance address. The current local preview must keep working.
- Regenerate the AEM nav page from the current `content/nav.plain.html`; the older export in the repo is stale and loses content. Upload the 3 header SVGs to Assets.
- Package both, install them, publish, then compare the delivered header with the local one using the same checks as before.

## Checklist

### 1. Make the header code AEM-tolerant
- [ ] Logo section: use the first link's address for the logo link, and take every image in the section (inside or outside the link) as logo 1 (white) and logo 2 (dark).
- [ ] Search section: take the icon from any image in the section, and the address from the first link.
- [ ] Menu: accept top-level links inside a paragraph (`li > p > a`) as well as directly in the item, and unwrap the paragraph so the existing styles still apply.
- [ ] Addresses tried in order:
  1. If the page is under `/content/<site>/` on the author instance: `/content/<site>/nav.plain.html`.
  2. `/content/nav.plain.html` (local preview).
  3. `/nav.plain.html` (aem.page / aem.live).
- [ ] Optionally also support standard icon names in the nav, so the fallback in problem 5 is ready.
- [ ] Re-run the header lint and the header checks (address, breakpoints), plus a quick desktop and mobile check against the local preview, to confirm nothing regressed.

### 2. Build the AEM content package
- [ ] Upload `header-logo-servier.svg`, `header-logo-servier-dark.svg` and `header-icon-search.svg` to `/content/dam/servier-aem/header/`.
- [ ] Generate the `nav` page as AEM content from the current `content/nav.plain.html`, with 4 sections:
  1. Image (white logo) + Image (dark logo) + a link to `/`.
  2. Text component: "Ouvrir le menu" + nested list of 7 items, 5 of them with sub-lists.
  3. Image (search icon) + a link to `https://servier.com/?s=` + 3 paragraphs: "Rechercher…", "Rechercher", "Fermer la recherche".
  4. Text component: fr/en list + list of the 3 utility links.
- [ ] Check the generated nav against the Universal Editor content models.
- [ ] Package the nav page and the header assets (`/content/servier-aem/nav`, `/content/dam/servier-aem/header`). Do not include the homepage.

### 3. Configure the AEM site
- [ ] Check the site's content source is the AEM author delivery URL (`author-p199354-e2062419…/bin/franklin.delivery/dbounliane-adobe/servier-aem/main`), not DA.
- [ ] Check the site config's path mapping includes `/content/servier-aem/:/` and that `/content/servier-aem/` is in the included paths.
- [ ] Install the package with Package Manager on the author instance.
- [ ] In Universal Editor, set the homepage's page properties to `theme = servier` and `language = fr`.

### 4. Publish and verify
- [ ] Publish the nav page, the homepage and the header assets (Universal Editor publish, or Sidekick preview then publish).
- [ ] Open the nav page in Universal Editor: confirm sections, lists and images can be edited.
- [ ] Open the homepage in Universal Editor: confirm the header renders inside the editor, which proves the author-instance address works.
- [ ] Check `https://main--servier-aem--dbounliane-adobe.aem.page/` and its `/nav.plain.html`: 4 sections, logos load (this is the SVG check from problem 5).
- [ ] Run the live header checks (styles, content, dropdowns, mobile menu size) against the aem.page URL. Target the same results as locally.
- [ ] If the logos don't render from Assets: switch to repo icons referenced by name in the nav, then re-check.

### 5. Hand-off notes for editors
- [ ] Short guide: what to edit in the nav page (logo images, menu list, search labels, language and utility lists). Rules:
  - keep the 4 sections in order;
  - a nested list makes a dropdown;
  - keep "fr"/"en" as the language labels.

## Risks and open points
- **SVG from Assets:** may not render through Edge Delivery. The fallback is ready (icons in the code repo).
- **Header check script:** the third nav address may make that check flag the code; the exception and its reason will be written down.
- **Footer:** has the same image and link patterns, so it will need the same treatment once the header is validated. Not included in this plan.
- **Other pages:** each one needs `theme = servier` to get the Servier header look.
