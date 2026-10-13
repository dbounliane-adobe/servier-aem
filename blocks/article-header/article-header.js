import { decorateRows, createDate } from '../../scripts/block-utils.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  decorateRows(block, ['article-header-content', 'article-header-meta', 'article-header-media']);
  const date = block.querySelector('.article-header-meta > div > p:first-child');
  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(date?.textContent.trim() || '')) {
    const time = createDate(date.textContent.trim());
    moveInstrumentation(date, time);
    date.replaceWith(time);
  }
  const image = block.querySelector('img');
  if (image) image.loading = 'eager';
}
