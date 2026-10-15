#!/usr/bin/env python3
"""
Builds AEM content packages (FileVault) for the Servier pages and their DAM images,
for install via CRX Package Manager on AEM author.

  index:  /content/servier-aem/index   + /content/dam/servier-aem/index/*
  header: /content/servier-aem/nav     + /content/dam/servier-aem/header/*.svg
  footer: /content/servier-aem/footer  + /content/dam/servier-aem/footer/*.svg
  site:   all of the above in one package

Page XML comes from migration-work/jcr-content/<page>.xml (html2md + md2jcr from
content/<page>.plain.html). Only each page node and its jcr:content are replaced:
child pages (e.g. under /content/servier-aem/index) are left untouched. Usage:
  python3 tools/aem-packages/build-fragments.py [index|header|footer|site|all]
"""
import os
import sys
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
CONTENT_IMAGES = os.path.join(ROOT, 'content', 'images')
FRAGMENTS = {
    'index': {
        'page': 'index',
        'name': f'{SITE}-index',
        'description': 'Servier homepage + its images (Edge Delivery / Universal Editor)',
        'source': os.path.join(ROOT, 'migration-work', 'aem-assets', 'index'),
        'images': [
            ('servier-carrieres-ambassadeurs_h.png', 'Rejoignez une aventure humaine'),
            ('image-aires-scaled.webp', 'Aires thérapeutiques (fond)'),
            ('servier-decryptage-cancer-colorectal.jpg', 'Cancer colorectal'),
            ('servier-decryptage-cholangiocarcinome-tumeur-patient-cancer.jpg', 'Cholangiocarcinome'),
            ('servier-decryptage-gliome-tumeur-cerebrale.png', 'Gliome'),
            ('banner-contact-scaled.webp', 'Nous rejoindre (fond)'),
        ],
    },
    'header': {
        'page': 'nav',
        'name': f'{SITE}-header-nav',
        'description': 'Servier header navigation page + header images (Edge Delivery / Universal Editor)',
        'source': CONTENT_IMAGES,
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
        'source': CONTENT_IMAGES,
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
MIME = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}

NS = ('xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" '
      'xmlns:sling="http://sling.apache.org/jcr/sling/1.0" xmlns:dam="http://www.day.com/dam/1.0" '
      'xmlns:dc="http://purl.org/dc/elements/1.1/"')
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'


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


def page_filter(path):
    # replace the page node + its jcr:content only, never its child pages
    return (f'    <filter root="{path}">\n'
            f'        <include pattern="{path}"/>\n'
            f'        <include pattern="{path}/jcr:content(/.*)?"/>\n'
            '    </filter>\n')


def build(keys, name, description):
    out = os.path.join(ROOT, 'tools', 'aem-packages', 'dist', f'{name}-{VERSION}.zip')
    filters = ''
    entries = []
    for key in keys:
        cfg = FRAGMENTS[key]
        page_path = f'/content/{SITE}/{cfg["page"]}'
        dam_path = f'/content/dam/{SITE}/{key}'
        filters += page_filter(page_path) + f'    <filter root="{dam_path}"/>\n'
        page_xml = open(os.path.join(ROOT, 'migration-work', 'jcr-content', f'{cfg["page"]}.xml'), encoding='utf-8').read()
        entries.append((f'jcr_root{page_path}/.content.xml', page_xml))
        entries.append((f'jcr_root{dam_path}/.content.xml', folder(key.capitalize())))
        for file, title in cfg['images']:
            mime = MIME[os.path.splitext(file)[1].lower()]
            base = f'jcr_root{dam_path}/{file}'
            entries.append((f'{base}/.content.xml', asset(title, mime)))
            entries.append((f'{base}/_jcr_content/renditions/original', ('file', os.path.join(cfg['source'], file))))
            entries.append((f'{base}/_jcr_content/renditions/original.dir/.content.xml', original_dir(mime)))

    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{name}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  f'    <entry key="description">{escape(description)}</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', f'{HEAD}<workspaceFilter version="1.0">\n{filters}</workspaceFilter>\n')
        z.writestr('META-INF/vault/properties.xml', properties)
        z.writestr(f'jcr_root/content/dam/{SITE}/.content.xml', folder(SITE))
        for path, data in entries:
            if isinstance(data, tuple):
                z.write(data[1], path)
            else:
                z.writestr(path, data)
    print(out)


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if target in ('site', 'all'):
        build(list(FRAGMENTS), f'{SITE}-site', 'Servier homepage, header (nav) and footer pages + their images')
    if target == 'all':
        for k, cfg in FRAGMENTS.items():
            build([k], cfg['name'], cfg['description'])
    elif target in FRAGMENTS:
        build([target], FRAGMENTS[target]['name'], FRAGMENTS[target]['description'])
