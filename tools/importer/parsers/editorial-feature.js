/* eslint-disable */
/* global WebImporter */
/**
 * Parser for editorial-feature. Base: editorial-feature (custom image + text promo).
 * Source: https://servier.com/ (template "home"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/editorial-feature/source.html and live page):
 *   article.featured-content
 *     > div > img                                   (image, alt preserved; live: data-lazy-src)
 *     > a[href].group                                (whole text panel is one link)
 *         > div > p (tag "Page")  -> eyebrow
 *         > h2                    -> heading
 *         > span (En savoir plus) -> CTA label
 *
 * UE model (blocks/editorial-feature/_editorial-feature.json), 2 rows ("classes" skipped):
 *   1. image (+imageAlt)
 *   2. content_eyebrow, content_heading, content_description, content_link (+linkText)
 */
function resolveSrc(img) {
  const candidates = [img.getAttribute('data-lazy-src'), img.getAttribute('data-src'), img.getAttribute('src')];
  return candidates.find((s) => s && !s.startsWith('data:')) || '';
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  // Row 1: image (outside the panel link, skip inline SVG arrows).
  const imageCell = [];
  const srcImg = [...element.querySelectorAll('img')].find((img) => !img.closest('a') && resolveSrc(img));
  if (srcImg) {
    const img = document.createElement('img');
    img.src = resolveSrc(srcImg);
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.push(hint('image'), img);
  }

  // Row 2: text panel. The panel itself is the link; read the href off it (not iterated).
  const panel = element.querySelector(':scope > a[href]') || element.querySelector('a[href]') || element;
  const href = panel.matches && panel.matches('a') ? panel.getAttribute('href') : '';
  const heading = panel.querySelector('h1, h2, h3, h4');
  const eyebrowEl = [...panel.querySelectorAll('p')].find((p) => !heading || (p.compareDocumentPosition(heading) & 4));
  const descriptionEls = heading
    ? [...panel.querySelectorAll('p')].filter((p) => heading.compareDocumentPosition(p) & 4)
    : [];
  const ctaLabelEl = [...panel.querySelectorAll('span')].reverse().find((s) => s.textContent.trim());
  const ctaLabel = ctaLabelEl ? ctaLabelEl.textContent.replace(/\s+/g, ' ').trim() : '';

  const contentCell = [];
  if (eyebrowEl && eyebrowEl.textContent.trim()) {
    const eyebrow = document.createElement('p');
    eyebrow.textContent = eyebrowEl.textContent.replace(/\s+/g, ' ').trim();
    contentCell.push(hint('content_eyebrow'), eyebrow);
  }
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    contentCell.push(hint('content_heading'), h);
  }
  if (descriptionEls.length) contentCell.push(hint('content_description'), ...descriptionEls);
  if (href) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = ctaLabel || (heading ? heading.textContent.trim() : href);
    p.append(a);
    contentCell.push(hint('content_link'), p);
  }

  if (!imageCell.length && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [imageCell.length ? imageCell : ''],
    [contentCell.length ? contentCell : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'editorial-feature', cells });
  element.replaceWith(block);
}
