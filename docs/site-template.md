# Template de site Servier

`tools/aem-packages/dist/servier-site-template-1.0.2.zip` (`python3 tools/aem-packages/build-site-template.py`).

Construit **sur le template Adobe « AEM Site with Edge Delivery Services Template » 0.2.0**
(`tools/aem-packages/template/aem-sites-with-edge-delivery-services-template-0.2.0.zip`, release
`adobe-rnd/aem-boilerplate-xwalk`), pour que l'assistant le traite comme un template Edge Delivery
(champ **URL du projet**) :

| Repris tel quel du template Adobe | Retiré | Ajouté (depuis `servier-aem-clean-install-1.0.0.zip`) |
|---|---|---|
| `package.json` (mêmes clés), `site.zip` : `META-INF` (propriétés, manifeste, Maven, FileVault), filtre, `/conf/<tpl>` (configuration Edge Delivery, dossiers wcm), page racine, dossier DAM racine (ACL, profil de traitement) | pages de démo `index`, `nav`, `footer` à la racine, images de démo | modèle CF `comex`, `metadata` (`/** → servier`), `redirects`, `master/fr` (48 pages), DAM `index`, `header`, `footer`, `newsroom`, `comex` (12 CF) |

Nom interne conservé : `aem-sites-with-edge-delivery-services-template` (AEM le remplace par le nom du
site à la création). Titre affiché : « Servier - Site Edge Delivery » ; aperçu 1024 × 2247
(`tools/aem-packages/template/preview.png`) ; page ouverte après création : `master/fr/index`.
Pas de `jcr:uuid` ni d'`indexedData` des CF (plusieurs sites peuvent être créés depuis le template).

## Créer un site

1. Créer d'abord le site Edge Delivery (tools.aem.live / service de configuration) : même dépôt de code,
   source `…/bin/franklin.delivery/<org>/<site>/main`, mapping `/content/<site>/:/`.
2. **Sites → Create → Site from template → Import** : `servier-site-template-1.0.2.zip` (une seule fois).
   Les templates importés sont dans `/conf/global/site-templates` (CRXDE) : supprimer une ancienne
   version avant de réimporter ; changer `VERSION` du script à chaque nouvelle version.
3. Choisir « Servier - Site Edge Delivery » → titre, nom du site, URL du projet
   `https://main--<site>--<org>.aem.page`.

## Ensuite, pour chaque site

- Fiches COMEX (overlay CF) : `tools/aem-packages/config/comex/*` adaptés au nom du site.
- Vérifier la recherche des Content Fragments (index régénéré par AEM) ; sinon ouvrir/enregistrer un CF.
- Ajuster le thème dans `metadata` (`servier`, `servier-be`…), puis publier `metadata`, `redirects`,
  les CF et `master/fr`.
