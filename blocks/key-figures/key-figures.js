import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const list = document.createElement('dl');
  [...block.children].forEach((row) => {
    const [value, label] = row.children;
    if (!value || !label) throw new Error('Each key figure needs a value and a label.');
    const item = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    moveInstrumentation(row, item);
    moveInstrumentation(label, term);
    moveInstrumentation(value, description);
    term.append(...label.childNodes);
    description.append(...value.childNodes);
    item.append(term, description);
    list.append(item);
  });
  block.replaceChildren(list);
}
