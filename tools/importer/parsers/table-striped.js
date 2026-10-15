/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-striped. Base: table (Block Collection "Table (striped)").
 * Source: https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/
 * (template "article"). Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/table-striped/source.html and live page):
 *   .single--content figure.wp-block-table.is-style-stripes          <- element
 *     > table.has-fixed-layout
 *         > thead > tr > th > strong   (header row, 2 columns)
 *         > tbody > tr (x4) > td       (body rows, 2 columns)
 *     > figcaption (optional, not on this page) -> kept as a paragraph after the block
 *
 * UE model (blocks/table-striped/_table-striped.json): container block.
 *   Parent fields: classes (skipped), filter (column-count select; template default
 *   "table-striped-2-columns" -> item component "table-striped-col-2"). No parent row is
 *   emitted: md2jcr detects multi-cell first body rows as child items and falls back to the
 *   definition's filter, which matches this source (2 columns).
 *   Item rows: one row per <tr> (header first), cells hinted column1text..columnNtext
 *   (table-striped-row = 1 col, table-striped-col-2/3/4 = 2/3/4 cols).
 *   Tables wider than 4 columns: extra cells are merged into column 4 (model max).
 */
const MAX_COLS = 4;

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);

  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Header rows first (thead), then body/foot rows; fall back to every row in the table.
  let rows = [
    ...table.querySelectorAll(':scope > thead > tr'),
    ...table.querySelectorAll(':scope > tbody > tr'),
    ...table.querySelectorAll(':scope > tfoot > tr'),
  ];
  if (!rows.length) rows = [...table.querySelectorAll('tr')];

  const sourceRows = rows
    .map((tr) => [...tr.querySelectorAll(':scope > th, :scope > td')])
    .filter((cellsOfRow) => cellsOfRow.some((c) => c.textContent.trim() || c.querySelector('img, a')));

  if (!sourceRows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const colCount = Math.min(
    MAX_COLS,
    Math.max(...sourceRows.map((r) => r.reduce((n, c) => n + (parseInt(c.getAttribute('colspan'), 10) || 1), 0))),
  );

  const cells = sourceRows.map((sourceCells) => {
    // Expand colspans so every row has the same number of cells.
    const expanded = [];
    sourceCells.forEach((c) => {
      expanded.push(c);
      const span = parseInt(c.getAttribute('colspan'), 10) || 1;
      for (let i = 1; i < span; i += 1) expanded.push(null);
    });
    // Merge overflow cells into the last supported column.
    if (expanded.length > colCount) {
      const overflow = expanded.splice(colCount - 1);
      const merged = document.createElement('div');
      overflow.filter(Boolean).forEach((c) => {
        const p = document.createElement('p');
        p.append(...c.childNodes);
        merged.append(p);
      });
      expanded.push(merged);
    }
    while (expanded.length < colCount) expanded.push(null);

    return expanded.map((c, i) => {
      if (!c) return '';
      const content = [...c.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
      if (!content.length) return '';
      return [hint(`column${i + 1}text`), ...content];
    });
  });

  const caption = element.querySelector('figcaption');
  const captionText = caption && caption.textContent.trim();

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-striped', cells });
  if (captionText) {
    const p = document.createElement('p');
    p.append(...caption.childNodes);
    element.replaceWith(block);
    block.after(p);
    return;
  }
  element.replaceWith(block);
}
