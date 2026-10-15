/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import campaignHeroParser from './parsers/campaign-hero.js';
import editorialFeatureParser from './parsers/editorial-feature.js';
import sectionIntroParser from './parsers/section-intro.js';
import articleFeedParser from './parsers/article-feed.js';
import embedSocialParser from './parsers/embed-social.js';
import topicCardsParser from './parsers/topic-cards.js';
import carouselStoriesParser from './parsers/carousel-stories.js';
import heroCtaParser from './parsers/hero-cta.js';

// TRANSFORMER IMPORTS
import servierCleanupTransformer from './transformers/servier-cleanup.js';
import servierSectionsTransformer from './transformers/servier-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "Servier homepage: full-screen video hero, featured editorial, latest news feed, social feed, therapeutic areas, patient stories carousel and closing CTA banner",
  "urls": [
    "https://servier.com/"
  ],
  "blocks": [
    {
      "name": "campaign-hero",
      "instances": [
        ".home-header-front-page"
      ]
    },
    {
      "name": "editorial-feature",
      "instances": [
        "#main > article.featured-content"
      ]
    },
    {
      "name": "section-intro",
      "instances": [
        ".wp-block-last-news-v2 > h2",
        ".wp-block-banner-img-cta-multiple-v2 .wp-block-group > .prose",
        ".wp-block-slider-v2 > span"
      ]
    },
    {
      "name": "article-feed",
      "instances": [
        ".wp-block-last-news-v2 > ul.news"
      ]
    },
    {
      "name": "embed-social",
      "instances": [
        "[class*=\"elfsight-app-\"]"
      ]
    },
    {
      "name": "topic-cards",
      "instances": [
        ".wp-block-banner-img-cta-multiple-v2 .items"
      ]
    },
    {
      "name": "carousel-stories",
      "instances": [
        ".wp-block-slider-v2 .slider-wrapper > .slider"
      ]
    },
    {
      "name": "hero-cta",
      "instances": [
        ".wp-block-banner-img-cta-v2"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "hero",
      "selector": [
        ".home-header-front-page"
      ],
      "style": null,
      "blocks": [
        "campaign-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "featured-content",
      "selector": [
        "#main > article.featured-content"
      ],
      "style": null,
      "blocks": [
        "editorial-feature"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "latest-news",
      "selector": [
        ".wp-block-last-news-v2"
      ],
      "style": null,
      "blocks": [
        "section-intro",
        "article-feed"
      ],
      "defaultContent": [
        ".wp-block-last-news-v2 > .mt-8"
      ]
    },
    {
      "id": "4",
      "name": "social-feed",
      "selector": [
        "#main > .wp-block-group.alignwide.is-layout-flow"
      ],
      "style": null,
      "blocks": [
        "embed-social"
      ],
      "defaultContent": [
        "#main > .wp-block-group.alignwide.is-layout-flow > p.is-style-surtitle-2"
      ]
    },
    {
      "id": "5",
      "name": "therapeutic-areas",
      "selector": [
        ".wp-block-banner-img-cta-multiple-v2"
      ],
      "style": "highlight",
      "blocks": [
        "section-intro",
        "topic-cards"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "patient-stories",
      "selector": [
        ".wp-block-slider-v2"
      ],
      "style": null,
      "blocks": [
        "section-intro",
        "carousel-stories"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "join-us-cta",
      "selector": [
        ".wp-block-banner-img-cta-v2"
      ],
      "style": null,
      "blocks": [
        "hero-cta"
      ],
      "defaultContent": []
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'campaign-hero': campaignHeroParser,
  'editorial-feature': editorialFeatureParser,
  'section-intro': sectionIntroParser,
  'article-feed': articleFeedParser,
  'embed-social': embedSocialParser,
  'topic-cards': topicCardsParser,
  'carousel-stories': carouselStoriesParser,
  'hero-cta': heroCtaParser,
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  servierCleanupTransformer,
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

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // Page metadata + Servier theme/language (see models/_page.json, docs/mvp-aem.md)
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    // lowercase keys match the page model field names (theme, language)
    meta.theme = 'servier';
    meta.language = 'fr';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
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
