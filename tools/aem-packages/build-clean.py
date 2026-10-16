#!/usr/bin/env python3
"""
Builds the "clean install" package of the whole servier-aem project, for an instance where
everything servier-aem was removed (pages, DAM, CF model):

  /conf/servier-aem/settings/dam/cfm/models/comex   CF model (from the DAM export cf-comex.zip)
  /conf/servier-aem/settings/cloudconfigs          Edge Delivery configuration (optional, if exported)
  /content/dam/servier-aem/{index,header,footer,newsroom,comex}
                                                    images + the 12 COMEX Content Fragments
  /content/servier-aem                              site root page (created only if missing)
  /content/servier-aem/metadata, /redirects         sheets (from the export sheets.zip)
  /content/servier-aem/master/...                   French language master (48 pages)

Nothing else is created at the root of the site. Sources: the packages built by
build-master.py and build-comex-cfs.py (dist/), the DAM export import/cf-comex.zip (model)
and the AEM export "import/export servier-aem.zip" (metadata + redirects sheets as authored, root page
properties, optionally the cloudconfigs).
The replication status of exported nodes is dropped. Usage:
  python3 tools/aem-packages/build-clean.py
"""
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'servier-aem'
VERSION = '1.0.0'
NAME = f'{SITE}-clean-install'
PKG = os.path.join(ROOT, 'tools', 'aem-packages')
DIST = os.path.join(PKG, 'dist')
OUT = os.path.join(DIST, f'{NAME}-{VERSION}.zip')
CF_EXPORT = os.path.join(PKG, 'import', 'cf-comex.zip')
SHEETS_EXPORT = os.path.join(PKG, 'import', 'export servier-aem.zip')
MODEL = f'/conf/{SITE}/settings/dam/cfm/models/comex'
SITE_PATH = f'/content/{SITE}'
DAM = f'/content/dam/{SITE}'
DAM_FOLDERS = ['index', 'header', 'footer', 'newsroom', 'comex']
SHEETS = ['metadata', 'redirects']
CLOUDCONFIGS = f'/conf/{SITE}/settings/cloudconfigs'
HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'
NS = ('xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" '
      'xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0"')

# jcr:uuid is kept: the CF indexedData refers to it
INSTANCE_PROPS = re.compile(r'\s+cq:(?:lastReplicated|lastReplicatedBy|lastReplicationAction)(?:_\w+)?="[^"]*"')


def clean(data, name):
    """Drops the replication status (properties + mixins) from exported .content.xml files."""
    if not name.endswith('.xml'):
        return data
    xml = INSTANCE_PROPS.sub('', data.decode('utf-8'))

    def mixins(match):
        kept = [t for t in match.group(1).split(',') if t and not t.startswith('cq:ReplicationStatus')]
        return f'jcr:mixinTypes="[{",".join(kept)}]"' if kept else ''
    xml = re.sub(r'jcr:mixinTypes="\[([^\]]*)\]"', mixins, xml)
    return xml.encode('utf-8')


def entries(zip_path, prefix):
    """(name, data) of the files of a package under a repository path."""
    root = f'jcr_root{prefix}'
    with zipfile.ZipFile(zip_path) as z:
        return [(n, z.read(n)) for n in z.namelist()
                if (n == f'{root}/.content.xml' or n.startswith(f'{root}/')) and not n.endswith('/')]


def site_root(sheets):
    """Root page: as exported (root page properties only), else a minimal Edge Delivery root."""
    name = f'jcr_root{SITE_PATH}/.content.xml'
    for n, data in sheets:
        if n == name:
            # keep the page properties, drop the child-node list of the exported root
            xml = re.sub(r'\s*<(?!jcr:content)[\w.:-]+/>', '', data.decode('utf-8'))
            return clean(xml.encode('utf-8'), n)
    return (f'{HEAD}<jcr:root {NS} jcr:primaryType="cq:Page">\n'
            '    <jcr:content cq:conf="/conf/servier-aem" cq:template="/libs/core/franklin/templates/page" '
            'sling:resourceType="core/franklin/components/page/v1/page" '
            'jcr:primaryType="cq:PageContent" jcr:title="servier-aem"/>\n'
            '</jcr:root>\n').encode('utf-8')


