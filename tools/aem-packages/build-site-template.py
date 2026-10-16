#!/usr/bin/env python3
"""
Builds the Servier AEM site template ("Sites > Create > Site from template > Import") on top of
the Adobe "AEM Site with Edge Delivery Services Template" 0.2.0
(tools/aem-packages/template/aem-sites-with-edge-delivery-services-template-0.2.0.zip, from the
adobe-rnd/aem-boilerplate-xwalk releases), so that the wizard treats it as an Edge Delivery
template (project URL field):

  - every file of the Adobe template is kept as is (package.json keys, site.zip META-INF,
    filter, /conf/<tpl> incl. the Edge Delivery cloud configuration, DAM root folder with its
    ACL and processing profile, site root page), with the same internal template name
    (aem-sites-with-edge-delivery-services-template): AEM renames it to the new site anyway;
  - removed: its demo pages (index, nav, footer at the root), demo images and DAM folder thumbnail;
  - added, from servier-aem-clean-install-1.0.0.zip with servier-aem renamed to the template
    name, reduced to an MVP for a new site: the comex CF model, metadata (/** -> servier),
    /master/fr with homepage, nav, footer, newsroom listing + 3 articles (MVP_ARTICLES) and the
    COMEX page with 3 members (MVP_MEMBERS), only the images they use, the matching redirects —
    without jcr:uuid nor CF indexedData;
  - package.json: Servier title, description, preview and page opened after creation.
Usage:
  python3 tools/aem-packages/build-site-template.py
"""
import io
import json
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PKG = os.path.join(ROOT, 'tools', 'aem-packages')
TEMPLATE_DIR = os.path.join(PKG, 'template')
BASE = os.path.join(TEMPLATE_DIR, 'aem-sites-with-edge-delivery-services-template-0.2.0.zip')
SOURCE = os.path.join(PKG, 'dist', 'servier-aem-clean-install-1.0.0.zip')
PREVIEW = os.path.join(TEMPLATE_DIR, 'preview.png')  # 1024 x 2247, like the Adobe template
SITE = 'servier-aem'
TPL = 'aem-sites-with-edge-delivery-services-template'  # internal name of the Adobe template
VERSION = '1.1.0'  # template version (bump on each change: AEM keeps imported templates by name)
OUT = os.path.join(PKG, 'dist', f'servier-site-template-{VERSION}.zip')

PATHS = re.compile(rf'(/content/dam|/content|/conf)/{SITE}(?=[/"\]&,;\s]|$)')
UUID = re.compile(r'\s+jcr:uuid="[^"]*"')
INDEXED = re.compile(r'\s*<indexedData\b.*?</indexedData>', re.S)
# Servier content taken from the clean-install package (renamed to the template name)
OURS = [f'jcr_root/conf/{TPL}/settings/dam/', f'jcr_root/content/{TPL}/metadata/',
        f'jcr_root/content/{TPL}/redirects/', f'jcr_root/content/{TPL}/master/'] + \
       [f'jcr_root/content/dam/{TPL}/{f}/' for f in ('index', 'header', 'footer', 'newsroom', 'comex')]
# MVP content kept in the template (the clean-install package holds the whole site)
MVP_ARTICLES = ['dystrophie-musculaire-becker-maladie-evolutions-multiples',  # full article
                'syndrome-x-fragile-maladie-rare-neurodeveloppement',          # card articles
                'comprendre-ataxies-spinocerebelleuses']
MVP_MEMBERS = ['olivier-laureau', 'dr-claude-bertrand', 'damien-catoir']      # COMEX CFs
MASTER = f'jcr_root/content/{TPL}/master/fr'
DAM = f'/content/dam/{TPL}'
# Adobe demo content left out
# (the DAM folder thumbnail is a picture of the demo images; AEM regenerates it)
DEMO = re.compile(rf'^jcr_root/content/{TPL}/(index|nav|footer)/|^jcr_root/content/dam/{TPL}/[^/_]+\.png/'
                  rf'|^jcr_root/content/dam/{TPL}/_jcr_content/folderThumbnail')
DAM_ROOT = f'jcr_root/content/dam/{TPL}/.content.xml'


def convert(name, data):
    name = PATHS.sub(lambda m: f'{m.group(1)}/{TPL}', name)
    if name.endswith('.xml'):
        xml = PATHS.sub(lambda m: f'{m.group(1)}/{TPL}', data.decode('utf-8'))
        xml = UUID.sub('', INDEXED.sub('', xml))
        if name.endswith(f'/content/{TPL}/metadata/.content.xml'):
            xml = re.sub(r'theme="[^"]*"', 'theme="servier"', xml)
        data = xml.encode('utf-8')
    return name, data


