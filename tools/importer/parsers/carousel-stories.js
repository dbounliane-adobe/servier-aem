/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-stories. Base: carousel. Source: https://servier.com/ (template "home").
 * Generated: 2026-10-15.
 *
 * Source DOM (validated in migration-work/block-context/carousel-stories/source.html,
 * cleaned.html and the live page):
 *   .wp-block-slider-v2 .slider-wrapper
 *     > .slider (slick)                     <- element
 *         .slick-track > .item(.slick-slide) > .content > div > h2 | div > p, a (Lire la suite)
 *     > .slider-nav (slick thumbnail strip)  <- slide images live here, one .nav-item per slide
 *         .slick-track > .nav-item > img (live: src=data: placeholder, real URL in data-lazy-src)
 * Slick clones (.slick-cloned) are skipped so slide/image indexes stay aligned.
 *
 * Container block: one row per slide, 2 cells (UE model carousel-stories-item):
 *   [ media_image ] [ content_text (h2, p, link) ]
 */
function resolveSrc(img) {
  const candidates = [
    img.getAttribute('data-lazy-src'),
    img.getAttribute('data-src'),
    img.getAttribute('src'),
  ];
  const found = candidates.find((s) => s && !s.startsWith('data:'));
  if (found) return found;
  // WP Rocket lazyload keeps the real <img> in a sibling <noscript>.
  const noscript = img.nextElementSibling && img.nextElementSibling.matches('noscript')
    ? img.nextElementSibling : img.parentElement && img.parentElement.querySelector('noscript');
  const m = noscript && (noscript.textContent || noscript.innerHTML).match(/src=["']([^"']+)["']/);
  return m && !m[1].startsWith('data:') ? m[1] : '';
}

export default function parse(element, { document }) {
  const hint = (name) => document.createComment(` field:${name} `);
  const notClone = (el) => !el.classList.contains('slick-cloned');

  // Slides: iterate the slide wrappers (block-level divs, not anchors).
  let slides = [...element.querySelectorAll('.slick-track > .item')].filter(notClone);
  if (!slides.length) slides = [...element.querySelectorAll(':scope > .item, .item')].filter(notClone);

  // Thumbnail strip (sibling of the slider inside .slider-wrapper).
  const wrapper = element.closest('.slider-wrapper') || element.parentElement;
  const nav = wrapper ? wrapper.querySelector('.slider-nav') : null;
  const navItems = nav
    ? [...nav.querySelectorAll('.nav-item')].filter(notClone)
    : [];

  const cells = [];
  slides.forEach((slide, idx) => {
    // Image: own image first (if a future variant puts it in the slide), else matching thumbnail.
    let srcImg = [...slide.querySelectorAll('img')].find((img) => resolveSrc(img) && !img.closest('a'));
    if (!srcImg && navItems[idx]) srcImg = navItems[idx].querySelector('img');
    const imageCell = [];
    if (srcImg) {
      const src = resolveSrc(srcImg);
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = srcImg.getAttribute('alt') || '';
        imageCell.push(hint('media_image'), img);
      }
    }

    // Text: heading, paragraphs, CTA link (drop decorative inline SVG arrows).
    const content = slide.querySelector('.content') || slide;
    content.querySelectorAll('img').forEach((img) => {
      if ((img.getAttribute('src') || '').startsWith('data:')) img.remove();
    });
    const textParts = [...content.querySelectorAll('h1, h2, h3, h4, p, a[href]')]
      .filter((el) => !(el.matches('a') && el.closest('h1, h2, h3, h4, p')));
    textParts.forEach((a) => {
      if (a.matches('a')) a.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    });
    const textCell = textParts.length ? [hint('content_text'), ...textParts] : '';

    if (!imageCell.length && !textParts.length) return;
    cells.push([imageCell.length ? imageCell : '', textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Thumbnail strip consumed: images now live in the slide rows.
  if (nav) nav.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-stories', cells });
  element.replaceWith(block);
}
