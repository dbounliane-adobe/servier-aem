import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateCTA } from '../../scripts/block-utils.js';

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    moveInstrumentation(row, item);
    [...row.children].forEach((cell, index) => {
      cell.classList.add(index === 0 ? 'topic-cards-media' : 'topic-cards-content');
      item.append(cell);
    });
    decorateCTA(item.querySelector('.topic-cards-content'));
    const image = item.querySelector('img');
    if (image) image.loading = 'lazy';
    list.append(item);
  });
  block.replaceChildren(list);
}
