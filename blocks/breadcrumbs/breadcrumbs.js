import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const values = new Map(rows.map((row) => [
    row.firstElementChild?.textContent.trim(),
    row.children[1],
  ]));
  const trail = values.get('trail');
  const list = trail?.querySelector('ol');
  if (!list) return;
  const nav = document.createElement('nav');
  const label = values.get('label')?.textContent.trim();
  if (label) nav.setAttribute('aria-label', label);
  const last = list.lastElementChild;
  if (last) (last.querySelector('a') || last).setAttribute('aria-current', 'page');
  moveInstrumentation(trail, nav);
  nav.append(...trail.childNodes);
  block.replaceChildren(nav);
}
