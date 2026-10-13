# MVP multisite EDS / AEM Sites

Ce socle reprend les principes visuels observés sur servier.com : grand hero,
typographie généreuse, bleu profond, accent corail, boutons arrondis, newsroom
filtrable, cartes thématiques et mises en avant image/texte. Ce n'est pas une
copie à l'identique. Les textes et l'illustration de démonstration sont originaux ;
les photos, vidéos, logos et polices de marque doivent être fournis avec leurs
droits d'utilisation.

## 1. Démonstration locale

Sans connexion au CMS :

```sh
python3 -m http.server 3000 --bind 127.0.0.1
```

Ouvrir `http://localhost:3000/drafts/index.html` puis une carte d'article.
La page dédiée est `/drafts/science.html`. Le listing utilise un index fictif
contenant trois entrées qui renvoient au même article de démonstration.
`science.plain.html` représente le HTML non décoré que le teaser récupérerait
depuis EDS. Les fichiers `drafts/` sont exclus de la diffusion du code EDS par
`.hlxignore` ; ils ne constituent pas des pages CMS déployées.

Avec un vrai site repoless déjà configuré et prévisualisé :

```sh
aem up --no-open --forward-browser-logs --url https://main--SITE--ORG.aem.page
```

Créer la page d'accueil dans Universal Editor, avec `theme = servier`,
`language = fr`. Ajouter `template = article` sur les pages éditoriales.
Sans métadonnée `theme`, le boilerplate reste inchangé. Le thème est chargé
en phase eager uniquement pour les pages qui l'activent. Aucun domaine Servier,
chemin DAM de client, identifiant de tenant ou jeton n'est codé dans les blocs.

Validation locale :

```sh
npm run build:json
npm run lint
npm run test:mvp
```

Le dernier test utilise Chrome headless installé sur macOS, sans dépendance de
test supplémentaire. Sur une autre machine : `CHROME_PATH=/chemin/chromium npm run test:mvp`.
Les tests utilisent un serveur loopback et un profil temporaire, fermés en fin
d'exécution. Les viewports CSS de 390 et 1440 pixels sont imposés par iframe
et vérifiés exactement, indépendamment de la largeur minimale de fenêtre
de Chrome headless. Node.js 22+ est nécessaire pour ce runner.

## 2. Bibliothèque de blocs Universal Editor

Les définitions, modèles et filtres se trouvent dans `blocks/*/_*.json`.
Les fichiers agrégés à la racine sont générés par `npm run build:json`.
Les blocs existants Hero, Cards, Columns et Fragment sont conservés.

| Bloc | Champs / rôle |
| --- | --- |
| Campaign Hero | Image de fond + alt, titre H1, sous-titre riche, destination et libellé CTA, vidéo MP4/WebM facultative |
| Section Intro | Surtitre, titre H2, introduction riche ; alignement gauche/centré |
| Editorial Feature | Image + alt, surtitre, H2, texte riche, CTA ; image à gauche/droite |
| Topic Cards | Conteneur d'items : image + alt, H3, description riche et CTA ; expertises, engagements, rubriques |
| Key Figures | Conteneur d'items : valeur libre et libellé ; chiffres non limités à un type numérique |
| Article Feed | Index du site, préfixe de chemin, catégorie facultative, limite ; filtres de catégories et dates |
| Article Header | Catégorie, H1, chapô riche, date ISO, auteur/relecteur, durée de lecture, couverture + alt |
| Scientific Teaser | URL d'un article CF publié sur ce site ; titre et résumé locaux facultatifs, libellé CTA |

Utiliser une section `Full width` pour le hero et `Soft background` pour une
zone légèrement teintée. Un seul H1 par page. Le corps d'un article AEM Sites
utilise les composants natifs Title, Text, Image, Button, et les autres blocs :
pas de gros champ HTML imposé pour toute la page.