def mvp(files):
    """Keeps the MVP of the site: homepage, nav, footer, newsroom listing + MVP_ARTICLES, COMEX page
    with MVP_MEMBERS, the images these pages and CFs use, and the matching redirects."""
    def keep_page(name):
        if not name.startswith(f'{MASTER}/newsroom/dossiers/'):
            return True
        page = name[len(f'{MASTER}/newsroom/dossiers/'):].split('/')[0]
        return page in ['index', '.content.xml'] + MVP_ARTICLES

    def keep_cf(name):
        m = re.match(rf'jcr_root{DAM}/comex/([^/]+)/', name)
        return not m or '.' in m.group(1) or m.group(1) == 'photos' or m.group(1) in MVP_MEMBERS

    files = {n: d for n, d in files.items() if keep_page(n) and keep_cf(n)}
    comex = f'{MASTER}/groupe/comex/index/.content.xml'
    members = ','.join(f'{DAM}/comex/{m}' for m in MVP_MEMBERS)
    files[comex] = re.sub(rb'members="\[[^\]]*\]"', f'members="[{members}]"'.encode(), files[comex])

    # images: only the newsroom images and COMEX photos referenced by the kept pages / CFs
    refs = set()
    for n, d in files.items():
        if n.endswith('.xml') and (n.startswith(MASTER) or re.match(rf'jcr_root{DAM}/comex/[^/.]+/', n)):
            refs.update(re.findall(rf'{DAM}/(?:newsroom|comex/photos)/[^"&\s,\]]+'.encode(), d))
    refs = {r.decode() for r in refs}

    def keep_image(name):
        m = re.match(rf'jcr_root({DAM}/(?:newsroom|comex/photos)/[^/]+)/', name)
        return not m or m.group(1) in refs
    files = {n: d for n, d in files.items() if keep_image(n)}

    # redirects: only rows whose destination is kept
    sheet = f'jcr_root/content/{TPL}/redirects/.content.xml'
    kept = {'/master/fr/newsroom/dossiers/' + a for a in MVP_ARTICLES}

    def row(m):
        dest = re.search(rb'destination="([^"]*)"', m.group(0)).group(1).decode()
        article = dest.startswith('/master/fr/newsroom/dossiers/') and dest != '/master/fr/newsroom/dossiers/'
        return m.group(0) if not article or dest in kept else b''
    files[sheet] = re.sub(rb'\s*<row_\w+\s[^>]*/>', row, files[sheet])
    return files


def servier_files():
    files = {}
    with zipfile.ZipFile(SOURCE) as src:
        for n in src.namelist():
            name, data = convert(n, src.read(n))
            if any(name.startswith(p) for p in OURS):
                files[name] = data
    left = [n for n, d in files.items() if n.endswith('.xml') and SITE.encode() in d]
    assert not left, f'{SITE} references left: {left[:5]}'
    return mvp(files)


def folder_entries(names):
    folders = set()
    for name in names:
        parts = name.split('/')[:-1]
        folders.update('/'.join(parts[:i]) + '/' for i in range(1, len(parts) + 1))
    return folders


def file_info(name, like=None):
    info = zipfile.ZipInfo(name, like.date_time if like else (2026, 10, 17, 0, 0, 0))
    info.create_system = 3
    if name.endswith('/'):
        info.external_attr = (0o40755 << 16) | 0x10
    else:
        info.external_attr = 0o100644 << 16
        info.compress_type = zipfile.ZIP_DEFLATED
    return info


def site_zip(base_site):
    """Adobe site.zip (entries and order kept) without its demo content, plus the Servier content."""
    ours = servier_files()
    buf = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(base_site)) as base, zipfile.ZipFile(buf, 'w') as z:
        kept = [i for i in base.infolist() if not DEMO.search(i.filename)]
        written = set()
        for info in kept:
            data = base.read(info.filename)
            if info.filename == DAM_ROOT:
                data = re.sub(rb'\s*<folderThumbnail/>', b'', data)
            z.writestr(info, data)
            written.add(info.filename)
        for name in sorted((folder_entries(ours) | set(ours)) - written):
            z.writestr(file_info(name), b'' if name.endswith('/') else ours[name])
    return buf.getvalue(), ours


def main():
    with zipfile.ZipFile(BASE) as base:
        package_json = json.loads(base.read('package.json'))
        site, ours = site_zip(base.read('site.zip'))
        infos = {i.filename: i for i in base.infolist()}

    package_json.update({
        'version': VERSION,
        'description': 'Servier site for AEM authoring with Edge Delivery Services: CF model comex, '
                       'DAM, metadata and redirects sheets, /master/fr language master. Based on the '
                       'AEM Site with Edge Delivery Services Template 0.2.0',
        'license': 'Proprietary, Servier (base template: MIT License, Copyright 2020 Adobe Systems Incorporated)',
    })
    package_json['siteTemplate'].update({
        'title': 'Servier - Site Edge Delivery',
        'createdBy': 'Servier',
        'useCases': package_json['siteTemplate']['useCases'] + ['Servier multilingual site (master/fr)'],
        'showcaseUrl': 'https://main--servier-aem--dbounliane-adobe.aem.page/master/fr/',
        'sourceRepositoryUrl': 'https://github.com/dbounliane-adobe/servier-aem',
        'openItem': '{Path}/master/fr/index',
    })
    package_text = json.dumps(package_json, indent=4) + '\n'
    assert package_text.isascii()

    with zipfile.ZipFile(OUT, 'w') as z:
        z.writestr(file_info('package.json', infos['package.json']), package_text)
        z.writestr(file_info('previews/', infos['previews/']), b'')
        z.writestr(file_info('previews/servier.png', infos['previews/starter.png']), open(PREVIEW, 'rb').read())
        z.writestr(file_info('site.zip', infos['site.zip']), site)
    pages = [n for n in ours if n.startswith(f'jcr_root/content/{TPL}/master/') and n.endswith('.content.xml')]
    print(OUT, f'{len(ours)} Servier files, {len(pages)} master nodes')


if __name__ == '__main__':
    main()