def main():
    files = {}

    def add(items):
        for n, data in items:
            files[n] = clean(data, n)

    # CF model + its parent configuration folders (folders merged, model replaced)
    add(entries(CF_EXPORT, MODEL))
    with zipfile.ZipFile(CF_EXPORT) as z:
        parents = ['/conf', f'/conf/{SITE}', f'/conf/{SITE}/settings', f'/conf/{SITE}/settings/dam',
                   f'/conf/{SITE}/settings/dam/cfm', f'/conf/{SITE}/settings/dam/cfm/models']
        for p in parents[1:]:
            add([(f'jcr_root{p}/.content.xml', z.read(f'jcr_root{p}/.content.xml'))])

    # DAM: images of the master pages + COMEX Content Fragments, photos, banner
    add(e for e in entries(os.path.join(DIST, f'{SITE}-master-fr-{VERSION}.zip'), DAM)
        if not e[0].startswith(f'jcr_root{DAM}/comex/') or 'servier-logo_n.jpg' in e[0])
    add(entries(os.path.join(DIST, f'{SITE}-comex-cfs-{VERSION}.zip'), f'{DAM}/comex'))
    add(entries(os.path.join(DIST, f'{SITE}-master-fr-{VERSION}.zip'), f'{DAM}/comex/servier-banniere-officielle-logo.jpg'))

    # pages: language master tree
    add(entries(os.path.join(DIST, f'{SITE}-master-fr-{VERSION}.zip'), f'{SITE_PATH}/master'))

    # sheets + root page properties (AEM export)
    sheets = entries(SHEETS_EXPORT, SITE_PATH) if os.path.exists(SHEETS_EXPORT) else []
    missing = [s for s in SHEETS if not any(n.startswith(f'jcr_root{SITE_PATH}/{s}/') for n, _ in sheets)]
    add(e for e in sheets if any(e[0].startswith(f'jcr_root{SITE_PATH}/{s}/') for s in SHEETS))
    files[f'jcr_root{SITE_PATH}/.content.xml'] = site_root(sheets)
    # optional: Edge Delivery cloud configuration, if it was exported with the sheets
    cloud = entries(SHEETS_EXPORT, CLOUDCONFIGS) if os.path.exists(SHEETS_EXPORT) else []
    add(cloud)

    folder_includes = ''.join(f'        <include pattern="{DAM}/{f}"/>\n' for f in DAM_FOLDERS)
    dam_filters = ''.join(f'    <filter root="{DAM}/{f}"/>\n' for f in DAM_FOLDERS)
    sheet_filters = ''.join(f'    <filter root="{SITE_PATH}/{s}"/>\n' for s in SHEETS if s not in missing)
    cloud_filter = f'    <filter root="{CLOUDCONFIGS}"/>\n' if cloud else ''
    conf_merge = ''.join(f'        <include pattern="{p}"/>\n' for p in parents[1:])
    filters = (f'{HEAD}<workspaceFilter version="1.0">\n'
               # parent folders and the site root page: created when missing, never overwritten
               f'    <filter root="/conf/{SITE}" mode="merge">\n{conf_merge}    </filter>\n'
               f'    <filter root="{MODEL}"/>\n'
               f'{cloud_filter}'
               f'    <filter root="{DAM}" mode="merge">\n        <include pattern="{DAM}"/>\n{folder_includes}    </filter>\n'
               f'{dam_filters}'
               f'    <filter root="{SITE_PATH}" mode="merge">\n'
               f'        <include pattern="{SITE_PATH}"/>\n'
               f'        <include pattern="{SITE_PATH}/jcr:content(/.*)?"/>\n'
               '    </filter>\n'
               f'{sheet_filters}'
               f'    <filter root="{SITE_PATH}/master"/>\n'
               '</workspaceFilter>\n')
    pages = sorted(n for n in files if n.startswith(f'jcr_root{SITE_PATH}/master/') and n.endswith('.content.xml'))
    cfs = [n for n in files if re.match(rf'jcr_root{DAM}/comex/[^/.]+/\.content\.xml$', n) and '/photos/' not in n]
    properties = (f'{HEAD}<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n'
                  '<properties>\n'
                  f'    <entry key="name">{NAME}</entry>\n'
                  f'    <entry key="group">{SITE}</entry>\n'
                  f'    <entry key="version">{VERSION}</entry>\n'
                  '    <entry key="description">servier-aem clean install: comex CF model, DAM (images + 12 COMEX '
                  'CFs), site root with metadata + redirects sheets and the /master/fr language master</entry>\n'
                  '    <entry key="requiresRoot">false</entry>\n'
                  '    <entry key="allowIndexDefinitions">false</entry>\n'
                  '</properties>\n')
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('META-INF/vault/filter.xml', filters)
        z.writestr('META-INF/vault/properties.xml', properties)
        for n in sorted(files):
            z.writestr(n, files[n])
    print(OUT, f'{len(pages)} master nodes, {len(cfs)} CFs, {len(files)} files')
    if missing:
        print(f'WARNING: sheets missing ({", ".join(missing)}): export them to {SHEETS_EXPORT}', file=sys.stderr)


if __name__ == '__main__':
    main()
