/* eslint-disable */
// Converts content/groupe/comex/index.plain.html to AEM JCR XML (html2md + md2jcr) for
// tools/aem-packages/build-comex-page.py. Run from a folder where @adobe/helix-html2md and
// @adobe/helix-md2jcr are installed (e.g. /tmp/md2jcr): node tools/aem-packages/convert-comex.mjs

import fs from 'fs';
import { html2md } from '@adobe/helix-html2md';
import { md2jcr } from '@adobe/helix-md2jcr';

const root = '/backups/dbounliane-adobe/servier-aem/repo';
const DAM = '/content/dam/servier-aem/comex';
const srcDir = `${root}/content/groupe/comex`;
const outDir = `${root}/migration-work/jcr-content/groupe/comex`;
const read = (f) => JSON.parse(fs.readFileSync(`${root}/${f}`, 'utf8'));
const models = read('component-models.json');
const filters = read('component-filters.json');
// md2jcr matches markdown block names against component titles; UE labels are
// prefixed ("Servier …"), html2md derives names from the class (hero-cta → "Hero Cta")
const definition = read('component-definition.json');
const fromId = (id) => id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
definition.groups.forEach((g) => g.components.forEach((c) => {
  if (c.plugins?.xwalk?.page?.template?.name) c.title = fromId(c.id);
}));
const log = { info() {}, warn: console.warn, error: console.error, debug() {} };

fs.mkdirSync(outDir, { recursive: true });
const report = [];
for (const file of fs.readdirSync(srcDir).filter((f) => f === 'index.plain.html')) {
  const slug = file.replace('.plain.html', '');
  let plain = fs.readFileSync(`${srcDir}/${file}`, 'utf8');
  // servier.com uploads → DAM (downloaded to migration-work/aem-assets/newsroom)
  plain = plain.replace(/https:\/\/servier\.com\/wp-content\/uploads\/[^"'\s)]*\/([^"'\s)/]+\.(?:jpe?g|png|webp|gif|svg))/gi, `${DAM}/$1`);
  const title = (plain.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || slug;
  const html = `<html><head><title>${title.replace(/<[^>]+>/g, '')}</title></head><body><main>${plain}</main></body></html>`;
  let md = await html2md(html, { log, url: 'https://servier.com/', mediaHandler: null, maxImages: 200 });
  // page model field is "image" (md2jcr matches metadata keys case-sensitively):
  // the card/og image becomes the page's image node (fileReference)
  md = md.replace(/^\| Image(\s+)\|/m, '| image$1|');
  let xml = await md2jcr(md, { models, definition, filters });
  // metadata table sits in its own section: drop the empty trailing section it leaves
  xml = xml.replace(/\s*<section_\d+ [^>]*><\/section_\d+>(\s*<\/root>)/, '$1');
  // comex-members "members" is a multi aem-content field: md2jcr keeps only the first
  // link of the cell. Store the ordered CF paths (what authors pick in Universal Editor;
  // the site paths mapping turns /content/dam/servier-aem/comex/<slug> into /groupe/comex/<slug>)
  const membersCell = (plain.match(/<div class="comex-members">[\s\S]*?<\/ul>/) || [''])[0];
  const slugs = [...membersCell.matchAll(/href="\/groupe\/comex\/([^"/]+)"/g)].map((m) => m[1]);
  if (slugs.length) {
    xml = xml.replace(/ members="[^"]*"/, ` members="[${slugs.map((s) => `/content/dam/servier-aem/comex/${s}`).join(',')}]"`);
  }
  fs.writeFileSync(`${outDir}/${slug}.xml`, xml);
  report.push({
    slug,
    sections: (xml.match(/<section(_\d+)? /g) || []).length,
    blocks: (xml.match(/ name="[^"]+"/g) || []).map((n) => n.slice(7, -1)),
    image: (xml.match(/jcr:content [^>]*?\simage="([^"]*)"/) || [])[1] || '',
    template: (xml.match(/jcr:content [^>]*?\stemplate="([^"]*)"/) || [])[1] || '',
    keywords: (xml.match(/jcr:content [^>]*?\skeywords="([^"]*)"/) || [])[1] || '',
  });
}
fs.writeFileSync(`${root}/migration-work/jcr-content/groupe/report.json`, JSON.stringify(report, null, 1));
console.log('pages', report.length);
