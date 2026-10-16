#!/usr/bin/env python3
"""
Builds the French language master package (FileVault): the whole migrated site under
/content/servier-aem/master/fr, the source for translation projects and live copies
(e.g. /content/servier-aem/fr/fr). The root site (/content/servier-aem/index...) is not touched.

  /content/servier-aem/master                     container, created only if missing
  /content/servier-aem/master/fr                  language root (jcr:language=fr), created only if missing
  /content/servier-aem/master/fr/index|nav|footer homepage + header/footer fragments
  /content/servier-aem/master/fr/newsroom/dossiers/index + 43 articles
  /content/servier-aem/master/fr/groupe/comex/index
  /content/dam/servier-aem/...                    the images they use (shared by all languages;
                                                  each asset replaced alone, folders merged)

Page XML comes from migration-work/jcr-content/ (html2md + md2jcr of the imported pages) with:
  - no page-level theme: the theme comes from the metadata sheet (page values would win);
  - internal links (rich text hrefs, *link / prefix fields) rewritten from /<path> to
    /content/servier-aem/master/fr/<path>: Edge Delivery maps them to /master/fr/<path>
    (paths.json) and MSM / translation rewrite them for each language copy and live copy.
    Kept as is: external URLs, /content/... paths, *.json, #anchors, other language
    trees (/en/...). The comex Content Fragments are shared and not part of this package.
Images: migration-work/aem-assets/ and content/images/ (header/footer). Usage:
  python3 tools/aem-packages/build-master.py
"""
import os
import re
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
NAME = f'{SITE}-master-fr'
SITE_PATH = f'/content/{SITE}'
MASTERS = f'{SITE_PATH}/master'
LANG_ROOT = f'{MASTERS}/fr'
SRC = os.path.join(ROOT, 'migration-work', 'jcr-content')
DIST = os.path.join(ROOT, 'tools', 'aem-packages', 'dist')
OUT = os.path.join(DIST, f'{NAME}-{VERSION}.zip')
ASSETS = os.path.join(ROOT, 'migration-work', 'aem-assets')
CONTENT_IMAGES = os.path.join(ROOT, 'content', 'images')
MIME = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.gif': 'image/gif'}
# DAM folder -> (folder title, source directory, [(file, title)]; None = every image of the directory)
DAM_IMAGES = {
    'index': ('Index', os.path.join(ASSETS, 'index'), [
        ('servier-carrieres-ambassadeurs_h.png', 'Rejoignez une aventure humaine'),
        ('image-aires-scaled.webp', 'Aires thérapeutiques (fond)'),
        ('servier-decryptage-cancer-colorectal.jpg', 'Cancer colorectal'),
        ('servier-decryptage-cholangiocarcinome-tumeur-patient-cancer.jpg', 'Cholangiocarcinome'),
        ('servier-decryptage-gliome-tumeur-cerebrale.png', 'Gliome'),
        ('banner-contact-scaled.webp', 'Nous rejoindre (fond)'),
    ]),
    'header': ('Header', CONTENT_IMAGES, [
        ('header-logo-servier.svg', 'Servier logo (white, over hero)'),
        ('header-logo-servier-dark.svg', 'Servier logo (indigo, sticky bar)'),
        ('header-icon-search.svg', 'Search icon'),
    ]),
    'footer': ('Footer', CONTENT_IMAGES, [
        ('footer-logo-servier.svg', 'Servier logo (footer)'),
        ('footer-social-facebook.svg', 'Facebook'),
        ('footer-social-twitter.svg', 'X (Twitter)'),
        ('footer-social-instagram.svg', 'Instagram'),
        ('footer-social-linkedin.svg', 'LinkedIn'),
        ('footer-kastor-ecodesign-score.svg', 'Kastor eco-design score badge'),
    ]),
    'newsroom': ('Newsroom', os.path.join(ASSETS, 'newsroom'), None),
    # COMEX page images; the Content Fragments + photos are in the comex-cfs package
    'comex': ('COMEX', os.path.join(ASSETS, 'comex'), [
        ('servier-banniere-officielle-logo.jpg', 'Bannière officielle de Servier'),
        ('servier-logo_n.jpg', 'Servier'),
    ]),
}

# container pages (merge: created when missing, never overwritten), parents first
CONTAINERS = [
    (MASTERS, 'Language Masters', None),
    (LANG_ROOT, 'Français', 'fr'),
    (f'{LANG_ROOT}/newsroom', 'Newsroom', None),
    (f'{LANG_ROOT}/newsroom/dossiers', 'Dossiers', None),
    (f'{LANG_ROOT}/groupe', 'Groupe Servier', None),
    (f'{LANG_ROOT}/groupe/comex', 'Comité Exécutif', None),
]

NS = ('xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" '
      'xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" '
      'xmlns:dam="http://www.day.com/dam/1.0" xmlns:dc="http://purl.org/dc/elements/1.1/"')
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'

KEEP = re.compile(r'^(//|/content/|/[a-z]{2}(?:[-_][a-z]{2})?(?:/|$))|\.json(?:$|[?#])', re.I)
RICH_HREF = re.compile(r'(href(?:&#x3D;|=)&quot;)(/[^&"]*)(&quot;)')
LINK_ATTR = re.compile(r'(\s[\w:]*(?:link|Link|prefix)=")(/[^"]*)(")')
THEME_ATTR = re.compile(r' theme="[^"]*"')


