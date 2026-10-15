# Header et footer Servier dans AEM Sites / Universal Editor

Le header (`blocks/header`) et le footer (`blocks/footer`) lisent chacun un
fragment : les pages AEM `/content/servier-aem/nav` et `/content/servier-aem/footer`,
servies en `/nav.plain.html` et `/footer.plain.html` sur aem.page / aem.live, et
en `/content/servier-aem/<page>.plain.html` sur l'author (Universal Editor).
En local, `aem up` sert `content/nav.plain.html` et `content/footer.plain.html`.

## 1. Installer le contenu

**Recommandé : `servier-aem-site-1.0.0.zip`** — page d'accueil + nav + footer et
toutes leurs images, en une seule installation. Seuls le nœud de chaque page et son
`jcr:content` sont remplacés ; les pages enfants (par ex. sous `index`) sont conservées.

| Paquet (`tools/aem-packages/dist/`) | Chemins | Contenu |
|---|---|---|
| `servier-aem-index-1.0.0.zip` | `/content/servier-aem/index` | page d'accueil (7 sections, `theme = servier`, `language = fr`) — **remplace** l'accueil existant |
| | `/content/dam/servier-aem/index/` | 6 images (feature, fonds, slides du carrousel) |
| `servier-aem-header-nav-1.0.0.zip` | `/content/servier-aem/nav` | page de navigation (4 sections) — **remplace** la page `nav` existante |
| | `/content/dam/servier-aem/header/` | `header-logo-servier.svg`, `header-logo-servier-dark.svg`, `header-icon-search.svg` |
| `servier-aem-footer-1.0.0.zip` | `/content/servier-aem/footer` | page footer (1 section) — **remplace** la page `footer` existante |
| | `/content/dam/servier-aem/footer/` | logo, 4 icônes réseaux sociaux, badge Kastor |

1. Author → **CRX Package Manager** (`/crx/packmgr`) → *Upload Package* → *Install*.
2. Assets → `servier-aem/index`, `header`, `footer` : vérifier les images
   (si les miniatures manquent : *Reprocess Assets*).
3. Publier les images, puis les pages `nav`, `footer` et l'accueil
   (Sites → sélectionner → *Quick Publish*, ou Universal Editor → *Publish*).

La vidéo du hero et les liens externes pointent vers servier.com, comme en preview
(une vidéo du DAM n'est pas servie par Edge Delivery : `…/content/dam/…mp4` → 404).

Régénérer après modification de `content/<page>.plain.html` : conversion html2md +
md2jcr vers `migration-work/jcr-content/<page>.xml` (images de l'accueil dans
`migration-work/aem-assets/index/`), puis
`python3 tools/aem-packages/build-fragments.py [index|header|footer|site|all]`.
Les titres des composants UE étant préfixés « Servier », la conversion compare les
blocs à leur identifiant (`hero-cta` → « Hero Cta »).

## 2. Structure de la page `nav` (à conserver)

Quatre sections, dans cet ordre :

1. **Logo** — Image (logo blanc, sur le hero) + Image (logo indigo, barre sticky)
   + Button « Servier » vers `/` (titre = libellé accessible du logo).
2. **Menu** — Text : paragraphe « Ouvrir le menu » (libellé du bouton mobile)
   puis une liste à puces. Une sous-liste sous un élément = menu déroulant.
3. **Recherche** — Image (icône loupe) + Button vers l'URL de recherche
   (`https://servier.com/?s=` : le nom du paramètre `s` est repris) + Text :
   placeholder, libellé « Rechercher », libellé « Fermer la recherche ».
4. **Liens utilitaires** — Text : liste des langues (`fr`, `en` : le libellé sert
   à repérer la langue courante), puis une 2ᵉ liste (Presse, Contactez-nous, Mediator).

## 3. Structure de la page `footer` (à conserver)

Une section, dans cet ordre :

1. **Logo** — Image (logo) **immédiatement suivie** d'un Button vers `/`
   (le libellé sert de texte alternatif si l'image n'en a pas).
2. **Text** — liste des liens légaux (menu sur 2 colonnes), puis liste des
   réseaux sociaux (chaque élément = lien contenant uniquement une icône),
   puis le paragraphe « ©2026 Les Laboratoires Servier ».
3. **Image** — badge Kastor (texte alternatif = contenu du badge).
4. **Button** vers `#top` — devient le bouton « retour en haut » (son libellé =
   libellé accessible).

Règles de classement : une liste dont chaque élément est un lien-image = réseaux
sociaux ; une autre liste = menu ; une image seule = badge ; un lien commençant
par `#` = retour en haut.

## 4. Formats acceptés par le code

- images à côté du lien (composants Image de Universal Editor, qui ne portent
  pas de lien) ;
- éléments de liste dans un paragraphe (`li > p > a`, produit par le texte riche) ;
- icônes `:nom-icone:` (→ `/icons/nom-icone.svg`, copies déjà dans `icons/`) ;
- images AEM en `<picture>` avec URLs relatives (`./media_…`), réécrites par
  rapport à l'URL du fragment.

## 5. Vérifier

- Universal Editor, page d'accueil : header et footer s'affichent dans l'éditeur.
- `…aem.page/nav.plain.html` : 4 sections, 3 `<img>` avec une vraie URL (pas `about:error`).
- `…aem.page/footer.plain.html` : le lien vers `/` contient le logo, 6 images au total.
- `https://main--servier-aem--dbounliane-adobe.aem.page/` :
  - header : logo, 5 menus déroulants, recherche, FR souligné, barre blanche au
    retour de scroll ; menu mobile < 900 px ;
  - footer : logo, 7 liens, 4 icônes, copyright, badge, bouton retour en haut.

Les SVG du DAM sont bien servis par Edge Delivery (l'ancien footer publié affiche
ses icônes). En cas de problème, remplacer une image par l'icône correspondante,
par ex. `:header-logo-servier:` ou `:footer-social-facebook:` dans le libellé du lien.

## Note technique

`fetchNav()` (header) et `fetchFooterFragment()` (footer) essaient
`/content/<site>/<page>.plain.html` (author), puis `/content/<page>.plain.html`
(local), puis `/<page>.plain.html` (aem.page / aem.live). Le premier chemin n'est
utilisé que sur un hôte `*.adobeaemcloud.*` : les contrôles `check-fetch-path` des
workflows header/footer, qui attendent exactement deux chemins, signalent donc
cette exception volontaire.
