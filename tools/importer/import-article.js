/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPageBannerParser from './parsers/hero-page-banner.js';
import articleHeaderParser from './parsers/article-header.js';
import calloutDidYouKnowParser from './parsers/callout-did-you-know.js';
import keyFiguresParser from './parsers/key-figures.js';
import tableStripedParser from './parsers/table-striped.js';
import heroCoverParser from './parsers/hero-cover.js';
import shareSocialParser from './parsers/share-social.js';

// TRANSFORMER IMPORTS (servier-* are shared with import-home.js and must stay generic)
import servierCleanupTransformer from './transformers/servier-cleanup.js';
import articleCleanupTransformer from './transformers/article-cleanup.js';
import servierSectionsTransformer from './transformers/servier-sections.js';
import articleMetadataTransformer from './transformers/article-metadata.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "article",
  "description": "Newsroom dossier article: return link, H1, date, long-form editorial body (coloured callouts, did-you-know, figure, table, cover banner, sources), share links",
  "urls": [
    "https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/"
  ],
  "blocks": [
    {
      "name": "hero-page-banner",
      "instances": [
        "#main > .page-header--classic"
      ]
    },
    {
      "name": "article-header",
      "instances": [
        ".single-wrapper > article > header.wp-block-group > h1"
      ]
    },
    {
      "name": "callout-did-you-know",
      "instances": [
        ".single--content .wp-block-did-you-know"
      ]
    },
    {
      "name": "key-figures",
      "instances": [
        ".single--content .wp-block-columns:has(> .wp-block-column > .wp-block-numbers):not(:has(> .wp-block-column > :not(.wp-block-numbers)))"
      ]
    },
    {
      "name": "table-striped",
      "instances": [
        ".single--content figure.wp-block-table"
      ]
    },
    {
      "name": "hero-cover",
      "instances": [
        ".single--content > .wp-block-cover"
      ]
    },
    {
      "name": "share-social",
      "instances": [
        ".single-wrapper > article > footer.wp-block-group"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "page-banner",
      "selector": [
        "#main > .page-header--classic"
      ],
      "style": null,
      "blocks": [
        "hero-page-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "article-header",
      "selector": [
        ".single-wrapper > article > header.wp-block-group"
      ],
      "style": null,
      "blocks": [
        "article-header"
      ],
      "defaultContent": [
        ".single-wrapper > article > header.wp-block-group > a.btn__return"
      ]
    },
    {
      "id": "3",
      "name": "lead-and-first-chapter",
      "selector": [
        ".single--content > .wp-block-group:first-child"
      ],
      "style": null,
      "blocks": [
        "callout-did-you-know"
      ],
      "defaultContent": [
        ".single--content > .wp-block-group:first-child > p",
        ".single--content > .wp-block-group:first-child > h2"
      ]
    },
    {
      "id": "4",
      "name": "key-facts-box",
      "selector": [
        ".single--content > .wp-block-group.has-indigo-50-background-color"
      ],
      "style": "soft",
      "blocks": [],
      "defaultContent": [
        ".single--content > .wp-block-group.has-indigo-50-background-color > h2",
        ".single--content > .wp-block-group.has-indigo-50-background-color > p"
      ]
    },
    {
      "id": "5",
      "name": "chapters-with-infographic",
      "selector": [
        ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image) > h2",
        ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image) > p",
        ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image) > figure.wp-block-image"
      ]
    },
    {
      "id": "6",
      "name": "focus-box",
      "selector": [
        ".single--content > .wp-block-group.has-red-100-background-color"
      ],
      "style": "accent",
      "blocks": [],
      "defaultContent": [
        ".single--content > .wp-block-group.has-red-100-background-color > h2",
        ".single--content > .wp-block-group.has-red-100-background-color > p"
      ]
    },
    {
      "id": "7",
      "name": "chapter-after-focus",
      "selector": [
        ".single--content > .wp-block-group.has-red-100-background-color + .wp-block-group"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".single--content > .wp-block-group.has-red-100-background-color + .wp-block-group > p",
        ".single--content > .wp-block-group.has-red-100-background-color + .wp-block-group > h2"
      ]
    },
    {
      "id": "8",
      "name": "key-figures-box",
      "selector": [
        ".single--content > .wp-block-group.has-indigo-900-background-color"
      ],
      "style": "dark",
      "blocks": [
        "key-figures"
      ],
      "defaultContent": [
        ".single--content > .wp-block-group.has-indigo-900-background-color > h2"
      ]
    },
    {
      "id": "9",
      "name": "table-chapter",
      "selector": [
        ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-table)"
      ],
      "style": null,
      "blocks": [
        "table-striped"
      ],
      "defaultContent": [
        ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-table) > p"
      ]
    },
    {
      "id": "10",
      "name": "cover",
      "selector": [
        ".single--content > .wp-block-cover"
      ],
      "style": null,
      "blocks": [
        "hero-cover"
      ],
      "defaultContent": []
    },
    {
      "id": "11",
      "name": "references",
      "selector": [
        ".single--content > .article-references",
        ".single--content > .wp-block-group:has(> hr.wp-block-separator)"
      ],
      "style": "references",
      "blocks": [],
      "defaultContent": [
        ".single--content > .wp-block-group:has(> hr.wp-block-separator) > p"
      ]
    },
    {
      "id": "12",
      "name": "share",
      "selector": [
        ".single-wrapper > article > footer.wp-block-group"
      ],
      "style": null,
      "blocks": [
        "share-social"
      ],
      "defaultContent": []
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'hero-page-banner': heroPageBannerParser,
  'article-header': articleHeaderParser,
  'callout-did-you-know': calloutDidYouKnowParser,
  'key-figures': keyFiguresParser,
  'table-striped': tableStripedParser,
  'hero-cover': heroCoverParser,
  'share-social': shareSocialParser,
};

// TRANSFORMER REGISTRY - cleanup, article cleanup, section breaks/metadata, page metadata
const transformers = [
  servierCleanupTransformer,
  articleCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [servierSectionsTransformer] : []),
  articleMetadataTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  /**
   * Runs before the importer's own image preprocessing, which drops <img> elements
   * whose src is a data: placeholder. WP Rocket lazyload keeps the real URL in
   * data-lazy-src / data-lazy-srcset, so promote it to src before that happens.
   */
  preprocess: ({ document }) => {
    document.querySelectorAll('img[data-lazy-src]').forEach((img) => {
      img.setAttribute('src', img.getAttribute('data-lazy-src'));
      const srcset = img.getAttribute('data-lazy-srcset');
      if (srcset) img.setAttribute('srcset', srcset);
    });
    // the importer removes every <hr> before transform: mark the references group
    // (identified by its separator) so the sections transformer can still find it
    document.querySelectorAll('.single--content > .wp-block-group').forEach((group) => {
      if (group.querySelector(':scope > hr.wp-block-separator')) group.classList.add('article-references');
    });
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup, section metadata, page metadata (article-metadata.js)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (e.g. /newsroom/dossiers/<slug>)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
