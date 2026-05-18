async function fetchTextFile(fichier) {
  const response = await fetch(fichier, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Impossible de charger ${fichier} (${response.status})`);
  }

  const texte = await response.text();
  return texte.replace(/^\uFEFF/, "");
}

function cleanCell(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1")
    .trim();
}

function detectSeparator(ligne) {
  if (ligne.includes("\t")) return "\t";
  if (ligne.includes(";")) return ";";
  if (ligne.includes(",")) return ",";
  return ";";
}

function parseDelimitedFile(texte) {
  const contenu = texte
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "");

  const lignes = contenu
    .split("\n")
    .filter(l => l.trim() !== "");

  if (lignes.length === 0) {
    return [];
  }

  const separateur = detectSeparator(lignes[0]);

  const headers = lignes[0]
    .split(separateur)
    .map(h => cleanCell(h));

  return lignes.slice(1).map(ligne => {
    const colonnes = ligne.split(separateur).map(c => cleanCell(c));
    const row = {};

    headers.forEach((header, index) => {
      row[header] = colonnes[index] ?? "";
    });

    return row;
  });
}

function normalizeKey(value) {
  return cleanCell(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeTeamName(value) {
  return cleanCell(value);
}

function toNumber(value) {
  const parsed = parseFloat(String(cleanCell(value)).replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formaterPointsPool(points) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

async function chargerResultatsSeries(fichier) {
  const texte = await fetchTextFile(fichier);
  const rows = parseDelimitedFile(texte);
  const resultats = {};

  rows.forEach(row => {
    const seriesId = cleanCell(row.seriesId);
    const winner = cleanCell(row.winner);
    const games = cleanCell(row.games);

    if (!seriesId) return;

    resultats[seriesId] = {
      winner,
      games: games ? Number(games) : ""
    };
  });

  return resultats;
}

async function chargerTousLesResultatsSeries() {
  const fichiers = [
    "data/resultats_ronde1.csv",
    "data/resultats_ronde2.csv",
    "data/resultats_ronde3.csv",
    "data/resultats_ronde4.csv"
  ];

  const tousLesResultats = {};

  for (const fichier of fichiers) {
    try {
      const resultats = await chargerResultatsSeries(fichier);
      Object.assign(tousLesResultats, resultats);
    } catch (error) {
      console.warn(`Résultats introuvables pour ${fichier}`, error);
    }
  }

  return tousLesResultats;
}

async function chargerPicksRonde1() {
  const texte = await fetchTextFile("data/picks_ronde1.csv");
  const rows = parseDelimitedFile(texte);
  const picks = {};

  rows.forEach(row => {
    const participant = cleanCell(row.participant);
    if (!participant) return;

    const fiche = {
      "r1-s1": { pick: cleanCell(row.s1_pick), games: cleanCell(row.s1_games) },
      "r1-s2": { pick: cleanCell(row.s2_pick), games: cleanCell(row.s2_games) },
      "r1-s3": { pick: cleanCell(row.s3_pick), games: cleanCell(row.s3_games) },
      "r1-s4": { pick: cleanCell(row.s4_pick), games: cleanCell(row.s4_games) },
      "r1-s5": { pick: cleanCell(row.s5_pick), games: cleanCell(row.s5_games) },
      "r1-s6": { pick: cleanCell(row.s6_pick), games: cleanCell(row.s6_games) },
      "r1-s7": { pick: cleanCell(row.s7_pick), games: cleanCell(row.s7_games) },
      "r1-s8": { pick: cleanCell(row.s8_pick), games: cleanCell(row.s8_games) }
    };

    picks[participant] = fiche;
    picks[normalizeKey(participant)] = fiche;
  });

  return picks;
}

async function chargerPicksRonde2() {
  const texte = await fetchTextFile("data/picks_ronde2.csv");
  const rows = parseDelimitedFile(texte);
  const picks = {};

  rows.forEach(row => {
    const participant = cleanCell(row.participant);
    if (!participant) return;

    const fiche = {
      "r2-s1": { pick: cleanCell(row.s1_pick), games: cleanCell(row.s1_games) },
      "r2-s2": { pick: cleanCell(row.s2_pick), games: cleanCell(row.s2_games) },
      "r2-s3": { pick: cleanCell(row.s3_pick), games: cleanCell(row.s3_games) },
      "r2-s4": { pick: cleanCell(row.s4_pick), games: cleanCell(row.s4_games) }
    };

    picks[participant] = fiche;
    picks[normalizeKey(participant)] = fiche;
  });

  return picks;
}

async function chargerPicksRonde3() {
  const texte = await fetchTextFile("data/picks_ronde3.csv");
  const rows = parseDelimitedFile(texte);
  const picks = {};

  rows.forEach(row => {
    const participant = cleanCell(row.participant);
    if (!participant) return;

    const fiche = {
      "r3-s1": { pick: cleanCell(row.s1_pick), games: cleanCell(row.s1_games) },
      "r3-s2": { pick: cleanCell(row.s2_pick), games: cleanCell(row.s2_games) }
    };

    picks[participant] = fiche;
    picks[normalizeKey(participant)] = fiche;
  });

  return picks;
}

async function chargerPicksRonde4() {
  const texte = await fetchTextFile("data/picks_ronde4.csv");
  const rows = parseDelimitedFile(texte);
  const picks = {};

  rows.forEach(row => {
    const participant = cleanCell(row.participant);
    if (!participant) return;

    const fiche = {
      "r4-s1": { pick: cleanCell(row.s1_pick), games: cleanCell(row.s1_games) },
      cup_pick: cleanCell(row.cup_pick)
    };

    picks[participant] = fiche;
    picks[normalizeKey(participant)] = fiche;
  });

  return picks;
}

async function chargerTousLesPicks() {
  const ronde1 = await chargerPicksRonde1().catch(() => ({}));
  const ronde2 = await chargerPicksRonde2().catch(() => ({}));
  const ronde3 = await chargerPicksRonde3().catch(() => ({}));
  const ronde4 = await chargerPicksRonde4().catch(() => ({}));

  const tous = {};
  const participants = new Set([
    ...Object.keys(ronde1),
    ...Object.keys(ronde2),
    ...Object.keys(ronde3),
    ...Object.keys(ronde4)
  ]);

  participants.forEach(participant => {
    tous[participant] = {
      ...(ronde1[participant] || {}),
      ...(ronde2[participant] || {}),
      ...(ronde3[participant] || {}),
      ...(ronde4[participant] || {})
    };
  });

  return tous;
}

async function chargerStatsJoueursRonde(fichier) {
  const texte = await fetchTextFile(fichier);
  const contenu = texte.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lignes = contenu.split("\n").map(l => l.trim()).filter(l => l !== "");

  const joueurs = {};
  const apresLimite = {};

  if (!lignes.length) {
    joueurs.__apresLimite = apresLimite;
    return joueurs;
  }

  const separateur = detectSeparator(lignes[0]);
  const headers = lignes[0].split(separateur).map(h => cleanCell(h));

  let modeApresLimite = false;

  lignes.slice(1).forEach(ligne => {
    const colonnes = ligne.split(separateur).map(c => cleanCell(c));

    if (normalizeKey(colonnes[0]) === "echange_apres_limite") {
      modeApresLimite = true;
      return;
    }

    if (modeApresLimite && normalizeKey(colonnes[0]) === "joueur") {
      return;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = colonnes[index] ?? "";
    });

    const nomJoueur = cleanCell(row.joueur);
    if (!nomJoueur) return;

    const fiche = {
      joueur: nomJoueur,
      buts: cleanCell(row.buts),
      passes: cleanCell(row.passes),
      plusMinus: cleanCell(row.plusMinus),
      tirs: cleanCell(row.tirs),
      totalPoints: cleanCell(row.totalPoints)
    };

    if (modeApresLimite) {
      apresLimite[normalizeKey(nomJoueur)] = fiche;
    } else {
      joueurs[nomJoueur] = fiche;
      joueurs[normalizeKey(nomJoueur)] = fiche;
    }
  });

  joueurs.__apresLimite = apresLimite;
  return joueurs;
}

async function chargerChoixJoueursRonde(fichier) {
  const texte = await fetchTextFile(fichier);
  const rows = parseDelimitedFile(texte);
  const choix = {};

  rows.forEach(row => {
    const participant = cleanCell(row.participant);
    if (!participant) return;

    const liste = [
      cleanCell(row.joueur1),
      cleanCell(row.joueur2),
      cleanCell(row.joueur3)
    ];

    choix[participant] = liste;
    choix[normalizeKey(participant)] = liste;
  });

  return choix;
}

const teamPointsByRound = {
  1: { exactWinnerAndGames: 25, winnerOnly: 12, exactGamesOnly: 10, plusMinusOne: 5 },
  2: { exactWinnerAndGames: 30, winnerOnly: 15, exactGamesOnly: 12, plusMinusOne: 6 },
  3: { exactWinnerAndGames: 35, winnerOnly: 18, exactGamesOnly: 15, plusMinusOne: 7 },
  4: { exactWinnerAndGames: 40, winnerOnly: 20, exactGamesOnly: 15, plusMinusOne: 8, cupWinner: 60 }
};

const playerPointsByRound = {
  1: { but: 3, passe: 2, plusMinus: 1, tir: 0.5 },
  2: { but: 4, passe: 3, plusMinus: 2, tir: 1 },
  3: { but: 5, passe: 4, plusMinus: 2.5, tir: 1.5 },
  4: { but: 8, passe: 6, plusMinus: 3, tir: 2 }
};

const cupResult = {
  winner: null
};

const teamLogoMap = {
  "Toronto": "IMAGE/32ÉQUIPES/tor.png",
  "Maple Leafs de Toronto": "IMAGE/32ÉQUIPES/tor.png",

  "Ottawa": "IMAGE/32ÉQUIPES/ott.png",
  "Sénateurs d'Ottawa": "IMAGE/32ÉQUIPES/ott.png",

  "Tampa Bay": "IMAGE/32ÉQUIPES/tbl.png",
  "Lightning de Tampa Bay": "IMAGE/32ÉQUIPES/tbl.png",

  "Floride": "IMAGE/32ÉQUIPES/fla.png",
  "Panthers de la Floride": "IMAGE/32ÉQUIPES/fla.png",

  "Washington": "IMAGE/32ÉQUIPES/wsh.png",
  "Capitals de Washington": "IMAGE/32ÉQUIPES/wsh.png",

  "Montréal": "IMAGE/32ÉQUIPES/mtl.png",
  "Canadiens de Montréal": "IMAGE/32ÉQUIPES/mtl.png",

  "Caroline": "IMAGE/32ÉQUIPES/car.png",
  "Hurricanes de la Caroline": "IMAGE/32ÉQUIPES/car.png",

  "New Jersey": "IMAGE/32ÉQUIPES/njd.png",
  "Devils du New Jersey": "IMAGE/32ÉQUIPES/njd.png",

  "Winnipeg": "IMAGE/32ÉQUIPES/win.png",
  "Jets de Winnipeg": "IMAGE/32ÉQUIPES/win.png",

  "St-Louis": "IMAGE/32ÉQUIPES/stl.png",
  "St. Louis": "IMAGE/32ÉQUIPES/stl.png",
  "Blues de St-Louis": "IMAGE/32ÉQUIPES/stl.png",

  "Dallas": "IMAGE/32ÉQUIPES/dal.png",
  "Stars de Dallas": "IMAGE/32ÉQUIPES/dal.png",

  "Colorado": "IMAGE/32ÉQUIPES/col.png",
  "Avalanche du Colorado": "IMAGE/32ÉQUIPES/col.png",

  "Vegas": "IMAGE/32ÉQUIPES/vgk.png",
  "Golden Knights de Vegas": "IMAGE/32ÉQUIPES/vgk.png",

  "Minnesota": "IMAGE/32ÉQUIPES/min.png",
  "Wild du Minnesota": "IMAGE/32ÉQUIPES/min.png",

  "Los Angeles": "IMAGE/32ÉQUIPES/lak.png",
  "Kings de Los Angeles": "IMAGE/32ÉQUIPES/lak.png",

  "Edmonton": "IMAGE/32ÉQUIPES/edm.png",
  "Oilers d'Edmonton": "IMAGE/32ÉQUIPES/edm.png",

  "À déterminer": "IMAGE/32ÉQUIPES/Determiner.jpg",

  "Anaheim": "IMAGE/32ÉQUIPES/ana.png",
  "Ducks d'Anaheim": "IMAGE/32ÉQUIPES/ana.png",

  "Boston": "IMAGE/32ÉQUIPES/bos.png",
  "Bruins de Boston": "IMAGE/32ÉQUIPES/bos.png",

  "Buffalo": "IMAGE/32ÉQUIPES/buf.png",
  "Sabres de Buffalo": "IMAGE/32ÉQUIPES/buf.png",

  "Columbus": "IMAGE/32ÉQUIPES/cbj.png",
  "Blue Jackets de Columbus": "IMAGE/32ÉQUIPES/cbj.png",

  "Calgary": "IMAGE/32ÉQUIPES/cgy.webp",
  "Flames de Calgary": "IMAGE/32ÉQUIPES/cgy.png",

  "Chicago": "IMAGE/32ÉQUIPES/chi.png",
  "Blackhawks de Chicago": "IMAGE/32ÉQUIPES/chi.png",

  "Detroit": "IMAGE/32ÉQUIPES/det.png",
  "Red Wings de Detroit": "IMAGE/32ÉQUIPES/det.png",

  "Islanders": "IMAGE/32ÉQUIPES/nyi.png",
  "New York Islanders": "IMAGE/32ÉQUIPES/nyi.png",
  "Islanders de New York": "IMAGE/32ÉQUIPES/nyi.png",

  "Rangers": "IMAGE/32ÉQUIPES/nyr.png",
  "New York Rangers": "IMAGE/32ÉQUIPES/nyr.png",
  "Rangers de New York": "IMAGE/32ÉQUIPES/nyr.png",

  "Nashville": "IMAGE/32ÉQUIPES/nsh.png",
  "Predators de Nashville": "IMAGE/32ÉQUIPES/nsh.png",

  "Philadelphie": "IMAGE/32ÉQUIPES/phi.png",
  "Flyers de Philadelphie": "IMAGE/32ÉQUIPES/phi.png",

  "Pittsburgh": "IMAGE/32ÉQUIPES/pit.png",
  "Penguins de Pittsburgh": "IMAGE/32ÉQUIPES/pit.png",

  "Seattle": "IMAGE/32ÉQUIPES/sea.png",
  "Kraken de Seattle": "IMAGE/32ÉQUIPES/sea.png",

  "San Jose": "IMAGE/32ÉQUIPES/sjs.png",
  "Sharks de San Jose": "IMAGE/32ÉQUIPES/sjs.png",

  "Utah": "IMAGE/32ÉQUIPES/utah.png",
  "Club de hockey de l'Utah": "IMAGE/32ÉQUIPES/utah.png",

  "Vancouver": "IMAGE/32ÉQUIPES/van.png",
  "Canucks de Vancouver": "IMAGE/32ÉQUIPES/van.png"
};

const cupCodeMap = {
  "Maple Leafs de Toronto": "TOR",
  "Toronto": "TOR",
  "Sénateurs d'Ottawa": "OTT",
  "Ottawa": "OTT",
  "Panthers de la Floride": "FLA",
  "Floride": "FLA",
  "Lightning de Tampa Bay": "LTB",
  "Tampa Bay": "LTB",
  "Canadiens de Montréal": "MTL",
  "Montréal": "MTL",
  "Capitals de Washington": "WSH",
  "Washington": "WSH",
  "Hurricanes de la Caroline": "CAR",
  "Caroline": "CAR",
  "Devils du New Jersey": "NJD",
  "New Jersey": "NJD",
  "Jets de Winnipeg": "WIN",
  "Winnipeg": "WIN",
  "Blues de St-Louis": "STL",
  "St-Louis": "STL",
  "St. Louis": "STL",
  "Stars de Dallas": "DAL",
  "Dallas": "DAL",
  "Avalanche du Colorado": "COL",
  "Colorado": "COL",
  "Golden Knights de Vegas": "VGK",
  "Vegas": "VGK",
  "Wild du Minnesota": "MIN",
  "Minnesota": "MIN",
  "Kings de Los Angeles": "LAK",
  "Los Angeles": "LAK",
  "Oilers d'Edmonton": "EDM",
  "Edmonton": "EDM",
  "Bruins de Boston": "BOS",
  "Boston": "BOS",
  "Sabres de Buffalo": "BUF",
  "Buffalo": "BUF",
  "Red Wings de Detroit": "DET",
  "Detroit": "DET",
  "Islanders de New York": "NYI",
  "Islanders": "NYI",
  "Rangers de New York": "NYR",
  "Rangers": "NYR",
  "Penguins de Pittsburgh": "PIT",
  "Pittsburgh": "PIT",
  "Blue Jackets de Columbus": "CBJ",
  "Columbus": "CBJ",
  "Flyers de Philadelphie": "PHI",
  "Philadelphie": "PHI",
  "Predators de Nashville": "NSH",
  "Nashville": "NSH",
  "Utah": "UTA",
  "Club de hockey de l'Utah": "UTA",
  "Kraken de Seattle": "SEA",
  "Seattle": "SEA",
  "Canucks de Vancouver": "VAN",
  "Vancouver": "VAN",
  "Flames de Calgary": "CGY",
  "Calgary": "CGY",
  "Ducks d'Anaheim": "ANA",
  "Anaheim": "ANA",
  "Sharks de San Jose": "SJS",
  "San Jose": "SJS",
  "Blackhawks de Chicago": "CHI",
  "Chicago": "CHI"
};

const playerImageMap = {
  "Sebastian Aho": "IMAGE/Joueurs/Aho.png",
  "Matt Boldy": "IMAGE/Joueurs/Boldy.png",
  "Leo Carlsson": "IMAGE/Joueurs/Carlsson.png",
  "Cole Caufield": "IMAGE/Joueurs/Caufield.png",
  "Sidney Crosby": "IMAGE/Joueurs/Crosby.png",
  "Rasmus Dahlin": "IMAGE/Joueurs/Dahlin.png",
  "Quinn Hughes": "IMAGE/Joueurs/Hughes.png",
  "Jack Eichel": "IMAGE/Joueurs/Eichel.png",
  "Taylor Hall": "IMAGE/Joueurs/Hall.png",
  "Lane Hutson": "IMAGE/Joueurs/Hutson.png",
  "Kirill Kaprizov": "IMAGE/Joueurs/Kaprizov.png",
  "Nikita Kucherov": "IMAGE/Joueurs/Kucherov.png",
  "Nathan MacKinnon": "IMAGE/Joueurs/MacKinnon.png",
  "Cale Makar": "IMAGE/Joueurs/Makar.png",
  "Mitch Marner": "IMAGE/Joueurs/Marner.png",
  "Connor McDavid": "IMAGE/Joueurs/McDavid.png",
  "Martin Necas": "IMAGE/Joueurs/Necas.png",
  "David Pastrnak": "IMAGE/Joueurs/Pastrnak.png",
  "Mikko Rantanen": "IMAGE/Joueurs/Rantanen.png",
  "Logan Stankoven": "IMAGE/Joueurs/Stankoven.png",
  "Nick Suzuki": "IMAGE/Joueurs/Suzuki.png",
  "Tage Thompson": "IMAGE/Joueurs/Thompson.png"
};

function calculerPointsJoueur(joueur, ronde) {
  const pointsConfig = playerPointsByRound[ronde];
  if (!pointsConfig) return 0;

  const buts = toNumber(joueur.buts);
  const passes = toNumber(joueur.passes);
  const plusMinus = toNumber(joueur.plusMinus);
  const tirs = toNumber(joueur.tirs);

  return (
    buts * pointsConfig.but +
    passes * pointsConfig.passe +
    plusMinus * pointsConfig.plusMinus +
    tirs * pointsConfig.tir
  );
}

function evaluateSeriesPrediction(round, predictedWinner, predictedGames, actualWinner, actualGames) {
  const pointsTable = teamPointsByRound[round];

  if (!pointsTable || !predictedWinner || !predictedGames || !actualWinner || !actualGames) {
    return { label: "", points: 0 };
  }

  const predictedGamesNum = Number(predictedGames);
  const actualGamesNum = Number(actualGames);

  const winnerCorrect = predictedWinner === actualWinner;
  const exactGames = predictedGamesNum === actualGamesNum;
  const plusMinusOne = Math.abs(predictedGamesNum - actualGamesNum) === 1;

  if (winnerCorrect && exactGames) {
    return {
      label: "Gagnant + nombre de matchs exact",
      points: pointsTable.exactWinnerAndGames
    };
  }

  const labels = [];
  let points = 0;

  if (winnerCorrect) {
    labels.push("Gagnant de la série");
    points += pointsTable.winnerOnly;
  }

  if (exactGames) {
    labels.push("Nombre exact de matchs");
    points += pointsTable.exactGamesOnly;
  } else if (plusMinusOne) {
    labels.push("± 1 match");
    points += pointsTable.plusMinusOne;
  }

  if (labels.length === 0) {
    return { label: "Aucun point", points: 0 };
  }

  return {
    label: labels.join(" + "),
    points
  };
}

function evaluateCupPrediction(predictedCupWinner, actualCupWinner) {
  if (!actualCupWinner) {
    return { label: "En attente", points: 0 };
  }

  if (predictedCupWinner === actualCupWinner) {
    return {
      label: "Gagnant de la Coupe Stanley",
      points: teamPointsByRound[4].cupWinner
    };
  }

  return { label: "Aucun point", points: 0 };
}

function appliquerClasseBadge(badge, games) {
  badge.classList.remove("badge-5", "badge-6", "badge-7");

  const gamesNumber = Number(games);

  if (gamesNumber === 5) badge.classList.add("badge-5");
  else if (gamesNumber === 6) badge.classList.add("badge-6");
  else if (gamesNumber === 7) badge.classList.add("badge-7");
}

function appliquerPickSerie(blocParticipant, seriesId, pickData) {
  if (!pickData) return;

  const card = blocParticipant.querySelector(`.series-card[data-series-id="${seriesId}"]`);
  if (!card) return;

  const logos = card.querySelectorAll(".team-logo");
  logos.forEach(logo => logo.classList.remove("selected"));

  const pickName = normalizeTeamName(pickData.pick);

  if (pickName) {
    const teamLogo = Array.from(logos).find(
      logo => normalizeTeamName(logo.dataset.team) === pickName
    );

    if (teamLogo) {
      teamLogo.classList.add("selected");
    }
  }

  const badge = card.querySelector(".series-badge");
  if (badge) {
    if (pickData.games) {
      badge.textContent = `${pickData.games} matchs`;
      appliquerClasseBadge(badge, pickData.games);
    } else {
      badge.textContent = "À déterminer";
      badge.classList.remove("badge-5", "badge-6", "badge-7");
    }
  }
}

function appliquerCoupe(blocParticipant, cupPick) {
  const cupBlock = blocParticipant.querySelector(".team-hero");
  if (!cupBlock) return;

  const cupPickName = normalizeTeamName(cupPick);
  cupBlock.dataset.cupPick = cupPickName || "";

  const nameEl = cupBlock.querySelector(".team-hero-name");
  const logoEl = cupBlock.querySelector(".team-hero-logo");

  if (nameEl) {
    nameEl.textContent = cupPickName || "À déterminer";
  }

  if (logoEl) {
    const logoPath = teamLogoMap[cupPickName] || teamLogoMap["À déterminer"];
    logoEl.src = logoPath;
    logoEl.alt = cupPickName || "À déterminer";
    logoEl.style.display = "";
  }
}

function appliquerFondParticipant(blocParticipant, cupPick) {
  const cupPickName = normalizeTeamName(cupPick);
  const logoPath = teamLogoMap[cupPickName];

  if (!logoPath) {
    blocParticipant.style.setProperty("--team-bg-logo", "none");
    return;
  }

  blocParticipant.style.setProperty("--team-bg-logo", `url("${logoPath}")`);
}


function appliquerThemeParticipant(blocParticipant, cupPick) {
  const allThemeClasses = [
    "theme-TOR", "theme-OTT", "theme-FLA", "theme-LTB", "theme-MTL",
    "theme-WSH", "theme-CAR", "theme-NJD", "theme-WIN", "theme-STL",
    "theme-DAL", "theme-COL", "theme-VGK", "theme-MIN", "theme-LAK",
    "theme-EDM", "theme-BOS", "theme-BUF", "theme-DET", "theme-NYI",
    "theme-NYR", "theme-PIT", "theme-CBJ", "theme-PHI", "theme-NSH",
    "theme-UTA", "theme-SEA", "theme-VAN", "theme-CGY", "theme-ANA",
    "theme-SJS", "theme-CHI"
  ];

  blocParticipant.classList.remove(...allThemeClasses);

  const normalizedCupPick = normalizeTeamName(cupPick);
  const teamCode = cupCodeMap[normalizedCupPick];

  if (!teamCode) return;

  blocParticipant.classList.add(`theme-${teamCode}`);
}

function resetLigneJoueur(ligne) {
  const cellules = ligne.querySelectorAll("td");
  const img = ligne.querySelector(".imgjoueurs");
  const spanNom = ligne.querySelector(".player-cell span");

  ligne.dataset.joueur = "";

  if (img) {
    img.src = "";
    img.alt = "";
    img.style.display = "none";
  }

  if (spanNom) {
    spanNom.textContent = "À déterminer";
  }

  if (cellules[1]) cellules[1].textContent = "0";
  if (cellules[2]) cellules[2].textContent = "0";
  if (cellules[3]) cellules[3].textContent = "0";
  if (cellules[4]) cellules[4].textContent = "0";
  if (cellules[5]) cellules[5].textContent = "0";
  if (cellules[6]) cellules[6].textContent = "0";
}

function remplirTableauJoueursDepuisChoix(bloc, ronde, nomsJoueurs, statsJoueurs, echangesApresLimite = {}) {
  const table = bloc.querySelector(`.player-table[data-ronde="${ronde}"]`);
  if (!table) return 0;

  const participantKey = normalizeKey(bloc.dataset.participant);
  const echange = echangesApresLimite[participantKey];

  const lignes = table.querySelectorAll("tbody tr");
  let totalRonde = 0;

  lignes.forEach((ligne, index) => {
    const nomChoisiBrut = cleanCell(nomsJoueurs[index] || "");
    const nomChoisiNormalise = normalizeKey(nomChoisiBrut);

    if (!nomChoisiBrut) {
      resetLigneJoueur(ligne);
      return;
    }

    let stats = statsJoueurs[nomChoisiBrut] || statsJoueurs[nomChoisiNormalise];

    if (
      ronde === 2 &&
      echange &&
      normalizeKey(echange.nouveauJoueur) === nomChoisiNormalise &&
      statsJoueurs.__apresLimite?.[nomChoisiNormalise]
    ) {
      stats = statsJoueurs.__apresLimite[nomChoisiNormalise];
    }

    if (!stats) {
      resetLigneJoueur(ligne);
      return;
    }

    const cellules = ligne.querySelectorAll("td");
    const img = ligne.querySelector(".imgjoueurs");
    const spanNom = ligne.querySelector(".player-cell span");

    ligne.dataset.joueur = stats.joueur;

    if (img) {
      img.src = playerImageMap[stats.joueur] || "";
      img.alt = stats.joueur;
      img.style.display = playerImageMap[stats.joueur] ? "" : "none";
    }

    if (spanNom) {
      spanNom.textContent = stats.joueur;
    }

    const pointsPool = calculerPointsJoueur(stats, ronde);
    totalRonde += pointsPool;

    if (cellules[1]) cellules[1].textContent = stats.buts || "0";
    if (cellules[2]) cellules[2].textContent = stats.passes || "0";
    if (cellules[3]) cellules[3].textContent = stats.totalPoints || "0";
    if (cellules[4]) cellules[4].textContent = stats.plusMinus || "0";
    if (cellules[5]) cellules[5].textContent = stats.tirs || "0";
    if (cellules[6]) cellules[6].textContent = formaterPointsPool(pointsPool);
  });

  const totalEl = bloc.querySelector(`.round-total-points[data-round-total="${ronde}"]`);
  if (totalEl) {
    totalEl.textContent = formaterPointsPool(totalRonde);
  }

  return totalRonde;
}

function syncParticipantMenuLogos() {
  const menuButtons = document.querySelectorAll(".participant-btn[data-target]");

  menuButtons.forEach(button => {
    const targetId = button.dataset.target;
    const participantSection = document.getElementById(targetId);

    if (!participantSection) return;

    const participantNameEl = participantSection.querySelector(".Nom");
    const teamNameEl = participantSection.querySelector(".team-hero-name");
    const teamLogoEl = participantSection.querySelector(".team-hero-logo");

    const buttonNameEl = button.querySelector(".participant-btn-name");
    const buttonSubEl = button.querySelector(".participant-btn-sub");
    const buttonLogoEl = button.querySelector(".participant-btn-logo");

    if (participantNameEl && buttonNameEl) {
      buttonNameEl.textContent = participantNameEl.textContent.trim();
    }

    if (teamNameEl && buttonSubEl) {
      const teamName = teamNameEl.textContent.trim();
      buttonSubEl.textContent = teamName || "Équipe favorite à déterminer";
    }

    if (buttonLogoEl) {
      if (teamLogoEl && teamLogoEl.getAttribute("src")) {
        buttonLogoEl.src = teamLogoEl.getAttribute("src");
        buttonLogoEl.alt = teamLogoEl.getAttribute("alt") || "Logo équipe favorite";
        button.classList.add("has-team-logo");
      } else {
        buttonLogoEl.src = teamLogoMap["À déterminer"];
        buttonLogoEl.alt = "Équipe à déterminer";
        button.classList.remove("has-team-logo");
      }
    }
  });
}

function initialiserMenuParticipants() {
  const participantButtons = document.querySelectorAll(".participant-btn");
  const participantSections = document.querySelectorAll(".Globe.participant-theme");
  const showAllBtn = document.getElementById("showAllParticipants");
  const hideAllBtn = document.getElementById("hideAllParticipants");

  function showParticipant(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.classList.remove("participant-hidden");
    target.classList.add("participant-visible", "participant-highlight");
  }

  function hideParticipant(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.classList.add("participant-hidden");
    target.classList.remove("participant-visible", "participant-highlight");
  }

  function clearHighlightLater(target) {
    setTimeout(() => {
      target.classList.remove("participant-highlight");
    }, 1200);
  }

  function hideAllParticipantsOnLoad() {
    participantSections.forEach(section => {
      section.classList.add("participant-hidden");
      section.classList.remove("participant-visible", "participant-highlight");
    });

    participantButtons.forEach(button => {
      button.classList.remove("active");
    });
  }

  hideAllParticipantsOnLoad();

  participantButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const target = document.getElementById(targetId);
      if (!target) return;

      const isHidden = target.classList.contains("participant-hidden");

      if (isHidden) {
        showParticipant(targetId);
        button.classList.add("active");

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        clearHighlightLater(target);
      } else {
        hideParticipant(targetId);
        button.classList.remove("active");
      }
    });
  });

  if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
      participantSections.forEach(section => {
        section.classList.remove("participant-hidden");
        section.classList.add("participant-visible");
      });

      participantButtons.forEach(button => {
        button.classList.add("active");
      });
    });
  }

  if (hideAllBtn) {
    hideAllBtn.addEventListener("click", () => {
      participantSections.forEach(section => {
        section.classList.add("participant-hidden");
        section.classList.remove("participant-visible", "participant-highlight");
      });

      participantButtons.forEach(button => {
        button.classList.remove("active");
      });
    });
  }
}
function ouvrirParticipantDepuisURL() {
  const targetId = window.location.hash.replace("#", "").trim();
  if (!targetId) return;

  const button = document.querySelector(`.participant-btn[data-target="${targetId}"]`);
  const target = document.getElementById(targetId);

  if (!button || !target) return;

  setTimeout(() => {
    button.click();

    setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 300);
  }, 300);
}

async function initialiser() {
  const seriesResults = await chargerTousLesResultatsSeries();
  const tousLesPicks = await chargerTousLesPicks();

  const [
    statsRonde1,
    statsRonde2,
    statsRonde3,
    statsRonde4,
    choixRonde1,
    choixRonde2,
    choixRonde3,
    choixRonde4,
echangesApresLimite
  ] = await Promise.all([
    chargerStatsJoueursRonde("data/stats_joueurs_ronde1.csv").catch(() => ({})),
    chargerStatsJoueursRonde("data/stats_joueurs_ronde2.csv").catch(() => ({})),
    chargerStatsJoueursRonde("data/stats_joueurs_ronde3.csv").catch(() => ({})),
    chargerStatsJoueursRonde("data/stats_joueurs_ronde4.csv").catch(() => ({})),
    chargerChoixJoueursRonde("data/choix_joueurs_ronde1.csv").catch(() => ({})),
    chargerChoixJoueursRonde("data/choix_joueurs_ronde2.csv").catch(() => ({})),
    chargerChoixJoueursRonde("data/choix_joueurs_ronde3.csv").catch(() => ({})),
    chargerChoixJoueursRonde("data/choix_joueurs_ronde4.csv").catch(() => ({})),
    chargerEchangesApresLimite().catch(() => ({}))
  ]);

  async function chargerEchangesApresLimite() {
  const texte = await fetchTextFile("data/echanges_apres_limite.csv");
  const rows = parseDelimitedFile(texte);
  const echanges = {};

  rows.forEach(row => {
    const participant = cleanCell(row.participant);
    const ancienJoueur = cleanCell(row.ancienJoueur);
    const nouveauJoueur = cleanCell(row.nouveauJoueur);

    if (!participant || !nouveauJoueur) return;

    echanges[normalizeKey(participant)] = {
      ancienJoueur,
      nouveauJoueur
    };
  });

  return echanges;
}

  const participantBlocks = document.querySelectorAll(".participant-shell[data-participant]");

  participantBlocks.forEach(bloc => {
    const nom = cleanCell(bloc.dataset.participant);
    const nomNormalise = normalizeKey(nom);

    const totalJoueursR1 = remplirTableauJoueursDepuisChoix(bloc, 1, choixRonde1[nom] || choixRonde1[nomNormalise] || [], statsRonde1);
    const totalJoueursR2 = remplirTableauJoueursDepuisChoix(bloc, 2, choixRonde2[nom] || choixRonde2[nomNormalise] || [], statsRonde2, echangesApresLimite);
    const totalJoueursR3 = remplirTableauJoueursDepuisChoix(bloc, 3, choixRonde3[nom] || choixRonde3[nomNormalise] || [], statsRonde3);
    const totalJoueursR4 = remplirTableauJoueursDepuisChoix(bloc, 4, choixRonde4[nom] || choixRonde4[nomNormalise] || [], statsRonde4);

    const totalJoueursGlobal = totalJoueursR1 + totalJoueursR2 + totalJoueursR3 + totalJoueursR4;
    const totalGlobalEl = bloc.querySelector(".players-grand-total");

    if (totalGlobalEl) {
      totalGlobalEl.textContent = formaterPointsPool(totalJoueursGlobal);
    }

    const picks = tousLesPicks[nom] || tousLesPicks[nomNormalise] || {};

    Object.keys(picks).forEach(key => {
      if (key.startsWith("r")) {
        appliquerPickSerie(bloc, key, picks[key]);
      }
    });

    appliquerCoupe(bloc, picks.cup_pick || "");
    appliquerThemeParticipant(bloc, picks.cup_pick || "");
    appliquerFondParticipant(bloc, picks.cup_pick || "");
  });

  participantBlocks.forEach(bloc => {
    const seriesCards = bloc.querySelectorAll(".series-card");

    seriesCards.forEach(card => {
      const round = Number(card.dataset.round);
      const seriesId = cleanCell(card.dataset.seriesId);
      const actualResult = seriesResults[seriesId];

      const labelEl = card.querySelector(".series-result-label");
      const pointsEl = card.querySelector(".series-result-points");

      if (!actualResult || !actualResult.winner || !actualResult.games) {
        if (labelEl) labelEl.textContent = "En attente";
        if (pointsEl) pointsEl.textContent = "0 pts";
        return;
      }

      const selectedTeamImg = card.querySelector(".team-logo.selected img");
      const predictedWinner = selectedTeamImg ? normalizeTeamName(selectedTeamImg.alt) : "";

      const badge = card.querySelector(".series-badge");
      const predictedGames = badge ? parseInt(badge.textContent, 10) || 0 : 0;

      const actualWinner = normalizeTeamName(actualResult.winner);
      const actualGames = Number(actualResult.games);

      const result = evaluateSeriesPrediction(
        round,
        predictedWinner,
        predictedGames,
        actualWinner,
        actualGames
      );

      if (labelEl) labelEl.textContent = result.label;
      if (pointsEl) pointsEl.textContent = `${result.points} pts`;
    });

    const cupBlock = bloc.querySelector(".team-hero");
    if (cupBlock) {
      const predictedCupWinner = normalizeTeamName(cupBlock.dataset.cupPick || "");
      const actualCupWinner = normalizeTeamName(cupResult.winner || "");
      const result = evaluateCupPrediction(predictedCupWinner, actualCupWinner);

      const labelEl = cupBlock.querySelector(".cup-result-label");
      const pointsEl = cupBlock.querySelector(".cup-result-points");

      if (labelEl) labelEl.textContent = result.label;
      if (pointsEl) pointsEl.textContent = `${result.points} pts`;
    }
  });

  syncParticipantMenuLogos();
  ouvrirParticipantDepuisURL();
}

document.addEventListener("DOMContentLoaded", async () => {
  initialiserMenuParticipants();

  try {
    await initialiser();
  } catch (error) {
    console.error("Erreur durant l'initialisation du pool :", error);
  }
});


window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("players") !== "1") return;

  setTimeout(() => {
    const participantCard = document.querySelector(window.location.hash);
    if (!participantCard) return;

    const playersSection = participantCard.querySelector(".players-section");
    if (!playersSection) return;

    playersSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 1000);
});