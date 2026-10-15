/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroPageBannerParser from './parsers/hero-page-banner.js';
import articleHeaderParser from './parsers/article-header.js';

// TRANSFORMER IMPORTS (servier-* are shared with import-home.js and must stay generic)
import servierCleanupTransformer from './transformers/servier-cleanup.js';
import articleCleanupTransformer from './transformers/article-cleanup.js';
import articleCardStubTransformer from './transformers/article-card-stub.js';
import servierSectionsTransformer from './transformers/servier-sections.js';
import articleMetadataTransformer from './transformers/article-metadata.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "article-card",
  "description": "Minimal (card) version of a newsroom dossier article: banner, header, intro + full card metadata",
  "urls": [],
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
      "blocks": [],
      "defaultContent": [
        ".single--content > .wp-block-group:first-child > p",
        ".single--content > .wp-block-group:first-child > h2"
      ]
    }
  ],
  "pageTemplate": "article"
};

// PARSER REGISTRY
const parsers = {
  'hero-page-banner': heroPageBannerParser,
  'article-header': articleHeaderParser,
};

// TRANSFORMER REGISTRY - cleanup, article cleanup, section breaks/metadata, page metadata
const transformers = [
  servierCleanupTransformer,
  articleCleanupTransformer,
  articleMetadataTransformer, // reads metadata before the stub trims the page
  articleCardStubTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [servierSectionsTransformer] : []),
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
