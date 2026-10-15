/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: minimal ("card") version of a newsroom dossier article.
 *
 * Used by import-article-card.js only. Keeps just what a blog card and a
 * placeholder page need: the page banner, the article header (H1 + date) and the
 * first intro paragraph. The page metadata (title, description, image, category,
 * keywords/tags, publication date) is still written by article-metadata.js, which
 * reads it before this content is trimmed.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const content = element.querySelector('.single--content');
  if (content) {
    // first editorial paragraph with text (skip spacers / empty paragraphs)
    const intro = [...content.querySelectorAll(':scope > .wp-block-group > p, :scope > p')]
      .find((p) => p.textContent.trim().length > 40);
    const groups = [...content.children];
    const keep = intro ? intro.closest('.single--content > *') : null;
    groups.forEach((child) => { if (child !== keep) child.remove(); });
    if (keep && intro) {
      [...keep.children].forEach((child) => { if (child !== intro) child.remove(); });
    }
  }

  // share links and comments are not part of the card version
  WebImporter.DOMUtils.remove(element, ['.single-wrapper > article > footer']);
}
