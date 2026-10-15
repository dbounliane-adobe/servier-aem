/*
 * Striped table, based on the Block Collection table
 * https://www.aem.live/developer/block-collection/table
 * First row is the header row unless the "no-header" option is set.
 */
import { moveInstrumentation } from '../../scripts/scripts.js';

const OPTION_CLASSES = ['no-header', 'bordered'];

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const hasHeader = !active.includes('no-header');

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  [...block.children].forEach((row, i) => {
    const isHeader = i === 0 && hasHeader;
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    [...row.children].forEach((cell) => {
      const td = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) td.setAttribute('scope', 'col');
      moveInstrumentation(cell, td);
      td.append(...cell.childNodes);
      tr.append(td);
    });
    if (!tr.children.length) return;
    (isHeader ? thead : tbody).append(tr);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  // horizontal scroll container on narrow screens, focusable for keyboard users
  const scroller = document.createElement('div');
  scroller.className = 'table-striped-scroll';
  scroller.tabIndex = 0;
  scroller.setAttribute('role', 'region');
  const label = [...thead.querySelectorAll('th')].map((th) => th.textContent.trim()).filter(Boolean).join(', ');
  if (label) scroller.setAttribute('aria-label', label);
  scroller.append(table);
  block.replaceChildren(scroller);
}
