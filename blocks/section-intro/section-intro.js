export default function decorate(block) {
  const first = block.querySelector(':scope > div > div > :first-child');
  if (first?.tagName === 'P' && first.nextElementSibling?.matches('h2')) {
    first.classList.add('section-intro-eyebrow');
  }
}
