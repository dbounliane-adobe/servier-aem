/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-feed. Base: article-feed (custom, key-value config block).
 * Source: https://servier.com/ (template "home"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/article-feed/source.html and live page):
 *   .wp-block-last-news-v2 > nav.filters-news   (filter chips, preceding sibling - consumed here)
 *   .wp-block-last-news-v2 > ul.news > li.news-item (~50 items, all but 3 carry .hidden)
 *
 * The EDS block renders the list dynamically from the site index, so the parser emits the
 * key-value configuration (UE model blocks/article-feed/_article-feed.json, "key-value": true):
 *   source | prefix | category | limit | all | empty | error  (one row per field, model order)
 * Key-value rows carry no field hints: md2jcr maps rows to fields by position and a hint
 * comment inside the value cell would be stringified into the value.
 */
export default function parse(element, { document }) {
  const root = element.closest('.wp-block-last-news-v2') || element.parentElement;

  // Filter chips nav: preceding sibling of ul.news. Read the "all categories" label, then remove.
  let filters = element.previousElementSibling;
  if (!filters || !filters.matches('nav.filters-news, nav[class*="filter"]')) {
    filters = root ? root.querySelector(':scope > nav.filters-news') : null;
  }
  const allBtn = filters
    ? (filters.querySelector('button.filter-btn.active') || filters.querySelector('button.filter-btn, button'))
    : null;
  const allLabel = allBtn ? allBtn.textContent.replace(/\s+/g, ' ').trim() : '';

  // Visible items = initial page size of the source listing (others carry .hidden).
  const items = [...element.querySelectorAll(':scope > li.news-item, :scope > li:not(.news-item)')];
  const visible = items.filter((li) => !li.classList.contains('hidden'));
  const limit = String(visible.length || items.length || 3);

  // Article path prefix: derive from the first item link (e.g. https://servier.com/newsroom/... -> /newsroom/).
  let prefix = '/newsroom/';
  const firstLink = element.querySelector('li a[href]');
  if (firstLink) {
    try {
      const { pathname } = new URL(firstLink.getAttribute('href'), 'https://servier.com/');
      const seg = pathname.split('/').filter(Boolean)[0];
      if (seg) prefix = `/${seg}/`;
    } catch (e) { /* keep default */ }
  }

  const cells = [
    ['source', '/query-index.json'],
    ['prefix', prefix],
    ['category', ''],
    ['limit', limit],
    ['all', allLabel],
    ['empty', ''],
    ['error', ''],
  ];

  if (filters) filters.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-feed', cells });
  element.replaceWith(block);
}
