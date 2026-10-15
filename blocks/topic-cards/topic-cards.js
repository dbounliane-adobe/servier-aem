import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Topic cards: white link cards with a colored accent bar.
 * The whole card is clickable through the CTA link (stretched link), so the
 * authored structure and Universal Editor instrumentation stay untouched.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    moveInstrumentation(row, item);
    [...row.children].forEach((cell, index) => {
      cell.classList.add(index === 0 ? 'topic-cards-media' : 'topic-cards-content');
      item.append(cell);
    });

    // no image authored: drop the empty media cell so no blank area renders
    const media = item.querySelector('.topic-cards-media');
    if (media && !media.querySelector('picture, img')) media.remove();
    const image = item.querySelector('img');
    if (image) image.loading = 'lazy';

    const content = item.querySelector('.topic-cards-content');
    const link = content?.querySelector('a[href]');
    if (link) {
      link.classList.remove('button', 'primary', 'secondary');
      link.classList.add('topic-cards-cta');
      const wrapper = link.closest('p');
      if (wrapper) {
        wrapper.classList.remove('button-wrapper', 'button-container');
        wrapper.classList.add('topic-cards-cta-wrapper');
      }
      const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading?.id) link.setAttribute('aria-describedby', heading.id);
      item.classList.add('topic-cards-linked');
    }

    list.append(item);
  });
  block.replaceChildren(list);
}
