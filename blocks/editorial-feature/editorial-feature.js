import { decorateRows, decorateCTA } from '../../scripts/block-utils.js';

export default function decorate(block) {
  decorateRows(block, ['editorial-feature-media', 'editorial-feature-content']);
  decorateCTA(block.querySelector('.editorial-feature-content'));
  const image = block.querySelector('img');
  if (image) image.loading = 'lazy';
}
