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

  // tools/importer/import-dossiers-listing.js
  var import_dossiers_listing_exports = {};
  __export(import_dossiers_listing_exports, {
    default: () => import_dossiers_listing_default
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

  // tools/importer/parsers/article-list.js
  function parse2(element, { document: document2 }) {
    const clean = (node) => node ? node.textContent.replace(/\s+/g, " ").trim() : "";
    const form = element.querySelector(".filters form, form");
    const filterLabel = form ? clean(form.querySelector(":scope > label")) : "";
    const dropdowns = form ? [...form.querySelectorAll(":scope > .dropdown, :scope > div:not(.select-wrap):not(.dropdown) ul")] : [];
    const dropdownLabel = (idPart, index) => {
      if (!form) return "";
      const input = form.querySelector(`input[id*="${idPart}"]`);
      let dd = input ? input.closest(".dropdown") || input.parentElement : null;
      if (!dd) dd = dropdowns[index] || null;
      if (!dd) return "";
      const lbl = [...dd.querySelectorAll("label")].find((l) => !l.closest("li"));
      return clean(lbl);
    };
    const categoryLabel = dropdownLabel("categor", 0);
    const tagsLabel = dropdownLabel("tag", 1);
    const selects = form ? [...form.querySelectorAll("select")] : [];
    const placeholder = (sel) => clean(sel && sel.querySelector("option"));
    let yearSel = selects.find((s) => /ann|year/i.test(`${s.name} ${s.id} ${placeholder(s)}`));
    let monthSel = selects.find((s) => /mois|month/i.test(`${s.name} ${s.id} ${placeholder(s)}`));
    if (!yearSel) [yearSel] = selects;
    if (!monthSel) [, monthSel] = selects;
    const yearLabel = placeholder(yearSel);
    const monthLabel = placeholder(monthSel);
    const buttons = form ? [...form.querySelectorAll('button, input[type="submit"]')] : [];
    const subscribeBtn = element.querySelector(".email-alert-link");
    const submitBtn = buttons.find((b) => !b.classList.contains("email-alert-link"));
    const submitLabel = submitBtn ? clean(submitBtn) || submitBtn.value || "" : "";
    const subscribeLabel = clean(subscribeBtn);
    let subscribe = "";
    if (subscribeBtn) {
      const href = subscribeBtn.getAttribute("href") || (subscribeBtn.closest("a[href]") || {}).href || "";
      if (href && !href.startsWith("#") && !href.startsWith("javascript")) subscribe = href;
    }
    const more = element.querySelector("a.btn__more[title], footer a[title]");
    const readMore = more ? more.getAttribute("title").trim() : "";
    const cells = [
      ["source", "/query-index.json"],
      ["prefix", "/newsroom/dossiers/"],
      ["pageSize", "9"],
      ["filters", "category,tags,year,month"],
      ["filterLabel", filterLabel],
      ["categoryLabel", categoryLabel],
      ["yearLabel", yearLabel],
      ["monthLabel", monthLabel],
      ["tagsLabel", tagsLabel],
      ["submitLabel", submitLabel],
      ["resetLabel", ""],
      ["readMore", readMore],
      ["results", ""],
      ["empty", ""],
      ["noResults", ""],
      ["error", ""],
      ["subscribe", subscribe],
      ["subscribeLabel", subscribeLabel]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "article-list", cells });
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
  var CATEGORY_LABELS = {
    decryptages: "D\xE9cryptages"
  };
  var pad = (n) => String(n).padStart(2, "0");
  var stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function toIsoDate(value) {
    if (!value) return "";
    const text = value.trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const fr = stripAccents(text.toLowerCase()).match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
    if (fr && FR_MONTHS[fr[2]]) return `${fr[3]}-${pad(FR_MONTHS[fr[2]])}-${pad(fr[1])}`;
    const num = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (num) return `${num[3]}-${pad(num[2])}-${pad(num[1])}`;
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
  function readCategory(element) {
    const strong = element.querySelector(".page-header--classic .title-page h2 strong");
    const fromBanner = strong && strong.textContent.trim();
    if (fromBanner) return fromBanner.charAt(0).toUpperCase() + fromBanner.slice(1);
    const article = element.querySelector('article[class*="category_folder-"]');
    const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
    if (m) {
      const slug = m[1];
      return CATEGORY_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    }
    return "";
  }
  function transform4(hookName, element, payload) {
    const doc = payload && payload.document || element.ownerDocument || document;
    if (hookName === TransformHook3.beforeTransform) {
      const time = element.querySelector("time.single--date");
      let date = "";
      if (time) date = toIsoDate(time.getAttribute("datetime")) || toIsoDate(time.textContent);
      if (!date) date = toIsoDate(jsonLdDatePublished(doc));
      if (!date) {
        const meta = doc.querySelector('meta[property="article:published_time"]');
        date = toIsoDate(meta && meta.getAttribute("content"));
      }
      if (date) element.setAttribute(ATTR_DATE, date);
      const category = readCategory(element);
      if (category) element.setAttribute(ATTR_CATEGORY, category);
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
      element.removeAttribute(ATTR_CATEGORY);
      element.removeAttribute(ATTR_DATE);
      element.append(doc.createElement("hr"), WebImporter.Blocks.getMetadataBlock(doc, meta));
    }
  }

  // tools/importer/import-dossiers-listing.js
  var PAGE_TEMPLATE = {
    "name": "dossiers-listing",
    "description": "Newsroom dossiers listing: page banner, filters (sub-category, year, month), 9-card article grid, pagination",
    "urls": [
      "https://servier.com/newsroom/dossiers/"
    ],
    "blocks": [
      {
        "name": "hero-page-banner",
        "instances": [
          "#main > .page-header--classic"
        ]
      },
      {
        "name": "article-list",
        "instances": [
          "#main > .container.mx-auto:not(.page-header--classic)"
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
        "name": "article-list",
        "selector": [
          "#main > .container.mx-auto:not(.page-header--classic)"
        ],
        "style": null,
        "blocks": [
          "article-list"
        ],
        "defaultContent": []
      }
    ],
    "pageTemplate": "listing"
  };
  var parsers = {
    "hero-page-banner": parse,
    "article-list": parse2
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
  var import_dossiers_listing_default = {
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
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : `${rawPath}/index`);
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
  return __toCommonJS(import_dossiers_listing_exports);
})();
