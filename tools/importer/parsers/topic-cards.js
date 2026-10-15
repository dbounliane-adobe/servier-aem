/* eslint-disable */
/* global WebImporter */
/**
 * Parser for topic-cards. Base: topic-cards (custom cards container).
 * Source: https://servier.com/ (template "home"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/topic-cards/source.html and live page):
 *   .wp-block-banner-img-cta-multiple-v2 .items      <- element
 *     > a.item[href][title]                           (one per card, wraps block content)
 *         > span (decorative accent bar)
 *         > div > h3, p                               <- stable inner wrapper, used as iteration key
 *         > span (CTA label "Découvrir" + inline SVG arrow)
 * Iteration is keyed on the inner div (h3 parent), not the anchors: sibling inline wrappers can be
 * merged by html2md preprocessing. The href is read back off the closest anchor.
 *
 * Container block, one row per card, 2 cells (UE model topic-card):
 *   [ image (+imageAlt) ] [ content_heading, content_description, content_link (+linkText) ]
 */
function resolveSrc(img) {
  const candidates = [img.getAttribute('data-lazy-src'), img.getAttribute('data-src'), img.getAttribute('src')];
  return candidates.find((s) => s && !s.startsWith('data:')) || '';
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  // Primary: inner block wrappers holding the card heading.
  let items = [...element.querySelectorAll('h3, h2, h4')]
    .map((h) => h.parentElement)
    .filter((body, i, arr) => body && arr.indexOf(body) === i)
    .map((body) => ({ body, card: body.closest('a.item, a[href], .item') || body }));
  if (!items.length) {
    // Fallback: card wrappers directly.
    items = [...element.querySelectorAll(':scope > .item, :scope > a')]
      .map((card) => ({ body: card.querySelector(':scope > div') || card, card }));
  }

  const cells = [];
  items.forEach(({ body, card }) => {
    // Image (optional; none on the home page cards).
    const imageCell = [];
    const srcImg = [...card.querySelectorAll('img')].find((img) => resolveSrc(img));
    if (srcImg) {
      const img = document.createElement('img');
      img.src = resolveSrc(srcImg);
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.push(hint('image'), img);
    }

    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    const descriptions = [...body.querySelectorAll('p')].filter((p) => clean(p.textContent));

    // CTA: href from the card anchor, label from the trailing span (or anchor title).
    const anchor = card.matches('a[href]') ? card : (card.querySelector('a[href]') || body.closest('a[href]'));
    const labelSpan = [...card.querySelectorAll(':scope > span')].find((s) => clean(s.textContent));
    const label = clean(labelSpan && labelSpan.textContent) || clean(anchor && anchor.getAttribute('title'));

    const contentCell = [];
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = clean(heading.textContent);
      contentCell.push(hint('content_heading'), h);
    }
    if (descriptions.length) contentCell.push(hint('content_description'), ...descriptions);
    if (anchor) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = anchor.getAttribute('href');
      a.textContent = label || (heading ? clean(heading.textContent) : anchor.getAttribute('href'));
      p.append(a);
      contentCell.push(hint('content_link'), p);
    }

    if (!imageCell.length && !contentCell.length) return;
    cells.push([imageCell.length ? imageCell : '', contentCell.length ? contentCell : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'topic-cards', cells });
  element.replaceWith(block);
}
