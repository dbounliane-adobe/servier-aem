/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-header. Base: article-header (custom, no library convention).
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/article-header/source.html and live page):
 *   .single-wrapper > article.category_folder-decryptages > header.wp-block-group
 *     > a.btn__return  "Retourner aux dossiers"   (left in place as default content)
 *     > h1             article title              <- element
 *     > time.single--date "6 octobre 2026"        (consumed + removed here; no datetime attr live)
 *
 * UE model (blocks/article-header/_article-header.json), 3 rows (grouped fields):
 *   1. content_* -> content_category (text), content_heading (text, headingType=h1 collapsed),
 *                   content_summary (richtext, not present on dossiers)
 *   2. meta_*    -> meta_date (YYYY-MM-DD, first <p> - the block JS turns it into <time>),
 *                   meta_author, meta_reading (not present on dossiers)
 *   3. image (+imageAlt collapsed) -> not present on dossiers (empty row kept)
 *
 * Category: "Décryptages" - read from (in order) the article-metadata transformer stash
 * (data-excat-article-category), the article taxonomy class category_folder-<slug>, or the
 * banner highlight ".title-page h2 strong" (the banner may already be a block table by now).
 */
const FR_MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};
const CATEGORY_LABELS = { decryptages: 'Décryptages' };

const pad = (n) => String(n).padStart(2, '0');
const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function toIsoDate(value) {
  if (!value) return '';
  const text = value.replace(/\s+/g, ' ').trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const fr = stripAccents(text.toLowerCase()).match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
  if (fr && FR_MONTHS[fr[2]]) return `${fr[3]}-${pad(FR_MONTHS[fr[2]])}-${pad(fr[1])}`;
  const num = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (num) return `${num[3]}-${pad(num[2])}-${pad(num[1])}`;
  return '';
}

function readCategory(element, document) {
  const stashed = document.querySelector('[data-excat-article-category]');
  const fromStash = stashed && stashed.getAttribute('data-excat-article-category');
  if (fromStash && fromStash.trim()) return fromStash.trim();

  const article = element.closest('article[class*="category_folder-"]')
    || document.querySelector('article[class*="category_folder-"]');
  const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
  if (m) return CATEGORY_LABELS[m[1]] || capitalize(m[1].replace(/-/g, ' '));

  const strong = document.querySelector('.page-header--classic .title-page h2 strong, .title-page h2 strong');
  const fromBanner = strong && strong.textContent.trim();
  return fromBanner ? capitalize(fromBanner) : '';
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const p = (text) => {
    const el = document.createElement('p');
    el.textContent = text;
    return el;
  };

  // Heading: the element is the <h1>; fall back to an inner heading if the selector widens.
  const sourceHeading = element.matches('h1, h2') ? element : element.querySelector('h1, h2');
  const title = sourceHeading ? sourceHeading.textContent.replace(/\s+/g, ' ').trim() : '';

  // Date: sibling <time class="single--date"> in the same header.
  const scope = element.closest('header') || element.parentElement || document;
  const time = scope.querySelector('time.single--date') || scope.querySelector('time');
  let date = '';
  if (time) {
    date = toIsoDate(time.getAttribute('datetime')) || toIsoDate(time.textContent);
    time.remove();
  }
  if (!date) {
    const stashed = document.querySelector('[data-excat-article-date]');
    date = toIsoDate(stashed && stashed.getAttribute('data-excat-article-date'));
  }

  const category = readCategory(element, document);

  if (!title && !date) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Row 1: content group (category, heading).
  const contentCell = [];
  if (category) contentCell.push(hint('content_category'), p(category));
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    contentCell.push(hint('content_heading'), h1);
  }

  // Row 2: meta group (date first - the block JS converts the first <p> to <time>).
  const metaCell = [];
  if (date) metaCell.push(hint('meta_date'), p(date));

  const cells = [
    [contentCell.length ? contentCell : ''],
    [metaCell.length ? metaCell : ''],
    [''], // image row (image + imageAlt): no cover image on dossier pages
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-header', cells });
  element.replaceWith(block);
}
