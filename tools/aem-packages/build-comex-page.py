#!/usr/bin/env python3
"""
Builds the AEM content package for the COMEX listing page:

  /content/servier-aem/groupe                 (container page, created only if missing)
  /content/servier-aem/groupe/comex           (container page, created only if missing)
  /content/servier-aem/groupe/comex/index     (listing, served at /groupe/comex/)
  /content/dam/servier-aem/comex/servier-banniere-officielle-logo.jpg  (banner image)
  /content/dam/servier-aem/comex/servier-logo_n.jpg                    (og:image)

The member cards are NOT in the page: the comex-members block lists the comex Content
Fragments (/content/dam/servier-aem/comex/<slug>, see build-comex-cfs.py) in the authored
order and reads each one from its CF overlay page /groupe/comex/<slug>.
Page XML: migration-work/jcr-content/groupe/comex/index.xml (convert-comex.mjs). Usage:
  python3 tools/aem-packages/build-comex-page.py
"""
import os
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
NAME = f'{SITE}-comex-page'
GROUPE = f'/content/{SITE}/groupe'
COMEX = f'{GROUPE}/comex'
DAM = f'/content/dam/{SITE}/comex'
PAGE_XML = os.path.join(ROOT, 'migration-work', 'jcr-content', 'groupe', 'comex', 'index.xml')
ASSETS_DIR = os.path.join(ROOT, 'migration-work', 'aem-assets', 'comex')
IMAGES = [('servier-banniere-officielle-logo.jpg', 'Bannière officielle de Servier'),
          ('servier-logo_n.jpg', 'Servier')]
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


def asset(title):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="dam:Asset">\n'
            '    <jcr:content jcr:primaryType="dam:AssetContent">\n'
            f'        <metadata jcr:primaryType="nt:unstructured" dc:format="image/jpeg" dc:title="{escape(title)}"/>\n'
            '        <renditions jcr:primaryType="nt:folder"/>\n'
            '    </jcr:content>\n'
            '</jcr:root>\n')


ORIGINAL_DIR = (f'{HEAD}<jcr:root {NS} jcr:primaryType="nt:file">\n'
                '    <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="image/jpeg"/>\n'
                '</jcr:root>\n')


def main():
    image_includes = ''.join(f'        <include pattern="{DAM}/{f}(/.*)?"/>\n' for f, _ in IMAGES)
    filters = (f'{HEAD}<workspaceFilter version="1.0">\n'
               # container pages / folders: only created when missing, never overwritten
               f'    <filter root="{GROUPE}" mode="merge">\n'
               f'        <include pattern="{GROUPE}"/>\n'
               f'        <include pattern="{GROUPE}/jcr:content(/.*)?"/>\n'
               f'        <include pattern="{COMEX}"/>\n'
               f'        <include pattern="{COMEX}/jcr:content(/.*)?"/>\n'
               '    </filter>\n'
               f'    <filter root="{COMEX}">\n'
               f'        <include pattern="{COMEX}/index"/>\n'
               f'        <include pattern="{COMEX}/index/jcr:content(/.*)?"/>\n'
               '    </filter>\n'
               f'    <filter root="/content/dam/{SITE}" mode="merge">\n'
               f'        <include pattern="/content/dam/{SITE}"/>\n'
               f'        <include pattern="{DAM}"/>\n'
               '    </filter>\n'
               f'    <filter root="{DAM}">\n{image_includes}    </filter>\n'
               '</workspaceFilter>\n')
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{NAME}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  '    <entry key="description">COMEX listing page (/groupe/comex/) fed by the comex Content Fragments</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', filters)
        z.writestr('META-INF/vault/properties.xml', properties)
        z.writestr(f'jcr_root{GROUPE}/.content.xml', container_page('Groupe Servier'))
        z.writestr(f'jcr_root{COMEX}/.content.xml', container_page('Comité Exécutif'))
        z.writestr(f'jcr_root{COMEX}/index/.content.xml', open(PAGE_XML, encoding='utf-8').read())
        z.writestr(f'jcr_root/content/dam/{SITE}/.content.xml', folder(SITE))
        z.writestr(f'jcr_root{DAM}/.content.xml', folder('COMEX'))
        for file, title in IMAGES:
            base = f'jcr_root{DAM}/{file}'
            z.writestr(f'{base}/.content.xml', asset(title))
            z.write(os.path.join(ASSETS_DIR, file), f'{base}/_jcr_content/renditions/original')
            z.writestr(f'{base}/_jcr_content/renditions/original.dir/.content.xml', ORIGINAL_DIR)
    print(OUT)


if __name__ == '__main__':
    main()
