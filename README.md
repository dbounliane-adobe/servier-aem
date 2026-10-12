# Servier AEM / Edge Delivery Services demo

Author content in AEM Sites with Universal Editor. This repository contains
rendering code and component models only: no Servier articles, images, logos,
videos, or page content are bundled or fetched at runtime from servier.com.

## Environments
- Preview: https://main--servier-aem--dbounliane-adobe.aem.page/
- Live: https://main--servier-aem--dbounliane-adobe.aem.live/

## Components and authoring

| Observed pattern | Component in Universal Editor | Authoring contract |
| --- | --- | --- |
| Homepage introduction | Hero / Full-screen introduction | Poster image, optional background video, rich text with one H1 and links |
| Newsroom or dossier banner | Hero / Editorial banner | Image and authored heading |
| Image-backed engagement panel | Hero / Image call to action | Image, heading, body, and authored button |
| Featured story | Columns / Featured content | Image in one cell; heading, text, and link in the other |
| Latest news | Cards / News grid | Card image, alternative text, and rich text containing heading, date, and links |
| Horizontal content collection | Cards / Horizontal collection | Authored cards; native horizontal scrolling, including keyboard access |
| Informational aside | Editorial callout | Authored heading and body; footnote links remain intact |
| Key figures | Columns / Key figures | Each cell contains a heading (H3) for the value and explanatory text |
| Breadcrumb trail | Breadcrumbs | Accessible label and an ordered list; the last item is the current page |
| Article body and scientific references | Title, Text, Image, Button | Default content; preserve authored reference IDs and links |

Use the page layout **Editorial article** for a 900px reading width. The
**Editorial panel**, **Article width**, and **References** section styles provide
additional layout controls. Set the page **Language** to a BCP 47 language tag
(for example `fr`); an existing HTML language is preserved if metadata is absent.

Create the homepage in Sites using Hero, Columns, Cards, and image-backed Hero
panels. Create a dossier using a banner, Breadcrumbs, an H1 and date in default
content, article sections, callouts, figures, an engagement panel, and references.
The `/nav` and `/footer` fragments remain authored in Sites; their paths can be
overridden through the boilerplate's `nav` and `footer` metadata.

Existing image/text Hero properties and Card content remain supported. The
optional Hero video uses Adobe's field grouping (`image_video` joins the existing
`image` cell). Provide an image as the poster when authoring a video. Videos are
muted, looped, and controllable; autoplay is disabled for reduced-motion users.
No automatic slide rotation, news category filtering, search backend, analytics,
or consent integration is introduced.

## Observation and verification boundary

The public HTML of [the homepage](https://servier.com/) and
[the glioma dossier](https://servier.com/newsroom/dossiers/gliome-tumeur-cerebrale-rare/)
was inspected on 12 October 2026, together with the referenced public stylesheet.
These observations establish the component inventory, image/video placement,
editorial structure, indigo/coral palette, and use of Poppins on the original
site. The demo retains the boilerplate's bundled Roboto rather than copying font
assets. The article green and spacing are demo design choices, not measured
pixel equivalence.

Rendered source indicates WordPress on the current public site; it does not
establish access to Servier's CMS, original source, or internal APIs. No REA
runtime capture or pixel-comparison evidence was available. Local browser
fixtures test decoration and responsive layout, not AEM publication, actual DAM
video playback, or Universal Editor round-trip behavior.

After deploying code, publish authored test pages in Sites and verify the
grouped video field, component insertion, in-context editing, navigation,
reference anchors, mobile rendering, and performance on the actual preview.

## Documentation

Before using the aem-boilerplate, we recommend you to go through the documentation on [www.aem.live](https://www.aem.live/docs/), more specifically:
1. [AEM Authoring](https://www.aem.live/docs/aem-authoring)
2. [Universal Editor Tutorial](https://www.aem.live/developer/ue-tutorial)
3. [Component Model Definitions](https://www.aem.live/developer/component-model-definitions)
4. [Authoring Path Mapping](https://www.aem.live/developer/authoring-path-mapping)

## Prerequisites

- nodejs 20 or newer
- AEM Cloud Service release 2026.4 or newer

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

Regenerate the Universal Editor catalogs after changing partial models:

```sh
npm run build:json
```

Run local browser checks with an installed Chrome (no browser is downloaded):

```sh
CHROME_BIN="/path/to/chrome" npm run test:blocks
```
