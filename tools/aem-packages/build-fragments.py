#!/usr/bin/env python3
"""
Builds AEM content packages (FileVault) for the header and footer fragments and
their DAM images, for install via CRX Package Manager on AEM author.

  header: /content/servier-aem/nav     + /content/dam/servier-aem/header/*.svg
  footer: /content/servier-aem/footer  + /content/dam/servier-aem/footer/*.svg

Page XML comes from migration-work/jcr-content/<page>.xml (html2md + md2jcr from
content/<page>.plain.html), images from content/images/. Usage:
  python3 tools/aem-packages/build-fragments.py [header|footer|all]
"""
import os
import sys
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
FRAGMENTS = {
    'header': {
        'page': 'nav',
        'name': f'{SITE}-header-nav',
        'description': 'Servier header navigation page + header images (Edge Delivery / Universal Editor)',
        'images': [
            ('header-logo-servier.svg', 'Servier logo (white, over hero)'),
            ('header-logo-servier-dark.svg', 'Servier logo (indigo, sticky bar)'),
            ('header-icon-search.svg', 'Search icon'),
        ],
    },
    'footer': {
        'page': 'footer',
        'name': f'{SITE}-footer',
        'description': 'Servier footer page + footer images (Edge Delivery / Universal Editor)',
        'images': [
            ('footer-logo-servier.svg', 'Servier logo (footer)'),
            ('footer-social-facebook.svg', 'Facebook'),
            ('footer-social-twitter.svg', 'X (Twitter)'),
            ('footer-social-instagram.svg', 'Instagram'),
            ('footer-social-linkedin.svg', 'LinkedIn'),
            ('footer-kastor-ecodesign-score.svg', 'Kastor eco-design score badge'),
        ],
    },
}

NS = ('xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" '
      'xmlns:sling="http://sling.apache.org/jcr/sling/1.0" xmlns:dam="http://www.day.com/dam/1.0" '
      'xmlns:dc="http://purl.org/dc/elements/1.1/"')
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'


def folder(title):
    return f'{HEAD}<jcr:root {NS} jcr:primaryType="sling:OrderedFolder" jcr:title="{escape(title)}"/>\n'


def asset(title):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="dam:Asset">\n'
            '    <jcr:content jcr:primaryType="dam:AssetContent">\n'
            f'        <metadata jcr:primaryType="nt:unstructured" dc:format="image/svg+xml" dc:title="{escape(title)}"/>\n'
            '        <renditions jcr:primaryType="nt:folder"/>\n'
            '    </jcr:content>\n'
            '</jcr:root>\n')


ORIGINAL_DIR = (f'{HEAD}<jcr:root {NS} jcr:primaryType="nt:file">\n'
                '    <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="image/svg+xml"/>\n'
                '</jcr:root>\n')


def build(key):
    cfg = FRAGMENTS[key]
    page_path = f'/content/{SITE}/{cfg["page"]}'
    dam_path = f'/content/dam/{SITE}/{key}'
    out = os.path.join(ROOT, 'tools', 'aem-packages', 'dist', f'{cfg["name"]}-{VERSION}.zip')
    page_xml = open(os.path.join(ROOT, 'migration-work', 'jcr-content', f'{cfg["page"]}.xml'), encoding='utf-8').read()

    filter_xml = (f'{HEAD}<workspaceFilter version="1.0">\n'
                  f'    <filter root="{page_path}"/>\n'
                  f'    <filter root="{dam_path}"/>\n'
                  '</workspaceFilter>\n')
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{cfg["name"]}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  f'    <entry key="description">{escape(cfg["description"])}</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', filter_xml)
        z.writestr('META-INF/vault/properties.xml', properties)
        z.writestr(f'jcr_root{page_path}/.content.xml', page_xml)
        z.writestr(f'jcr_root/content/dam/{SITE}/.content.xml', folder(SITE))
        z.writestr(f'jcr_root{dam_path}/.content.xml', folder(key.capitalize()))
        for file, title in cfg['images']:
            base = f'jcr_root{dam_path}/{file}'
            z.writestr(f'{base}/.content.xml', asset(title))
            z.write(os.path.join(ROOT, 'content', 'images', file), f'{base}/_jcr_content/renditions/original')
            z.writestr(f'{base}/_jcr_content/renditions/original.dir/.content.xml', ORIGINAL_DIR)
    print(out)


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for k in (FRAGMENTS if target == 'all' else [target]):
        build(k)
