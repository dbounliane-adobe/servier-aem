/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-page-banner. Base: hero.
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"; the same banner is used on the dossiers listing). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/hero-page-banner/source.html and live page):
 *   #main > .page-header--classic                       <- element
 *     > picture.image
 *         > source[media="(min-width: 768px)"][srcset]  full-size banner (bandeau_visuel-15.png)
 *         > source[media="(min-width: 350px)"][srcset]  768px rendition
 *         > img[data-lazy-src]                          300px rendition (src is an SVG placeholder live)
 *     > .page-header-wrap
 *         > .title-page > h2 ("Retrouvez nos <strong>décryptages</strong>"), .block-border (decorative)
 *         > .breadcrumbs  (removed by article-cleanup.js; rebuilt by the block JS) - ignored here too
 *
 * UE model (blocks/hero-page-banner/_hero-page-banner.json), 2 rows:
 *   1. image (+imageAlt collapsed) -> banner photo
 *   2. text (richtext)             -> title card heading (+ any non-breadcrumb paragraph)
 */
function isRealSrc(s) {
  return !!s && !s.trim().startsWith('data:');
}

function firstSrcsetUrl(srcset) {
  if (!srcset) return '';
  // Pick the widest candidate when descriptors exist, else the first URL.
  const candidates = srcset.split(',').map((c) => c.trim()).filter(Boolean).map((c) => {
    const [url, desc] = c.split(/\s+/);
    const w = desc && /\d+w$/.test(desc) ? parseInt(desc, 10) : 0;
    return { url, w };
  });
  candidates.sort((a, b) => b.w - a.w);
  return candidates.length ? candidates[0].url : '';
}

function resolveBannerSrc(picture, img) {
  if (picture) {
    const sources = [...picture.querySelectorAll('source')];
    // Largest breakpoint first (min-width: 768px), then any other source.
    const wide = sources.find((s) => /min-width:\s*768px/.test(s.getAttribute('media') || ''));
    const ordered = wide ? [wide, ...sources.filter((s) => s !== wide)] : sources;
    for (const s of ordered) {
      const url = firstSrcsetUrl(s.getAttribute('srcset') || s.getAttribute('data-lazy-srcset') || s.getAttribute('data-srcset'));
      if (isRealSrc(url)) return url;
    }
  }
  if (img) {
    const candidates = [img.getAttribute('data-lazy-src'), img.getAttribute('data-src'), img.getAttribute('src')];
    const found = candidates.find(isRealSrc);
    if (found) return found;
  }
  return '';
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  // Row 1: banner image.
  const picture = element.querySelector(':scope > picture, picture.image, picture');
  const srcImg = (picture && picture.querySelector('img')) || element.querySelector('img');
  const bannerSrc = resolveBannerSrc(picture, srcImg);
  const imageCell = [];
  if (bannerSrc) {
    const img = document.createElement('img');
    img.src = bannerSrc;
    img.alt = (srcImg && srcImg.getAttribute('alt')) || '';
    imageCell.push(hint('image'), img);
  }

  // Row 2: title card heading (breadcrumbs are never authored content).
  const titleWrap = element.querySelector('.title-page') || element.querySelector('.page-header-wrap') || element;
  const heading = titleWrap.querySelector('h1, h2, h3');
  const paragraphs = [...titleWrap.querySelectorAll('p')]
    .filter((p) => p.textContent.trim() && !p.closest('.breadcrumbs'));
  const textParts = [];
  if (heading) textParts.push(heading);
  textParts.push(...paragraphs);

  if (!imageCell.length && !textParts.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [imageCell.length ? imageCell : ''],
    [textParts.length ? [hint('text'), ...textParts] : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-page-banner', cells });
  element.replaceWith(block);
}
