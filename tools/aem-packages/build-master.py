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

Page XML comes from migration-work/jcr-content/ (same sources as the root packages) with:
  - no page-level theme: the theme comes from the metadata sheet (page values would win);
  - internal links (rich text hrefs, *link / prefix fields) rewritten from /<path> to
    /content/servier-aem/master/fr/<path>: Edge Delivery maps them to /master/fr/<path>
    (paths.json) and MSM / translation rewrite them for each language copy and live copy.
    Kept as is: external URLs, /content/... paths, *.json, #anchors, other language
    trees (/en/...). The comex Content Fragments are shared and not part of this package.
Images are taken from the root packages in dist/. Usage:
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
IMAGE_PACKAGES = ['index', 'header-nav', 'footer', 'newsroom-dossiers', 'comex-page']

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


def dam_entries():
    """DAM files of the root packages: assets (path -> files) and their folders (path -> .content.xml)."""
    assets, folders = {}, {}
    for key in IMAGE_PACKAGES:
        with zipfile.ZipFile(os.path.join(DIST, f'{SITE}-{key}-{VERSION}.zip')) as z:
            for name in z.namelist():
                f = re.match(rf'jcr_root(/content/dam/{SITE}/[^/]+)/\.content\.xml$', name)
                if f:
                    folders[f.group(1)] = (name, z.read(name))
                m = re.match(rf'jcr_root(/content/dam/{SITE}/[^/]+)/([^/]+\.[a-z0-9]+)/', name, re.I)
                if m:
                    asset = f'{m.group(1)}/{m.group(2)}'
                    assets.setdefault(asset, {})[name] = z.read(name)
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
