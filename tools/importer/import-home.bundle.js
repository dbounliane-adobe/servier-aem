/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/campaign-hero.js
  function parse(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const imageCell = [];
    const video = element.querySelector("video");
    let posterImg = null;
    const poster = video && video.getAttribute("poster");
    if (poster) {
      posterImg = document2.createElement("img");
      posterImg.src = poster;
      posterImg.alt = "";
    } else {
      posterImg = [...element.querySelectorAll("img")].find((img) => !img.closest("form, button") && !(img.getAttribute("src") || "").startsWith("data:")) || null;
    }
    if (posterImg) imageCell.push(hint("image"), posterImg);
    const contentRoot = element.querySelector(".prose") || element;
    const heading = contentRoot.querySelector("h1, h2");
    const description = [...contentRoot.querySelectorAll(":scope > p")].filter((p) => p.textContent.trim() && !p.closest("form"));
    const cta = [...contentRoot.querySelectorAll("a[href]")].find((a) => !a.closest("form"));
    const contentCell = [];
    if (heading) contentCell.push(hint("content_heading"), heading);
    if (description.length) contentCell.push(hint("content_description"), ...description);
    if (cta) contentCell.push(hint("content_link"), cta);
    const videoCell = [];
    const sourceEl = video && (video.querySelector("source[src]") || (video.getAttribute("src") ? video : null));
    const videoSrc = sourceEl ? sourceEl.getAttribute("src") : "";
    if (videoSrc) {
      const link = document2.createElement("a");
      link.href = videoSrc;
      link.textContent = videoSrc;
      videoCell.push(hint("video"), link);
    }
    if (!heading && !videoSrc) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [imageCell.length ? imageCell : ""],
      [contentCell.length ? contentCell : ""],
      [videoCell.length ? videoCell : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "campaign-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/editorial-feature.js
  function resolveSrc(img) {
    const candidates = [img.getAttribute("data-lazy-src"), img.getAttribute("data-src"), img.getAttribute("src")];
    return candidates.find((s) => s && !s.startsWith("data:")) || "";
  }
  function parse2(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const imageCell = [];
    const srcImg = [...element.querySelectorAll("img")].find((img) => !img.closest("a") && resolveSrc(img));
    if (srcImg) {
      const img = document2.createElement("img");
      img.src = resolveSrc(srcImg);
      img.alt = srcImg.getAttribute("alt") || "";
      imageCell.push(hint("image"), img);
    }
    const panel = element.querySelector(":scope > a[href]") || element.querySelector("a[href]") || element;
    const href = panel.matches && panel.matches("a") ? panel.getAttribute("href") : "";
    const heading = panel.querySelector("h1, h2, h3, h4");
    const eyebrowEl = [...panel.querySelectorAll("p")].find((p) => !heading || p.compareDocumentPosition(heading) & 4);
    const descriptionEls = heading ? [...panel.querySelectorAll("p")].filter((p) => heading.compareDocumentPosition(p) & 4) : [];
    const ctaLabelEl = [...panel.querySelectorAll("span")].reverse().find((s) => s.textContent.trim());
    const ctaLabel = ctaLabelEl ? ctaLabelEl.textContent.replace(/\s+/g, " ").trim() : "";
    const contentCell = [];
    if (eyebrowEl && eyebrowEl.textContent.trim()) {
      const eyebrow = document2.createElement("p");
      eyebrow.textContent = eyebrowEl.textContent.replace(/\s+/g, " ").trim();
      contentCell.push(hint("content_eyebrow"), eyebrow);
    }
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      contentCell.push(hint("content_heading"), h);
    }
    if (descriptionEls.length) contentCell.push(hint("content_description"), ...descriptionEls);
    if (href) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = href;
      a.textContent = ctaLabel || (heading ? heading.textContent.trim() : href);
      p.append(a);
      contentCell.push(hint("content_link"), p);
    }
    if (!imageCell.length && !contentCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [imageCell.length ? imageCell : ""],
      [contentCell.length ? contentCell : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "editorial-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/section-intro.js
  var EYEBROW_SEL = '.is-style-surtitle-2, .is-style-surtitle-v2, [class*="surtitle"]';
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function bgUrlFromStyle(style) {
    if (!style) return "";
    const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : "";
  }
  function extractSectionBackground(element, document2) {
    const section = element.closest(".wp-block-banner-img-cta-multiple-v2, [data-bg]");
    if (!section || section === element || section.hasAttribute("data-excat-bg-done")) return null;
    section.setAttribute("data-excat-bg-done", "");
    const src = section.getAttribute("data-bg") || bgUrlFromStyle(section.getAttribute("style"));
    if (!src) return null;
    const hasChildImg = [...section.querySelectorAll(":scope > img, :scope > picture")].length > 0;
    if (hasChildImg) return null;
    const img = document2.createElement("img");
    img.src = src;
    img.alt = "";
    const p = document2.createElement("p");
    p.append(img);
    return p;
  }
  function parse3(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    let heading = null;
    let eyebrowEl = null;
    let descriptions = [];
    const consumed = [];
    if (element.matches("h1, h2, h3, h4")) {
      heading = element;
      const next = element.nextElementSibling;
      const prev = element.previousElementSibling;
      if (next && next.matches(EYEBROW_SEL)) eyebrowEl = next;
      else if (prev && prev.matches(EYEBROW_SEL)) eyebrowEl = prev;
      if (eyebrowEl) consumed.push(eyebrowEl);
    } else if (element.matches(EYEBROW_SEL) && !element.querySelector("h1, h2, h3, h4")) {
      eyebrowEl = element;
      const next = element.nextElementSibling;
      if (next && next.matches("h1, h2, h3, h4")) {
        heading = next;
        consumed.push(next);
      }
    } else {
      heading = element.querySelector("h1, h2, h3, h4");
      eyebrowEl = element.querySelector(EYEBROW_SEL);
      descriptions = [...element.querySelectorAll("p")].filter((p) => p !== eyebrowEl && !p.matches(EYEBROW_SEL) && clean(p.textContent));
    }
    if (!heading && !eyebrowEl && !descriptions.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (eyebrowEl && clean(eyebrowEl.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean(eyebrowEl.textContent);
      contentCell.push(hint("content_eyebrow"), p);
    }
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = clean(heading.textContent);
      contentCell.push(hint("content_heading"), h);
    }
    if (descriptions.length) contentCell.push(hint("content_description"), ...descriptions);
    const cells = [[contentCell]];
    const bg = extractSectionBackground(element, document2);
    consumed.forEach((el) => el.remove());
    const block = WebImporter.Blocks.createBlock(document2, { name: "section-intro", cells });
    element.replaceWith(block);
    if (bg) block.before(bg);
  }

  // tools/importer/parsers/article-feed.js
  function parse4(element, { document: document2 }) {
    const root = element.closest(".wp-block-last-news-v2") || element.parentElement;
    let filters = element.previousElementSibling;
    if (!filters || !filters.matches('nav.filters-news, nav[class*="filter"]')) {
      filters = root ? root.querySelector(":scope > nav.filters-news") : null;
    }
    const allBtn = filters ? filters.querySelector("button.filter-btn.active") || filters.querySelector("button.filter-btn, button") : null;
    const allLabel = allBtn ? allBtn.textContent.replace(/\s+/g, " ").trim() : "";
    const items = [...element.querySelectorAll(":scope > li.news-item, :scope > li:not(.news-item)")];
    const visible = items.filter((li) => !li.classList.contains("hidden"));
    const limit = String(visible.length || items.length || 3);
    let prefix = "/newsroom/";
    const firstLink = element.querySelector("li a[href]");
    if (firstLink) {
      try {
        const { pathname } = new URL(firstLink.getAttribute("href"), "https://servier.com/");
        const seg = pathname.split("/").filter(Boolean)[0];
        if (seg) prefix = `/${seg}/`;
      } catch (e) {
      }
    }
    const cells = [
      ["source", "/query-index.json"],
      ["prefix", prefix],
      ["category", ""],
      ["limit", limit],
      ["all", allLabel],
      ["empty", ""],
      ["error", ""]
    ];
    if (filters) filters.remove();
    const block = WebImporter.Blocks.createBlock(document2, { name: "article-feed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-social.js
  function parse5(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    let source = "";
    const classMatch = [...element.classList].find((c) => c.startsWith("elfsight-app-"));
    if (classMatch) {
      const m = classMatch.match(UUID);
      if (m) source = m[0];
    }
    if (!source) {
      const m = (element.outerHTML || "").match(UUID);
      if (m) source = m[0];
    }
    if (!source) {
      const link = element.querySelector('a[href^="https://"]');
      if (link) source = link.getAttribute("href");
    }
    if (!source) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const title = (element.getAttribute("title") || element.getAttribute("aria-label") || "").trim();
    const sourceCell = [hint("source"), document2.createTextNode(source)];
    const titleCell = title ? [hint("title"), document2.createTextNode(title)] : "";
    const cells = [
      [sourceCell],
      [titleCell]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "embed-social", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/topic-cards.js
  function resolveSrc2(img) {
    const candidates = [img.getAttribute("data-lazy-src"), img.getAttribute("data-src"), img.getAttribute("src")];
    return candidates.find((s) => s && !s.startsWith("data:")) || "";
  }
  function clean2(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function parse6(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    let items = [...element.querySelectorAll("h3, h2, h4")].map((h) => h.parentElement).filter((body, i, arr) => body && arr.indexOf(body) === i).map((body) => ({ body, card: body.closest("a.item, a[href], .item") || body }));
    if (!items.length) {
      items = [...element.querySelectorAll(":scope > .item, :scope > a")].map((card) => ({ body: card.querySelector(":scope > div") || card, card }));
    }
    const cells = [];
    items.forEach(({ body, card }) => {
      const imageCell = [];
      const srcImg = [...card.querySelectorAll("img")].find((img) => resolveSrc2(img));
      if (srcImg) {
        const img = document2.createElement("img");
        img.src = resolveSrc2(srcImg);
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell.push(hint("image"), img);
      }
      const heading = body.querySelector("h1, h2, h3, h4, h5, h6");
      const descriptions = [...body.querySelectorAll("p")].filter((p) => clean2(p.textContent));
      const anchor = card.matches("a[href]") ? card : card.querySelector("a[href]") || body.closest("a[href]");
      const labelSpan = [...card.querySelectorAll(":scope > span")].find((s) => clean2(s.textContent));
      const label = clean2(labelSpan && labelSpan.textContent) || clean2(anchor && anchor.getAttribute("title"));
      const contentCell = [];
      if (heading) {
        const h = document2.createElement(heading.tagName.toLowerCase());
        h.textContent = clean2(heading.textContent);
        contentCell.push(hint("content_heading"), h);
      }
      if (descriptions.length) contentCell.push(hint("content_description"), ...descriptions);
      if (anchor) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = anchor.getAttribute("href");
        a.textContent = label || (heading ? clean2(heading.textContent) : anchor.getAttribute("href"));
        p.append(a);
        contentCell.push(hint("content_link"), p);
      }
      if (!imageCell.length && !contentCell.length) return;
      cells.push([imageCell.length ? imageCell : "", contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "topic-cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-stories.js
  function resolveSrc3(img) {
    const candidates = [
      img.getAttribute("data-lazy-src"),
      img.getAttribute("data-src"),
      img.getAttribute("src")
    ];
    const found = candidates.find((s) => s && !s.startsWith("data:"));
    if (found) return found;
    const noscript = img.nextElementSibling && img.nextElementSibling.matches("noscript") ? img.nextElementSibling : img.parentElement && img.parentElement.querySelector("noscript");
    const m = noscript && (noscript.textContent || noscript.innerHTML).match(/src=["']([^"']+)["']/);
    return m && !m[1].startsWith("data:") ? m[1] : "";
  }
  function parse7(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const notClone = (el) => !el.classList.contains("slick-cloned");
    let slides = [...element.querySelectorAll(".slick-track > .item")].filter(notClone);
    if (!slides.length) slides = [...element.querySelectorAll(":scope > .item, .item")].filter(notClone);
    const wrapper = element.closest(".slider-wrapper") || element.parentElement;
    const nav = wrapper ? wrapper.querySelector(".slider-nav") : null;
    const navItems = nav ? [...nav.querySelectorAll(".nav-item")].filter(notClone) : [];
    const cells = [];
    slides.forEach((slide, idx) => {
      let srcImg = [...slide.querySelectorAll("img")].find((img) => resolveSrc3(img) && !img.closest("a"));
      if (!srcImg && navItems[idx]) srcImg = navItems[idx].querySelector("img");
      const imageCell = [];
      if (srcImg) {
        const src = resolveSrc3(srcImg);
        if (src) {
          const img = document2.createElement("img");
          img.src = src;
          img.alt = srcImg.getAttribute("alt") || "";
          imageCell.push(hint("media_image"), img);
        }
      }
      const content = slide.querySelector(".content") || slide;
      content.querySelectorAll("img").forEach((img) => {
        if ((img.getAttribute("src") || "").startsWith("data:")) img.remove();
      });
      const textParts = [...content.querySelectorAll("h1, h2, h3, h4, p, a[href]")].filter((el) => !(el.matches("a") && el.closest("h1, h2, h3, h4, p")));
      textParts.forEach((a) => {
        if (a.matches("a")) a.textContent = a.textContent.replace(/\s+/g, " ").trim();
      });
      const textCell = textParts.length ? [hint("content_text"), ...textParts] : "";
      if (!imageCell.length && !textParts.length) return;
      cells.push([imageCell.length ? imageCell : "", textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (nav) nav.remove();
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-stories", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-cta.js
  function bgUrlFromStyle2(style) {
    if (!style) return "";
    const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : "";
  }
  function resolveSrc4(img) {
    const candidates = [img.getAttribute("data-lazy-src"), img.getAttribute("data-src"), img.getAttribute("src")];
    return candidates.find((s) => s && !s.startsWith("data:")) || "";
  }
  function parse8(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    let bgSrc = element.getAttribute("data-bg") || element.getAttribute("data-background") || bgUrlFromStyle2(element.getAttribute("style"));
    let bgAlt = "";
    if (!bgSrc) {
      const childImg = [...element.querySelectorAll(":scope > img, :scope > picture img")].find((i) => resolveSrc4(i));
      if (childImg) {
        bgSrc = resolveSrc4(childImg);
        bgAlt = childImg.getAttribute("alt") || "";
      }
    }
    const imageCell = [];
    if (bgSrc) {
      const img = document2.createElement("img");
      img.src = bgSrc;
      img.alt = bgAlt;
      imageCell.push(hint("image"), img);
    }
    const group = element.querySelector(".wp-block-group") || element;
    const heading = group.querySelector("h1, h2, h3");
    const paragraphs = [...group.querySelectorAll("p")].filter((p) => p.textContent.trim());
    const ctas = [...group.querySelectorAll("a[href]")].filter((a) => !a.closest("p, h1, h2, h3"));
    const textParts = [];
    if (heading) textParts.push(heading);
    textParts.push(...paragraphs);
    ctas.forEach((a) => {
      a.querySelectorAll("img").forEach((img) => {
        if ((img.getAttribute("src") || "").startsWith("data:")) img.remove();
      });
      a.textContent = a.textContent.replace(/\s+/g, " ").trim();
      const p = document2.createElement("p");
      p.append(a);
      textParts.push(p);
    });
    if (!imageCell.length && !textParts.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [imageCell.length ? imageCell : ""],
      [textParts.length ? [hint("text"), ...textParts] : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/servier-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // tarteaucitron cookie consent panel: <div id="tarteaucitronRoot"> (cleaned.html line ~1499)
        "#tarteaucitronRoot",
        // Email alert subscription modal: <div class="modal micromodal-slide" id="email-alert-modal">
        "#email-alert-modal",
        // Elfsight portal root outside main: <div id="__EAAPS_PORTAL">
        "#__EAAPS_PORTAL",
        // Hero search form inside campaign-hero: <form class="search-form relative w-fit">
        ".home-header-front-page form.search-form",
        // Slick slider prev/next buttons: <button class="prev ... slick-arrow">
        "button.slick-arrow",
        // Slick infinite-mode clones (runtime class added by slick on the live page; requested by orchestrator)
        ".slick-cloned"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // <header class="banner"> (contains nav, fullscreen search form #search-form)
        "header.banner",
        // <footer class="relative site-footer ...">
        "footer.site-footer",
        // Skip links: <a class="sr-only focus:not-sr-only" href="#main"> etc.
        'a.sr-only[href^="#"]',
        // WordPress spacer blocks: <div class="wp-block-spacer anim-active">
        ".wp-block-spacer",
        // Generic non-content elements (present on live page)
        "noscript",
        "script",
        "style",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/servier-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
    "name": "home",
    "description": "Servier homepage: full-screen video hero, featured editorial, latest news feed, social feed, therapeutic areas, patient stories carousel and closing CTA banner",
    "urls": [
      "https://servier.com/"
    ],
    "blocks": [
      {
        "name": "campaign-hero",
        "instances": [
          ".home-header-front-page"
        ]
      },
      {
        "name": "editorial-feature",
        "instances": [
          "#main > article.featured-content"
        ]
      },
      {
        "name": "section-intro",
        "instances": [
          ".wp-block-last-news-v2 > h2",
          ".wp-block-banner-img-cta-multiple-v2 .wp-block-group > .prose",
          ".wp-block-slider-v2 > span"
        ]
      },
      {
        "name": "article-feed",
        "instances": [
          ".wp-block-last-news-v2 > ul.news"
        ]
      },
      {
        "name": "embed-social",
        "instances": [
          '[class*="elfsight-app-"]'
        ]
      },
      {
        "name": "topic-cards",
        "instances": [
          ".wp-block-banner-img-cta-multiple-v2 .items"
        ]
      },
      {
        "name": "carousel-stories",
        "instances": [
          ".wp-block-slider-v2 .slider-wrapper > .slider"
        ]
      },
      {
        "name": "hero-cta",
        "instances": [
          ".wp-block-banner-img-cta-v2"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "hero",
        "selector": [
          ".home-header-front-page"
        ],
        "style": null,
        "blocks": [
          "campaign-hero"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "featured-content",
        "selector": [
          "#main > article.featured-content"
        ],
        "style": null,
        "blocks": [
          "editorial-feature"
        ],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "latest-news",
        "selector": [
          ".wp-block-last-news-v2"
        ],
        "style": null,
        "blocks": [
          "section-intro",
          "article-feed"
        ],
        "defaultContent": [
          ".wp-block-last-news-v2 > .mt-8"
        ]
      },
      {
        "id": "4",
        "name": "social-feed",
        "selector": [
          "#main > .wp-block-group.alignwide.is-layout-flow"
        ],
        "style": null,
        "blocks": [
          "embed-social"
        ],
        "defaultContent": [
          "#main > .wp-block-group.alignwide.is-layout-flow > p.is-style-surtitle-2"
        ]
      },
      {
        "id": "5",
        "name": "therapeutic-areas",
        "selector": [
          ".wp-block-banner-img-cta-multiple-v2"
        ],
        "style": "highlight",
        "blocks": [
          "section-intro",
          "topic-cards"
        ],
        "defaultContent": []
      },
      {
        "id": "6",
        "name": "patient-stories",
        "selector": [
          ".wp-block-slider-v2"
        ],
        "style": null,
        "blocks": [
          "section-intro",
          "carousel-stories"
        ],
        "defaultContent": []
      },
      {
        "id": "7",
        "name": "join-us-cta",
        "selector": [
          ".wp-block-banner-img-cta-v2"
        ],
        "style": null,
        "blocks": [
          "hero-cta"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "campaign-hero": parse,
    "editorial-feature": parse2,
    "section-intro": parse3,
    "article-feed": parse4,
    "embed-social": parse5,
    "topic-cards": parse6,
    "carousel-stories": parse7,
    "hero-cta": parse8
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    /**
     * Runs before the importer's own image preprocessing, which drops <img> elements
     * whose src is a data: placeholder. WP Rocket lazyload keeps the real URL in
     * data-lazy-src / data-lazy-srcset, so promote it to src before that happens.
     */
    preprocess: ({ document: document2 }) => {
      document2.querySelectorAll("img[data-lazy-src]").forEach((img) => {
        img.setAttribute("src", img.getAttribute("data-lazy-src"));
        const srcset = img.getAttribute("data-lazy-srcset");
        if (srcset) img.setAttribute("srcset", srcset);
      });
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      meta.theme = "servier";
      meta.language = "fr";
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
