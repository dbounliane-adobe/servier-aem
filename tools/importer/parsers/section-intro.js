/* eslint-disable */
/* global WebImporter */
/**
 * Parser for section-intro. Base: section-intro (custom eyebrow + heading + description block).
 * Source: https://servier.com/ (template "home"). Generated: 2026-10-15.
 *
 * Three source shapes (validated in migration-work/block-context/section-intro/source.html,
 * instances/01.html, instances/02.html and the live page):
 *   1. .wp-block-last-news-v2 > h2                      <- element is the heading;
 *        eyebrow is the NEXT sibling span.is-style-surtitle-2 ("Newsroom") - consumed/removed here
 *   2. .wp-block-banner-img-cta-multiple-v2 .wp-block-group > .prose
 *        > h2, p.is-style-surtitle-2 (eyebrow), p (description)
 *   3. .wp-block-slider-v2 > span.is-style-surtitle-2   <- eyebrow only ("Côté patients")
 *
 * Section 5 (.wp-block-banner-img-cta-multiple-v2) carries its background image in data-bg
 * (live page, rocket-lazyload) / inline style; the section model has no image field, so when the
 * intro sits in that section the image is emitted as default content right before the block.
 * (cleaned.html already has it as a direct-child <img>, which is left as-is to avoid duplicates.)
 *
 * UE model (blocks/section-intro/_section-intro.json), 1 row ("classes" skipped):
 *   content_eyebrow (p, first - the decorator styles the first <p> before the h2),
 *   content_heading, content_description
 */
const EYEBROW_SEL = '.is-style-surtitle-2, .is-style-surtitle-v2, [class*="surtitle"]';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function bgUrlFromStyle(style) {
  if (!style) return '';
  const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1] : '';
}

function extractSectionBackground(element, document) {
  const section = element.closest('.wp-block-banner-img-cta-multiple-v2, [data-bg]');
  if (!section || section === element || section.hasAttribute('data-excat-bg-done')) return null;
  section.setAttribute('data-excat-bg-done', '');
  const src = section.getAttribute('data-bg') || bgUrlFromStyle(section.getAttribute('style'));
  if (!src) return null; // cleaned.html: direct-child <img> already present as default content
  const hasChildImg = [...section.querySelectorAll(':scope > img, :scope > picture')].length > 0;
  if (hasChildImg) return null;
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  const p = document.createElement('p');
  p.append(img);
  return p;
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  let heading = null;
  let eyebrowEl = null;
  let descriptions = [];
  const consumed = [];

  if (element.matches('h1, h2, h3, h4')) {
    // Shape 1: heading element, eyebrow is an adjacent sibling.
    heading = element;
    const next = element.nextElementSibling;
    const prev = element.previousElementSibling;
    if (next && next.matches(EYEBROW_SEL)) eyebrowEl = next;
    else if (prev && prev.matches(EYEBROW_SEL)) eyebrowEl = prev;
    if (eyebrowEl) consumed.push(eyebrowEl);
  } else if (element.matches(EYEBROW_SEL) && !element.querySelector('h1, h2, h3, h4')) {
    // Shape 3: eyebrow-only span; pick up an adjacent heading if a page has one.
    eyebrowEl = element;
    const next = element.nextElementSibling;
    if (next && next.matches('h1, h2, h3, h4')) {
      heading = next;
      consumed.push(next);
    }
  } else {
    // Shape 2: container with heading, eyebrow paragraph and description paragraphs.
    heading = element.querySelector('h1, h2, h3, h4');
    eyebrowEl = element.querySelector(EYEBROW_SEL);
    descriptions = [...element.querySelectorAll('p')]
      .filter((p) => p !== eyebrowEl && !p.matches(EYEBROW_SEL) && clean(p.textContent));
  }

  if (!heading && !eyebrowEl && !descriptions.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (eyebrowEl && clean(eyebrowEl.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(eyebrowEl.textContent);
    contentCell.push(hint('content_eyebrow'), p);
  }
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = clean(heading.textContent);
    contentCell.push(hint('content_heading'), h);
  }
  if (descriptions.length) contentCell.push(hint('content_description'), ...descriptions);

  const cells = [[contentCell]];

  const bg = extractSectionBackground(element, document);
  consumed.forEach((el) => el.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'section-intro', cells });
  element.replaceWith(block);
  if (bg) block.before(bg);
}
