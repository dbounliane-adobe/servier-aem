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

  // tools/importer/import-comex.js
  var import_comex_exports = {};
  __export(import_comex_exports, {
    default: () => import_comex_default
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

  // tools/importer/parsers/columns.js
  function parse2(element, { document: document2 }) {
    let columns = [...element.querySelectorAll(":scope > .wp-block-column")];
    if (!columns.length) columns = [...element.children];
    const hasContent = (col) => col.textContent.trim() !== "" || col.querySelector("img, picture, video, iframe, a[href]");
    const row = columns.filter(hasContent).map((col) => {
      const content = [...col.children].filter((child) => child.textContent.trim() !== "" || child.querySelector("img, picture, video, iframe"));
      return content.length ? content : [...col.childNodes];
    });
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/comex-members.js
  function parse3(element, { document: document2 }) {
    const clean = (node) => node ? node.textContent.replace(/\s+/g, " ").trim() : "";
    const toSlug = (href) => {
      let path = href || "";
      try {
        path = new URL(href, "https://servier.com").pathname;
      } catch (e) {
      }
      const last = path.replace(/\/+$/, "").split("/").pop() || "";
      return last.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^comite-executif-/, "").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    };
    const isDetailLink = (a) => /\/groupe\/comex\/[^/]+/.test(a.getAttribute("href") || "") && !/linkedin\.com/i.test(a.getAttribute("href") || "");
    let cards = [...element.querySelectorAll(".wp-block-column > .wp-block-group")].filter((g) => [...g.querySelectorAll("a[href]")].some(isDetailLink));
    if (!cards.length) {
      cards = [...element.querySelectorAll(".wp-block-column")].filter((c) => !c.querySelector(".wp-block-column") && [...c.querySelectorAll("a[href]")].some(isDetailLink));
    }
    const seen = /* @__PURE__ */ new Set();
    const members = [];
    cards.forEach((card) => {
      const link = card.querySelector("a.wp-block-button__link[href]") || [...card.querySelectorAll("a[href]")].find(isDetailLink);
      if (!link) return;
      const slug = toSlug(link.getAttribute("href"));
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const nameEl = card.querySelector("p.mb-0 strong, p strong, h2, h3, h4");
      const name = clean(nameEl) || slug;
      members.push({ slug, name });
    });
    if (!members.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const list = document2.createElement("ul");
    members.forEach(({ slug, name }) => {
      const li = document2.createElement("li");
      const a = document2.createElement("a");
      a.href = `/groupe/comex/${slug}`;
      a.textContent = name;
      li.append(a);
      list.append(li);
    });
    const readMoreEl = element.querySelector(".wp-block-button a.wp-block-button__link, a.wp-element-button");
    const readMore = clean(readMoreEl);
    const linkedinImg = element.querySelector('a[href*="linkedin.com"] img[alt], img[src*="linkedin"][alt], img[data-lazy-src*="linkedin"][alt]');
    const linkedinLabel = linkedinImg ? linkedinImg.getAttribute("alt").trim() : "";
    const cells = [
      ["members", list],
      ["readMore", readMore],
      ["linkedinLabel", linkedinLabel]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "comex-members", cells });
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

  // tools/importer/transformers/comex-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_HOSTS = ["servier.com", "www.servier.com"];
  var capturedCrumbs = [];
  function toSiteRelative(href) {
    if (!href) return href;
    try {
      const url = new URL(href, "https://servier.com/");
      if (SOURCE_HOSTS.includes(url.hostname)) return `${url.pathname}${url.search}${url.hash}`;
    } catch (e) {
    }
    return href;
  }
  function captureBreadcrumbs(element) {
    const crumbsEl = element.querySelector(".page-header--classic .breadcrumbs");
    if (!crumbsEl) return [];
    const items = [...crumbsEl.querySelectorAll("a, .breadcrumb_last")];
    const crumbs = items.map((item) => ({
      text: item.textContent.replace(/\s+/g, " ").trim(),
      href: item.tagName === "A" ? toSiteRelative(item.getAttribute("href")) : null
    })).filter((c) => c.text);
    if (crumbs.length) crumbs[crumbs.length - 1].href = null;
    return crumbs;
  }
  function buildCrumbList(doc, crumbs) {
    const ul = doc.createElement("ul");
    crumbs.forEach(({ text, href }, i) => {
      const li = doc.createElement("li");
      if (href && i < crumbs.length - 1) {
        const a = doc.createElement("a");
        a.setAttribute("href", href);
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    return ul;
  }
  function findBannerTextCell(element) {
    const tables = [...element.querySelectorAll("table")];
    const block = tables.find((t) => {
      const first = t.querySelector("tr");
      const name = first && first.textContent.trim().toLowerCase().replace(/\s+/g, "-");
      return name && /^hero-page-banner\b/.test(name);
    });
    if (block) {
      const rows = [...block.querySelectorAll(":scope > tbody > tr, :scope > tr")].slice(1);
      const textRow = rows.find((r) => r.querySelector("h1, h2, h3, h4, h5, h6")) || rows.find((r) => !r.querySelector("img, picture"));
      return textRow ? textRow.querySelector("td") : null;
    }
    return element.querySelector(".page-header--classic .title-page");
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const doc = element.ownerDocument;
      capturedCrumbs = captureBreadcrumbs(element);
      WebImporter.DOMUtils.remove(element, [".page-header--classic .breadcrumbs"]);
      element.querySelectorAll(".wp-block-columns.has-logo > .wp-block-column").forEach((col) => {
        if (!col.textContent.trim() && !col.querySelector("img, picture, video, iframe")) col.remove();
      });
      element.querySelectorAll(".wp-block-button a.wp-block-button__link").forEach((a) => {
        if (a.closest(".has-indigo-50-background-color")) return;
        a.setAttribute("href", toSiteRelative(a.getAttribute("href")));
        if (a.closest("strong, b")) return;
        const strong = doc.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
    }
    if (hookName === TransformHook2.afterTransform) {
      if (!capturedCrumbs.length) return;
      const cell = findBannerTextCell(element);
      if (!cell) return;
      const list = buildCrumbList(element.ownerDocument, capturedCrumbs);
      const heading = cell.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading && heading.parentElement === cell) heading.after(list);
      else cell.append(list);
      capturedCrumbs = [];
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
    const article = element.querySelector('article[class*="category_folder-"]');
    const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
    if (m) {
      const slug = m[1];
      return CATEGORY_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
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
      if (time) date = toIsoDate(time.getAttribute("datetime")) || toIsoDate(time.textContent);
      if (!date) date = toIsoDate(jsonLdDatePublished(doc));
      if (!date) {
        const meta = doc.querySelector('meta[property="article:published_time"]');
        date = toIsoDate(meta && meta.getAttribute("content"));
      }
      if (date) element.setAttribute(ATTR_DATE, date);
      const category = readCategory(element);
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

  // tools/importer/import-comex.js
  var PAGE_TEMPLATE = {
    "name": "comex",
    "description": "COMEX listing: page banner, intro (eyebrow + 2 columns), member grid fed by the comex Content Fragments, governance CTA",
    "urls": [
      "https://servier.com/groupe/comex/"
    ],
    "blocks": [
      {
        "name": "hero-page-banner",
        "instances": [
          "#main > .page-header--classic"
        ]
      },
      {
        "name": "columns",
        "instances": [
          ".content-page > .wp-block-group.alignwide > .wp-block-columns.has-logo"
        ]
      },
      {
        "name": "comex-members",
        "instances": [
          ".content-page > .wp-block-group.has-indigo-50-background-color"
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
        "name": "intro",
        "selector": [
          ".content-page > .wp-block-group.alignwide"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": [
          ".content-page > .wp-block-group.alignwide > p.is-style-surtitle"
        ]
      },
      {
        "id": "3",
        "name": "members",
        "selector": [
          ".content-page > .wp-block-group.has-indigo-50-background-color"
        ],
        "style": "soft",
        "blocks": [
          "comex-members"
        ],
        "defaultContent": []
      },
      {
        "id": "4",
        "name": "governance-cta",
        "selector": [
          ".content-page > .wp-block-group.is-layout-constrained:not(.alignfull):not(.alignwide)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".content-page > .wp-block-group.is-layout-constrained:not(.alignfull):not(.alignwide) > h2",
          ".content-page > .wp-block-group.is-layout-constrained:not(.alignfull):not(.alignwide) .wp-block-buttons"
        ]
      }
    ],
    "pageTemplate": "comex"
  };
  var parsers = {
    "hero-page-banner": parse,
    "columns": parse2,
    "comex-members": parse3
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
  var import_comex_default = {
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
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath + "/index");
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
  return __toCommonJS(import_comex_exports);
})();
