/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns. Base: columns (boilerplate xwalk columns block).
 * Source: https://servier.com/groupe/comex/ (template "comex", intro). Generated: 2026-10-16.
 *
 * Source DOM (validated in migration-work/block-context/columns/source.html):
 *   div.wp-block-columns.has-logo
 *     div.wp-block-column (45%)  > p.has-large-font-size
 *     div.wp-block-column (5%)   EMPTY spacer column -> dropped
 *     div.wp-block-column (50%)  > p, p > strong
 *
 * Output: one row, one cell per non-empty column (2 x 1 here). Cells hold default
 * content (paragraphs, strong kept verbatim). Columns blocks take no field hints
 * (hinting rule: Columns blocks do NOT require HTML comments).
 */
export default function parse(element, { document }) {
  let columns = [...element.querySelectorAll(':scope > .wp-block-column')];
  if (!columns.length) columns = [...element.children];

  // A column is empty when it has no text and no media (WP layout spacer columns).
  const hasContent = (col) => col.textContent.trim() !== ''
    || col.querySelector('img, picture, video, iframe, a[href]');

  const row = columns.filter(hasContent).map((col) => {
    // keep the column's children (p, headings, lists, figures, buttons) as default content
    const content = [...col.children].filter((child) => child.textContent.trim() !== ''
      || child.querySelector('img, picture, video, iframe'));
    return content.length ? content : [...col.childNodes];
  });

  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
