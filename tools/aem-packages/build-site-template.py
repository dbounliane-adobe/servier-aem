#!/usr/bin/env python3
"""
Builds an AEM site template ("Sites > Create > Site from template > Import") from the
clean-install package, with the same layout as the Adobe xwalk site template
(adobe-rnd/aem-boilerplate-xwalk releases):

  servier-site-template-1.0.0.zip
  ├── package.json          template metadata (title, page opened after creation)
  ├── previews/servier.png  wizard preview (tools/aem-packages/template/preview.png)
  └── site.zip              content package: /conf/<tpl>, /content/<tpl>, /content/dam/<tpl>

AEM copies the three roots under the new site name when a site is created. Compared with
the clean-install package:
  - servier-aem paths (/conf, /content, /content/dam) renamed to the template name, in node
    paths and in references (cq:conf, cq:model, images, /content links, CF data);
  - no jcr:uuid and no CF indexedData (instance data; several sites from one template);
  - metadata sheet: /** -> theme servier (global theme by default);
  - empty wcm folders (templates, policies, template-types) as in the Adobe template.
The Edge Delivery configuration keeps owner/repo of this project (the code repository);
the wizard's project URL sets the site. Usage:
  python3 tools/aem-packages/build-site-template.py
"""
import io
import json
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PKG = os.path.join(ROOT, 'tools', 'aem-packages')
SITE = 'servier-aem'
TPL = 'servier-site-template'
VERSION = '1.0.0'
SOURCE = os.path.join(PKG, 'dist', f'{SITE}-clean-install-{VERSION}.zip')
PREVIEW = os.path.join(PKG, 'template', 'preview.png')
OUT = os.path.join(PKG, 'dist', f'{TPL}-{VERSION}.zip')
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
NS = 'xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0"'

PATHS = re.compile(rf'(/content/dam|/content|/conf)/{SITE}(?=[/"\]&,;\s]|$)')
UUID = re.compile(r'\s+jcr:uuid="[^"]*"')
INDEXED = re.compile(r'\s*<indexedData\b.*?</indexedData>', re.S)

WCM = {
    'settings/wcm': '<jcr:root {ns} jcr:primaryType="cq:Page">\n    <templates/>\n    <policies/>\n    <template-types/>\n</jcr:root>\n',
    'settings/wcm/templates': '<jcr:root {ns} jcr:primaryType="cq:Page"/>\n',
    'settings/wcm/policies': '<jcr:root {ns} jcr:primaryType="cq:Page"/>\n',
    'settings/wcm/template-types': ('<jcr:root {ns} jcr:primaryType="cq:Page">\n'
                                    '    <jcr:content jcr:primaryType="cq:PageContent" mergeList="{{Boolean}}true"/>\n'
                                    '</jcr:root>\n'),
}


def convert(name, data):
    name = PATHS.sub(lambda m: f'{m.group(1)}/{TPL}', name)
    if not name.endswith('.xml'):
        return name, data
    xml = data.decode('utf-8')
    xml = PATHS.sub(lambda m: f'{m.group(1)}/{TPL}', xml)
    xml = UUID.sub('', INDEXED.sub('', xml))
    xml = xml.replace(f'jcr:title="{SITE}"', 'jcr:title="Servier"')
    if name.endswith(f'/content/{TPL}/metadata/.content.xml'):
        xml = re.sub(r'theme="[^"]*"', 'theme="servier"', xml)
    return name, xml.encode('utf-8')


def site_package():
    files = {}
    with zipfile.ZipFile(SOURCE) as src:
        for n in src.namelist():
            if n.startswith('jcr_root/'):
                name, data = convert(n, src.read(n))
                files[name] = data
    for path, xml in WCM.items():
        files[f'jcr_root/conf/{TPL}/{path}/.content.xml'] = (HEAD + xml.format(ns=NS)).encode('utf-8')
    left = [n for n, d in files.items() if n.endswith('.xml') and SITE.encode() in d and b'repo=' not in d]
    assert not left, f'{SITE} references left: {left[:5]}'

    filters = (f'{HEAD}<workspaceFilter version="1.0">\n'
               f'    <filter root="/conf/{TPL}"/>\n'
               f'    <filter root="/content/{TPL}"/>\n'
               f'    <filter root="/content/dam/{TPL}"/>\n'
               '</workspaceFilter>\n')
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{TPL}.site</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  '    <entry key="description">Site template content package of the Servier Edge Delivery site</entry>\n'
                  '    <entry key="packageType">content</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', filters)
        z.writestr('META-INF/vault/properties.xml', properties)
        for n in sorted(files):
            z.writestr(n, files[n])
    return buf.getvalue(), files


def main():
    site_zip, files = site_package()
    package_json = {
        'name': TPL,
        'version': VERSION,
        'description': 'Servier site for AEM authoring with Edge Delivery Services: CF model comex, '
                       'DAM, metadata + redirects sheets and the /master/fr language master',
        'siteTemplate': {
            'title': 'Servier – Site Edge Delivery',
            'createdBy': 'Servier',
            'useCases': ['AEM Sites delivered with Edge Delivery Services', 'Servier multilingual site (master/fr)'],
            'docsUrl': '',
            'showcaseUrl': 'https://main--servier-aem--dbounliane-adobe.aem.page/master/fr/',
            'sourceRepositoryUrl': 'https://github.com/dbounliane-adobe/servier-aem',
            'openItem': '{Path}/master/fr/index',
        },
    }
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('package.json', json.dumps(package_json, indent=4, ensure_ascii=False) + '\n')
        z.write(PREVIEW, 'previews/servier.png')
        z.writestr('site.zip', site_zip)
    pages = [n for n in files if n.startswith(f'jcr_root/content/{TPL}/master/') and n.endswith('.content.xml')]
    print(OUT, f'{len(files)} files, {len(pages)} master nodes')


if __name__ == '__main__':
    main()
