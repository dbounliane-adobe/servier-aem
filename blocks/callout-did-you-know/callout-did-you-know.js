/* decorative lightbulb (source icon), coloured via currentColor */
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="43" height="45" viewBox="0 0 43 45" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-width="1.8" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"><path d="M15.764 35.583s-1.129-6.185-2.46-8.312a9.836 9.836 0 0 1-1.63-5.44c0-5.434 4.377-9.839 9.776-9.839 5.4 0 9.776 4.405 9.776 9.838a9.83 9.83 0 0 1-1.63 5.44c-1.33 2.128-2.46 8.313-2.46 8.313H15.764Z"/><path d="M22.653 15.988a7.124 7.124 0 0 1 4.913 6.296M21.5 7.124V1M1 19.672h6.085m28.83 0H42m-9.45-8.581 4.834-3.719M9.951 11.091 5.117 7.372m28.231 20.78 4.835 3.719m-28.83-3.719-4.835 3.719m22.07 7.77H16.313m9.427 4.309h-8.43"/></g></svg>';

/**
 * "Le saviez-vous ?" callout: label card (icon + authored label) beside rich text.
 * Accepts the UE shape (label row, text row) and a single row with two cells.
 * Authored cells are moved, not copied, so Universal Editor instrumentation is kept.
 */
export default function decorate(block) {
  const rows = [...block.children];
  let labelCell;
  let textCells;
  if (rows.length === 1 && rows[0].children.length > 1) {
    [labelCell, ...textCells] = [...rows[0].children];
  } else {
    labelCell = rows[0]?.firstElementChild;
    textCells = rows.slice(1).flatMap((row) => [...row.children]);
  }

  const parts = [];
  if (labelCell?.textContent.trim()) {
    const label = document.createElement('div');
    label.className = 'callout-did-you-know-label';
    const icon = document.createElement('span');
    icon.className = 'callout-did-you-know-icon';
    icon.innerHTML = ICON;
    labelCell.classList.add('callout-did-you-know-title');
    label.append(icon, labelCell);
    parts.push(label);
  } else {
    block.classList.add('callout-did-you-know-no-label');
  }

  const content = textCells.filter((cell) => cell.textContent.trim() || cell.querySelector('img'));
  if (content.length) {
    const body = document.createElement('div');
    body.className = 'callout-did-you-know-text';
    body.append(...content);
    parts.push(body);
  }

  block.replaceChildren(...parts);
}
