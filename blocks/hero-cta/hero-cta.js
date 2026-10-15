import { decorateCTA } from '../../scripts/block-utils.js';

/**
 * Closing CTA banner: background image row + centered text row (heading, text, link).
 * Rows are identified by content so authors can omit the image or reorder rows.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture, img'));
  const contentRows = rows.filter((row) => row !== mediaRow);

  if (mediaRow) {
    mediaRow.classList.add('hero-cta-media');
    // banner sits at the bottom of the page: never compete with LCP
    mediaRow.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy';
      img.alt = img.alt || '';
    });
  } else {
    block.classList.add('hero-cta-no-image');
  }

  contentRows.forEach((row) => {
    if (!row.textContent.trim()) {
      row.remove();
      return;
    }
    row.classList.add('hero-cta-content');
    decorateCTA(row);
  });
}
