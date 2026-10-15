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

  // tools/importer/import-article.js
  var import_article_exports = {};
  __export(import_article_exports, {
    default: () => import_article_default
  });

  // tools/importer/parsers/hero-page-banner.js
  function isRealSrc(s) {
    return !!s && !s.trim().startsWith("data:");
  }
  function firstSrcsetUrl(srcset) {
    if (!srcset) return "";
    const candidates = srcset.split(",").map((c) => c.trim()).filter(Boolean).map((c) => {
      const [url, desc] = c.split(/\s+/);
      const w = desc && /\d+w$/.test(desc) ? parseInt(desc, 10) : 0;
      return { url, w };
    });
    candidates.sort((a, b) => b.w - a.w);
    return candidates.length ? candidates[0].url : "";
  }
  function resolveBannerSrc(picture, img) {
    if (picture) {
      const sources = [...picture.querySelectorAll("source")];
      const wide = sources.find((s) => /min-width:\s*768px/.test(s.getAttribute("media") || ""));
      const ordered = wide ? [wide, ...sources.filter((s) => s !== wide)] : sources;
      for (const s of ordered) {
        const url = firstSrcsetUrl(s.getAttribute("srcset") || s.getAttribute("data-lazy-srcset") || s.getAttribute("data-srcset"));
        if (isRealSrc(url)) return url;
      }
    }
    if (img) {
      const candidates = [img.getAttribute("data-lazy-src"), img.getAttribute("data-src"), img.getAttribute("src")];
      const found = candidates.find(isRealSrc);
      if (found) return found;
    }
    return "";
  }
  function parse(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const picture = element.querySelector(":scope > picture, picture.image, picture");
    const srcImg = picture && picture.querySelector("img") || element.querySelector("img");
    const bannerSrc = resolveBannerSrc(picture, srcImg);
    const imageCell = [];
    if (bannerSrc) {
      const img = document2.createElement("img");
      img.src = bannerSrc;
      img.alt = srcImg && srcImg.getAttribute("alt") || "";
      imageCell.push(hint("image"), img);
    }
    const titleWrap = element.querySelector(".title-page") || element.querySelector(".page-header-wrap") || element;
    const heading = titleWrap.querySelector("h1, h2, h3");
    const paragraphs = [...titleWrap.querySelectorAll("p")].filter((p) => p.textContent.trim() && !p.closest(".breadcrumbs"));
    const textParts = [];
    if (heading) textParts.push(heading);
    textParts.push(...paragraphs);
    if (!imageCell.length && !textParts.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [imageCell.length ? imageCell : ""],
      [textParts.length ? [hint("text"), ...textParts] : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-page-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/article-header.js
  var FR_MONTHS = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12
  };
  var CATEGORY_LABELS = { decryptages: "D\xE9cryptages" };
  var pad = (n) => String(n).padStart(2, "0");
  var stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  function toIsoDate(value) {
    if (!value) return "";
    const text = value.replace(/\s+/g, " ").trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const fr = stripAccents(text.toLowerCase()).match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
    if (fr && FR_MONTHS[fr[2]]) return `${fr[3]}-${pad(FR_MONTHS[fr[2]])}-${pad(fr[1])}`;
    const num = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (num) return `${num[3]}-${pad(num[2])}-${pad(num[1])}`;
    return "";
  }
  function readCategory(element, document2) {
    const stashed = document2.querySelector("[data-excat-article-category]");
    const fromStash = stashed && stashed.getAttribute("data-excat-article-category");
    if (fromStash && fromStash.trim()) return fromStash.trim();
    const article = element.closest('article[class*="category_folder-"]') || document2.querySelector('article[class*="category_folder-"]');
    const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
    if (m) return CATEGORY_LABELS[m[1]] || capitalize(m[1].replace(/-/g, " "));
    const strong = document2.querySelector(".page-header--classic .title-page h2 strong, .title-page h2 strong");
    const fromBanner = strong && strong.textContent.trim();
    return fromBanner ? capitalize(fromBanner) : "";
  }
  function parse2(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const p = (text) => {
      const el = document2.createElement("p");
      el.textContent = text;
      return el;
    };
    const sourceHeading = element.matches("h1, h2") ? element : element.querySelector("h1, h2");
    const title = sourceHeading ? sourceHeading.textContent.replace(/\s+/g, " ").trim() : "";
    const scope = element.closest("header") || element.parentElement || document2;
    const time = scope.querySelector("time.single--date") || scope.querySelector("time");
    let date = "";
    if (time) {
      date = toIsoDate(time.getAttribute("datetime")) || toIsoDate(time.textContent);
      time.remove();
    }
    if (!date) {
      const stashed = document2.querySelector("[data-excat-article-date]");
      date = toIsoDate(stashed && stashed.getAttribute("data-excat-article-date"));
    }
    const category = readCategory(element, document2);
    if (!title && !date) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (category) contentCell.push(hint("content_category"), p(category));
    if (title) {
      const h1 = document2.createElement("h1");
      h1.textContent = title;
      contentCell.push(hint("content_heading"), h1);
    }
    const metaCell = [];
    if (date) metaCell.push(hint("meta_date"), p(date));
    const cells = [
      [contentCell.length ? contentCell : ""],
      [metaCell.length ? metaCell : ""],
      [""]
      // image row (image + imageAlt): no cover image on dossier pages
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "article-header", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/callout-did-you-know.js
  function parse3(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const bloc = element.querySelector(":scope > .bloc") || element.querySelector(".bloc");
    let label = "";
    if (bloc) {
      const clone = bloc.cloneNode(true);
      clone.querySelectorAll("svg, img, .block-border").forEach((n) => n.remove());
      label = clone.textContent.replace(/\s+/g, " ").trim();
    }
    const content = element.querySelector(":scope > .content") || element.querySelector(".content");
    const textParts = [];
    if (content) {
      const walker = document2.createTreeWalker(
        content,
        128
        /* NodeFilter.SHOW_COMMENT */
      );
      const comments = [];
      while (walker.nextNode()) comments.push(walker.currentNode);
      comments.forEach((c) => c.remove());
      [...content.children].forEach((child) => {
        if (child.textContent.trim() || child.querySelector("img, a")) textParts.push(child);
      });
      if (!textParts.length && content.textContent.trim()) {
        const p = document2.createElement("p");
        p.append(...content.childNodes);
        textParts.push(p);
      }
    }
    if (!label && !textParts.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const labelCell = [];
    if (label) {
      const p = document2.createElement("p");
      p.textContent = label;
      labelCell.push(hint("title"), p);
    }
    const cells = [
      [labelCell.length ? labelCell : ""],
      [textParts.length ? [hint("text"), ...textParts] : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "callout-did-you-know", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/key-figures.js
  function parse4(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const textOf = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    let items = [...element.querySelectorAll(".wp-block-numbers")];
    if (!items.length) items = [...element.querySelectorAll(":scope > .wp-block-column")];
    const cells = [];
    items.forEach((item) => {
      const paragraphs = [...item.querySelectorAll("p")].filter((p) => textOf(p));
      let value = "";
      let label = "";
      if (paragraphs.length) {
        value = textOf(paragraphs[0]);
        label = paragraphs.slice(1).map(textOf).join(" ");
      } else {
        value = textOf(item.querySelector('[class*="number"], [class*="value"], h2, h3, strong'));
        label = textOf(item).replace(value, "").trim();
      }
      if (!value && !label) return;
      const valueCell = value ? [hint("value"), document2.createTextNode(value)] : "";
      const labelCell = label ? [hint("label"), document2.createTextNode(label)] : "";
      cells.push([valueCell, labelCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "key-figures", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-striped.js
  var MAX_COLS = 4;
  function parse5(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    let rows = [
      ...table.querySelectorAll(":scope > thead > tr"),
      ...table.querySelectorAll(":scope > tbody > tr"),
      ...table.querySelectorAll(":scope > tfoot > tr")
    ];
    if (!rows.length) rows = [...table.querySelectorAll("tr")];
    const sourceRows = rows.map((tr) => [...tr.querySelectorAll(":scope > th, :scope > td")]).filter((cellsOfRow) => cellsOfRow.some((c) => c.textContent.trim() || c.querySelector("img, a")));
    if (!sourceRows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const colCount = Math.min(
      MAX_COLS,
      Math.max(...sourceRows.map((r) => r.reduce((n, c) => n + (parseInt(c.getAttribute("colspan"), 10) || 1), 0)))
    );
    const cells = sourceRows.map((sourceCells) => {
      const expanded = [];
      sourceCells.forEach((c) => {
        expanded.push(c);
        const span = parseInt(c.getAttribute("colspan"), 10) || 1;
        for (let i = 1; i < span; i += 1) expanded.push(null);
      });
      if (expanded.length > colCount) {
        const overflow = expanded.splice(colCount - 1);
        const merged = document2.createElement("div");
        overflow.filter(Boolean).forEach((c) => {
          const p = document2.createElement("p");
          p.append(...c.childNodes);
          merged.append(p);
        });
        expanded.push(merged);
      }
      while (expanded.length < colCount) expanded.push(null);
      return expanded.map((c, i) => {
        if (!c) return "";
        const content = [...c.childNodes].filter((n) => n.nodeType !== 3 || n.textContent.trim());
        if (!content.length) return "";
        return [hint(`column${i + 1}text`), ...content];
      });
    });
    const caption = element.querySelector("figcaption");
    const captionText = caption && caption.textContent.trim();
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-striped", cells });
    if (captionText) {
      const p = document2.createElement("p");
      p.append(...caption.childNodes);
      element.replaceWith(block);
      block.after(p);
      return;
    }
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-cover.js
  function isRealSrc2(s) {
    return !!s && !s.trim().startsWith("data:");
  }
  function widestFromSrcset(srcset) {
    if (!srcset) return "";
    const list = srcset.split(",").map((c) => c.trim()).filter(Boolean).map((c) => {
      const [url, desc] = c.split(/\s+/);
      return { url, w: desc && /\d+w$/.test(desc) ? parseInt(desc, 10) : 0 };
    });
    list.sort((a, b) => b.w - a.w);
    return list.length ? list[0].url : "";
  }
  function resolveSrc(img) {
    const candidates = [
      img.getAttribute("data-lazy-src"),
      img.getAttribute("data-src"),
      widestFromSrcset(img.getAttribute("data-lazy-srcset")),
      img.getAttribute("src"),
      widestFromSrcset(img.getAttribute("srcset"))
    ];
    return candidates.find(isRealSrc2) || "";
  }
  function parse6(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const bgCandidates = [
      ...element.querySelectorAll(":scope > img.wp-block-cover__image-background, :scope > picture img"),
      ...element.querySelectorAll("img.wp-block-cover__image-background")
    ];
    let bgImg = null;
    let bgSrc = "";
    for (const img of bgCandidates) {
      const src = resolveSrc(img);
      if (src) {
        bgImg = img;
        bgSrc = src;
        break;
      }
    }
    const imageCell = [];
    if (bgSrc) {
      const img = document2.createElement("img");
      img.src = bgSrc;
      img.alt = bgImg && bgImg.getAttribute("alt") || "";
      imageCell.push(hint("image"), img);
    }
    const inner = element.querySelector(".wp-block-cover__inner-container") || element;
    const textParts = [];
    const heading = inner.querySelector("h1, h2, h3, h4");
    if (heading) textParts.push(heading);
    [...inner.querySelectorAll("p")].filter((p) => !p.closest(".wp-block-buttons, .wp-block-button") && norm(p.textContent)).forEach((p) => textParts.push(p));
    const seen = /* @__PURE__ */ new Set();
    [...inner.querySelectorAll("a.wp-block-button__link, .wp-block-button a[href]")].forEach((a) => {
      if (!a.getAttribute("href")) return;
      const label = norm(a.textContent);
      const key = `${a.getAttribute("href")}|${label}`;
      if (!label || seen.has(key)) return;
      seen.add(key);
      const link = document2.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = label;
      const strong = document2.createElement("strong");
      strong.append(link);
      const p = document2.createElement("p");
      p.append(strong);
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-cover", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/share-social.js
  function parse7(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const labelEl = [...element.querySelectorAll("span, p, h2, h3, h4, strong")].find((el) => !el.closest("a, button") && norm(el.textContent));
    const label = labelEl ? norm(labelEl.textContent) : "Partager sur :";
    const p = document2.createElement("p");
    p.textContent = label;
    const cells = [[[hint("label"), p]]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "share-social", cells });
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
        // NOTE: the hero search form (.home-header-front-page form.search-form) is NOT removed here:
        // the campaign-hero parser reads its action/placeholder into the search_ fields and drops it.
        // Slick slider prev/next buttons: <button class="prev ... slick-arrow">
        "button.slick-arrow",
        // Slick infinite-mode clones (runtime class added by slick on the live page; requested by orchestrator)
        ".slick-cloned"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll('a[class*="rounded-[50px]"]').forEach((a) => {
        if (a.closest("strong, em")) return;
        const strong = element.ownerDocument.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
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

  // tools/importer/transformers/article-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var RUNTIME_CLASSES = ["anim-active", "bg-active", "entered", "lazyloaded"];
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [".page-header--classic .breadcrumbs"]);
      element.querySelectorAll("a.btn__return").forEach((a) => {
        a.querySelectorAll("img, svg").forEach((icon) => icon.remove());
        a.textContent = a.textContent.replace(/\s+/g, " ").trim();
      });
      element.querySelectorAll(".single--content").forEach((content) => {
        const walker = content.ownerDocument.createTreeWalker(
          content,
          128
          /* NodeFilter.SHOW_COMMENT */
        );
        const comments = [];
        while (walker.nextNode()) comments.push(walker.currentNode);
        comments.forEach((c) => c.remove());
        content.querySelectorAll(".wp-block-did-you-know .content > p").forEach((p) => {
          if (!p.textContent.trim() && !p.querySelector("img, a")) p.remove();
        });
      });
    }
    if (hookName === TransformHook2.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "hr.wp-block-separator",
        // Empty decorative bars: <div class="block-border"> (page banner title, did-you-know header)
        ".block-border",
        // Cover overlay: <span class="wp-block-cover__background has-indigo-900-background-color ...">
        ".wp-block-cover__background"
      ]);
      element.querySelectorAll('a[href^="#_ftn"]').forEach((a) => {
        a.replaceWith(a.ownerDocument.createTextNode(a.textContent));
      });
      element.querySelectorAll(RUNTIME_CLASSES.map((c) => `.${c}`).join(",")).forEach((el) => {
        el.classList.remove(...RUNTIME_CLASSES);
        if (!el.classList.length) el.removeAttribute("class");
      });
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/transformers/article-metadata.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ATTR_DATE = "data-excat-article-date";
  var ATTR_CATEGORY = "data-excat-article-category";
  var ATTR_TAGS = "data-excat-article-tags";
  var FR_MONTHS2 = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12
  };
  var CATEGORY_LABELS2 = {
    decryptages: "D\xE9cryptages"
  };
  var pad2 = (n) => String(n).padStart(2, "0");
  var stripAccents2 = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function toIsoDate2(value) {
    if (!value) return "";
    const text = value.trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const fr = stripAccents2(text.toLowerCase()).match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
    if (fr && FR_MONTHS2[fr[2]]) return `${fr[3]}-${pad2(FR_MONTHS2[fr[2]])}-${pad2(fr[1])}`;
    const num = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (num) return `${num[3]}-${pad2(num[2])}-${pad2(num[1])}`;
    return "";
  }
  function jsonLdDatePublished(doc) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
        const hit = nodes.find((n) => n && n.datePublished);
        if (hit) return hit.datePublished;
      } catch (e) {
      }
    }
    return "";
  }
  function readCategory2(element) {
    const article = element.querySelector('article[class*="category_folder-"]');
    const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
    if (m) {
      const slug = m[1];
      return CATEGORY_LABELS2[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    }
    const strong = element.querySelector(".page-header--classic .title-page h2 strong");
    const fromBanner = strong && strong.textContent.trim();
    if (fromBanner) return fromBanner.charAt(0).toUpperCase() + fromBanner.slice(1);
    return "";
  }
  var TAG_LABELS = {
    "comprendre-les-pathologies": "Comprendre les pathologies",
    "comprendre-la-recherche": "Comprendre la recherche",
    "comprendre-nos-engagements": "Comprendre nos engagements"
  };
  function readTags(element) {
    const article = element.querySelector('article[class*="tag_folder-"]');
    if (!article) return [];
    return [...article.className.matchAll(/tag_folder-([a-z0-9-]+)/g)].map(([, slug]) => TAG_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));
  }
  function transform4(hookName, element, payload) {
    const doc = payload && payload.document || element.ownerDocument || document;
    if (hookName === TransformHook3.beforeTransform) {
      const time = element.querySelector("time.single--date");
      let date = "";
      if (time) date = toIsoDate2(time.getAttribute("datetime")) || toIsoDate2(time.textContent);
      if (!date) date = toIsoDate2(jsonLdDatePublished(doc));
      if (!date) {
        const meta = doc.querySelector('meta[property="article:published_time"]');
        date = toIsoDate2(meta && meta.getAttribute("content"));
      }
      if (date) element.setAttribute(ATTR_DATE, date);
      const category = readCategory2(element);
      if (category) element.setAttribute(ATTR_CATEGORY, category);
      const tags = readTags(element);
      if (tags.length) element.setAttribute(ATTR_TAGS, tags.join(", "));
    }
    if (hookName === TransformHook3.afterTransform) {
      let meta = {};
      try {
        meta = WebImporter.Blocks.getMetadata(doc) || {};
      } catch (e) {
        meta = {};
      }
      const pageTemplate = payload && payload.template && payload.template.pageTemplate || "article";
      meta.template = pageTemplate;
      meta.theme = "servier";
      const lang = (doc.documentElement.getAttribute("lang") || "fr").split("-")[0].toLowerCase();
      meta.language = lang || "fr";
      const category = element.getAttribute(ATTR_CATEGORY);
      if (category && pageTemplate === "article") meta.category = category;
      const date = element.getAttribute(ATTR_DATE);
      if (date && pageTemplate === "article") meta["publication-date"] = date;
      const tags = element.getAttribute(ATTR_TAGS);
      if (tags && pageTemplate === "article") meta.keywords = tags;
      element.removeAttribute(ATTR_CATEGORY);
      element.removeAttribute(ATTR_DATE);
      element.removeAttribute(ATTR_TAGS);
      element.append(doc.createElement("hr"), WebImporter.Blocks.getMetadataBlock(doc, meta));
    }
  }

  // tools/importer/import-article.js
  var PAGE_TEMPLATE = {
    "name": "article",
    "description": "Newsroom dossier article: return link, H1, date, long-form editorial body (coloured callouts, did-you-know, figure, table, cover banner, sources), share links",
    "urls": [
      "https://servier.com/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples/"
    ],
    "blocks": [
      {
        "name": "hero-page-banner",
        "instances": [
          "#main > .page-header--classic"
        ]
      },
      {
        "name": "article-header",
        "instances": [
          ".single-wrapper > article > header.wp-block-group > h1"
        ]
      },
      {
        "name": "callout-did-you-know",
        "instances": [
          ".single--content .wp-block-did-you-know"
        ]
      },
      {
        "name": "key-figures",
        "instances": [
          ".single--content .wp-block-columns:has(> .wp-block-column > .wp-block-numbers):not(:has(> .wp-block-column > :not(.wp-block-numbers)))"
        ]
      },
      {
        "name": "table-striped",
        "instances": [
          ".single--content figure.wp-block-table"
        ]
      },
      {
        "name": "hero-cover",
        "instances": [
          ".single--content > .wp-block-cover"
        ]
      },
      {
        "name": "share-social",
        "instances": [
          ".single-wrapper > article > footer.wp-block-group"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "page-banner",
        "selector": [
          "#main > .page-header--classic"
        ],
        "style": null,
        "blocks": [
          "hero-page-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "article-header",
        "selector": [
          ".single-wrapper > article > header.wp-block-group"
        ],
        "style": null,
        "blocks": [
          "article-header"
        ],
        "defaultContent": [
          ".single-wrapper > article > header.wp-block-group > a.btn__return"
        ]
      },
      {
        "id": "3",
        "name": "lead-and-first-chapter",
        "selector": [
          ".single--content > .wp-block-group:first-child"
        ],
        "style": null,
        "blocks": [
          "callout-did-you-know"
        ],
        "defaultContent": [
          ".single--content > .wp-block-group:first-child > p",
          ".single--content > .wp-block-group:first-child > h2"
        ]
      },
      {
        "id": "4",
        "name": "key-facts-box",
        "selector": [
          ".single--content > .wp-block-group.has-indigo-50-background-color"
        ],
        "style": "soft",
        "blocks": [],
        "defaultContent": [
          ".single--content > .wp-block-group.has-indigo-50-background-color > h2",
          ".single--content > .wp-block-group.has-indigo-50-background-color > p"
        ]
      },
      {
        "id": "5",
        "name": "chapters-with-infographic",
        "selector": [
          ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image) > h2",
          ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image) > p",
          ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-image) > figure.wp-block-image"
        ]
      },
      {
        "id": "6",
        "name": "focus-box",
        "selector": [
          ".single--content > .wp-block-group.has-red-100-background-color"
        ],
        "style": "accent",
        "blocks": [],
        "defaultContent": [
          ".single--content > .wp-block-group.has-red-100-background-color > h2",
          ".single--content > .wp-block-group.has-red-100-background-color > p"
        ]
      },
      {
        "id": "7",
        "name": "chapter-after-focus",
        "selector": [
          ".single--content > .wp-block-group.has-red-100-background-color + .wp-block-group"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".single--content > .wp-block-group.has-red-100-background-color + .wp-block-group > p",
          ".single--content > .wp-block-group.has-red-100-background-color + .wp-block-group > h2"
        ]
      },
      {
        "id": "8",
        "name": "key-figures-box",
        "selector": [
          ".single--content > .wp-block-group.has-indigo-900-background-color"
        ],
        "style": "dark",
        "blocks": [
          "key-figures"
        ],
        "defaultContent": [
          ".single--content > .wp-block-group.has-indigo-900-background-color > h2"
        ]
      },
      {
        "id": "9",
        "name": "table-chapter",
        "selector": [
          ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-table)"
        ],
        "style": null,
        "blocks": [
          "table-striped"
        ],
        "defaultContent": [
          ".single--content > .wp-block-group:not(:first-child):has(> figure.wp-block-table) > p"
        ]
      },
      {
        "id": "10",
        "name": "cover",
        "selector": [
          ".single--content > .wp-block-cover"
        ],
        "style": null,
        "blocks": [
          "hero-cover"
        ],
        "defaultContent": []
      },
      {
        "id": "11",
        "name": "references",
        "selector": [
          ".single--content > .article-references",
          ".single--content > .wp-block-group:has(> hr.wp-block-separator)"
        ],
        "style": "references",
        "blocks": [],
        "defaultContent": [
          ".single--content > .wp-block-group:has(> hr.wp-block-separator) > p"
        ]
      },
      {
        "id": "12",
        "name": "share",
        "selector": [
          ".single-wrapper > article > footer.wp-block-group"
        ],
        "style": null,
        "blocks": [
          "share-social"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "hero-page-banner": parse,
    "article-header": parse2,
    "callout-did-you-know": parse3,
    "key-figures": parse4,
    "table-striped": parse5,
    "hero-cover": parse6,
    "share-social": parse7
  };
  var transformers = [
    transform,
    transform2,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : [],
    transform4
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
  var import_article_default = {
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
      document2.querySelectorAll(".single--content > .wp-block-group").forEach((group) => {
        if (group.querySelector(":scope > hr.wp-block-separator")) group.classList.add("article-references");
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
  return __toCommonJS(import_article_exports);
})();
