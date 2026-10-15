# Blog Servier (newsroom / dossiers) dans AEM Sites / Universal Editor

## Pages

| Page AEM | URL | Contenu |
|---|---|---|
| `/content/servier-aem/newsroom/dossiers/index` | `/newsroom/dossiers/` | liste : bandeau (`hero-page-banner`) + `article-list` (filtres, grille de cartes, pagination), `template = listing` |
| `/content/servier-aem/newsroom/dossiers/dystrophie-musculaire-becker-maladie-evolutions-multiples` | idem | article complet, `template = article` |
| `/content/servier-aem/newsroom/dossiers/<slug>` (42 pages) | idem | articles « carte » : bandeau, en-tête (titre + date), introduction |

Chaque article porte dans ses propriétés de page : titre, description, **image**
(carte / og:image), `category` (Décryptages), `publication-date` (AAAA-MM-JJ),
`keywords` (étiquette : Comprendre les pathologies / la recherche / nos engagements),
`template = article`, `theme = servier`, `language = fr`.

## Installer

Paquet : `tools/aem-packages/dist/servier-aem-newsroom-dossiers-1.0.0.zip` (44 pages, 46 images).
Il ne touche ni l'accueil, ni la nav, ni le footer. Les pages conteneurs `newsroom` et
`newsroom/dossiers` ne sont créées que si elles n'existent pas.

1. Author → **CRX Package Manager** (`/crx/packmgr`) → *Upload* → *Install*.
2. Assets → `servier-aem/newsroom` : vérifier les images (*Reprocess Assets* si besoin).
3. Publier les images, puis les 43 articles, puis `newsroom/dossiers/index`.

## Index

Les cartes (liste et grille d'actualités de l'accueil) lisent `/query-index.json`.
La configuration (`helix-query.yaml`, appliquée aussi dans le service de configuration :
`content/query.yaml`) indexe : titre = H1, description, image (og:image), date,
catégorie, étiquettes (`keywords`), template ; nav et footer exclus. L'index se
remplit au fur et à mesure de la publication des pages.

## Régénérer

1. Import : `tools/importer/import-article.js` (article complet), `import-article-card.js`
   (articles carte, `urls-article-card.txt`), `import-dossiers-listing.js` (liste).
2. Conversion AEM : `node tools/aem-packages/convert-blog.mjs` (voir l'en-tête du script),
   images dans `migration-work/aem-assets/newsroom/`.
3. Paquet : `python3 tools/aem-packages/build-blog.py`.
