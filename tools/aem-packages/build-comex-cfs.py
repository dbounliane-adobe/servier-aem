#!/usr/bin/env python3
"""
Builds the AEM content package with one Content Fragment per COMEX member
(model /conf/servier-aem/settings/dam/cfm/models/comex — not modified) and their photos.

  /content/dam/servier-aem/comex/<slug>          CF (firstname, lastname, position,
                                                 biography [rich text], linkedin, photo)
  /content/dam/servier-aem/comex/photos/<file>   member photos (referenced by "photo")

Source data: migration-work/comex/comex-members.json (extracted verbatim from
https://servier.com/groupe/comex/ and each member page), photos in
migration-work/aem-assets/comex/photos/. CF nodes: tools/aem-packages/import/cf-comex.zip
(package exported from the DAM after the CFs were repaired against the model; values are
checked against the source data). Also writes migration-work/comex/cf-data.json
(the exact field values) for review. Usage:
  python3 tools/aem-packages/build-comex-cfs.py
"""
import html
import json
import os
import re
import unicodedata
import zipfile
from xml.sax.saxutils import escape, quoteattr

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
NAME = f'{SITE}-comex-cfs'
MODEL = f'/conf/{SITE}/settings/dam/cfm/models/comex'
CF_FOLDER = f'/content/dam/{SITE}/comex'
PHOTO_FOLDER = f'{CF_FOLDER}/photos'
SRC = os.path.join(ROOT, 'migration-work', 'comex', 'comex-members.json')
PHOTOS_DIR = os.path.join(ROOT, 'migration-work', 'aem-assets', 'comex', 'photos')
OUT = os.path.join(ROOT, 'tools', 'aem-packages', 'dist', f'{NAME}-{VERSION}.zip')
REPAIRED = os.path.join(ROOT, 'tools', 'aem-packages', 'import', 'cf-comex.zip')
BANNER = 'servier-banniere-officielle-logo.jpg'
BANNER_FILE = os.path.join(ROOT, 'migration-work', 'aem-assets', 'comex', BANNER)
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}

NS = ('xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" '
      'xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" '
      'xmlns:dam="http://www.day.com/dam/1.0" xmlns:dc="http://purl.org/dc/elements/1.1/"')
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'


def slugify(url):
    """CF name: source URL slug without the "comite-executif-" prefix, lowercase, no accents."""
    slug = url.rstrip('/').split('/')[-1]
    slug = re.sub(r'^comite-executif-', '', slug)
    slug = unicodedata.normalize('NFD', slug).encode('ascii', 'ignore').decode()
    return slug.lower()


def split_name(full):
    """firstname = first word (+ a leading "Dr" title and middle initials), lastname = the rest."""
    tokens = full.split()
    first = []
    if tokens and tokens[0] in ('Dr', 'Dr.', 'Pr', 'Pr.'):
        first.append(tokens.pop(0))
    first.append(tokens.pop(0))
    while tokens and re.fullmatch(r'[A-Z]\.', tokens[0]):
        first.append(tokens.pop(0))
    return ' '.join(first), ' '.join(tokens)


def attr(value):
    return quoteattr(value).replace('\n', '&#xa;')


def folder(title, conf=None):
    content = (f'\n    <jcr:content jcr:primaryType="nt:unstructured" jcr:title="{escape(title)}"'
               f'{f" cq:conf={attr(conf)}" if conf else ""}/>\n') if conf else ''
    end = f'>{content}</jcr:root>\n' if content else '/>\n'
    return f'{HEAD}<jcr:root {NS} jcr:primaryType="sling:OrderedFolder" jcr:title="{escape(title)}"{end}'


def image_asset(title, mime):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="dam:Asset">\n'
            '    <jcr:content jcr:primaryType="dam:AssetContent">\n'
            f'        <metadata jcr:primaryType="nt:unstructured" dc:format="{mime}" dc:title={attr(title)}/>\n'
            '        <renditions jcr:primaryType="nt:folder"/>\n'
            '    </jcr:content>\n'
            '</jcr:root>\n')


def original_dir(mime):
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="nt:file">\n'
            f'    <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="{mime}"/>\n'
            '</jcr:root>\n')


