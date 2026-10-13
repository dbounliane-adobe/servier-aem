# Shared EDS / AEM Sites template

Reusable Universal Editor blocks and an opt-in Servier-inspired demo theme for
multiple repoless sites.

See the [MVP setup guide](docs/mvp-aem.md) for the Content Fragment Model,
per-site repoless/overlay configuration, editorial workflows and local demo.

## Environments
- Preview: https://main--{site}--{org}.aem.page/
- Live: https://main--{site}--{org}.aem.live/

For the canonical site, `{site}/{org}` correspond to the code repository and
owner. Repoless sites keep their own site names and content sources.

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

## Local MVP

```sh
python3 -m http.server 3000 --bind 127.0.0.1
```

Open `http://localhost:3000/drafts/index.html`. The draft content is fictional
and excluded from EDS code delivery.

```sh
npm run build:json
npm run test:mvp
```

Browser tests require Node.js 22+ and Chrome; set `CHROME_PATH` outside macOS.
