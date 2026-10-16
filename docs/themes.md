# Thèmes : Servier global et variantes régionales

| Thème (`theme`) | Feuilles chargées | Usage |
|---|---|---|
| `servier` | `styles/servier.css` | site global servier.com |
| `servier-be` | `styles/servier.css` puis `styles/servier-be.css` | Servier Belgique (codes visuels de servier.be) |

Les couches sont déclarées dans `THEME_LAYERS` (`scripts/scripts.js`). Ajouter un pays =
un fichier `styles/servier-xx.css` + une ligne dans `THEME_LAYERS` + une option dans `models/_page.json`.

## Définir le thème pour tout le site (recommandé)

Le thème vient de la métadonnée `theme`. On la pose une fois à la racine avec un tableau
de métadonnées en masse (bulk metadata) :

1. AEM Sites → racine `/content/servier-aem` → **Créer → Page** → modèle **Metadata**, nom `metadata`.
2. Colonnes `URL` et `theme`, une ligne : `/**` | `servier` (ou `servier-be`).
   Les lignes sont lues de haut en bas : `/**` d'abord, les motifs plus précis (`/be/**`) ensuite.
3. **Prévisualiser puis publier** le tableau `metadata`.
4. Seulement ensuite, vider le champ **Theme** de la page index
   (Propriétés de page → Theme → « Hériter du site »), puis re-prévisualiser / publier la page.
   Le paquet `servier-aem-index` / `servier-aem-site` ne pose plus de thème sur la page.

Le thème d'une page (champ **Theme** renseigné) passe toujours avant le tableau :
« Hériter du site » (valeur vide) laisse le tableau décider.

## Démo en prévisualisation

`?theme=servier-be` (ou `?theme=servier`) force un thème sur `*.aem.page` et en local ;
ignoré sur `*.aem.live`.

La copie locale `content/index.plain.html` garde `theme = servier` dans ses métadonnées
pour que la prévisualisation locale reste stylée sans dépendre du tableau de métadonnées.