Les noms groupés `content_*`/`meta_*` et les suffixes `Alt`, `Text`, `Type`
exploitent le regroupement et l'inférence sémantique natifs AEM. Le contrat HTML :

- Hero / Editorial Feature : ligne image, ligne contenu regroupé ; vidéo en
  troisième ligne pour le hero.
- Article Header : ligne contenu, ligne métadonnées regroupées, ligne image.
- Topic Cards : une ligne par item, cellule image puis cellule contenu.
- Key Figures : une ligne par item, cellule valeur puis cellule libellé.
- Article Feed / Scientific Teaser : lignes clé/valeur.

Les emplacements image/vidéo vides sont acceptés ; conserver ces cellules
structurelles lorsqu'on écrit du HTML de test à la main. Une nouvelle structure
doit être vérifiée sur le `.plain.html` réel rendu par votre instance AEM.
Les nœuds éditoriaux sont conservés, ou leur instrumentation `data-aue-*` est
transférée lors des transformations. Les données récupérées par le feed ne sont
pas présentées comme des composants éditables de la page courante.

La vidéo est décorative, muette, en boucle, avec commande lecture/pause.
Le démarrage automatique est différé de trois secondes pour privilégier l'image
et le contenu nécessaires au LCP.
En mode réduction des animations, sa source n'est chargée qu'après action
explicite. L'image reste le poster et le fond de secours. Fournir une courte
vidéo compressée, sans information indispensable exclusivement dans la vidéo.
Les libellés système ont des valeurs FR/EN ; les libellés du feed peuvent être
surchargés dans ses propriétés.

## 3. Content Fragment Model à créer dans AEM

Activer les Content Fragment Models sur votre configuration `/conf/<projet>`.
Créer un modèle **Scientific Article**, nom technique `scientific-article`.
Autoriser ce modèle sur un dossier DAM propre à chaque site :
`/content/dam/<site>/articles/`. Les noms techniques ci-dessous doivent
correspondre exactement aux clés `properties.elements` de l'Assets HTTP API.

| Nom technique | Type AEM | Obligatoire / usage |
| --- | --- | --- |
| `headline` | Single line text | Oui, titre affiché et SEO |
| `summary` | Multi line text, **plain text** | Oui, chapô et description des cartes/SEO |
| `category` | Enumeration, une valeur | Oui ; par exemple Décryptages, Actualités, Revue scientifique |
| `publicationDate` | Date and time | Oui ; valeur ISO 8601, date de publication éditoriale |
| `author` | Single line text | Oui, auteur ou équipe de rédaction |
| `readingTime` | Single line text | Facultatif, libellé localisé, par exemple « 5 minutes de lecture » |
| `image` | Content reference, un asset image | Facultatif, couverture utilisée aussi dans le feed |
| `imageAlt` | Single line text | À renseigner si l'image transmet une information |
| `body` | Multi line text, **rich text / HTML** | Oui ; paragraphes, H2/H3, listes, liens et illustrations |
| `quote` | Multi line text, plain text | Facultatif, citation mise en évidence après le corps |
| `sources` | Multi line text, rich text / HTML | Facultatif, bibliographie et liens DOI |
| `sourcesHeading` | Single line text | Si sources renseignées ; valeur initiale « Sources et références » |
| `relatedLinks` | Multi line text, rich text / HTML | Facultatif, liste éditorialisée de liens vers des pages EDS |
| `relatedHeading` | Single line text | Si liens renseignés ; valeur initiale « Pour aller plus loin » |
| `language` | Enumeration | Oui, `fr` ou `en` ; langue du fragment et du HTML |
| `theme` | Enumeration | Facultatif ; `servier` pour ce design, vide pour le boilerplate |

Le nom de l'asset est le slug : `lire-une-publication` devient par exemple
`/newsroom/science/lire-une-publication`. Utiliser les variations/localisations
AEM pour les besoins linguistiques ; ce MVP lit la variation principale
`properties.elements.*.value`, pas une variation choisie dynamiquement.

