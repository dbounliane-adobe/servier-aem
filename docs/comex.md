# COMEX Servier : Content Fragments + page /groupe/comex/

## Architecture

| Élément | Où | Rôle |
|---|---|---|
| 12 CF modèle `comex` | `/content/dam/servier-aem/comex/<slug>` | données des membres (firstname, lastname, position, biography, linkedin, photo) |
| Photos | `/content/dam/servier-aem/comex/photos/` | référencées par le champ `photo` |
| Fiche membre | `/groupe/comex/<slug>` | **rendue depuis le CF** par l'overlay CF (json2html + `cf-templates/comex-member.html`) : bandeau + bloc `comex-profile` |
| Page liste | `/content/servier-aem/groupe/comex/index` → `/groupe/comex/` | `hero-page-banner`, intro (`columns`), bloc **`comex-members`**, bas de page gouvernance |

Le bloc `comex-members` ne contient aucune donnée de membre : le champ `members` liste
les CF dans l'ordre d'affichage (sélecteur de contenu UE). Le bloc lit chaque fiche
`/groupe/comex/<slug>.plain.html` et en extrait photo, nom, fonction et LinkedIn
(contrat `.plain.html` : `blocks/comex-profile/README.md`). Modifier un CF puis
re-prévisualiser / publier sa fiche met à jour la fiche et la liste.

Ordre (comme la source) : Olivier Laureau, puis ordre alphabétique des noms.

## Installer

Paquets (`tools/aem-packages/dist/`) :

1. `servier-aem-comex-cfs-1.0.0.zip` — 12 CF + 12 photos + photo du bandeau
   (le modèle `comex` n'est **pas** inclus ni modifié). Les nœuds CF viennent de l'export du DAM
   réparé `tools/aem-packages/import/cf-comex.zip` (mixin `cq:contentFragment`, `_strucVersion` 2,
   variation `master`, `indexedData`), sans l'état de publication ; leurs valeurs sont contrôlées
   par rapport aux données sources au build.
2. Page liste : `/content/servier-aem/master/fr/groupe/comex/index`, dans `servier-aem-master-fr`
   et `servier-aem-clean-install` (ce dernier contient aussi les CF et le modèle `comex`).

Puis publier le dossier `comex` (CF, photos, bandeau) et la page `master/fr/groupe/comex/index`.

## Configuration du site (une fois) — fichiers dans `tools/aem-packages/config/comex/`

1. `public.json` → `POST https://admin.hlx.page/config/dbounliane-adobe/sites/servier-aem/public.json`
   (mapping `/content/dam/servier-aem/comex/:/groupe/comex/` + allowlist overlay du modèle).
   Le dépôt contient aussi un `paths.json` (mapping `/content/servier-aem/:/`) : y ajouter
   la ligne `"/content/dam/servier-aem/comex/:/groupe/comex/"` si c'est ce fichier qui fait foi.
2. `content-overlay.json` → à fusionner dans `POST …/sites/servier-aem/content.json`
   en **conservant** la `source` existante.
3. `json2html.json` → `POST https://json2html.adobeaem.workers.dev/config/dbounliane-adobe/servier-aem/main`
   avec l'en-tête `Authorization: token <jeton-admin>` (jeton à saisir dans votre terminal,
   jamais dans le code).

Vérifier ensuite `https://main--servier-aem--dbounliane-adobe.aem.page/groupe/comex/olivier-laureau`
(prévisualiser la fiche) puis `/groupe/comex/`.

## Écarts connus avec la source

- **URL des fiches :** `/groupe/comex/olivier-laureau` au lieu de
  `/groupe/comex/comite-executif-olivier-laureau/` (nom du CF). Prévoir des redirections si besoin.
- **Fonction sur la liste :** la source coupe certaines fonctions après « Vice-Président·e
  Exécutif·ve » (retour à la ligne de mise en page). Le CF stocke la fonction de la fiche
  sur une ligne, donc le retour à la ligne de la liste n'est pas reproduit.
- **Fiche :** un seul paragraphe de biographie est placé à côté de la photo ; sur la source,
  David Hindley et Stéphane Mascarau en ont deux.
- **Prévisualisation locale :** les fiches `content/groupe/comex/<slug>.plain.html` sont des
  copies locales importées (`tools/importer/import-comex-member.js`) avec la même structure que
  l'overlay ; elles ne sont pas à publier. En ligne, les fiches viennent des CF.
