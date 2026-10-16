/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-comex-member.js
  var import_comex_member_exports = {};
  __export(import_comex_member_exports, {
    default: () => import_comex_member_default
  });

  // tools/importer/parsers/hero-page-banner.js
  function isRealSrc(s) {
    return !!s && !s.trim().startsWith("data:");
  }
  function firstSrcsetUrl(srcset) {
    if (!srcset) return "";
    const candidates = srcset.split(",").map((c) => c.trim()).filter(Boolean).map((c) => {
      const [url, desc] = c.split(/\s+/);
      const w = desc && /\d+w$/.test(desc) ? parseInt(desc, 10) : 0;
      return { url, w };
    });
    candidates.sort((a, b) => b.w - a.w);
    return candidates.length ? candidates[0].url : "";
  }
  function resolveBannerSrc(picture, img) {
    if (picture) {
      const sources = [...picture.querySelectorAll("source")];
      const wide = sources.find((s) => /min-width:\s*768px/.test(s.getAttribute("media") || ""));
      const ordered = wide ? [wide, ...sources.filter((s) => s !== wide)] : sources;
      for (const s of ordered) {
        const url = firstSrcsetUrl(s.getAttribute("srcset") || s.getAttribute("data-lazy-srcset") || s.getAttribute("data-srcset"));
        if (isRealSrc(url)) return url;
      }
    }
    if (img) {
      const candidates = [img.getAttribute("data-lazy-src"), img.getAttribute("data-src"), img.getAttribute("src")];
      const found = candidates.find(isRealSrc);
      if (found) return found;
    }
    return "";
  }
  function parse(element, { document: document2 }) {
    const hint = (name) => document2.createComment(` field:${name} `);
    const picture = element.querySelector(":scope > picture, picture.image, picture");
    const srcImg = picture && picture.querySelector("img") || element.querySelector("img");
    const bannerSrc = resolveBannerSrc(picture, srcImg);
    const imageCell = [];
    if (bannerSrc) {
      const img = document2.createElement("img");
      img.src = bannerSrc;
      img.alt = srcImg && srcImg.getAttribute("alt") || "";
      imageCell.push(hint("image"), img);
    }
    const titleWrap = element.querySelector(".title-page") || element.querySelector(".page-header-wrap") || element;
    const heading = titleWrap.querySelector("h1, h2, h3");
    const paragraphs = [...titleWrap.querySelectorAll("p")].filter((p) => p.textContent.trim() && !p.closest(".breadcrumbs"));
    const textParts = [];
    if (heading) textParts.push(heading);
    textParts.push(...paragraphs);
    if (!imageCell.length && !textParts.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [imageCell.length ? imageCell : ""],
      [textParts.length ? [hint("text"), ...textParts] : ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-page-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/comex-profile.js
  var CF_DATA = {
    "/groupe/comex/comite-executif-olivier-laureau": {
      "firstname": "Olivier",
      "lastname": "Laureau",
      "position": "Pr\xE9sident de Servier et Pr\xE9sident de la Fondation Internationale de Recherche Servier",
      "linkedin": "https://www.linkedin.com/in/olivierlaureau/",
      "biography": "<p>Dipl\xF4m\xE9 de l\u2019Universit\xE9 Panth\xE9on-Assas \xE0 Paris, France, Olivier Laureau a rejoint le groupe Servier en 1982, d\u2019abord \xE0 la Direction de la propri\xE9t\xE9 intellectuelle puis \xE0 la direction juridique o\xF9 il supervisait les contrats internationaux. En 2000, il rejoint la Direction financi\xE8re et est nomm\xE9 Directeur financier du Groupe en 2008.</p><p>En tant que Pr\xE9sident du Groupe depuis 2014, Olivier Laureau a engag\xE9 un vaste plan de transformation visant \xE0 assurer l\u2019ind\xE9pendance de Servier, son d\xE9veloppement et sa p\xE9rennit\xE9 tout en continuant de r\xE9pondre \xE0 sa vocation : engag\xE9 pour le progr\xE8s th\xE9rapeutique au b\xE9n\xE9fice des patients.</p><p>Les piliers de cette strat\xE9gie sont d\u2019optimiser le potentiel des m\xE9dicaments du Groupe en cardiologie, m\xE9tabolisme et maladies veineuses, de rechercher et d\xE9velopper des th\xE9rapies innovantes et cibl\xE9es dans le domaine de l\u2019oncologie, des neurosciences et de l\u2019immuno-inflammation, et de piloter le d\xE9veloppement du portefeuille de m\xE9dicaments, \xE0 travers une strat\xE9gie de partenariats dynamique et une forte expansion internationale.</p><p>Tr\xE8s impliqu\xE9 dans les d\xE9bats li\xE9s au secteur de la sant\xE9 aux niveaux fran\xE7ais et international, Olivier Laureau est membre du conseil d\u2019administration du G5, une organisation regroupant les principales entreprises pharmaceutiques fran\xE7aises.</p><p>Il est \xE9galement membre du conseil d\u2019administration de la F\xE9d\xE9ration europ\xE9enne des associations et industries pharmaceutiques (EFPIA), et membre de la Biopharmaceutical CEOs Roundtable (BCR), un forum mondial sur les politiques de sant\xE9 r\xE9unissant les PDG des entreprises membres de la F\xE9d\xE9ration internationale de l\u2019industrie du m\xE9dicament (FIIM).</p>"
    },
    "/groupe/comex/comite-executif-dr-claude-bertrand": {
      "firstname": "Dr Claude",
      "lastname": "Bertrand",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Recherche & D\xE9veloppement, Chief Scientific Officer",
      "linkedin": "https://www.linkedin.com/in/claude-bertrand-374580/",
      "biography": "<p>Apr\xE8s plus de 25 ans d\u2019exp\xE9rience en R&amp;D et \xE0 l\u2019international au sein de grands groupes pharmaceutiques (Novartis, Roche, Pfizer, AstraZeneca, Ipsen), Claude Bertrand rejoint Servier en 2017 en tant que Directeur g\xE9n\xE9ral R&amp;D et Directeur scientifique.</p><p>En 2018, il int\xE8gre le Comit\xE9 Ex\xE9cutif du Groupe et occupe depuis le poste de Vice-Pr\xE9sident Ex\xE9cutif Recherche et D\xE9veloppement.</p><p>Claude Bertrand si\xE8ge \xE9galement au Conseil d\u2019administration d\u2019Eclosion2 et de MAAT Pharma. Il est aussi Pr\xE9sident du Comit\xE9 scientifique du LabEx Medalis et Vice-Pr\xE9sident de MEDICEN.</p><p>Titulaire d\u2019un doctorat en pharmacie de l\u2019Universit\xE9 de Strasbourg, il a soutenu une th\xE8se (Ph.D.) puis poursuivi des \xE9tudes postdoctorales (University of California San Francisco) portant sur la recherche dans les domaines de l\u2019immunopharmacologie et des inflammations neurog\xE8nes.</p>"
    },
    "/groupe/comex/comite-executif-damien-catoir": {
      "firstname": "Damien",
      "lastname": "Catoir",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Secr\xE9taire G\xE9n\xE9ral",
      "linkedin": "https://www.linkedin.com/in/damien-catoir-0aaa7a2/",
      "biography": "<p>Damien Catoir a rejoint le groupe Servier en avril 2023, en tant que Vice-Pr\xE9sident Ex\xE9cutif Secr\xE9taire G\xE9n\xE9ral, membre du Comit\xE9 Ex\xE9cutif du Groupe.</p><p>Damien Catoir poss\xE8de une exp\xE9rience de plus de 15 ans dans le domaine bancaire et dans des grands cabinets d\u2019avocats d\u2019affaires aux \xC9tats-Unis et en France. Il rejoint le monde de l\u2019entreprise en 2018 au sein du Groupe ATOS, o\xF9 il occupait pr\xE9c\xE9demment les fonctions de Directeur Juridique Groupe et Secr\xE9taire du Conseil d\u2019administration.</p><p>Dans le cadre de ses missions, il a notamment accompagn\xE9 ATOS dans la n\xE9gociation de partenariats strat\xE9giques, de contrats majeurs et de transactions M&amp;A transformantes. Il a \xE9galement pilot\xE9 des contentieux complexes et des r\xE9organisations importantes.</p><p>Damien Catoir est avocat aux barreaux de New York et de Paris. Dipl\xF4m\xE9 de l\u2019ESSEC (Grande Ecole), il a \xE9galement \xE9tudi\xE9 \xE0 l\u2019\xC9cole Normale Sup\xE9rieure et est titulaire d\u2019un Master 2 en Droit priv\xE9 g\xE9n\xE9ral de l\u2019Universit\xE9 Paris 1 Panth\xE9on-Sorbonne et d\u2019un <em>Juris Doctor</em> de l\u2019Universit\xE9 de Cornell aux \xC9tats-Unis.</p>"
    },
    "/groupe/comex/comite-executif-virginie-dominguez": {
      "firstname": "Virginie",
      "lastname": "Dominguez",
      "position": "Vice-Pr\xE9sidente Ex\xE9cutive Syst\xE8mes d\u2019Information, Digital, Data & IA",
      "linkedin": "https://www.linkedin.com/in/virginie-dominguez/",
      "biography": "<p>Virginie Dominguez rejoint Servier en 2020 en qualit\xE9 de Chief Digital Officer, puis est nomm\xE9e en 2021 au Comit\xE9 Ex\xE9cutif en tant que Vice-Pr\xE9sidente Ex\xE9cutive Digital, Data et Syst\xE8mes d\u2019Information. Elle assure et pilote la transformation digitale de Servier pour r\xE9aliser l\u2019ambition du Groupe de devenir un&nbsp;<em>digital performer</em>&nbsp;d\u2019ici 2025.</p><p>Virginie Dominguez dispose d\u2019une expertise de vingt ans en mati\xE8re de digital, principalement construite au sein du groupe Orange o\xF9 elle a occup\xE9 diff\xE9rents postes \xE0 responsabilit\xE9s entre 2003 et 2019. Elle a notamment men\xE9, chez Orange France, la transformation digitale de la relation client grand public et a accompagn\xE9 un grand programme de transformation \xAB agilit\xE9 \xE0 l\u2019\xE9chelle \xBB, concernant plusieurs milliers de collaborateurs.</p><p>Virginie Dominguez est dipl\xF4m\xE9e de l\u2019\xC9cole polytechnique (France) et ing\xE9nieure des Ponts et Chauss\xE9es.</p>"
    },
    "/groupe/comex/hani-friedman-bouganim": {
      "firstname": "Hani",
      "lastname": "Friedman Bouganim",
      "position": "Vice-Pr\xE9sidente Ex\xE9cutive Manufacturing, Quality and Supply Chain",
      "linkedin": "https://www.linkedin.com/in/hanifriedman/",
      "biography": "<p>Hani Friedman Bouganim est forte d\u2019une exp\xE9rience de plus de 17 ans dans l\u2019industrie pharmaceutique. Son parcours professionnel l\u2019a amen\xE9e \xE0 r\xE9aliser des missions \xE0 dimension op\xE9rationnelles, financi\xE8res et strat\xE9giques.</p><p>Hani Friedman Bouganim a d\xE9but\xE9 sa carri\xE8re en 2007 chez Teva, groupe pharmaceutique international, et y a occup\xE9 plusieurs postes cl\xE9s. Elle a ainsi \xE9t\xE9 Vice-Pr\xE9sidente des op\xE9rations et Directrice g\xE9n\xE9rale des sites d\u2019Ulm et Weiler chez Teva Allemagne de 2021 \xE0 2022. Auparavant, Hani Friedman Bouganim a \xE9t\xE9 responsable d\u2019un cluster pharmaceutique \xE0 Cracovie (Pologne), Troyan (Bulgarie) et Baldooyle (Irlande). Elle a \xE9galement occup\xE9 diff\xE9rents postes de Directrice g\xE9n\xE9rale sur les sites de Cracovie et d\u2019Ashdod et Kiryat en Isra\xEBl. Hani Friedman Bouganim a par ailleurs \xE9t\xE9 Pr\xE9sidente du conseil d\u2019administration de Teva Operations Pologne de 2018 \xE0 2021. Elle a occup\xE9 des postes de Directrice Senior et f\xFBt en charge de la division \xAB&nbsp;Soins respiratoires&nbsp;\xBB \xE0 J\xE9rusalem de 2015 \xE0 2017. Elle a \xE9galement supervis\xE9 des sites de production pour cette entit\xE9 de 2011 \xE0 2015.</p><p>En novembre 2022, Hani Friedman Bouganim rejoint Servier en tant que Vice-Pr\xE9sidente adjointe des op\xE9rations industrielles. En avril 2024, elle est nomm\xE9e Vice-Pr\xE9sidente Ex\xE9cutive Manufacturing, Quality and Supply&nbsp;Chain et membre du Comit\xE9 Ex\xE9cutif du Groupe. Elle a notamment pour mission le pilotage de la transformation des activit\xE9s industrielles, en ligne avec l\u2019ambition Servier 2030.</p><p>Hani Friedman Bouganim est titulaire d\u2019un Master en Administration des Affaires (MBA) de l\u2019Universit\xE9 Ben-Gourion, en Isra\xEBl, et d\u2019un Bachelor en Ing\xE9nierie de Biotechnologie (BSc).</p>"
    },
    "/groupe/comex/comite-executif-dr-philippe-gonnard": {
      "firstname": "Dr Philippe",
      "lastname": "Gonnard",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Global Product Strategy",
      "linkedin": "https://www.linkedin.com/in/philippe-gonnard/",
      "biography": "<p>Philippe Gonnard d\xE9bute sa carri\xE8re au sein du groupe Servier en 1993, en tant que chef de produit international. Il occupe ensuite en France des postes de directeur marketing, m\xE9dical et des op\xE9rations commerciales. Ancien directeur de filiale, il a \xE9t\xE9 directeur de zone Europe Ouest puis directeur oncologie au sein des Op\xE9rations Monde. </p><p>En 2016, Philippe Gonnard est nomm\xE9 \xE0 la t\xEAte des Affaires M\xE9dicales Monde. Il est membre du Comit\xE9 Ex\xE9cutif du groupe Servier depuis 2018, en tant que Vice-Pr\xE9sident Ex\xE9cutif Global Medical &amp; Patient Affairs.</p><p>Entre 2020 et 2022, Philippe Gonnard \xE9tait \xE9galement Chief Medical Officer du groupe Servier. En 2023, Philippe Gonnard devient Vice-Pr\xE9sident Ex\xE9cutif Global Product Strategy.</p><p>Philippe Gonnard est cardiologue et titulaire d\u2019un MBA du groupe HEC.</p>"
    },
    "/groupe/comex/comite-executif-david-hindley": {
      "firstname": "David",
      "lastname": "Hindley",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Ressources Humaines",
      "linkedin": "https://www.linkedin.com/in/david-hindley-99220b3/",
      "biography": "<p>David Hindley a rejoint le groupe Servier le 1<sup>er</sup> mars 2023, en tant que Vice-Pr\xE9sident Ex\xE9cutif Ressources Humaines, membre du Comit\xE9 Ex\xE9cutif du Groupe. </p><p>David Hindley poss\xE8de plus de 20 ans d\u2019exp\xE9rience dans des secteurs vari\xE9s au sein d\u2019entreprises multinationales, telles que Total Energies, Areva, Axa, Danone et derni\xE8rement chez Mars Wrigley.</p><p>Passionn\xE9 par le d\xE9veloppement des talents, il a \xE9labor\xE9 et d\xE9ploy\xE9 diff\xE9rents outils et m\xE9thodologies pour faire grandir les collaborateurs. David Hindley a \xE9galement pilot\xE9 des programmes de transformation majeurs \xE0 travers des exp\xE9riences multiples, incluant notamment l\u2019\xE9volution et le d\xE9ploiement de mod\xE8les de leadership.</p><p>Dipl\xF4m\xE9 du CIFFOP (Centre Interdisciplinaire de Formation \xE0 la Fonction Personnel) de l\u2019Universit\xE9 Paris-Panth\xE9on-Assas, en management des Ressources Humaines en 1999, David Hindley est \xE9galement titulaire d\u2019un troisi\xE8me cycle en Psychologie du travail et de trois certificats en droit du travail, en r\xE9mun\xE9ration et avantages sociaux et en coaching.</p>"
    },
    "/groupe/comex/comite-executif-arnaud-lallouette": {
      "firstname": "Dr Arnaud",
      "lastname": "Lallouette",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Global Medical & Patient Affairs",
      "linkedin": "https://www.linkedin.com/in/arnaudlallouette/",
      "biography": "<p>Arnaud Lallouette a d\xE9but\xE9 sa carri\xE8re au sein du groupe Servier il y a 25 ans. Il s\u2019est forg\xE9 une solide exp\xE9rience en occupant des postes \xE0 responsabilit\xE9s, notamment en tant que Directeur Affaires M\xE9dicales ou Directeur G\xE9n\xE9ral de filiales du Groupe, mais \xE9galement en \xE9tant confront\xE9 \xE0 de nombreux m\xE9tiers et march\xE9s.</p><p>Arnaud Lallouette a v\xE9cu et travaill\xE9 en France, au Danemark, en Su\xE8de, en Finlande, au Royaume-Uni, en Australie et au Canada, et a ainsi eu l\u2019opportunit\xE9 de manager des \xE9quipes sur trois continents.</p><p>Ces exp\xE9riences ont fa\xE7onn\xE9 sa compr\xE9hension des besoins des patients et des syst\xE8mes de sant\xE9 dans le monde. Il a ainsi toujours \xE9t\xE9 fortement engag\xE9 \xE0 contribuer \xE0 fournir un acc\xE8s aux soins \xE9quitable pour les patients.</p><p>Arnaud Lallouette travaille aujourd\u2019hui avec passion pour les personnes et les sciences de la vie, dans un souci d\u2019am\xE9lioration continue de la performance. Il est \xE9galement attach\xE9 \xE0 la responsabilit\xE9 soci\xE9tale d\u2019entreprise et int\xE8gre les sujets environnementaux, sociaux et de gouvernance (ESG) dans son management , afin de cr\xE9er une plus grande valeur \xE0 long terme pour les patients et les personnes.</p><p>Arnaud Lallouette est m\xE9decin et cardiologue, dipl\xF4m\xE9 de l\u2019Universit\xE9 Nancy 2 en France.</p>"
    },
    "/groupe/comex/david-k-lee": {
      "firstname": "David K.",
      "lastname": "Lee",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Etats-Unis",
      "linkedin": "https://www.linkedin.com/in/david-k-lee-b9b23a3a/",
      "biography": "<p>David K. Lee rejoint Servier en 2018 pour diriger les activit\xE9s de Servier aux Etats-Unis. Il est nomm\xE9 en janvier 2025 au Comit\xE9 Ex\xE9cutif en tant que Vice-Pr\xE9sident Ex\xE9cutif Etats-Unis.</p><p>A ce titre, il a pour mission d\u2019accompagner le d\xE9veloppement de Servier aux Etats-Unis, actuellement premi\xE8re filiale du Groupe, gr\xE2ce \xE0 son d\xE9veloppement en oncologie, tout en contribuant \xE0 la strat\xE9gie globale du Groupe.</p><p>Avant de rejoindre Servier, David K. Lee a occup\xE9 des postes de direction dans plusieurs entreprises leaders dans le secteur pharmaceutique, notamment Bexter, GSK, Novartis et Shire. Pour Shire, David K. Lee a \xE9t\xE9 Directeur Global des franchises Maladies Rares et Oncologie o\xF9 il a supervis\xE9 des \xE9quipes de directions transverses en charge de la strat\xE9gie, du marketing, du d\xE9veloppement commercial, de la R&amp;D et des fonctions supports.</p><p>Il a jou\xE9 un r\xF4le cl\xE9 dans l\u2019acquisition par Servier du portefeuille d\u2019oncologie de Shire et plus tard de la division oncologie d\u2019Agios. Il a contribu\xE9 \xE0 l\u2019int\xE9gration r\xE9ussie des \xE9quipes et des actifs au sein du Groupe.</p><p>David K. Lee a \xE9tudi\xE9 la biochimie \xE0 l\u2019Universit\xE9 de Harvard. Il est titulaire d\u2019un MBA \xE0 la Harvard Business School.</p>"
    },
    "/groupe/comex/comite-executif-pascal-lemaire": {
      "firstname": "Pascal",
      "lastname": "Lemaire",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Finance",
      "linkedin": "https://www.linkedin.com/in/pascal-lemaire-9b1558/",
      "biography": "<p>Pascal Lemaire poss\xE8de plus de 30 ans d\u2019exp\xE9rience internationale en finance d\u2019entreprise, notamment dans le secteur des produits de grande consommation et au sein de l\u2019industrie pharmaceutique. Pascal Lemaire a d\xE9but\xE9 sa carri\xE8re \xE0 l\u2019international chez Nestl\xE9. Pendant plus de 17 ans, il y a occup\xE9 diff\xE9rents postes \xE0 responsabilit\xE9s dans tous les domaines de la finance d\u2019entreprise et dans les Global Business Services.</p><p>En 2015, il est nomm\xE9 Directeur Ex\xE9cutif Finance et Business Planning chez Celgene pour l\u2019ensemble de l\u2019activit\xE9 hors \xC9tats-Unis. Pascal Lemaire rejoint Servier en 2020 et est membre du Comit\xE9 Ex\xE9cutif, en tant que Vice-Pr\xE9sident Ex\xE9cutif Finance.</p><p>Pascal Lemaire est titulaire d\u2019une licence en administration des affaires et d\u2019un master en Banque et Finance d\u2019HEC Lausanne.</p>"
    },
    "/groupe/comex/comite-executif-charlotte-marmousez-tartar": {
      "firstname": "Charlotte",
      "lastname": "Marmousez-Tartar",
      "position": "Vice-Pr\xE9sidente Ex\xE9cutive Corporate Strategy & Transformation",
      "linkedin": "https://www.linkedin.com/in/charlottemarmousez/",
      "biography": "<p>Charlotte Marmousez-Tartar poss\xE8de plus de 15 ans d\u2019exp\xE9rience dans l\u2019industrie pharmaceutique en France et \xE0 Singapour. Elle d\xE9bute sa carri\xE8re chez Servier en 2006, en tant que Global Competitive Project Manager, o\xF9 elle occupe des fonctions en marketing et veille strat\xE9giques. Elle rejoint ensuite la filiale de Servier \xE0 Singapour en 2011, o\xF9 elle occupe des fonctions op\xE9rationnelles dans les \xE9quipes marketing et ventes. </p><p>En 2015, Charlotte Marmousez-Tartar est nomm\xE9e Directrice de la valorisation strat\xE9gique, en charge de la valorisation des projets R&amp;D et Business Development, et du pilotage du plan strat\xE9gique \xE0 10 ans. Elle rejoint ensuite en 2017 la Direction Corporate Strategy, o\xF9 elle occupe successivement les postes de Directeur de projets strat\xE9giques, puis de Directeur de la planification strat\xE9gique. En 2021, Charlotte Marmousez-Tartar est nomm\xE9e Head of Group Transformation &amp; Programs Office. Depuis 2019, elle \xE9tait \xE9galement Secr\xE9taire du Comit\xE9 Ex\xE9cutif du groupe Servier.</p><p>En f\xE9vrier 2024, Charlotte Marmousez-Tartar devient Vice-Pr\xE9sidente Ex\xE9cutive Corporate Strategy &amp; Transformation. Elle pilote notamment la strat\xE9gie globale et coordonne l\u2019ensemble des projets de transformation du Groupe. Elle est \xE9galement membre du Comit\xE9 de Liaison, qui a pour mission d\u2019aider le Conseil de Surveillance \xE0 s\u2019acquitter de sa mission de contr\xF4le de l\u2019ind\xE9pendance et de la p\xE9rennit\xE9 du groupe Servier.</p><p>Charlotte Marmousez-Tartar est titulaire d\u2019un Doctorat en pharmacie de l\u2019Universit\xE9 de Lille&nbsp;2 Sciences et Technologie. Elle est \xE9galement dipl\xF4m\xE9e d\u2019HEC Paris avec un Master Intelligence Marketing.</p>"
    },
    "/groupe/comex/comite-executif-stephane-mascarau": {
      "firstname": "St\xE9phane",
      "lastname": "Mascarau",
      "position": "Vice-Pr\xE9sident Ex\xE9cutif Op\xE9rations Monde",
      "linkedin": "https://www.linkedin.com/in/stephane-mascarau-47713049/",
      "biography": "<p>St\xE9phane Mascarau a d\xE9but\xE9 sa carri\xE8re au sein du groupe Servier en 1999.</p><p>St\xE9phane Mascarau a effectu\xE9 la majeure partie de sa carri\xE8re \xE0 l\u2019international, et poss\xE8de plus de 20 ans d\u2019exp\xE9rience dans le secteur pharmaceutique, dans le marketing, les ventes et le management. Apr\xE8s avoir occup\xE9 diff\xE9rents postes de management au sein des \xE9quipes marketing et ventes, il devient Directeur g\xE9n\xE9ral de Servier Mexique en 2008, Directeur g\xE9n\xE9ral \xC9gypte en 2012 et Directeur g\xE9n\xE9ral Espagne en 2015. </p><p>En 2017, il est nomm\xE9 Directeur g\xE9n\xE9ral de la filiale de Servier en Chine, puis il devient, en 2022, Directeur de Zone de la r\xE9gion Chine (Chine continentale, Taiwan, Hong Kong, Macao) et Australie.</p><p>Dans les diff\xE9rents pays, au-del\xE0 des lancements de nouveaux m\xE9dicaments dans des domaines th\xE9rapeutiques aussi vari\xE9s que le domaine cardio-m\xE9tabolique, la maladie veineuse et l\u2019oncologie, il a su accompagner et engager ses \xE9quipes dans un processus de transformation des organisations, du business model et donner une place importante au digital au service de la performance.</p><p>\xC0 compter de janvier 2023, St\xE9phane Mascarau devient Vice-Pr\xE9sident Ex\xE9cutif, Op\xE9rations Monde, et membre du Comit\xE9 Ex\xE9cutif du groupe Servier.</p><p>St\xE9phane Mascarau est titulaire d\u2019un dipl\xF4me de pharmacie de l\u2019Universit\xE9 de la M\xE9diterran\xE9e (Aix-Marseille II), Marseille, France, et d\u2019un Master en Marketing et Management Pharmaceutique de l\u2019Universit\xE9 de Paris-Sud (Paris XI), France.</p>"
    }
  };
  function parse2(element, { document: document2, url, params }) {
    const clean = (node) => node ? node.textContent.replace(/\s+/g, " ").trim() : "";
    const candidates = [
      params && params.originalURL,
      url,
      document2.querySelector('link[rel="canonical"]') && document2.querySelector('link[rel="canonical"]').getAttribute("href"),
      document2.querySelector('meta[property="og:url"]') && document2.querySelector('meta[property="og:url"]').getAttribute("content"),
      document2.location && document2.location.href
    ];
    let cf = null;
    candidates.some((c) => {
      if (!c) return false;
      try {
        const path = new URL(c, "https://servier.com").pathname.replace(/\/+$/, "");
        cf = CF_DATA[path] || null;
      } catch (e) {
        cf = null;
      }
      return !!cf;
    });
    const isRealSrc2 = (s) => s && !s.startsWith("data:");
    const photoImg = [...element.querySelectorAll("figure img, img")].find((img) => !img.closest("noscript") && !img.closest('a[href*="linkedin"]') && !/linkedin/i.test(`${img.getAttribute("data-lazy-src") || ""} ${img.getAttribute("src") || ""}`));
    let photo = "";
    if (photoImg) {
      const src = photoImg.getAttribute("data-lazy-src") || photoImg.getAttribute("data-src");
      const srcset = photoImg.getAttribute("data-lazy-srcset") || photoImg.getAttribute("srcset") || "";
      const fromSrcset = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]).find(isRealSrc2);
      const real = [src, photoImg.getAttribute("src"), fromSrcset].find(isRealSrc2);
      if (real) {
        photo = document2.createElement("img");
        photo.src = new URL(real, "https://servier.com").href;
        photo.alt = "";
      }
    }
    const liAnchor = element.querySelector('a[href*="linkedin.com"]');
    const liHref = cf && cf.linkedin || liAnchor && liAnchor.getAttribute("href").trim() || "";
    let linkedin = "";
    if (liHref) {
      linkedin = document2.createElement("a");
      linkedin.href = liHref;
      linkedin.textContent = liHref;
    }
    let firstname = "";
    let lastname = "";
    let position = "";
    const biography = document2.createElement("div");
    if (cf) {
      ({ firstname, lastname, position } = cf);
      biography.innerHTML = cf.biography || "";
    } else {
      const name = clean(element.querySelector("h2, h1, h3"));
      const parts = name.split(" ");
      lastname = parts.length > 1 ? parts.pop() : "";
      firstname = parts.join(" ");
      position = clean(element.querySelector("p.has-red-500-color strong, p.has-red-500-color, p strong"));
      const positionP = element.querySelector("p.has-red-500-color");
      [...element.querySelectorAll("p")].filter((p) => p !== positionP && !p.closest("figure") && clean(p)).forEach((p) => {
        const np = document2.createElement("p");
        np.innerHTML = p.innerHTML;
        biography.append(np);
      });
    }
    if (!firstname && !lastname && !biography.children.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      ["photo", photo],
      ["firstname", firstname],
      ["lastname", lastname],
      ["position", position],
      ["linkedin", linkedin],
      ["biography", [...biography.childNodes]]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "comex-profile", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/servier-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // tarteaucitron cookie consent panel: <div id="tarteaucitronRoot"> (cleaned.html line ~1499)
        "#tarteaucitronRoot",
        // Email alert subscription modal: <div class="modal micromodal-slide" id="email-alert-modal">
        "#email-alert-modal",
        // Elfsight portal root outside main: <div id="__EAAPS_PORTAL">
        "#__EAAPS_PORTAL",
        // NOTE: the hero search form (.home-header-front-page form.search-form) is NOT removed here:
        // the campaign-hero parser reads its action/placeholder into the search_ fields and drops it.
        // Slick slider prev/next buttons: <button class="prev ... slick-arrow">
        "button.slick-arrow",
        // Slick infinite-mode clones (runtime class added by slick on the live page; requested by orchestrator)
        ".slick-cloned"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll('a[class*="rounded-[50px]"]').forEach((a) => {
        if (a.closest("strong, em")) return;
        const strong = element.ownerDocument.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
      WebImporter.DOMUtils.remove(element, [
        // <header class="banner"> (contains nav, fullscreen search form #search-form)
        "header.banner",
        // <footer class="relative site-footer ...">
        "footer.site-footer",
        // Skip links: <a class="sr-only focus:not-sr-only" href="#main"> etc.
        'a.sr-only[href^="#"]',
        // WordPress spacer blocks: <div class="wp-block-spacer anim-active">
        ".wp-block-spacer",
        // Generic non-content elements (present on live page)
        "noscript",
        "script",
        "style",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/comex-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_HOSTS = ["servier.com", "www.servier.com"];
  var capturedCrumbs = [];
  function toSiteRelative(href) {
    if (!href) return href;
    try {
      const url = new URL(href, "https://servier.com/");
      if (SOURCE_HOSTS.includes(url.hostname)) return `${url.pathname}${url.search}${url.hash}`;
    } catch (e) {
    }
    return href;
  }
  function captureBreadcrumbs(element) {
    const crumbsEl = element.querySelector(".page-header--classic .breadcrumbs");
    if (!crumbsEl) return [];
    const items = [...crumbsEl.querySelectorAll("a, .breadcrumb_last")];
    const crumbs = items.map((item) => ({
      text: item.textContent.replace(/\s+/g, " ").trim(),
      href: item.tagName === "A" ? toSiteRelative(item.getAttribute("href")) : null
    })).filter((c) => c.text);
    if (crumbs.length) crumbs[crumbs.length - 1].href = null;
    return crumbs;
  }
  function buildCrumbList(doc, crumbs) {
    const ul = doc.createElement("ul");
    crumbs.forEach(({ text, href }, i) => {
      const li = doc.createElement("li");
      if (href && i < crumbs.length - 1) {
        const a = doc.createElement("a");
        a.setAttribute("href", href);
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    return ul;
  }
  function findBannerTextCell(element) {
    const tables = [...element.querySelectorAll("table")];
    const block = tables.find((t) => {
      const first = t.querySelector("tr");
      const name = first && first.textContent.trim().toLowerCase().replace(/\s+/g, "-");
      return name && /^hero-page-banner\b/.test(name);
    });
    if (block) {
      const rows = [...block.querySelectorAll(":scope > tbody > tr, :scope > tr")].slice(1);
      const textRow = rows.find((r) => r.querySelector("h1, h2, h3, h4, h5, h6")) || rows.find((r) => !r.querySelector("img, picture"));
      return textRow ? textRow.querySelector("td") : null;
    }
    return element.querySelector(".page-header--classic .title-page");
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const doc = element.ownerDocument;
      capturedCrumbs = captureBreadcrumbs(element);
      WebImporter.DOMUtils.remove(element, [".page-header--classic .breadcrumbs"]);
      element.querySelectorAll(".wp-block-columns.has-logo > .wp-block-column").forEach((col) => {
        if (!col.textContent.trim() && !col.querySelector("img, picture, video, iframe")) col.remove();
      });
      element.querySelectorAll(".wp-block-button a.wp-block-button__link").forEach((a) => {
        if (a.closest(".has-indigo-50-background-color")) return;
        a.setAttribute("href", toSiteRelative(a.getAttribute("href")));
        if (a.closest("strong, b")) return;
        const strong = doc.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
    }
    if (hookName === TransformHook2.afterTransform) {
      if (!capturedCrumbs.length) return;
      const cell = findBannerTextCell(element);
      if (!cell) return;
      const list = buildCrumbList(element.ownerDocument, capturedCrumbs);
      const heading = cell.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading && heading.parentElement === cell) heading.after(list);
      else cell.append(list);
      capturedCrumbs = [];
    }
  }

  // tools/importer/transformers/servier-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform3(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/transformers/article-metadata.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ATTR_DATE = "data-excat-article-date";
  var ATTR_CATEGORY = "data-excat-article-category";
  var ATTR_TAGS = "data-excat-article-tags";
  var FR_MONTHS = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12
  };
  var CATEGORY_LABELS = {
    decryptages: "D\xE9cryptages"
  };
  var pad = (n) => String(n).padStart(2, "0");
  var stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function toIsoDate(value) {
    if (!value) return "";
    const text = value.trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const fr = stripAccents(text.toLowerCase()).match(/(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})/);
    if (fr && FR_MONTHS[fr[2]]) return `${fr[3]}-${pad(FR_MONTHS[fr[2]])}-${pad(fr[1])}`;
    const num = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (num) return `${num[3]}-${pad(num[2])}-${pad(num[1])}`;
    return "";
  }
  function jsonLdDatePublished(doc) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
        const hit = nodes.find((n) => n && n.datePublished);
        if (hit) return hit.datePublished;
      } catch (e) {
      }
    }
    return "";
  }
  function readCategory(element) {
    const article = element.querySelector('article[class*="category_folder-"]');
    const m = article && article.className.match(/category_folder-([a-z0-9-]+)/);
    if (m) {
      const slug = m[1];
      return CATEGORY_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
    }
    const strong = element.querySelector(".page-header--classic .title-page h2 strong");
    const fromBanner = strong && strong.textContent.trim();
    if (fromBanner) return fromBanner.charAt(0).toUpperCase() + fromBanner.slice(1);
    return "";
  }
  var TAG_LABELS = {
    "comprendre-les-pathologies": "Comprendre les pathologies",
    "comprendre-la-recherche": "Comprendre la recherche",
    "comprendre-nos-engagements": "Comprendre nos engagements"
  };
  function readTags(element) {
    const article = element.querySelector('article[class*="tag_folder-"]');
    if (!article) return [];
    return [...article.className.matchAll(/tag_folder-([a-z0-9-]+)/g)].map(([, slug]) => TAG_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));
  }
  function transform4(hookName, element, payload) {
    const doc = payload && payload.document || element.ownerDocument || document;
    if (hookName === TransformHook3.beforeTransform) {
      const time = element.querySelector("time.single--date");
      let date = "";
      if (time) date = toIsoDate(time.getAttribute("datetime")) || toIsoDate(time.textContent);
      if (!date) date = toIsoDate(jsonLdDatePublished(doc));
      if (!date) {
        const meta = doc.querySelector('meta[property="article:published_time"]');
        date = toIsoDate(meta && meta.getAttribute("content"));
      }
      if (date) element.setAttribute(ATTR_DATE, date);
      const category = readCategory(element);
      if (category) element.setAttribute(ATTR_CATEGORY, category);
      const tags = readTags(element);
      if (tags.length) element.setAttribute(ATTR_TAGS, tags.join(", "));
    }
    if (hookName === TransformHook3.afterTransform) {
      let meta = {};
      try {
        meta = WebImporter.Blocks.getMetadata(doc) || {};
      } catch (e) {
        meta = {};
      }
      const pageTemplate = payload && payload.template && payload.template.pageTemplate || "article";
      meta.template = pageTemplate;
      meta.theme = "servier";
      const lang = (doc.documentElement.getAttribute("lang") || "fr").split("-")[0].toLowerCase();
      meta.language = lang || "fr";
      const category = element.getAttribute(ATTR_CATEGORY);
      if (category && pageTemplate === "article") meta.category = category;
      const date = element.getAttribute(ATTR_DATE);
      if (date && pageTemplate === "article") meta["publication-date"] = date;
      const tags = element.getAttribute(ATTR_TAGS);
      if (tags && pageTemplate === "article") meta.keywords = tags;
      element.removeAttribute(ATTR_CATEGORY);
      element.removeAttribute(ATTR_DATE);
      element.removeAttribute(ATTR_TAGS);
      element.append(doc.createElement("hr"), WebImporter.Blocks.getMetadataBlock(doc, meta));
    }
  }

  // tools/importer/import-comex-member.js
  var PAGE_TEMPLATE = {
    "name": "comex-member",
    "description": "COMEX member fiche (LOCAL PREVIEW ONLY \u2014 in production the page is rendered from the CF by the overlay template cf-templates/comex-member.html)",
    "urls": [
      "https://servier.com/groupe/comex/comite-executif-olivier-laureau/",
      "https://servier.com/groupe/comex/comite-executif-dr-claude-bertrand/",
      "https://servier.com/groupe/comex/comite-executif-damien-catoir/",
      "https://servier.com/groupe/comex/comite-executif-virginie-dominguez/",
      "https://servier.com/groupe/comex/hani-friedman-bouganim/",
      "https://servier.com/groupe/comex/comite-executif-dr-philippe-gonnard/",
      "https://servier.com/groupe/comex/comite-executif-david-hindley/",
      "https://servier.com/groupe/comex/comite-executif-arnaud-lallouette/",
      "https://servier.com/groupe/comex/david-k-lee/",
      "https://servier.com/groupe/comex/comite-executif-pascal-lemaire/",
      "https://servier.com/groupe/comex/comite-executif-charlotte-marmousez-tartar/",
      "https://servier.com/groupe/comex/comite-executif-stephane-mascarau/"
    ],
    "blocks": [
      {
        "name": "hero-page-banner",
        "instances": [
          "#main > .page-header--classic"
        ]
      },
      {
        "name": "comex-profile",
        "instances": [
          ".content-page > .wp-block-group.has-indigo-50-background-color",
          ".content-page > .wp-block-group.alignfull > .wp-block-group.has-indigo-50-background-color"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "page-banner",
        "selector": [
          "#main > .page-header--classic"
        ],
        "style": null,
        "blocks": [
          "hero-page-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "profile",
        "selector": [
          ".content-page > .wp-block-group.has-indigo-50-background-color",
          ".content-page > .wp-block-group.alignfull > .wp-block-group.has-indigo-50-background-color"
        ],
        "style": "soft",
        "blocks": [
          "comex-profile"
        ],
        "defaultContent": []
      }
    ],
    "pageTemplate": "comex-member"
  };
  var parsers = {
    "hero-page-banner": parse,
    "comex-profile": parse2
  };
  var transformers = [
    transform,
    transform2,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : [],
    transform4
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_comex_member_default = {
    /**
     * Runs before the importer's own image preprocessing, which drops <img> elements
     * whose src is a data: placeholder. WP Rocket lazyload keeps the real URL in
     * data-lazy-src / data-lazy-srcset, so promote it to src before that happens.
     */
    preprocess: ({ document: document2 }) => {
      document2.querySelectorAll("img[data-lazy-src]").forEach((img) => {
        img.setAttribute("src", img.getAttribute("data-lazy-src"));
        const srcset = img.getAttribute("data-lazy-srcset");
        if (srcset) img.setAttribute("srcset", srcset);
      });
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath.replace(/\/comite-executif-([^/]+)$/, "/$1"));
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_comex_member_exports);
})();