def repaired_fragment(cf, z):
    """CF node as repaired in the DAM (cf-comex.zip export: cq:contentFragment mixin, _strucVersion 2,
    dam:cfVariationNode master, indexedData), minus this instance's replication status.
    Fails if a field value differs from the source data (content is never rewritten)."""
    xml = z.read(f'jcr_root{CF_FOLDER}/{cf["name"]}/.content.xml').decode('utf-8')
    master = re.search(r'<data\b.*?<master\b(.*?)/>', xml, re.S).group(1)
    values = {k: html.unescape(v) for k, v in re.findall(r'\s([\w:]+)="([^"]*)"', master)}
    for field in ('firstname', 'lastname', 'position', 'biography', 'linkedin', 'photo'):
        assert values.get(field) == cf[field], f'{cf["name"]}: {field} differs from the source data'
    xml = re.sub(r'\s+cq:(?:lastReplicated|lastReplicatedBy|lastReplicationAction)(?:_\w+)?="[^"]*"', '', xml)
    return xml.replace('jcr:mixinTypes="[cq:ReplicationStatus,cq:ReplicationStatus2]"', '')


def main():
    members = json.load(open(SRC, encoding='utf-8'))
    cfs = []
    for m in members:
        d = m['detailData']
        firstname, lastname = split_name(d['name'])
        photo_file = (d.get('photo') or m['photo']).split('/')[-1]
        cfs.append({
            'order': m['order'],
            'name': slugify(m['detail']),
            'title': d['name'],
            'firstname': firstname,
            'lastname': lastname,
            'position': d['positionText'],
            'biography': d['bioHtml'],
            'linkedin': d.get('linkedin') or m.get('linkedin') or '',
            'photo': f'{PHOTO_FOLDER}/{photo_file}',
            'photoFile': photo_file,
            'sourceUrl': m['detail'],
        })
    names = [c['name'] for c in cfs]
    assert len(names) == len(set(names)), f'duplicate CF names: {names}'
    json.dump(cfs, open(os.path.join(ROOT, 'migration-work', 'comex', 'cf-data.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    includes = ''.join(f'        <include pattern="{CF_FOLDER}/{c["name"]}(/.*)?"/>\n' for c in cfs)
    filters = (f'{HEAD}<workspaceFilter version="1.0">\n'
               # parent folders are created if missing, never overwritten
               f'    <filter root="/content/dam/{SITE}" mode="merge">\n'
               f'        <include pattern="/content/dam/{SITE}"/>\n'
               f'        <include pattern="{CF_FOLDER}"/>\n'
               f'        <include pattern="{CF_FOLDER}/jcr:content(/.*)?"/>\n'
               '    </filter>\n'
               f'    <filter root="{CF_FOLDER}">\n{includes}'
               f'        <include pattern="{PHOTO_FOLDER}(/.*)?"/>\n'
               # banner image used by the CF overlay template (cf-templates/comex-member.html)
               f'        <include pattern="{CF_FOLDER}/{BANNER}(/.*)?"/>\n'
               '    </filter>\n'
               '</workspaceFilter>\n')
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{NAME}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  f'    <entry key="description">{len(cfs)} COMEX Content Fragments (model comex) + photos</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z, zipfile.ZipFile(REPAIRED) as repaired:
        z.writestr('META-INF/vault/filter.xml', filters)
        z.writestr('META-INF/vault/properties.xml', properties)
        z.writestr(f'jcr_root/content/dam/{SITE}/.content.xml', folder(SITE))
        # the CF folder points at the project configuration so the comex model is allowed
        z.writestr(f'jcr_root{CF_FOLDER}/.content.xml', folder('COMEX', conf=f'/conf/{SITE}'))
        z.writestr(f'jcr_root{PHOTO_FOLDER}/.content.xml', folder('Photos'))
        for c in cfs:
            z.writestr(f'jcr_root{CF_FOLDER}/{c["name"]}/.content.xml', repaired_fragment(c, repaired))
            mime = MIME[os.path.splitext(c['photoFile'])[1].lower()]
            base = f'jcr_root{PHOTO_FOLDER}/{c["photoFile"]}'
            z.writestr(f'{base}/.content.xml', image_asset(c['title'], mime))
            z.write(os.path.join(PHOTOS_DIR, c['photoFile']), f'{base}/_jcr_content/renditions/original')
            z.writestr(f'{base}/_jcr_content/renditions/original.dir/.content.xml', original_dir(mime))
        base = f'jcr_root{CF_FOLDER}/{BANNER}'
        z.writestr(f'{base}/.content.xml', image_asset('Bannière officielle de Servier', 'image/jpeg'))
        z.write(BANNER_FILE, f'{base}/_jcr_content/renditions/original')
        z.writestr(f'{base}/_jcr_content/renditions/original.dir/.content.xml', original_dir('image/jpeg'))
    print(OUT, f'{len(cfs)} CFs')


if __name__ == '__main__':
    main()
