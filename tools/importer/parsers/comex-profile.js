/* eslint-disable */
/* global WebImporter */
/**
 * Parser for comex-profile. Base: comex-profile (custom, key-value block, 6 rows).
 * Source: https://servier.com/groupe/comex/comite-executif-olivier-laureau/ (template "comex-member",
 * LOCAL PREVIEW member pages only: in production the page is rendered from the CF by
 * cf-templates/comex-member.html). Generated: 2026-10-16.
 *
 * Source DOM (validated in migration-work/block-context/comex-profile/source.html + instances/):
 *   div.wp-block-group.has-indigo-50-background-color   (direct child of .content-page, or nested
 *                                                        in .content-page > .wp-block-group.alignfull)
 *     div.wp-block-columns
 *       div.wp-block-column > figure.wp-block-image > img[data-lazy-src]       (photo)
 *       div.wp-block-column > h2 (name) + p.has-red-500-color > strong (position) + p (bio 1)
 *     p.wp-block-paragraph × N                                                 (bio 2..n)
 *     figure.wp-block-image > a[href*=linkedin] > img[src*=icone_linkedin]     (LinkedIn)
 *
 * Output: the .plain.html contract of blocks/comex-profile/README.md, six key-value rows in
 * order: photo, firstname, lastname, position, linkedin, biography. Key-value rows carry no
 * field hints (md2jcr maps rows by key; see article-list.js).
 *
 * Values must equal the COMEX Content Fragment data (migration-work/comex/cf-data.json), so the
 * CF values (firstname/lastname split, position, biography HTML) are embedded below, keyed by the
 * source URL path. The photo is taken from the page (data-lazy-src). Unknown URLs fall back to
 * extraction from the page.
 */
