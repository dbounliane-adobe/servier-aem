const HEADING = 'h1, h2, h3, h4, h5, h6';

/**
 * An eyebrow is the short plain-text paragraph authored before the heading.
 * Without a heading, a single short plain paragraph is treated as an eyebrow
 * (label-only intro, e.g. above a carousel).
 * @param {Element} el candidate element
 * @param {Element|null} heading the intro heading, if any
 * @returns {boolean}
 */
function isEyebrow(el, heading) {
  if (el?.tagName !== 'P') return false;
  if (heading) return el.nextElementSibling === heading;
  const siblings = el.parentElement.children;
  return siblings.length === 1 && !el.children.length && el.textContent.trim().length <= 80;
}

/**
 * Decorates the section intro: tags eyebrow, title and description so CSS can
 * reproduce the source order (title above eyebrow) without changing the model.
 * @param {Element} block the section-intro block
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;
  cell.classList.add('section-intro-content');

  const heading = cell.querySelector(`:scope > :is(${HEADING})`);
  const first = cell.firstElementChild;
  const eyebrow = isEyebrow(first, heading) ? first : null;

  eyebrow?.classList.add('section-intro-eyebrow');
  heading?.classList.add('section-intro-title');

  const description = [...cell.children].filter((el) => el !== eyebrow && el !== heading);
  description.forEach((el) => el.classList.add('section-intro-description'));

  if (eyebrow && !heading && !description.length) block.classList.add('section-intro-eyebrow-only');
  if (description.length) block.classList.add('section-intro-has-description');
}
