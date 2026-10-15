/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-cover. Base: hero.
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/hero-cover/source.html and live page):
 *   .single--content > .wp-block-cover                                   <- element
 *     > img.wp-block-cover__image-background  (live: src = SVG placeholder, real URL in
 *                                              data-lazy-src / data-lazy-srcset; <noscript> copy)
 *     > span.wp-block-cover__background        (overlay, decorative)
 *     > .wp-block-cover__inner-container
 *         > .wp-block-spacer (ignored)
 *         > h2 > strong "Et Servier ?"
 *         > p (x2)
 *         > .wp-block-columns > .wp-block-column (x2) > .wp-block-buttons > .wp-block-button
 *             > a.wp-block-button__link > strong  (the two buttons are exact duplicates:
 *               same href + same text -> only one is kept)
 *
 * UE model (blocks/hero-cover/_hero-cover.json), 2 rows:
 *   1. image (+imageAlt collapsed) -> background image
 *   2. text (richtext)             -> h2, paragraphs, buttons as <p><strong><a></a></strong></p>
 *                                     (block JS renders bold links as buttons)
 */
function isRealSrc(s) {
  return !!s && !s.trim().startsWith('data:');
}

function widestFromSrcset(srcset) {
  if (!srcset) return '';
  const list = srcset.split(',').map((c) => c.trim()).filter(Boolean).map((c) => {
    const [url, desc] = c.split(/\s+/);
    return { url, w: desc && /\d+w$/.test(desc) ? parseInt(desc, 10) : 0 };
  });
  list.sort((a, b) => b.w - a.w);
  return list.length ? list[0].url : '';
}

function resolveSrc(img) {
  const candidates = [
    img.getAttribute('data-lazy-src'),
    img.getAttribute('data-src'),
    widestFromSrcset(img.getAttribute('data-lazy-srcset')),
    img.getAttribute('src'),
    widestFromSrcset(img.getAttribute('srcset')),
  ];
  return candidates.find(isRealSrc) || '';
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // Row 1: background image (outside <noscript>; first real candidate).
  const bgCandidates = [
    ...element.querySelectorAll(':scope > img.wp-block-cover__image-background, :scope > picture img'),
    ...element.querySelectorAll('img.wp-block-cover__image-background'),
  ];
  let bgImg = null;
  let bgSrc = '';
  for (const img of bgCandidates) {
    const src = resolveSrc(img);
    if (src) { bgImg = img; bgSrc = src; break; }
  }
  const imageCell = [];
  if (bgSrc) {
    const img = document.createElement('img');
    img.src = bgSrc;
    img.alt = (bgImg && bgImg.getAttribute('alt')) || '';
    imageCell.push(hint('image'), img);
  }

  // Row 2: inner content.
  const inner = element.querySelector('.wp-block-cover__inner-container') || element;
  const textParts = [];
  const heading = inner.querySelector('h1, h2, h3, h4');
  if (heading) textParts.push(heading);

  [...inner.querySelectorAll('p')]
    .filter((p) => !p.closest('.wp-block-buttons, .wp-block-button') && norm(p.textContent))
    .forEach((p) => textParts.push(p));

  // Buttons: dedupe exact duplicates (same href + same visible text).
  const seen = new Set();
  [...inner.querySelectorAll('a.wp-block-button__link, .wp-block-button a[href]')].forEach((a) => {
    if (!a.getAttribute('href')) return;
    const label = norm(a.textContent);
    const key = `${a.getAttribute('href')}|${label}`;
    if (!label || seen.has(key)) return;
    seen.add(key);
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = label;
    const strong = document.createElement('strong');
    strong.append(link);
    const p = document.createElement('p');
    p.append(strong);
    textParts.push(p);
  });

  if (!imageCell.length && !textParts.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [imageCell.length ? imageCell : ''],
    [textParts.length ? [hint('text'), ...textParts] : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cover', cells });
  element.replaceWith(block);
}