Le champ riche `body` laisse la liberté narrative sans multiplier les modèles.
Le template utilise du Mustache échappé pour les textes/attributs, et du HTML
non échappé uniquement pour `body`, `sources` et `relatedLinks` provenant des
champs rich text AEM de rédacteurs de confiance. Ne pas y injecter de HTML
provenant de formulaires ou de sources non fiables.

### Deux parcours éditoriaux, sans fausse synchronisation

**Réutilisation structurée :** éditer le CF dans l'éditeur de Content Fragments,
le prévisualiser/publier vers EDS via l'overlay ci-dessous. Il devient une page
HTML complète, sans requête GraphQL côté navigateur. Dans Universal Editor,
ajouter un **Scientific Teaser** qui pointe vers son URL EDS. Le teaser lit le
`.plain.html`, reprend titre/chapô/image, et permet de surcharger titre/chapô
localement dans le panneau de propriétés UE. Les valeurs d'origine restent
dans le CF. Après modification du CF, republier sa page ; les teasers reprennent
les nouvelles valeurs lors de leur prochain chargement.

**Composition libre :** créer directement une page AEM Sites avec Article
Header et les composants/blocs éditables UE, puis publier cette page.
Reporter catégorie et date dans les métadonnées de page pour le feed.
Le titre et la description de page fournissent les données SEO.

L'overlay ne rend **pas** un CF directement éditable dans Universal Editor et
ne synchronise **pas** une page UE avec un CF. Une intégration UE de l'édition
des champs CF et des compositions récursives de fragments serait un chantier
supplémentaire, hors MVP. Éviter deux sources éditoriales pour un même article.

## 4. Configuration repoless, une fois par site

Ces exemples sont des **gabarits à adapter**, non exécutés par le repository.
Utiliser un jeton Admin API dans votre terminal, jamais dans le code client ni
dans `public.json`. Fusionner les paramètres avec la configuration existante :
ne pas remplacer aveuglément les mappings, includes ou overlays déjà en place.

### Site canonique et code partagé

Le site canonique doit associer `ORG/SITE = code.owner/code.repo`, avec AEM
Code Sync installé. Pour ce repo, le code est
`dbounliane-adobe/servier-aem`. Faire confirmer le provisionnement et les droits
de votre organisation EDS avant de créer les autres sites.

Créer chaque site repoless via `PUT /config/<org>/sites/<site>.json` avec :

```json
{
  "code": {
    "owner": "dbounliane-adobe",
    "repo": "servier-aem"
  },
  "content": {
    "source": {
      "url": "https://AUTHOR.adobeaemcloud.com/bin/franklin.delivery/ORG/SITE/main",
      "type": "markup",
      "suffix": ".html"
    }
  }
}
```

Réutiliser l'URL de delivery réellement fournie pour votre configuration AEM
Sites. Chaque site garde sa racine de contenu, ses assets, sa navigation
`/nav`, son `/footer`, son index et ses métadonnées. Les URLs de preview sont
`https://main--<site>--<org>.aem.page`, **pas nécessairement le nom du repo**.
Les mises à jour du code partagé affectent tous les sites qui le consomment.
Tester une branche sur un site de démo avant promotion.

### Mapping et allowlist des CF

Fusionner dans `POST https://admin.hlx.page/config/<org>/sites/<site>/public.json` :

```json
{
  "paths": {
    "mappings": [
      "/content/SITE/:/",
      "/content/dam/SITE/articles/:/newsroom/science/"
    ],
    "includes": [
      "/content/SITE/",
      "/content/dam/SITE/articles/"
    ]
  },
  "xwalk": {
    "content-fragment-overlay": {
      "/content/dam/SITE/articles/**": {
        "includes": ["/conf/PROJET/settings/dam/cfm/models/scientific-article"]
      }
    }
  }
}
```

Les racines et le chemin du modèle sont propres à votre instance.
Le support multi-field existant reste dans `xwalk.json` ; si vous l'overridez
dans la configuration publique du site, conserver sa valeur intentionnelle.

