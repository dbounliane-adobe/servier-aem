/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: servier.com newsroom dossier ARTICLE cleanup (template "article").
 * Complements servier-cleanup.js (which already removes header.banner, footer.site-footer,
 * skip links, cookie panel, modals, .wp-block-spacer, script/style/link/noscript and
 * buttonizes pill CTAs). Run it AFTER servier-cleanup.js and BEFORE/AFTER servier-sections.js
 * (order does not matter for sections: the references separator is only removed in
 * afterTransform, once servier-sections.js has matched `:has(> hr.wp-block-separator)`).
 *
 * All selectors verified in migration-work/cleaned.html (Becker dossier article).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Runtime/animation classes added by the WP theme JS (present throughout main in cleaned.html).
const RUNTIME_CLASSES = ['anim-active', 'bg-active', 'entered', 'lazyloaded'];

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Breadcrumbs inside the page banner: <div class="breadcrumbs lg:w-1/3 lg:pt-20"> (line ~341).
    // Site chrome, not authored (the hero-page-banner parser only needs picture + title).
    WebImporter.DOMUtils.remove(element, ['.page-header--classic .breadcrumbs']);

    // "Retourner aux dossiers" back link: <a class="btn__return"><img src="data:image/svg+xml..."> text</a>
    // The arrow icon is a decorative inline SVG data URI; keep only the link text.
    element.querySelectorAll('a.btn__return').forEach((a) => {
      a.querySelectorAll('img, svg').forEach((icon) => icon.remove());
      a.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    });

    // WordPress block comments left inside rich text (e.g. <!-- wp:paragraph --> in
    // .wp-block-did-you-know .content) and the empty <p> they leave behind.
    element.querySelectorAll('.single--content').forEach((content) => {
      const walker = content.ownerDocument.createTreeWalker(content, 128 /* NodeFilter.SHOW_COMMENT */);
      const comments = [];
      while (walker.nextNode()) comments.push(walker.currentNode);
      comments.forEach((c) => c.remove());
      content.querySelectorAll('.wp-block-did-you-know .content > p').forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector('img, a')) p.remove();
      });
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // References group separator: <hr class="wp-block-separator has-alpha-channel-opacity"> (line ~596).
    // Replaced by the "references" section style. Targets the WP class only, so the bare <hr>
    // section breaks inserted by servier-sections.js survive.
    WebImporter.DOMUtils.remove(element, [
      'hr.wp-block-separator',
      // Empty decorative bars: <div class="block-border"> (page banner title, did-you-know header)
      '.block-border',
      // Cover overlay: <span class="wp-block-cover__background has-indigo-900-background-color ...">
      '.wp-block-cover__background',
    ]);

    // Footnotes: in-text calls <sup><a href="#_ftn1">1</a></sup> and reference back-links
    // <a href="#_ftnref1" id="_ftn1">[1]</a>. In-page anchors/ids do not survive EDS/xwalk,
    // so unwrap them to plain text (the <sup> wrapper is kept).
    element.querySelectorAll('a[href^="#_ftn"]').forEach((a) => {
      a.replaceWith(a.ownerDocument.createTextNode(a.textContent));
    });

    // Strip theme runtime classes (animation / lazyload state).
    element.querySelectorAll(RUNTIME_CLASSES.map((c) => `.${c}`).join(',')).forEach((el) => {
      el.classList.remove(...RUNTIME_CLASSES);
      if (!el.classList.length) el.removeAttribute('class');
    });
  }
}