const CF_DATA = {
  "/groupe/comex/comite-executif-olivier-laureau": {
    "firstname": "Olivier",
    "lastname": "Laureau",
    "position": "Président de Servier et Président de la Fondation Internationale de Recherche Servier",
    "linkedin": "https://www.linkedin.com/in/olivierlaureau/",
    "biography": "<p>Diplômé de l’Université Panthéon-Assas à Paris, France, Olivier Laureau a rejoint le groupe Servier en 1982, d’abord à la Direction de la propriété intellectuelle puis à la direction juridique où il supervisait les contrats internationaux. En 2000, il rejoint la Direction financière et est nommé Directeur financier du Groupe en 2008.</p><p>En tant que Président du Groupe depuis 2014, Olivier Laureau a engagé un vaste plan de transformation visant à assurer l’indépendance de Servier, son développement et sa pérennité tout en continuant de répondre à sa vocation : engagé pour le progrès thérapeutique au bénéfice des patients.</p><p>Les piliers de cette stratégie sont d’optimiser le potentiel des médicaments du Groupe en cardiologie, métabolisme et maladies veineuses, de rechercher et développer des thérapies innovantes et ciblées dans le domaine de l’oncologie, des neurosciences et de l’immuno-inflammation, et de piloter le développement du portefeuille de médicaments, à travers une stratégie de partenariats dynamique et une forte expansion internationale.</p><p>Très impliqué dans les débats liés au secteur de la santé aux niveaux français et international, Olivier Laureau est membre du conseil d’administration du G5, une organisation regroupant les principales entreprises pharmaceutiques françaises.</p><p>Il est également membre du conseil d’administration de la Fédération européenne des associations et industries pharmaceutiques (EFPIA), et membre de la Biopharmaceutical CEOs Roundtable (BCR), un forum mondial sur les politiques de santé réunissant les PDG des entreprises membres de la Fédération internationale de l’industrie du médicament (FIIM).</p>"
  },
  "/groupe/comex/comite-executif-dr-claude-bertrand": {
    "firstname": "Dr Claude",
    "lastname": "Bertrand",
    "position": "Vice-Président Exécutif Recherche & Développement, Chief Scientific Officer",
    "linkedin": "https://www.linkedin.com/in/claude-bertrand-374580/",
    "biography": "<p>Après plus de 25 ans d’expérience en R&amp;D et à l’international au sein de grands groupes pharmaceutiques (Novartis, Roche, Pfizer, AstraZeneca, Ipsen), Claude Bertrand rejoint Servier en 2017 en tant que Directeur général R&amp;D et Directeur scientifique.</p><p>En 2018, il intègre le Comité Exécutif du Groupe et occupe depuis le poste de Vice-Président Exécutif Recherche et Développement.</p><p>Claude Bertrand siège également au Conseil d’administration d’Eclosion2 et de MAAT Pharma. Il est aussi Président du Comité scientifique du LabEx Medalis et Vice-Président de MEDICEN.</p><p>Titulaire d’un doctorat en pharmacie de l’Université de Strasbourg, il a soutenu une thèse (Ph.D.) puis poursuivi des études postdoctorales (University of California San Francisco) portant sur la recherche dans les domaines de l’immunopharmacologie et des inflammations neurogènes.</p>"
  },
  "/groupe/comex/comite-executif-damien-catoir": {
    "firstname": "Damien",
    "lastname": "Catoir",
    "position": "Vice-Président Exécutif Secrétaire Général",
    "linkedin": "https://www.linkedin.com/in/damien-catoir-0aaa7a2/",
    "biography": "<p>Damien Catoir a rejoint le groupe Servier en avril 2023, en tant que Vice-Président Exécutif Secrétaire Général, membre du Comité Exécutif du Groupe.</p><p>Damien Catoir possède une expérience de plus de 15 ans dans le domaine bancaire et dans des grands cabinets d’avocats d’affaires aux États-Unis et en France. Il rejoint le monde de l’entreprise en 2018 au sein du Groupe ATOS, où il occupait précédemment les fonctions de Directeur Juridique Groupe et Secrétaire du Conseil d’administration.</p><p>Dans le cadre de ses missions, il a notamment accompagné ATOS dans la négociation de partenariats stratégiques, de contrats majeurs et de transactions M&amp;A transformantes. Il a également piloté des contentieux complexes et des réorganisations importantes.</p><p>Damien Catoir est avocat aux barreaux de New York et de Paris. Diplômé de l’ESSEC (Grande Ecole), il a également étudié à l’École Normale Supérieure et est titulaire d’un Master 2 en Droit privé général de l’Université Paris 1 Panthéon-Sorbonne et d’un <em>Juris Doctor</em> de l’Université de Cornell aux États-Unis.</p>"
  },
  "/groupe/comex/comite-executif-virginie-dominguez": {
    "firstname": "Virginie",
    "lastname": "Dominguez",
    "position": "Vice-Présidente Exécutive Systèmes d’Information, Digital, Data & IA",
    "linkedin": "https://www.linkedin.com/in/virginie-dominguez/",
    "biography": "<p>Virginie Dominguez rejoint Servier en 2020 en qualité de Chief Digital Officer, puis est nommée en 2021 au Comité Exécutif en tant que Vice-Présidente Exécutive Digital, Data et Systèmes d’Information. Elle assure et pilote la transformation digitale de Servier pour réaliser l’ambition du Groupe de devenir un&nbsp;<em>digital performer</em>&nbsp;d’ici 2025.</p><p>Virginie Dominguez dispose d’une expertise de vingt ans en matière de digital, principalement construite au sein du groupe Orange où elle a occupé différents postes à responsabilités entre 2003 et 2019. Elle a notamment mené, chez Orange France, la transformation digitale de la relation client grand public et a accompagné un grand programme de transformation « agilité à l’échelle », concernant plusieurs milliers de collaborateurs.</p><p>Virginie Dominguez est diplômée de l’École polytechnique (France) et ingénieure des Ponts et Chaussées.</p>"
  },
  "/groupe/comex/hani-friedman-bouganim": {
    "firstname": "Hani",
    "lastname": "Friedman Bouganim",
    "position": "Vice-Présidente Exécutive Manufacturing, Quality and Supply Chain",
    "linkedin": "https://www.linkedin.com/in/hanifriedman/",
    "biography": "<p>Hani Friedman Bouganim est forte d’une expérience de plus de 17 ans dans l’industrie pharmaceutique. Son parcours professionnel l’a amenée à réaliser des missions à dimension opérationnelles, financières et stratégiques.</p><p>Hani Friedman Bouganim a débuté sa carrière en 2007 chez Teva, groupe pharmaceutique international, et y a occupé plusieurs postes clés. Elle a ainsi été Vice-Présidente des opérations et Directrice générale des sites d’Ulm et Weiler chez Teva Allemagne de 2021 à 2022. Auparavant, Hani Friedman Bouganim a été responsable d’un cluster pharmaceutique à Cracovie (Pologne), Troyan (Bulgarie) et Baldooyle (Irlande). Elle a également occupé différents postes de Directrice générale sur les sites de Cracovie et d’Ashdod et Kiryat en Israël. Hani Friedman Bouganim a par ailleurs été Présidente du conseil d’administration de Teva Operations Pologne de 2018 à 2021. Elle a occupé des postes de Directrice Senior et fût en charge de la division «&nbsp;Soins respiratoires&nbsp;» à Jérusalem de 2015 à 2017. Elle a également supervisé des sites de production pour cette entité de 2011 à 2015.</p><p>En novembre 2022, Hani Friedman Bouganim rejoint Servier en tant que Vice-Présidente adjointe des opérations industrielles. En avril 2024, elle est nommée Vice-Présidente Exécutive Manufacturing, Quality and Supply&nbsp;Chain et membre du Comité Exécutif du Groupe. Elle a notamment pour mission le pilotage de la transformation des activités industrielles, en ligne avec l’ambition Servier 2030.</p><p>Hani Friedman Bouganim est titulaire d’un Master en Administration des Affaires (MBA) de l’Université Ben-Gourion, en Israël, et d’un Bachelor en Ingénierie de Biotechnologie (BSc).</p>"
  },
  "/groupe/comex/comite-executif-dr-philippe-gonnard": {
    "firstname": "Dr Philippe",
    "lastname": "Gonnard",
    "position": "Vice-Président Exécutif Global Product Strategy",
    "linkedin": "https://www.linkedin.com/in/philippe-gonnard/",
    "biography": "<p>Philippe Gonnard débute sa carrière au sein du groupe Servier en 1993, en tant que chef de produit international. Il occupe ensuite en France des postes de directeur marketing, médical et des opérations commerciales. Ancien directeur de filiale, il a été directeur de zone Europe Ouest puis directeur oncologie au sein des Opérations Monde. </p><p>En 2016, Philippe Gonnard est nommé à la tête des Affaires Médicales Monde. Il est membre du Comité Exécutif du groupe Servier depuis 2018, en tant que Vice-Président Exécutif Global Medical &amp; Patient Affairs.</p><p>Entre 2020 et 2022, Philippe Gonnard était également Chief Medical Officer du groupe Servier. En 2023, Philippe Gonnard devient Vice-Président Exécutif Global Product Strategy.</p><p>Philippe Gonnard est cardiologue et titulaire d’un MBA du groupe HEC.</p>"
  },
  "/groupe/comex/comite-executif-david-hindley": {
    "firstname": "David",
    "lastname": "Hindley",
    "position": "Vice-Président Exécutif Ressources Humaines",
    "linkedin": "https://www.linkedin.com/in/david-hindley-99220b3/",
    "biography": "<p>David Hindley a rejoint le groupe Servier le 1<sup>er</sup> mars 2023, en tant que Vice-Président Exécutif Ressources Humaines, membre du Comité Exécutif du Groupe. </p><p>David Hindley possède plus de 20 ans d’expérience dans des secteurs variés au sein d’entreprises multinationales, telles que Total Energies, Areva, Axa, Danone et dernièrement chez Mars Wrigley.</p><p>Passionné par le développement des talents, il a élaboré et déployé différents outils et méthodologies pour faire grandir les collaborateurs. David Hindley a également piloté des programmes de transformation majeurs à travers des expériences multiples, incluant notamment l’évolution et le déploiement de modèles de leadership.</p><p>Diplômé du CIFFOP (Centre Interdisciplinaire de Formation à la Fonction Personnel) de l’Université Paris-Panthéon-Assas, en management des Ressources Humaines en 1999, David Hindley est également titulaire d’un troisième cycle en Psychologie du travail et de trois certificats en droit du travail, en rémunération et avantages sociaux et en coaching.</p>"
  },
  "/groupe/comex/comite-executif-arnaud-lallouette": {
    "firstname": "Dr Arnaud",
    "lastname": "Lallouette",
    "position": "Vice-Président Exécutif Global Medical & Patient Affairs",
    "linkedin": "https://www.linkedin.com/in/arnaudlallouette/",
    "biography": "<p>Arnaud Lallouette a débuté sa carrière au sein du groupe Servier il y a 25 ans. Il s’est forgé une solide expérience en occupant des postes à responsabilités, notamment en tant que Directeur Affaires Médicales ou Directeur Général de filiales du Groupe, mais également en étant confronté à de nombreux métiers et marchés.</p><p>Arnaud Lallouette a vécu et travaillé en France, au Danemark, en Suède, en Finlande, au Royaume-Uni, en Australie et au Canada, et a ainsi eu l’opportunité de manager des équipes sur trois continents.</p><p>Ces expériences ont façonné sa compréhension des besoins des patients et des systèmes de santé dans le monde. Il a ainsi toujours été fortement engagé à contribuer à fournir un accès aux soins équitable pour les patients.</p><p>Arnaud Lallouette travaille aujourd’hui avec passion pour les personnes et les sciences de la vie, dans un souci d’amélioration continue de la performance. Il est également attaché à la responsabilité sociétale d’entreprise et intègre les sujets environnementaux, sociaux et de gouvernance (ESG) dans son management , afin de créer une plus grande valeur à long terme pour les patients et les personnes.</p><p>Arnaud Lallouette est médecin et cardiologue, diplômé de l’Université Nancy 2 en France.</p>"
  },
  "/groupe/comex/david-k-lee": {
    "firstname": "David K.",
    "lastname": "Lee",
    "position": "Vice-Président Exécutif Etats-Unis",
    "linkedin": "https://www.linkedin.com/in/david-k-lee-b9b23a3a/",
    "biography": "<p>David K. Lee rejoint Servier en 2018 pour diriger les activités de Servier aux Etats-Unis. Il est nommé en janvier 2025 au Comité Exécutif en tant que Vice-Président Exécutif Etats-Unis.</p><p>A ce titre, il a pour mission d’accompagner le développement de Servier aux Etats-Unis, actuellement première filiale du Groupe, grâce à son développement en oncologie, tout en contribuant à la stratégie globale du Groupe.</p><p>Avant de rejoindre Servier, David K. Lee a occupé des postes de direction dans plusieurs entreprises leaders dans le secteur pharmaceutique, notamment Bexter, GSK, Novartis et Shire. Pour Shire, David K. Lee a été Directeur Global des franchises Maladies Rares et Oncologie où il a supervisé des équipes de directions transverses en charge de la stratégie, du marketing, du développement commercial, de la R&amp;D et des fonctions supports.</p><p>Il a joué un rôle clé dans l’acquisition par Servier du portefeuille d’oncologie de Shire et plus tard de la division oncologie d’Agios. Il a contribué à l’intégration réussie des équipes et des actifs au sein du Groupe.</p><p>David K. Lee a étudié la biochimie à l’Université de Harvard. Il est titulaire d’un MBA à la Harvard Business School.</p>"
  },
  "/groupe/comex/comite-executif-pascal-lemaire": {
    "firstname": "Pascal",
    "lastname": "Lemaire",
    "position": "Vice-Président Exécutif Finance",
    "linkedin": "https://www.linkedin.com/in/pascal-lemaire-9b1558/",
    "biography": "<p>Pascal Lemaire possède plus de 30 ans d’expérience internationale en finance d’entreprise, notamment dans le secteur des produits de grande consommation et au sein de l’industrie pharmaceutique. Pascal Lemaire a débuté sa carrière à l’international chez Nestlé. Pendant plus de 17 ans, il y a occupé différents postes à responsabilités dans tous les domaines de la finance d’entreprise et dans les Global Business Services.</p><p>En 2015, il est nommé Directeur Exécutif Finance et Business Planning chez Celgene pour l’ensemble de l’activité hors États-Unis. Pascal Lemaire rejoint Servier en 2020 et est membre du Comité Exécutif, en tant que Vice-Président Exécutif Finance.</p><p>Pascal Lemaire est titulaire d’une licence en administration des affaires et d’un master en Banque et Finance d’HEC Lausanne.</p>"
  },
  "/groupe/comex/comite-executif-charlotte-marmousez-tartar": {
    "firstname": "Charlotte",
    "lastname": "Marmousez-Tartar",
    "position": "Vice-Présidente Exécutive Corporate Strategy & Transformation",
    "linkedin": "https://www.linkedin.com/in/charlottemarmousez/",
    "biography": "<p>Charlotte Marmousez-Tartar possède plus de 15 ans d’expérience dans l’industrie pharmaceutique en France et à Singapour. Elle débute sa carrière chez Servier en 2006, en tant que Global Competitive Project Manager, où elle occupe des fonctions en marketing et veille stratégiques. Elle rejoint ensuite la filiale de Servier à Singapour en 2011, où elle occupe des fonctions opérationnelles dans les équipes marketing et ventes. </p><p>En 2015, Charlotte Marmousez-Tartar est nommée Directrice de la valorisation stratégique, en charge de la valorisation des projets R&amp;D et Business Development, et du pilotage du plan stratégique à 10 ans. Elle rejoint ensuite en 2017 la Direction Corporate Strategy, où elle occupe successivement les postes de Directeur de projets stratégiques, puis de Directeur de la planification stratégique. En 2021, Charlotte Marmousez-Tartar est nommée Head of Group Transformation &amp; Programs Office. Depuis 2019, elle était également Secrétaire du Comité Exécutif du groupe Servier.</p><p>En février 2024, Charlotte Marmousez-Tartar devient Vice-Présidente Exécutive Corporate Strategy &amp; Transformation. Elle pilote notamment la stratégie globale et coordonne l’ensemble des projets de transformation du Groupe. Elle est également membre du Comité de Liaison, qui a pour mission d’aider le Conseil de Surveillance à s’acquitter de sa mission de contrôle de l’indépendance et de la pérennité du groupe Servier.</p><p>Charlotte Marmousez-Tartar est titulaire d’un Doctorat en pharmacie de l’Université de Lille&nbsp;2 Sciences et Technologie. Elle est également diplômée d’HEC Paris avec un Master Intelligence Marketing.</p>"
  },
  "/groupe/comex/comite-executif-stephane-mascarau": {
    "firstname": "Stéphane",
    "lastname": "Mascarau",
    "position": "Vice-Président Exécutif Opérations Monde",
    "linkedin": "https://www.linkedin.com/in/stephane-mascarau-47713049/",
    "biography": "<p>Stéphane Mascarau a débuté sa carrière au sein du groupe Servier en 1999.</p><p>Stéphane Mascarau a effectué la majeure partie de sa carrière à l’international, et possède plus de 20 ans d’expérience dans le secteur pharmaceutique, dans le marketing, les ventes et le management. Après avoir occupé différents postes de management au sein des équipes marketing et ventes, il devient Directeur général de Servier Mexique en 2008, Directeur général Égypte en 2012 et Directeur général Espagne en 2015. </p><p>En 2017, il est nommé Directeur général de la filiale de Servier en Chine, puis il devient, en 2022, Directeur de Zone de la région Chine (Chine continentale, Taiwan, Hong Kong, Macao) et Australie.</p><p>Dans les différents pays, au-delà des lancements de nouveaux médicaments dans des domaines thérapeutiques aussi variés que le domaine cardio-métabolique, la maladie veineuse et l’oncologie, il a su accompagner et engager ses équipes dans un processus de transformation des organisations, du business model et donner une place importante au digital au service de la performance.</p><p>À compter de janvier 2023, Stéphane Mascarau devient Vice-Président Exécutif, Opérations Monde, et membre du Comité Exécutif du groupe Servier.</p><p>Stéphane Mascarau est titulaire d’un diplôme de pharmacie de l’Université de la Méditerranée (Aix-Marseille II), Marseille, France, et d’un Master en Marketing et Management Pharmaceutique de l’Université de Paris-Sud (Paris XI), France.</p>"
  }
};

