/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-list. Base: article-list (custom, key-value config block).
 * Source: https://servier.com/newsroom/dossiers/ (template "dossiers-listing"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/article-list/source.html):
 *   #main > .container.mx-auto
 *     div.filters > form
 *       label "Filtrer"
 *       div.dropdown (input#filters-dropdown-categories) > label "Sous-catégorie"
 *       div.select-wrap > select > option:first-child "Année"
 *       div.select-wrap > select > option:first-child "Mois"
 *       div.dropdown (input#filters-dropdown-tags) > label "Étiquettes"
 *       button "Filtrer"  |  button.email-alert-link "Je m'abonne" (opens a WP modal, no URL)
 *     div.wp-block-last-news > div.news > article × N  (cards: NOT authored, rendered from the index)
 *     nav.paginate-links
 *
 * The EDS block renders cards dynamically from the query index, so the parser emits the
 * key-value configuration (UE model blocks/article-list/_article-list.json, "key-value": true),
 * one row per model field in model order. Like article-feed, key-value rows carry no field
 * hints: md2jcr maps rows to properties by key, and a hint comment inside the value cell
 * would be stringified into the value. Empty values let the block's built-in defaults apply.
 */
export default function parse(element, { document }) {
  const clean = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');

  const form = element.querySelector('.filters form, form');

  // Filter bar label: direct <label> child of the form ("Filtrer").
  const filterLabel = form ? clean(form.querySelector(':scope > label')) : '';

  // Dropdowns: identify by their checkbox-toggle input id; fall back to document order.
  const dropdowns = form ? [...form.querySelectorAll(':scope > .dropdown, :scope > div:not(.select-wrap):not(.dropdown) ul')] : [];
  const dropdownLabel = (idPart, index) => {
    if (!form) return '';
    const input = form.querySelector(`input[id*="${idPart}"]`);
    let dd = input ? input.closest('.dropdown') || input.parentElement : null;
    if (!dd) dd = dropdowns[index] || null;
    if (!dd) return '';
    // label directly in the dropdown (not the per-option labels inside ul > li)
    const lbl = [...dd.querySelectorAll('label')].find((l) => !l.closest('li'));
    return clean(lbl);
  };
  const categoryLabel = dropdownLabel('categor', 0);
  const tagsLabel = dropdownLabel('tag', 1);

  // Year / month selects: placeholder is the first option.
  const selects = form ? [...form.querySelectorAll('select')] : [];
  const placeholder = (sel) => clean(sel && sel.querySelector('option'));
  let yearSel = selects.find((s) => /ann|year/i.test(`${s.name} ${s.id} ${placeholder(s)}`));
  let monthSel = selects.find((s) => /mois|month/i.test(`${s.name} ${s.id} ${placeholder(s)}`));
  if (!yearSel) [yearSel] = selects;
  if (!monthSel) [, monthSel] = selects;
  const yearLabel = placeholder(yearSel);
  const monthLabel = placeholder(monthSel);

  // Buttons: submit (not the email alert) and subscribe.
  const buttons = form ? [...form.querySelectorAll('button, input[type="submit"]')] : [];
  const subscribeBtn = element.querySelector('.email-alert-link');
  const submitBtn = buttons.find((b) => !b.classList.contains('email-alert-link'));
  const submitLabel = submitBtn ? (clean(submitBtn) || submitBtn.value || '') : '';
  const subscribeLabel = clean(subscribeBtn);
  // Subscribe only if a real URL exists (source opens a WordPress modal -> leave empty to hide).
  let subscribe = '';
  if (subscribeBtn) {
    const href = subscribeBtn.getAttribute('href') || (subscribeBtn.closest('a[href]') || {}).href || '';
    if (href && !href.startsWith('#') && !href.startsWith('javascript')) subscribe = href;
  }

  // Card "Lire la suite" title attribute -> readMore label.
  const more = element.querySelector('a.btn__more[title], footer a[title]');
  const readMore = more ? more.getAttribute('title').trim() : '';

  const cells = [
    ['source', '/query-index.json'],
    ['prefix', '/newsroom/dossiers/'],
    ['pageSize', '9'],
    ['filters', 'category,tags,year,month'],
    ['filterLabel', filterLabel],
    ['categoryLabel', categoryLabel],
    ['yearLabel', yearLabel],
    ['monthLabel', monthLabel],
    ['tagsLabel', tagsLabel],
    ['submitLabel', submitLabel],
    ['resetLabel', ''],
    ['readMore', readMore],
    ['results', ''],
    ['empty', ''],
    ['noResults', ''],
    ['error', ''],
    ['subscribe', subscribe],
    ['subscribeLabel', subscribeLabel],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}
