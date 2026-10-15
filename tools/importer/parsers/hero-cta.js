/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-cta. Base: hero. Source: https://servier.com/ (template "home").
 * Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/hero-cta/source.html and live page):
 *   .wp-block-banner-img-cta-v2                 <- element (section-level banner)
 *       background image: live page -> data-bg="https://.../banner-contact-scaled.webp"
 *                         (rocket-lazyload; may also land in style="background-image:url(...)")
 *                         cleaned.html -> first-child <img> materialised by the scraper
 *     > div.absolute (gradient overlay, decorative)
 *     > div.wp-block-group > h2, p, a[href] (pill CTA with decorative inline SVG)
 *
 * UE model (blocks/hero-cta/_hero-cta.json), 2 rows:
 *   1. image (+imageAlt)  -> background image
 *   2. text (richtext)    -> h2, p, CTA link
 */
function bgUrlFromStyle(style) {
  if (!style) return '';
  const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1] : '';
}

function resolveSrc(img) {
  const candidates = [img.getAttribute('data-lazy-src'), img.getAttribute('data-src'), img.getAttribute('src')];
  return candidates.find((s) => s && !s.startsWith('data:')) || '';
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  // Row 1: background image - data-bg, then inline style, then a direct-child <img>.
  let bgSrc = element.getAttribute('data-bg')
    || element.getAttribute('data-background')
    || bgUrlFromStyle(element.getAttribute('style'));
  let bgAlt = '';
  if (!bgSrc) {
    const childImg = [...element.querySelectorAll(':scope > img, :scope > picture img')].find((i) => resolveSrc(i));
    if (childImg) {
      bgSrc = resolveSrc(childImg);
      bgAlt = childImg.getAttribute('alt') || '';
    }
  }
  const imageCell = [];
  if (bgSrc) {
    const img = document.createElement('img');
    img.src = bgSrc;
    img.alt = bgAlt;
    imageCell.push(hint('image'), img);
  }

  // Row 2: heading, text, CTA.
  const group = element.querySelector('.wp-block-group') || element;
  const heading = group.querySelector('h1, h2, h3');
  const paragraphs = [...group.querySelectorAll('p')].filter((p) => p.textContent.trim());
  const ctas = [...group.querySelectorAll('a[href]')].filter((a) => !a.closest('p, h1, h2, h3'));
  const textParts = [];
  if (heading) textParts.push(heading);
  textParts.push(...paragraphs);
  ctas.forEach((a) => {
    a.querySelectorAll('img').forEach((img) => {
      if ((img.getAttribute('src') || '').startsWith('data:')) img.remove();
    });
    a.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    const p = document.createElement('p');
    p.append(a);
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
