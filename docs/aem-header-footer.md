# Header et footer Servier dans AEM Sites / Universal Editor

Le header (`blocks/header`) et le footer (`blocks/footer`) lisent chacun un
fragment : les pages AEM `/content/servier-aem/nav` et `/content/servier-aem/footer`,
servies en `/nav.plain.html` et `/footer.plain.html` sur aem.page / aem.live, et
en `/content/servier-aem/<page>.plain.html` sur l'author (Universal Editor).
En local, `aem up` sert `content/nav.plain.html` et `content/footer.plain.html`.

## 1. Installer le contenu

> **Installation : paquet unique `servier-aem-clean-install-1.0.0.zip`** (voir `docs/multilingue.md`).
> Les pages sont désormais sous `/content/servier-aem/master/fr/…` ; les anciens paquets du site
> racine ont été supprimés.

Pages : `/content/servier-aem/master/fr/nav` et `/content/servier-aem/master/fr/footer`
(servies en `/master/fr/nav.plain.html` et `/master/fr/footer.plain.html` ; le code charge
les fragments du dossier de langue, sinon ceux de la racine — `scripts/locale-fragments.js`).
Images : `/content/dam/servier-aem/header/` et `/content/dam/servier-aem/footer/`.

Régénérer après modification de `content/<page>.plain.html` : conversion html2md +
md2jcr vers `migration-work/jcr-content/<page>.xml`, puis
`python3 tools/aem-packages/build-master.py` et `python3 tools/aem-packages/build-clean.py`.
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
