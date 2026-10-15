import { decorateRows, createDate } from '../../scripts/block-utils.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;

export default function decorate(block) {
  decorateRows(block, ['article-header-content', 'article-header-meta', 'article-header-media']);

  // category: any paragraph authored before the heading (kept in the DOM for authors)
  const content = block.querySelector('.article-header-content > div');
  const heading = content?.querySelector('h1, h2');
  if (heading) {
    const children = [...content.children];
    children.slice(0, children.indexOf(heading))
      .filter((el) => el.tagName === 'P')
      .forEach((el) => el.classList.add('article-header-category'));
  }

  // publication date: ISO value rendered as <time> in the page locale ("6 octobre 2026")
  const date = block.querySelector('.article-header-meta > div > p:first-child');
  const value = date?.textContent.trim() || '';
  if (ISO_DATE.test(value)) {
    const time = createDate(value);
    time.className = 'article-header-date';
    moveInstrumentation(date, time);
    date.replaceWith(time);
  }

  // hide rows the author left empty
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('img, picture')) row.classList.add('article-header-empty');
  });

  const image = block.querySelector('img');
  if (image) image.loading = 'eager';
}
