# Multilingue : master français et copies de langue / pays

## Structure

```
/content/servier-aem
├── metadata                 tableau de métadonnées (/** → theme)
├── index, nav, footer, …    site racine actuel (inchangé)
└── master                   « Language Masters »
    └── fr                   racine de langue (jcr:language = fr) → source des traductions / live copies
        ├── index            accueil        → /master/fr/
        ├── nav, footer      fragments      → chargés automatiquement pour /master/fr/… (scripts/locale-fragments.js)
        ├── newsroom/dossiers/index + 43 articles
        └── groupe/comex/index
```

Copies à venir (non créées) : `/content/servier-aem/fr/fr`, `/content/servier-aem/be/fr`, `/content/servier-aem/be/nl`…
Le code reconnaît tout chemin `/{dossier}/{langue}/` et y cherche `nav` / `footer`, sinon ceux de la racine.

## Paquet

`tools/aem-packages/dist/servier-aem-master-fr-1.0.0.zip` (`python3 tools/aem-packages/build-master.py`)

- 48 pages + les 63 images qu'elles utilisent (DAM partagé entre langues, chaque image remplacée seule).
- `master` et `master/fr` (et les pages conteneurs `newsroom`, `dossiers`, `groupe`, `comex`) : créés seulement s'ils
  n'existent pas. Les 48 pages, elles, sont **remplacées** (nœud page + `jcr:content`) : les modifications faites à la
  main dans un `/master/fr` existant sont écrasées.
- Prérequis : paquet `servier-aem-comex-cfs` (les Content Fragments COMEX sont partagés, hors master).

Différences avec les pages racine :
- **Aucun thème au niveau des pages** : le thème vient du tableau `metadata` (`/**` couvre `/master/fr/**`).
- **Liens internes en chemins AEM** : `/groupe/comex/` → `/content/servier-aem/master/fr/groupe/comex/`.
  Edge Delivery les publie en `/master/fr/groupe/comex/` (mapping `paths.json`) ; MSM et les projets de traduction
  les réécrivent vers chaque copie. Les listes d'articles filtrent sur `/master/fr/newsroom/…`.
  Les liens vers des pages pas encore migrées (`/patients/…`) pointent aussi dans le master (404 tant qu'elles
  n'existent pas, comme à la racine). Conservés : URL externes, `/en/…`, `/query-index.json`, ancres.

## Thème des copies

- Copies dans **le même site Edge Delivery** (`servier-aem`, ex. `/fr/fr/…`) : couvertes par `/** → servier`.
  Pour un thème par pays, ajouter des lignes **après** `/**` : `/be/** → servier-be`.
- Copies publiées comme **sites Edge Delivery séparés** (repoless, mapping `/content/servier-aem/be/fr/:/`) : chaque
  site lit le `metadata` de **sa** racine. Créer aussi un tableau `metadata` dans `/master/fr` (`/** → servier`) :
  il sera copié avec la langue et ajusté par pays (`servier-be`).

## Étapes suivantes (dans AEM)

1. Installer le paquet, puis prévisualiser / publier `/master/fr` (arborescence).
2. Traductions : *Projects → Translation project* avec `/content/servier-aem/master/fr` comme source
   (règles : `tools/translation/translation_rules.xml`) → crée `/master/en`, `/master/nl`…
3. Pays : *Sites → Create → Live Copy* depuis `/master/fr` (ou une langue traduite) vers `/content/servier-aem/fr/fr`…

## Racine du site → /master/fr (redirections 301)

Liste prête : `tools/aem-packages/config/redirects-root-to-master-fr.csv` (50 lignes, une par URL racine publiée ;
le tableau `redirects` d'Edge Delivery n'accepte pas de jokers).

1. AEM Sites → `/content/servier-aem` → **Créer → Page** → modèle **Redirects** (nom `redirects`).
2. Coller les lignes `source` / `destination` du CSV, puis **prévisualiser et publier** `redirects`.
3. Vérifier `/redirects.json`, puis `/` → `/master/fr/`.

- Les redirections passent avant le contenu : les pages racine peuvent rester, elles sont masquées.
- Pages conteneurs vides de la racine (`/groupe`, `/newsroom`…) : envoyées vers la page master réelle la plus proche.
- **Non redirigés** : `/groupe/comex/<membre>` (fiches rendues depuis les Content Fragments), `/nav`, `/footer`
  (repli des fragments), `/metadata.json`, `/query-index.json`.
- Toute nouvelle page racine publiée plus tard = une ligne à ajouter. À terme, rediriger vers la copie publique
  (`/fr/fr/…`) plutôt que vers le master.

## Installation propre (instance vidée de servier-aem)

Paquet unique : `tools/aem-packages/dist/servier-aem-clean-install-1.0.0.zip`
(`python3 tools/aem-packages/build-clean.py` ; sources : paquets `master-fr` et `comex-cfs`, exports
`import/cf-comex.zip` et `import/export servier-aem.zip`, sans état de publication).

| Chemin | Contenu | Mode |
|---|---|---|
| `/conf/servier-aem/settings/dam/cfm/models/comex` | modèle CF `comex` | remplacé (dossiers parents fusionnés) |
| `/conf/servier-aem/settings/cloudconfigs` | configuration Edge Delivery (owner `dbounliane-adobe`, repo `servier-aem`) | remplacé |
| `/content/dam/servier-aem/{index,header,footer,newsroom,comex}` | images, 12 CF COMEX, photos | chaque dossier remplacé |
| `/content/servier-aem` | page racine (`cq:conf`, langue fr) | créée si absente |
| `/content/servier-aem/metadata`, `/redirects` | tableaux (thème ; 50 redirections) | remplacés |
| `/content/servier-aem/master` | master français (48 pages) | remplacé |

Après installation : publier `metadata` et `redirects` (Edge Delivery), les CF COMEX, puis l'arborescence `/master/fr`.
Le paquet ne supprime pas d'éventuelles anciennes pages racine (`index`, `nav`…) : les supprimer avant si besoin.