export default function parse(element, { document, url, params }) {
  const clean = (node) => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');

  // --- resolve the source page path (import: url/params.originalURL; validation: the document)
  const candidates = [
    params && params.originalURL,
    url,
    document.querySelector('link[rel="canonical"]') && document.querySelector('link[rel="canonical"]').getAttribute('href'),
    document.querySelector('meta[property="og:url"]') && document.querySelector('meta[property="og:url"]').getAttribute('content'),
    document.location && document.location.href,
  ];
  let cf = null;
  candidates.some((c) => {
    if (!c) return false;
    try {
      const path = new URL(c, 'https://servier.com').pathname.replace(/\/+$/, '');
      cf = CF_DATA[path] || null;
    } catch (e) { cf = null; }
    return !!cf;
  });

  // --- photo (page): first image that is not the LinkedIn icon
  const isRealSrc = (s) => s && !s.startsWith('data:');
  const photoImg = [...element.querySelectorAll('figure img, img')]
    .find((img) => !img.closest('noscript') && !img.closest('a[href*="linkedin"]')
      && !/linkedin/i.test(`${img.getAttribute('data-lazy-src') || ''} ${img.getAttribute('src') || ''}`));
  let photo = '';
  if (photoImg) {
    const src = photoImg.getAttribute('data-lazy-src') || photoImg.getAttribute('data-src');
    const srcset = photoImg.getAttribute('data-lazy-srcset') || photoImg.getAttribute('srcset') || '';
    const fromSrcset = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).find(isRealSrc);
    const real = [src, photoImg.getAttribute('src'), fromSrcset].find(isRealSrc);
    if (real) {
      photo = document.createElement('img');
      photo.src = new URL(real, 'https://servier.com').href;
      photo.alt = ''; // decorative: the name is adjacent (README contract)
    }
  }

  // --- LinkedIn (page figure at the end of the group), CF value as fallback
  const liAnchor = element.querySelector('a[href*="linkedin.com"]');
  // CF value first (the source has stray whitespace in some hrefs, e.g. ".../hanifriedman/ ")
  const liHref = (cf && cf.linkedin) || (liAnchor && liAnchor.getAttribute('href').trim()) || '';
  let linkedin = '';
  if (liHref) {
    linkedin = document.createElement('a');
    linkedin.href = liHref;
    linkedin.textContent = liHref;
  }

  // --- text values: CF data verbatim, else from the page
  let firstname = '';
  let lastname = '';
  let position = '';
  const biography = document.createElement('div');
  if (cf) {
    ({ firstname, lastname, position } = cf);
    biography.innerHTML = cf.biography || '';
  } else {
    const name = clean(element.querySelector('h2, h1, h3'));
    const parts = name.split(' ');
    lastname = parts.length > 1 ? parts.pop() : '';
    firstname = parts.join(' ');
    position = clean(element.querySelector('p.has-red-500-color strong, p.has-red-500-color, p strong'));
    const positionP = element.querySelector('p.has-red-500-color');
    [...element.querySelectorAll('p')]
      .filter((p) => p !== positionP && !p.closest('figure') && clean(p))
      .forEach((p) => {
        const np = document.createElement('p');
        np.innerHTML = p.innerHTML;
        biography.append(np);
      });
  }

  if (!firstname && !lastname && !biography.children.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    ['photo', photo],
    ['firstname', firstname],
    ['lastname', lastname],
    ['position', position],
    ['linkedin', linkedin],
    ['biography', [...biography.childNodes]],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'comex-profile', cells });
  element.replaceWith(block);
}
