# Template de site Servier

`tools/aem-packages/dist/servier-site-template-1.0.0.zip` (`python3 tools/aem-packages/build-site-template.py`,
à partir de `servier-aem-clean-install-1.0.0.zip`). Même structure que le template Adobe
`aem-boilerplate-xwalk` (releases GitHub) :

| Fichier | Rôle |
|---|---|
| `package.json` | titre « Servier – Site Edge Delivery », page ouverte après création : `master/fr/index` |
| `previews/servier.png` | aperçu dans l'assistant (`tools/aem-packages/template/preview.png`) |
| `site.zip` | `/conf/servier-site-template` (modèle CF `comex`, config Edge Delivery, dossiers wcm), `/content/servier-site-template` (`metadata` `/** → servier`, `redirects`, `master/fr`), `/content/dam/servier-site-template` (images + 12 CF COMEX) |

Différences avec le paquet d'installation : chemins renommés `servier-aem` → `servier-site-template`
(AEM les renomme à son tour au nom du nouveau site), pas de `jcr:uuid` ni d'`indexedData` des CF
(plusieurs sites peuvent être créés depuis le même template), thème global `servier`.

## Créer un site

1. **Sites → Create → Site from template → Import** : `servier-site-template-1.0.0.zip` (une seule fois).
2. Choisir le template → titre, nom du site, URL de projet `https://main--<site>--<org>.aem.page`.

## À faire pour chaque nouveau site (hors AEM)

- Site Edge Delivery (repoless, même dépôt de code) : `POST https://admin.hlx.page/config/<org>/sites/<site>.json`
  avec la source `…/bin/franklin.delivery/<org>/<site>/main`, puis le mapping `/content/<site>/:/`
  (`public.json` → `paths`). Le `paths.json` du dépôt ne vaut que pour `servier-aem`.
- Fiches COMEX (overlay CF) : `tools/aem-packages/config/comex/*` adaptés au nom du site.
- Vérifier la recherche des Content Fragments (index régénéré par AEM) ; sinon ouvrir/enregistrer un CF.
- Ajuster le thème dans `metadata` (`servier`, `servier-be`…).
