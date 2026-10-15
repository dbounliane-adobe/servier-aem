#!/usr/bin/env python3
"""
Builds the AEM content package (FileVault) for the Servier newsroom dossiers blog:

  /content/servier-aem/newsroom                (container page, created only if missing)
  /content/servier-aem/newsroom/dossiers       (container page, created only if missing)
  /content/servier-aem/newsroom/dossiers/index (listing, served at /newsroom/dossiers/)
  /content/servier-aem/newsroom/dossiers/<slug> (Becker article + 42 card-only articles)
  /content/dam/servier-aem/newsroom/*          (all their images)

Page XML comes from migration-work/jcr-content/newsroom/dossiers/<slug>.xml (html2md +
md2jcr from content/newsroom/dossiers/<slug>.plain.html), images from
migration-work/aem-assets/newsroom/. Homepage, nav and footer are not part of it.
Only each page node + its jcr:content is replaced. Usage:
  python3 tools/aem-packages/build-blog.py
"""
import os
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
NAME = f'{SITE}-newsroom-dossiers'
PAGES_DIR = os.path.join(ROOT, 'migration-work', 'jcr-content', 'newsroom', 'dossiers')
IMAGES_DIR = os.path.join(ROOT, 'migration-work', 'aem-assets', 'newsroom')
BLOG_PATH = f'/content/{SITE}/newsroom/dossiers'
NEWSROOM_PATH = f'/content/{SITE}/newsroom'
DAM_PATH = f'/content/dam/{SITE}/newsroom'
MIME = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.gif': 'image/gif'}
OUT = os.path.join(ROOT, 'tools', 'aem-packages', 'dist', f'{NAME}-{VERSION}.zip')

NS = ('xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" '
      'xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" '
      'xmlns:dam="http://www.day.com/dam/1.0" xmlns:dc="http://purl.org/dc/elements/1.1/"')
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'


def container_page(title):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="cq:Page">\n'
            f'    <jcr:content cq:template="/libs/core/franklin/templates/page" '
            f'sling:resourceType="core/franklin/components/page/v1/page" '
            f'jcr:primaryType="cq:PageContent" jcr:title="{escape(title)}"/>\n'
            '</jcr:root>\n')


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


def main():
    slugs = sorted(f[:-4] for f in os.listdir(PAGES_DIR) if f.endswith('.xml'))
    images = sorted(f for f in os.listdir(IMAGES_DIR) if os.path.splitext(f)[1].lower() in MIME)

    includes = ''.join(f'        <include pattern="{BLOG_PATH}/{s}"/>\n'
                       f'        <include pattern="{BLOG_PATH}/{s}/jcr:content(/.*)?"/>\n' for s in slugs)
    filters = (f'{HEAD}<workspaceFilter version="1.0">\n'
               # container pages: only created when missing, never overwritten
               f'    <filter root="{NEWSROOM_PATH}" mode="merge">\n'
               f'        <include pattern="{NEWSROOM_PATH}"/>\n'
               f'        <include pattern="{NEWSROOM_PATH}/jcr:content(/.*)?"/>\n'
               f'        <include pattern="{BLOG_PATH}"/>\n'
               f'        <include pattern="{BLOG_PATH}/jcr:content(/.*)?"/>\n'
               '    </filter>\n'
               f'    <filter root="{BLOG_PATH}">\n{includes}    </filter>\n'
               f'    <filter root="{DAM_PATH}"/>\n'
               '</workspaceFilter>\n')
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{NAME}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  f'    <entry key="description">Servier newsroom dossiers: listing, {len(slugs) - 1} articles, {len(images)} images</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', filters)
        z.writestr('META-INF/vault/properties.xml', properties)
        z.writestr(f'jcr_root{NEWSROOM_PATH}/.content.xml', container_page('Newsroom'))
        z.writestr(f'jcr_root{BLOG_PATH}/.content.xml', container_page('Dossiers'))
        for slug in slugs:
            xml = open(os.path.join(PAGES_DIR, f'{slug}.xml'), encoding='utf-8').read()
            z.writestr(f'jcr_root{BLOG_PATH}/{slug}/.content.xml', xml)
        z.writestr(f'jcr_root/content/dam/{SITE}/.content.xml', folder(SITE))
        z.writestr(f'jcr_root{DAM_PATH}/.content.xml', folder('Newsroom'))
        for file in images:
            mime = MIME[os.path.splitext(file)[1].lower()]
            base = f'jcr_root{DAM_PATH}/{file}'
            z.writestr(f'{base}/.content.xml', asset(os.path.splitext(file)[0], mime))
            z.write(os.path.join(IMAGES_DIR, file), f'{base}/_jcr_content/renditions/original')
            z.writestr(f'{base}/_jcr_content/renditions/original.dir/.content.xml', original_dir(mime))
    print(OUT, f'{len(slugs)} pages, {len(images)} images')


if __name__ == '__main__':
    main()