Ajouter à `POST .../sites/<site>/content.json`, en conservant `source` :

```json
{
  "overlay": {
    "url": "https://json2html.adobeaem.workers.dev/ORG/SITE/main",
    "type": "markup"
  }
}
```

Configurer le service avec
`POST https://json2html.adobeaem.workers.dev/config/ORG/SITE/main`,
en-tête `Authorization: token <jeton-admin>`, et ce tableau JSON :

```json
[
  {
    "path": "/newsroom/science/",
    "endpoint": "https://AUTHOR.adobeaemcloud.com/api/assets/SITE/articles/{{id}}.json",
    "regex": "/(?<=\\/newsroom\\/science\\/)(.+)$/",
    "template": "/cf-templates/scientific-article.html",
    "relativeURLPrefix": "https://PUBLISH.adobeaemcloud.com",
    "headers": { "Accept": "application/json" },
    "forwardHeaders": ["Authorization"]
  }
]
```

Le template Mustache est livré dans `cf-templates/scientific-article.html`.
Il faut d'abord synchroniser ce code vers EDS, puis tester la réponse JSON
réelle d'un CF et adapter au besoin ses chemins de propriétés. Les images et
autres assets référencés doivent être publiés et accessibles à l'ingestion.
`relativeURLPrefix` ne réécrit que les extensions prises en charge par Adobe ;
utiliser des URLs absolues pour les autres formats.

### Index de la newsroom

Installer la configuration d'index sur **chaque site** (ou profil adapté) :

```sh
curl -X POST "https://admin.hlx.page/config/ORG/sites/SITE/content/query.yaml" \
  -H "x-auth-token: $AEM_ADMIN_TOKEN" \
  -H "content-type: text/yaml" \
  --data-binary @helix-query.yaml
```

`helix-query.yaml` sert ici de source/version de référence pour le déploiement
de la configuration, sans supposer que le service lit automatiquement ce fichier
pour tous les sites repoless. Vérifier puis réindexer via l'Index Admin Tool.
Le feed utilise `title`, `description`, `image`, `imageAlt`, `date`, `category`,
`path` et `robots`. Son préfixe par défaut est `/newsroom/` ; le modifier si la
structure du site diffère. Les liens et l'index doivent appartenir au site courant.

**Un index EDS contient les pages publiées, pas seulement prévisualisées**,
même lorsqu'il est consulté sur `.aem.page`. Publier au moins un CF/article,
puis vérifier `/query-index.json`. Un index vide affiche un état vide explicite ;
un index absent/invalide affiche une erreur et journalise le problème.

### Recette sur votre instance

1. Créer et publier le modèle et un CF de test ; publier ses assets.
2. Configurer mappings, overlay et json2html, puis prévisualiser/publier le CF
   vers `/newsroom/science/<slug>` selon les droits/outils de votre instance.
3. Vérifier le HTML et `.plain.html` de cette page, puis son entrée dans l'index.
4. Dans UE, créer l'accueil et un Scientific Teaser pointant vers cette URL.
5. Prévisualiser, tester CTA, filtres, mobile, lecture/pause et surcharge locale.
6. Répéter avec un second site : même code, contenu/navigation/index distincts.

L'accès à votre instance, la configuration des services, les flux de
publication CF, les tests réels dans UE et la mesure PageSpeed du site déployé
restent à effectuer. Le test local valide les blocs, pas le provisioning AEM.

## Documentation Adobe

- [Repoless](https://www.aem.live/docs/repoless)
- [Configuration Service](https://www.aem.live/docs/config-service-setup)
- [Modèles et regroupement des champs](https://www.aem.live/developer/component-model-definitions)
- [Content Fragment overlay](https://www.aem.live/developer/content-fragment-overlay)
- [json2html](https://www.aem.live/developer/json2html)
- [Indexing](https://www.aem.live/developer/indexing)
