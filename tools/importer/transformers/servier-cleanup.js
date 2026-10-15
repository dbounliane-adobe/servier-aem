/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: servier.com (WordPress, theme servier-2022) site-wide cleanup.
 * Selectors verified in migration-work/cleaned.html unless noted otherwise.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that could pollute block parsing.
    WebImporter.DOMUtils.remove(element, [
      // tarteaucitron cookie consent panel: <div id="tarteaucitronRoot"> (cleaned.html line ~1499)
      '#tarteaucitronRoot',
      // Email alert subscription modal: <div class="modal micromodal-slide" id="email-alert-modal">
      '#email-alert-modal',
      // Elfsight portal root outside main: <div id="__EAAPS_PORTAL">
      '#__EAAPS_PORTAL',
      // Hero search form inside campaign-hero: <form class="search-form relative w-fit">
      '.home-header-front-page form.search-form',
      // Slick slider prev/next buttons: <button class="prev ... slick-arrow">
      'button.slick-arrow',
      // Slick infinite-mode clones (runtime class added by slick on the live page; requested by orchestrator)
      '.slick-cloned',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header/footer are migrated separately).
    WebImporter.DOMUtils.remove(element, [
      // <header class="banner"> (contains nav, fullscreen search form #search-form)
      'header.banner',
      // <footer class="relative site-footer ...">
      'footer.site-footer',
      // Skip links: <a class="sr-only focus:not-sr-only" href="#main"> etc.
      'a.sr-only[href^="#"]',
      // WordPress spacer blocks: <div class="wp-block-spacer anim-active">
      '.wp-block-spacer',
      // Generic non-content elements (present on live page)
      'noscript',
      'script',
      'style',
      'link',
    ]);
  }
}