def container_page(title, language=None):
    lang = f' jcr:language="{language}"' if language else ''
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="cq:Page">\n'
            f'    <jcr:content cq:template="/libs/core/franklin/templates/page" '
            f'sling:resourceType="core/franklin/components/page/v1/page" '
            f'jcr:primaryType="cq:PageContent" jcr:title="{escape(title)}"{lang}/>\n'
            '</jcr:root>\n')


def localize(path):
    return path if KEEP.search(path) else f'{LANG_ROOT}{path}'


def to_master(xml, stats):
    def sub(match):
        new = localize(match.group(2))
        stats['links' if new != match.group(2) else 'kept'] += 1
        return f'{match.group(1)}{new}{match.group(3)}'
    xml, themes = THEME_ATTR.subn('', xml)
    stats['themes'] += themes
    return LINK_ATTR.sub(sub, RICH_HREF.sub(sub, xml))


def pages():
    """(master page path, source xml file) for every migrated page."""
    out = [(f'{LANG_ROOT}/{name}', os.path.join(SRC, f'{name}.xml')) for name in ('index', 'nav', 'footer')]
    dossiers = os.path.join(SRC, 'newsroom', 'dossiers')
    out += [(f'{LANG_ROOT}/newsroom/dossiers/{f[:-4]}', os.path.join(dossiers, f))
            for f in sorted(os.listdir(dossiers)) if f.endswith('.xml')]
    out.append((f'{LANG_ROOT}/groupe/comex/index', os.path.join(SRC, 'groupe', 'comex', 'index.xml')))
    return out


def folder(title):
    return f'{HEAD}<jcr:root {NS} jcr:primaryType="sling:OrderedFolder" jcr:title="{escape(title)}"/>\n'


def asset(title, mime):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="dam:Asset">\n'
            '    <jcr:content jcr:primaryType="dam:AssetContent">\n'
            f'        <metadata jcr:primaryType="nt:unstructured" dc:format="{mime}" dc:title="{escape(title)}"/>\n'
            '        <renditions jcr:primaryType="nt:folder"/>\n'
            '    </jcr:content>\n'
            '</jcr:root>\n')


def original_dir(mime):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="nt:file">\n'
            f'    <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="{mime}"/>\n'
            '</jcr:root>\n')


def dam_entries():
    """Images used by the pages: assets (path -> files) and their folders (path -> .content.xml)."""
    assets, folders = {}, {}
    for key, (title, source, images) in DAM_IMAGES.items():
        path = f'/content/dam/{SITE}/{key}'
        folders[path] = (f'jcr_root{path}/.content.xml', folder(title).encode('utf-8'))
        if images is None:
            images = [(f, os.path.splitext(f)[0]) for f in sorted(os.listdir(source))
                      if os.path.splitext(f)[1].lower() in MIME]
        for file, image_title in images:
            mime = MIME[os.path.splitext(file)[1].lower()]
            base = f'jcr_root{path}/{file}'
            assets[f'{path}/{file}'] = {
                f'{base}/.content.xml': asset(image_title, mime).encode('utf-8'),
                f'{base}/_jcr_content/renditions/original': open(os.path.join(source, file), 'rb').read(),
                f'{base}/_jcr_content/renditions/original.dir/.content.xml': original_dir(mime).encode('utf-8'),
            }
    return assets, folders


def main():
    stats = {'links': 0, 'kept': 0, 'themes': 0}
    page_list = pages()
    assets, dam_folders = dam_entries()

    merge = ''.join(f'        <include pattern="{p}"/>\n        <include pattern="{p}/jcr:content(/.*)?"/>\n'
                    for p, _, _ in CONTAINERS)
    page_filters = ''.join(f'    <filter root="{p}">\n'
                           f'        <include pattern="{p}"/>\n'
                           f'        <include pattern="{p}/jcr:content(/.*)?"/>\n'
                           '    </filter>\n' for p, _ in page_list)
    dam_merge = ''.join(f'        <include pattern="{f}"/>\n' for f in sorted(dam_folders))
    dam_filters = ''.join(f'    <filter root="{a}"/>\n' for a in sorted(assets))
    filters = (f'{HEAD}<workspaceFilter version="1.0">\n'
               f'    <filter root="{MASTERS}" mode="merge">\n{merge}    </filter>\n'
               f'{page_filters}'
               f'    <filter root="/content/dam/{SITE}" mode="merge">\n'
               f'        <include pattern="/content/dam/{SITE}"/>\n{dam_merge}    </filter>\n'
               f'{dam_filters}'
               '</workspaceFilter>\n')
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{NAME}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  f'    <entry key="description">French language master ({LANG_ROOT}): '
                  f'{len(page_list)} pages, {len(assets)} images</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')

    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', filters)
        z.writestr('META-INF/vault/properties.xml', properties)
        for path, title, language in CONTAINERS:
            z.writestr(f'jcr_root{path}/.content.xml', container_page(title, language))
        for path, src in page_list:
            xml = open(src, encoding='utf-8').read()
            z.writestr(f'jcr_root{path}/.content.xml', to_master(xml, stats))
        z.writestr(f'jcr_root/content/dam/{SITE}/.content.xml',
                   f'{HEAD}<jcr:root {NS} jcr:primaryType="sling:OrderedFolder" jcr:title="{SITE}"/>\n')
        for name, data in dam_folders.values():
            z.writestr(name, data)
        for files in assets.values():
            for name, data in files.items():
                z.writestr(name, data)
    print(OUT, f"{len(page_list)} pages, {len(assets)} images, {stats['links']} links localized, "
               f"{stats['kept']} kept, {stats['themes']} page themes removed")


if __name__ == '__main__':
    main()
