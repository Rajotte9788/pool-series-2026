async function fetchTextFile(fichier) {
  const response = await fetch(fichier, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Impossible de charger ${fichier} (${response.status})`);
  }

  const texte = await response.text();
  return texte.replace(/^\uFEFF/, "");
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
    .map(l => l.trim())
    .filter(l => l !== "");

  if (lignes.length === 0) return [];

  const separateur = detectSeparator(lignes[0]);

  const headers = lignes[0]
    .split(separateur)
    .map(h => h.replace(/^\uFEFF/, "").trim());

  return lignes.slice(1).map(ligne => {
    const colonnes = ligne.split(separateur).map(c => c.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = colonnes[index] ?? "";
    });

    return row;
  });
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toNumber(value) {
  const parsed = parseFloat(String(value || "").replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatPoints(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/* ====================== ÉCHANGE APRÈS LIMITE ====================== */

async function chargerEchangesApresLimite() {
  const texte = await fetchTextFile("data/echanges_apres_limite.csv");
  const rows = parseDelimitedFile(texte);
  const echanges = {};

  rows.forEach(row => {
    const participant = (row.participant || "").trim();
    const nouveauJoueur = (row.nouveauJoueur || "").trim();
    const ancienJoueur = (row.ancienJoueur || "").trim();

    if (!participant || !nouveauJoueur) return;

    echanges[normalizeKey(participant)] = {
      ancienJoueur,
      nouveauJoueur
    };
  });

  return echanges;
}

function getStatsJoueurSelonEchange(participantKey, nomJoueur, statsRonde, ronde, echangesApresLimite) {
  const participantKeyClean = normalizeKey(participantKey);
  const nomKey = normalizeKey(nomJoueur);

  const echange = echangesApresLimite[participantKeyClean];

  if (ronde === 2 && echange) {
    const nouveauKey = normalizeKey(echange.nouveauJoueur);

    if (nouveauKey === nomKey) {
      const statsSpeciales = statsRonde.__apresLimite?.[nomKey];

      if (statsSpeciales) {
        return statsSpeciales;
      }
    }
  }

  return statsRonde[nomKey];
}


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
  "Flames de Calgary": "IMAGE/32ÉQUIPES/cgy.webp",

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
  "Mammoth de l'Utah": "IMAGE/32ÉQUIPES/utah.png",

  "Vancouver": "IMAGE/32ÉQUIPES/van.png",
  "Canucks de Vancouver": "IMAGE/32ÉQUIPES/van.png"
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

const teamCardThemeMap = {
  "Ducks d'Anaheim": {
    bg: "linear-gradient(180deg,#f47a38 0%,#a94f1f 100%)",
    accent: "rgba(0,0,0,0.25)"
  },
  "Coyotes de l'Arizona": {
    bg: "linear-gradient(180deg,#8c2633 0%,#5a1720 100%)",
    accent: "rgba(221,203,164,0.20)"
  },
  "Bruins de Boston": {
    bg: "linear-gradient(180deg,#ffb81c 0%,#c69214 100%)",
    accent: "rgba(0,0,0,0.25)"
  },
  "Sabres de Buffalo": {
    bg: "linear-gradient(180deg,#003087 0%,#001f5c 100%)",
    accent: "rgba(255,184,28,0.20)"
  },
  "Flames de Calgary": {
    bg: "linear-gradient(180deg,#d2001c 0%,#8c0012 100%)",
    accent: "rgba(255,184,28,0.20)"
  },
  "Hurricanes de la Caroline": {
    bg: "linear-gradient(180deg,#c8102e 0%,#880b1f 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Blackhawks de Chicago": {
    bg: "linear-gradient(180deg,#cf0a2c 0%,#8c071d 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Avalanche du Colorado": {
    bg: "linear-gradient(180deg,#7b1734 0%,#4f1023 100%)",
    accent: "rgba(65,155,249,0.18)"
  },
  "Blue Jackets de Columbus": {
    bg: "linear-gradient(180deg,#002654 0%,#001a3a 100%)",
    accent: "rgba(200,16,46,0.20)"
  },
  "Stars de Dallas": {
    bg: "linear-gradient(180deg,#0f8b63 0%,#0b5f45 100%)",
    accent: "rgba(255,255,255,0.16)"
  },
  "Red Wings de Detroit": {
    bg: "linear-gradient(180deg,#ce1126 0%,#8c0b19 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Oilers d'Edmonton": {
    bg: "linear-gradient(180deg,#f26b21 0%,#b34a12 100%)",
    accent: "rgba(12,35,64,0.20)"
  },
  "Panthers de la Floride": {
    bg: "linear-gradient(180deg,#c8102e 0%,#8f0f23 100%)",
    accent: "rgba(214,178,94,0.20)"
  },
  "Kings de Los Angeles": {
    bg: "linear-gradient(180deg,#444444 0%,#222222 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Wild du Minnesota": {
    bg: "linear-gradient(180deg,#0e5a3a 0%,#093b27 100%)",
    accent: "rgba(196,171,105,0.18)"
  },
  "Canadiens de Montréal": {
    bg: "linear-gradient(180deg,#c51230 0%,#8f0f24 100%)",
    accent: "rgba(25,33,104,0.20)"
  },
  "Predators de Nashville": {
    bg: "linear-gradient(180deg,#ffb81c 0%,#c69214 100%)",
    accent: "rgba(4,30,66,0.20)"
  },
  "Devils du New Jersey": {
    bg: "linear-gradient(180deg,#c8102e 0%,#860d21 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Islanders de New York": {
    bg: "linear-gradient(180deg,#00539b 0%,#003a6d 100%)",
    accent: "rgba(245,125,0,0.20)"
  },
  "Rangers de New York": {
    bg: "linear-gradient(180deg,#0038a8 0%,#002a78 100%)",
    accent: "rgba(206,17,38,0.20)"
  },
  "Sénateurs d'Ottawa": {
    bg: "linear-gradient(180deg,#c52032 0%,#8f1523 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Flyers de Philadelphie": {
    bg: "linear-gradient(180deg,#f74902 0%,#a93401 100%)",
    accent: "rgba(0,0,0,0.25)"
  },
  "Penguins de Pittsburgh": {
    bg: "linear-gradient(180deg,#ffb81c 0%,#c69214 100%)",
    accent: "rgba(0,0,0,0.25)"
  },
  "Sharks de San Jose": {
    bg: "linear-gradient(180deg,#006d75 0%,#00484d 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Kraken de Seattle": {
    bg: "linear-gradient(180deg,#001628 0%,#000d1a 100%)",
    accent: "rgba(153,217,217,0.20)"
  },
  "Blues de St-Louis": {
    bg: "linear-gradient(180deg,#1f4fa3 0%,#15356f 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Lightning de Tampa Bay": {
    bg: "linear-gradient(180deg,#1f5ebc 0%,#163f82 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Maple Leafs de Toronto": {
    bg: "linear-gradient(180deg,#1f5aa8 0%,#143d73 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Canucks de Vancouver": {
    bg: "linear-gradient(180deg,#00205b 0%,#00153d 100%)",
    accent: "rgba(0,176,80,0.20)"
  },
  "Golden Knights de Vegas": {
    bg: "linear-gradient(180deg,#b4975a 0%,#7f673a 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Capitals de Washington": {
    bg: "linear-gradient(180deg,#c61f2f 0%,#8f1622 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Jets de Winnipeg": {
    bg: "linear-gradient(180deg,#1d4f91 0%,#12345f 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "Mammoth de l'Utah": {
    bg: "linear-gradient(180deg,#0b3040 0%,#071f2a 100%)",
    accent: "rgba(255,255,255,0.18)"
  },
  "À déterminer": {
    bg: "linear-gradient(180deg,#384152 0%,#232a36 100%)",
    accent: "rgba(255,255,255,0.16)"
  }
};

function getSafeTeamTheme(equipe) {
  const nom = String(equipe || "").trim();
  return teamCardThemeMap[nom] || teamCardThemeMap["À déterminer"];
}

const playerPointsByRound = {
  1: { but: 3, passe: 2, plusMinus: 1, tir: 0.5 },
  2: { but: 4, passe: 3, plusMinus: 2, tir: 1 },
  3: { but: 5, passe: 4, plusMinus: 2.5, tir: 1.5 },
  4: { but: 8, passe: 6, plusMinus: 3, tir: 2 }
};

const roundScoring = {
  1: { winnerOnly: 12, exactGamesOnly: 10, plusMinusOne: 5, perfect: 25 },
  2: { winnerOnly: 15, exactGamesOnly: 12, plusMinusOne: 6, perfect: 30 },
  3: { winnerOnly: 18, exactGamesOnly: 15, plusMinusOne: 7, perfect: 35 },
  4: { winnerOnly: 20, exactGamesOnly: 15, plusMinusOne: 8, perfect: 40, cupWinner: 60 }
};

function splitPerfectPoints(round) {
  return roundScoring[round].perfect / 2;
}

const tendancesManuelles = {
  "mario rousseau (1)": { icon: "IMAGE/FlecheDroite.png", text: "0" },
  "daniel rajotte (1)": { icon: "IMAGE/FlecheDroite.png", text: "0" },
  "simon corbeil": { icon: "IMAGE/FlecheHaut.png", text: "5" },
  "william guenette": { icon: "IMAGE/FlecheHaut.png", text: "6" },
  "danny rajotte": { icon: "IMAGE/FlecheBas.png", text: "2" },
  "jonathan rajotte brodeur": { icon: "IMAGE/FlecheBas.png", text: "2" },
  "gabriel bernier (2)": { icon: "IMAGE/FlecheHaut.png", text: "7" },
  "daniel rajotte (2)": { icon: "IMAGE/FlecheBas.png", text: "3" },
  "gabriel bernier (1)": { icon: "IMAGE/FlecheHaut.png", text: "5" },
  "martin noel (1)": { icon: "IMAGE/FlecheBas.png", text: "4" },
  "mario rousseau (2)": { icon: "IMAGE/FlecheHaut.png", text: "6" },
  "charlotte roy": { icon: "IMAGE/FlecheBas.png", text: "5" },
  "alex michaud": { icon: "IMAGE/FlecheBas.png", text: "4" },
  "jean-francois hubert (1)": { icon: "IMAGE/FlecheBas.png", text: "3" },
  "mederic giard (1)": { icon: "IMAGE/FlecheBas.png", text: "3" },
  "kevin dunkler": { icon: "IMAGE/FlecheBas.png", text: "3" },
  "samuel michaud": { icon: "IMAGE/FlecheBas.png", text: "1" },
  "jean-francois hubert (2)": { icon: "IMAGE/FlecheDroite.png", text: "0" },
  "laurie noel": { icon: "IMAGE/FlecheHaut.png", text: "2" },
  "martin noel (2)": { icon: "IMAGE/FlecheBas.png", text: "1" },
  "mederic giard (2)": { icon: "IMAGE/FlecheBas.png", text: "1" },
  "william deschambres": { icon: "IMAGE/FlecheDroite.png", text: "0" }
};

const playerNhlUrlMap = {
  "Sebastian Aho": "https://www.nhl.com/hurricanes/player/sebastian-aho-8478427",
  "Matt Boldy": "https://www.nhl.com/wild/player/matt-boldy-8481557",
  "Leo Carlsson": "https://www.nhl.com/ducks/player/leo-carlsson-8484153",
  "Cole Caufield": "https://www.nhl.com/canadiens/player/cole-caufield-8481540",
  "Sidney Crosby": "https://www.nhl.com/penguins/player/sidney-crosby-8471675",
  "Rasmus Dahlin": "https://www.nhl.com/sabres/player/rasmus-dahlin-8480839",
  "Jack Eichel": "https://www.nhl.com/goldenknights/player/jack-eichel-8478403",
  "Taylor Hall": "https://www.nhl.com/hurricanes/player/taylor-hall-8475791",
  "Quinn Hughes": "https://www.nhl.com/wild/player/quinn-hughes-8480800",
  "Lane Hutson": "https://www.nhl.com/canadiens/player/lane-hutson-8483457",
  "Kirill Kaprizov": "https://www.nhl.com/wild/player/kirill-kaprizov-8478864",
  "Nikita Kucherov": "https://www.nhl.com/lightning/player/nikita-kucherov-8476453",
  "Nathan MacKinnon": "https://www.nhl.com/avalanche/player/nathan-mackinnon-8477492",
  "Cale Makar": "https://www.nhl.com/avalanche/player/cale-makar-8480069",
  "Mitch Marner": "https://www.nhl.com/goldenknights/player/mitch-marner-8478483",
  "Connor McDavid": "https://www.nhl.com/oilers/player/connor-mcdavid-8478402",
  "Martin Necas": "https://www.nhl.com/avalanche/player/martin-necas-8480039",
  "David Pastrnak": "https://www.nhl.com/bruins/player/david-pastrnak-8477956",
  "Mikko Rantanen": "https://www.nhl.com/stars/player/mikko-rantanen-8478420",
  "Nick Suzuki": "https://www.nhl.com/canadiens/player/nick-suzuki-8480018",
  "Tage Thompson": "https://www.nhl.com/sabres/player/tage-thompson-8479420"
};

function getNhlPlayerLink(playerName) {
  return playerNhlUrlMap[playerName] || "#";
}

function getManualTrend(participantName) {
  const key = normalizeKey(participantName);
  return (
    tendancesManuelles[key] || {
      icon: "IMAGE/FlecheDroite.png",
      text: ""
    }
  );
}

async function chargerPicksRonde(numero) {
  const texte = await fetchTextFile(`data/picks_ronde${numero}.csv`);
  const rows = parseDelimitedFile(texte);
  const picks = {};

  rows.forEach(row => {
    const participant = (row.participant || "").trim();
    if (!participant) return;

    if (numero === 1) {
      picks[normalizeKey(participant)] = {
        "r1-s1": { pick: (row.s1_pick || "").trim(), games: (row.s1_games || "").trim() },
        "r1-s2": { pick: (row.s2_pick || "").trim(), games: (row.s2_games || "").trim() },
        "r1-s3": { pick: (row.s3_pick || "").trim(), games: (row.s3_games || "").trim() },
        "r1-s4": { pick: (row.s4_pick || "").trim(), games: (row.s4_games || "").trim() },
        "r1-s5": { pick: (row.s5_pick || "").trim(), games: (row.s5_games || "").trim() },
        "r1-s6": { pick: (row.s6_pick || "").trim(), games: (row.s6_games || "").trim() },
        "r1-s7": { pick: (row.s7_pick || "").trim(), games: (row.s7_games || "").trim() },
        "r1-s8": { pick: (row.s8_pick || "").trim(), games: (row.s8_games || "").trim() }
      };
    }

    if (numero === 2) {
      picks[normalizeKey(participant)] = {
        "r2-s1": { pick: (row.s1_pick || "").trim(), games: (row.s1_games || "").trim() },
        "r2-s2": { pick: (row.s2_pick || "").trim(), games: (row.s2_games || "").trim() },
        "r2-s3": { pick: (row.s3_pick || "").trim(), games: (row.s3_games || "").trim() },
        "r2-s4": { pick: (row.s4_pick || "").trim(), games: (row.s4_games || "").trim() }
      };
    }

    if (numero === 3) {
      picks[normalizeKey(participant)] = {
        "r3-s1": { pick: (row.s1_pick || "").trim(), games: (row.s1_games || "").trim() },
        "r3-s2": { pick: (row.s2_pick || "").trim(), games: (row.s2_games || "").trim() }
      };
    }

    if (numero === 4) {
      picks[normalizeKey(participant)] = {
        "r4-s1": { pick: (row.s1_pick || "").trim(), games: (row.s1_games || "").trim() },
        cup_pick: (row.cup_pick || "").trim()
      };
    }
  });

  return picks;
}

async function chargerResultatsRonde(numero) {
  const texte = await fetchTextFile(`data/resultats_ronde${numero}.csv`);
  const rows = parseDelimitedFile(texte);
  const resultats = {};

  rows.forEach(row => {
    const seriesId = (row.seriesId || "").trim();
    if (!seriesId) return;

    resultats[seriesId] = {
      winner: (row.winner || "").trim(),
      games: toNumber(row.games)
    };
  });

  return resultats;
}

async function chargerStatsJoueursRonde(numero) {
  const texte = await fetchTextFile(`data/stats_joueurs_ronde${numero}.csv`);
  const contenu = texte.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const lignes = contenu.split("\n").map(l => l.trim()).filter(l => l !== "");

  const stats = {};
  const statsApresLimite = {};

  if (!lignes.length) {
    stats.__apresLimite = statsApresLimite;
    return stats;
  }

  const separateur = detectSeparator(lignes[0]);
  const headers = lignes[0].split(separateur).map(h => h.trim());

  let modeApresLimite = false;

  lignes.slice(1).forEach(ligne => {
    const colonnes = ligne.split(separateur).map(c => c.trim());

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

    const joueur = (row.joueur || "").trim();
    if (!joueur) return;

    const fiche = {
      joueur,
      buts: toNumber(row.buts),
      passes: toNumber(row.passes),
      plusMinus: toNumber(row.plusMinus),
      tirs: toNumber(row.tirs),
      totalPoints: toNumber(row.totalPoints),
      equipe: (row.equipe || "").trim(),
      poste: (row.poste || "").trim(),
      numero: (row.numero || "").trim(),
      image: playerImageMap[joueur] || "",
      logoEquipe: teamLogoMap[(row.equipe || "").trim()] || teamLogoMap["À déterminer"]
    };

    if (modeApresLimite) {
      statsApresLimite[normalizeKey(joueur)] = fiche;
    } else {
      stats[normalizeKey(joueur)] = fiche;
    }
  });

  stats.__apresLimite = statsApresLimite;
  return stats;
}

async function chargerChoixJoueursRonde(numero) {
  const texte = await fetchTextFile(`data/choix_joueurs_ronde${numero}.csv`);
  const rows = parseDelimitedFile(texte);
  const choix = {};

  rows.forEach(row => {
    const participant = (row.participant || "").trim();
    if (!participant) return;

    choix[normalizeKey(participant)] = [
      (row.joueur1 || "").trim(),
      (row.joueur2 || "").trim(),
      (row.joueur3 || "").trim()
    ];
  });

  return choix;
}

function calculerPointsJoueursPourRonde(nomsJoueurs, statsRonde, ronde, participantKey = "", echangesApresLimite = {}) {
  const config = playerPointsByRound[ronde];
  let total = 0;

  (nomsJoueurs || []).forEach(nom => {
    const joueur = getStatsJoueurSelonEchange(
      participantKey,
      nom,
      statsRonde,
      ronde,
      echangesApresLimite
    );

    if (!joueur) return;

    total +=
      joueur.buts * config.but +
      joueur.passes * config.passe +
      joueur.plusMinus * config.plusMinus +
      joueur.tirs * config.tir;
  });

  return total;
}

function calculerPointsSerie(round, predictedWinner, predictedGames, actualWinner, actualGames) {
  const score = roundScoring[round];
  const winnerCorrect = predictedWinner === actualWinner;
  const exactGames = toNumber(predictedGames) === toNumber(actualGames);
  const plusMinusOne = Math.abs(toNumber(predictedGames) - toNumber(actualGames)) === 1;

  let pointsEquipe = 0;
  let pointsPartie = 0;
  let perfect = 0;

  if (winnerCorrect && exactGames) {
    pointsEquipe += splitPerfectPoints(round);
    pointsPartie += splitPerfectPoints(round);
    perfect += 1;

    return { pointsEquipe, pointsPartie, perfect };
  }

  if (winnerCorrect) {
    pointsEquipe += score.winnerOnly;
  }

  if (exactGames) {
    pointsPartie += score.exactGamesOnly;
  } else if (plusMinusOne) {
    pointsPartie += score.plusMinusOne;
  }

  return { pointsEquipe, pointsPartie, perfect };
}

function mergeParticipants(...objects) {
  const participants = new Set();

  objects.forEach(obj => {
    Object.keys(obj || {}).forEach(key => participants.add(key));
  });

  return Array.from(participants);
}

function getParticipantTargetId(name) {
  const key = normalizeKey(name);

  const participantTargetMap = {
    "jean-francois hubert (1)": "participant-jf-hubert-1",
    "jean-francois hubert (2)": "participant-jf-hubert-2"
  };

  if (participantTargetMap[key]) {
    return participantTargetMap[key];
  }

  return "participant-" + key
    .replace(/[()]/g, "")
    .replace(/\s+/g, "-");
}

function buildRowHTML(row) {
  const targetId = getParticipantTargetId(row.name);

  return `
    <tr>
      <td class="thRang"><span>${row.rank}</span></td>

      <td class="thNom">
        <a class="joueur-cell joueur-cell--link" href="Prediction.html#${targetId}">
          <img class="IMGLOGO joueur-cell__logo" src="${row.gcLogo}" alt="Logo équipe gagnante">
          <span class="joueur-cell__name">${row.name}</span>
        </a>
      </td>

      <td class="${row.bestEquipe ? "stat-best stat-best-equipe" : ""}">
        ${formatPoints(row.pointsEquipe)}
      </td>

      <td class="${row.bestPartie ? "stat-best stat-best-partie" : ""}">
        ${formatPoints(row.pointsPartie)}
      </td>

      <td class="thPP ${row.bestPerfect ? "stat-best stat-best-perfect" : ""}">
        ${row.predictionsParfaites}
      </td>

      <td class="${row.bestJoueurs ? "stat-best stat-best-joueurs" : ""}">
        ${formatPoints(row.pointsJoueurs)}
      </td>

      <td class="T">${formatPoints(row.pointsTotaux)}</td>

      <td>
        ${row.trendIcon ? `<img class="IMGLOGO IMGLOGO--trend" src="${row.trendIcon}" alt="Tendance">` : ""}
        ${row.trendText}
      </td>
    </tr>
  `;
}

async function initialiserClassement() {
  const [
    picks1, picks2, picks3, picks4,
    resultats1, resultats2, resultats3, resultats4,
    statsJ1, statsJ2, statsJ3, statsJ4,
    choixJ1, choixJ2, choixJ3, choixJ4,
    echangesApresLimite
  ] = await Promise.all([
    chargerPicksRonde(1).catch(() => ({})),
    chargerPicksRonde(2).catch(() => ({})),
    chargerPicksRonde(3).catch(() => ({})),
    chargerPicksRonde(4).catch(() => ({})),
    chargerResultatsRonde(1).catch(() => ({})),
    chargerResultatsRonde(2).catch(() => ({})),
    chargerResultatsRonde(3).catch(() => ({})),
    chargerResultatsRonde(4).catch(() => ({})),
    chargerStatsJoueursRonde(1).catch(() => ({})),
    chargerStatsJoueursRonde(2).catch(() => ({})),
    chargerStatsJoueursRonde(3).catch(() => ({})),
    chargerStatsJoueursRonde(4).catch(() => ({})),
    chargerChoixJoueursRonde(1).catch(() => ({})),
    chargerChoixJoueursRonde(2).catch(() => ({})),
    chargerChoixJoueursRonde(3).catch(() => ({})),
    chargerChoixJoueursRonde(4).catch(() => ({})),
    chargerEchangesApresLimite().catch(() => ({}))
  ]);

  const participants = mergeParticipants(
    picks1, picks2, picks3, picks4,
    choixJ1, choixJ2, choixJ3, choixJ4
  );

  const rows = participants.map(participantKey => {
    let pointsEquipe = 0;
    let pointsPartie = 0;
    let predictionsParfaites = 0;
    let pointsJoueurs = 0;
    let pointsCoupe = 0;
    let gcPick = "À déterminer";

    const picksByRound = [
      { round: 1, picks: picks1[participantKey] || {}, results: resultats1 },
      { round: 2, picks: picks2[participantKey] || {}, results: resultats2 },
      { round: 3, picks: picks3[participantKey] || {}, results: resultats3 },
      { round: 4, picks: picks4[participantKey] || {}, results: resultats4 }
    ];

    picksByRound.forEach(({ round, picks, results }) => {
      Object.keys(picks).forEach(seriesId => {
        if (!seriesId.startsWith("r")) return;

        const pick = picks[seriesId];
        const actual = results[seriesId];

        if (!actual || !actual.winner || !actual.games) return;

        const score = calculerPointsSerie(
          round,
          (pick.pick || "").trim(),
          pick.games,
          actual.winner,
          actual.games
        );

        pointsEquipe += score.pointsEquipe;
        pointsPartie += score.pointsPartie;
        predictionsParfaites += score.perfect;
      });
    });

    const round4 = picks4[participantKey] || {};
    gcPick = round4.cup_pick || "À déterminer";

    pointsJoueurs += calculerPointsJoueursPourRonde(choixJ1[participantKey] || [], statsJ1, 1);

    const choixR2 = choixJ2[participantKey] || [];
    const echangeKey = Object.keys(echangesApresLimite).find(key => {
  return normalizeKey(key).replace(/[^a-z0-9]/g, "") === normalizeKey(participantKey).replace(/[^a-z0-9]/g, "");
});

const echange = echangeKey ? echangesApresLimite[echangeKey] : null;

console.log("TEST MATCH", participantKey, echangeKey, echange);







console.log("TEST MATCH", participantKey, echange);
    choixR2.forEach(nomJoueur => {
      const joueurKey = normalizeKey(nomJoueur);
      let stats = statsJ2[joueurKey];

      if (
        echange &&
        normalizeKey(echange.nouveauJoueur) === joueurKey &&
        statsJ2.__apresLimite &&
        statsJ2.__apresLimite[joueurKey]
      ) {
        stats = statsJ2.__apresLimite[joueurKey];
        console.log("✅ SPECIAL APPLIQUÉ", participantKey, nomJoueur, stats);
      }

      if (!stats) return;

      pointsJoueurs +=
        toNumber(stats.buts) * playerPointsByRound[2].but +
        toNumber(stats.passes) * playerPointsByRound[2].passe +
        toNumber(stats.plusMinus) * playerPointsByRound[2].plusMinus +
        toNumber(stats.tirs) * playerPointsByRound[2].tir;
    });

    pointsJoueurs += calculerPointsJoueursPourRonde(choixJ3[participantKey] || [], statsJ3, 3);
    pointsJoueurs += calculerPointsJoueursPourRonde(choixJ4[participantKey] || [], statsJ4, 4);

    const rawName = participantKey;

    const displayName = rawName
      .split(" ")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const trend = getManualTrend(displayName);

    return {
      key: participantKey,
      name: displayName,
      gcLogo: teamLogoMap[gcPick] || teamLogoMap["À déterminer"],
      pointsEquipe,
      pointsPartie,
      predictionsParfaites,
      pointsJoueurs,
      pointsTotaux: pointsEquipe + pointsPartie + pointsJoueurs + pointsCoupe,
      trendIcon: trend.icon,
      trendText: trend.text
    };
  });

  rows.sort((a, b) => {
    if (b.pointsTotaux !== a.pointsTotaux) return b.pointsTotaux - a.pointsTotaux;
    if (b.predictionsParfaites !== a.predictionsParfaites) return b.predictionsParfaites - a.predictionsParfaites;

    const pointsSeriesA = a.pointsEquipe + a.pointsPartie;
    const pointsSeriesB = b.pointsEquipe + b.pointsPartie;

    if (pointsSeriesB !== pointsSeriesA) return pointsSeriesB - pointsSeriesA;

    return a.name.localeCompare(b.name, "fr");
  });

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  const maxEquipe = Math.max(...rows.map(r => r.pointsEquipe));
const maxPartie = Math.max(...rows.map(r => r.pointsPartie));
const maxPerfect = Math.max(...rows.map(r => r.predictionsParfaites));
const maxJoueurs = Math.max(...rows.map(r => r.pointsJoueurs));

rows.forEach(row => {
  row.bestEquipe = row.pointsEquipe === maxEquipe && maxEquipe > 0;
  row.bestPartie = row.pointsPartie === maxPartie && maxPartie > 0;
  row.bestPerfect = row.predictionsParfaites === maxPerfect && maxPerfect > 0;
  row.bestJoueurs = row.pointsJoueurs === maxJoueurs && maxJoueurs > 0;
});

  const body = document.getElementById("classementBody");
  if (!body) return;

  body.innerHTML = rows.map(buildRowHTML).join("");
}


/* =============================================================================================================================================================
   ÉCHANGES DE JOUEURS
   =============================================================================================================================================================*/

function formatParticipantNameFromKey(participantKey, picks1 = {}, picks2 = {}, picks3 = {}, picks4 = {}) {
  const rawName =
    Object.keys(picks1).find(k => normalizeKey(k) === participantKey) ||
    Object.keys(picks2).find(k => normalizeKey(k) === participantKey) ||
    Object.keys(picks3).find(k => normalizeKey(k) === participantKey) ||
    Object.keys(picks4).find(k => normalizeKey(k) === participantKey) ||
    participantKey;

  return String(rawName || "")
    .split(" ")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCupLogoForParticipant(participantKey, picks4) {
  const pickR4 = picks4[participantKey] || {};
  const cupPick = (pickR4.cup_pick || "À déterminer").trim();

  return {
    cupPick,
    logo: teamLogoMap[cupPick] || teamLogoMap["À déterminer"]
  };
}

function calculerStatsJoueurCumule(nomJoueur, statsParRonde, rondeDebut, rondeFin) {
  let total = {
    buts: 0,
    passes: 0,
    plusMinus: 0,
    tirs: 0,
    pointsPool: 0,
    equipe: "",
    poste: "",
    numero: "",
    image: "",
    logoEquipe: ""
  };

  for (let ronde = rondeDebut; ronde <= rondeFin; ronde++) {
    const statsRonde = statsParRonde[ronde] || {};
    const stats = statsRonde[normalizeKey(nomJoueur)];

    if (!stats) continue;

    const config = playerPointsByRound[ronde];
    const buts = toNumber(stats.buts);
    const passes = toNumber(stats.passes);
    const plusMinus = toNumber(stats.plusMinus);
    const tirs = toNumber(stats.tirs);

    total.buts += buts;
    total.passes += passes;
    total.plusMinus += plusMinus;
    total.tirs += tirs;

    total.pointsPool +=
      buts * config.but +
      passes * config.passe +
      plusMinus * config.plusMinus +
      tirs * config.tir;

    total.equipe = stats.equipe || total.equipe;
    total.poste = stats.poste || total.poste;
    total.numero = stats.numero || total.numero;
    total.image = stats.image || total.image;
    total.logoEquipe = stats.logoEquipe || total.logoEquipe;
  }

  if (!total.image) {
    total.image = playerImageMap[nomJoueur] || "";
  }

  if (!total.logoEquipe) {
    total.logoEquipe = teamLogoMap[total.equipe] || teamLogoMap["À déterminer"];
  }

  return total;
}

function detecterEchangesJoueurs(ancienneListe, nouvelleListe) {
  const oldMap = new Map((ancienneListe || []).filter(Boolean).map(j => [normalizeKey(j), j]));
  const newMap = new Map((nouvelleListe || []).filter(Boolean).map(j => [normalizeKey(j), j]));

  const sortants = (ancienneListe || []).filter(j => j && !newMap.has(normalizeKey(j)));
  const entrants = (nouvelleListe || []).filter(j => j && !oldMap.has(normalizeKey(j)));

  const total = Math.max(sortants.length, entrants.length);
  const echanges = [];

  for (let i = 0; i < total; i++) {
    echanges.push({
      sortant: sortants[i] || "",
      entrant: entrants[i] || ""
    });
  }

  return echanges;
}

function buildStatsJoueurEchangeHTML(nomJoueur, statsParRonde, rondeDebut, rondeFin, type = "out") {
  if (!nomJoueur) {
    return `
      <div class="exchange-player exchange-player--${type}">
        <span class="exchange-player__tag">${type === "out" ? "Sortant" : "Entrant"}</span>
        <h4 class="exchange-player__name">Aucun joueur</h4>
        <div class="exchange-player__stats">
          <span>Points pool : 0</span>
        </div>
      </div>
    `;
  }

  const stats = calculerStatsJoueurCumule(nomJoueur, statsParRonde, rondeDebut, rondeFin);

  const equipe = stats.equipe || "Équipe inconnue";
  const poste = stats.poste || "";
  const numero = stats.numero || "";
  const imageJoueur = stats.image || "";
  const logoEquipe = stats.logoEquipe || teamLogoMap["À déterminer"];
  const theme = getSafeTeamTheme(equipe);

  return `
    <div class="exchange-player exchange-player--${type}" style="background: ${theme.bg};">
      <div class="exchange-player__head">
        <span class="exchange-player__number">${numero ? "#" + numero : ""}</span>
        <img class="exchange-player__team-logo" src="${logoEquipe}" alt="${equipe}">
      </div>

      ${
  imageJoueur
    ? `<a href="${getNhlPlayerLink(nomJoueur)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
         <div class="exchange-player__image-wrap">
           <img class="exchange-player__image" src="${imageJoueur}" alt="${nomJoueur}">
         </div>
       </a>`
    : ``
}

      <span class="exchange-player__tag">${type === "out" ? "Sortant" : "Entrant"}</span>







     <h4 class="exchange-player__name">
  <a href="${getNhlPlayerLink(nomJoueur)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
    ${nomJoueur}
  </a>
</h4>








      <p class="exchange-player__role">${poste}</p>
      <p class="exchange-player__team-name">${equipe}</p>

      <div class="exchange-player__points-box">
        <strong>Points pool : ${formatPoints(stats.pointsPool)}</strong>
      </div>

      <div class="exchange-player__stats-line">
        Buts : ${formatPoints(stats.buts)} |
        Passes : ${formatPoints(stats.passes)} |
        Tirs : ${formatPoints(stats.tirs)} |
        +/- : ${formatPoints(stats.plusMinus)}
      </div>
    </div>
  `;
}

function buildBlocEchangeHTML(echange, statsParRonde, rondeEchange) {
  const statsEntrant = calculerStatsJoueurCumule(echange.entrant, statsParRonde, rondeEchange, 4);

  return `
    <div class="exchange-list">
      <div class="exchange-row">
        ${buildStatsJoueurEchangeHTML(echange.sortant, statsParRonde, 1, rondeEchange - 1, "out")}
        <div class="exchange-arrow">→</div>
        ${buildStatsJoueurEchangeHTML(echange.entrant, statsParRonde, rondeEchange, 4, "in")}
      </div>

      <div class="exchange-meta">
        <span class="exchange-meta__round">Échange effectué avant la ronde ${rondeEchange}</span>
        <span class="exchange-meta__points">Nouveau joueur : ${formatPoints(statsEntrant.pointsPool)} pts depuis l’échange</span>
      </div>
    </div>
  `;
}

async function initialiserEchangesJoueurs() {
  const container = document.getElementById("exchangeGrid");
  if (!container) return;

  container.innerHTML = `<div class="exchange-empty">Chargement des échanges...</div>`;

  const [
    choixJ1, choixJ2, choixJ3, choixJ4,
    statsJ1, statsJ2, statsJ3, statsJ4,
    picks1, picks2, picks3, picks4
  ] = await Promise.all([
    chargerChoixJoueursRonde(1).catch(() => ({})),
    chargerChoixJoueursRonde(2).catch(() => ({})),
    chargerChoixJoueursRonde(3).catch(() => ({})),
    chargerChoixJoueursRonde(4).catch(() => ({})),
    chargerStatsJoueursRonde(1).catch(() => ({})),
    chargerStatsJoueursRonde(2).catch(() => ({})),
    chargerStatsJoueursRonde(3).catch(() => ({})),
    chargerStatsJoueursRonde(4).catch(() => ({})),
    chargerPicksRonde(1).catch(() => ({})),
    chargerPicksRonde(2).catch(() => ({})),
    chargerPicksRonde(3).catch(() => ({})),
    chargerPicksRonde(4).catch(() => ({}))
  ]);

  const statsParRonde = {
    1: statsJ1,
    2: statsJ2,
    3: statsJ3,
    4: statsJ4
  };

  const participants = mergeParticipants(
    choixJ1, choixJ2, choixJ3, choixJ4,
    picks1, picks2, picks3, picks4
  );

  const comparaisons = [
    { ronde: 2, avant: choixJ1, apres: choixJ2 },
    { ronde: 3, avant: choixJ2, apres: choixJ3 },
    { ronde: 4, avant: choixJ3, apres: choixJ4 }
  ];

  const cartesData = participants.map(participantKey => {
    let echangeTrouve = null;

    for (const comparaison of comparaisons) {
      const anciens = comparaison.avant[participantKey] || [];
      const nouveaux = comparaison.apres[participantKey] || [];
      const echanges = detecterEchangesJoueurs(anciens, nouveaux);

      if (echanges.length > 0) {
        echangeTrouve = {
          ronde: comparaison.ronde,
          echange: echanges[0]
        };
        break;
      }
    }

    const displayName = formatParticipantNameFromKey(
      participantKey,
      picks1,
      picks2,
      picks3,
      picks4
    );

    const { cupPick, logo } = getCupLogoForParticipant(participantKey, picks4);
    const nbEchanges = echangeTrouve ? 1 : 0;

    const contenu = echangeTrouve
      ? buildBlocEchangeHTML(echangeTrouve.echange, statsParRonde, echangeTrouve.ronde)
      : `
        <div class="exchange-empty">
          Aucun échange jusqu'à présent.
        </div>
      `;

    const html = `
      <article 
  class="exchange-card ${nbEchanges === 0 ? "exchange-card--empty" : "exchange-card--active"}"
  onclick="window.location.href='Prediction.html?players=1#${getParticipantTargetId(displayName)}'"
>
        <div class="exchange-card__top">
          <div class="exchange-card__identity">
            <div class="exchange-card__team">
              <img src="${logo}" alt="${cupPick}">
            </div>

            <div>
              <p class="exchange-card__label">Participant</p>
              <h3 class="exchange-card__name">${displayName}</h3>
            </div>
          </div>

          <span class="exchange-card__total">${nbEchanges}/1 échange</span>
        </div>

        ${contenu}
      </article>
    `;

    return {
      displayName,
      nbEchanges,
      html
    };
  });

  cartesData.sort((a, b) => {
    if (b.nbEchanges !== a.nbEchanges) {
      return b.nbEchanges - a.nbEchanges;
    }

    return a.displayName.localeCompare(b.displayName, "fr", {
      sensitivity: "base"
    });
  });

  container.innerHTML = cartesData.length
    ? cartesData.map(carte => carte.html).join("")
    : `<div class="exchange-empty">Aucun participant trouvé.</div>`;
}

function buildRowJoueursRondesHTML(row) {
  const targetId = getParticipantTargetId(row.name);

  return `
    <tr>
      <td class="thRang"><span>${row.rank}</span></td>
      <td class="thNom">
        <a class="joueur-cell joueur-cell--link" href="Prediction.html#${targetId}">
          <img class="IMGLOGO joueur-cell__logo" src="${row.gcLogo}" alt="Logo équipe">
          <span class="joueur-cell__name">${row.name}</span>
        </a>
      </td>
      <td>${formatPoints(row.ronde1)}</td>
      <td>${formatPoints(row.ronde2)}</td>
      <td>${formatPoints(row.ronde3)}</td>
      <td>${formatPoints(row.ronde4)}</td>
      <td class="total-joueurs-col">${formatPoints(row.totalJoueurs)}</td>
    </tr>
  `;
}

async function initialiserClassementJoueursParRonde() {
  const [
    picks1, picks2, picks3, picks4,
    statsJ1, statsJ2, statsJ3, statsJ4,
    choixJ1, choixJ2, choixJ3, choixJ4,
    echangesApresLimite
  ] = await Promise.all([
    chargerPicksRonde(1).catch(() => ({})),
    chargerPicksRonde(2).catch(() => ({})),
    chargerPicksRonde(3).catch(() => ({})),
    chargerPicksRonde(4).catch(() => ({})),
    chargerStatsJoueursRonde(1).catch(() => ({})),
    chargerStatsJoueursRonde(2).catch(() => ({})),
    chargerStatsJoueursRonde(3).catch(() => ({})),
    chargerStatsJoueursRonde(4).catch(() => ({})),
    chargerChoixJoueursRonde(1).catch(() => ({})),
    chargerChoixJoueursRonde(2).catch(() => ({})),
    chargerChoixJoueursRonde(3).catch(() => ({})),
    chargerChoixJoueursRonde(4).catch(() => ({})),
    chargerEchangesApresLimite().catch(() => ({}))
  ]);

  const participants = mergeParticipants(
    picks1, picks2, picks3, picks4,
    choixJ1, choixJ2, choixJ3, choixJ4
  );

  const rows = participants.map(participantKey => {
    const ronde1 = calculerPointsJoueursPourRonde(
      choixJ1[participantKey] || [],
      statsJ1,
      1,
      participantKey,
      echangesApresLimite
    );

    let ronde2 = 0;

const choixR2 = choixJ2[participantKey] || [];
const echangeKey = Object.keys(echangesApresLimite).find(key =>
  normalizeKey(key).replace(/[^a-z0-9]/g, "") === normalizeKey(participantKey).replace(/[^a-z0-9]/g, "")
);

const echange = echangeKey ? echangesApresLimite[echangeKey] : null;

choixR2.forEach(nomJoueur => {
  const joueurKey = normalizeKey(nomJoueur);
  let stats = statsJ2[joueurKey];

  if (
    echange &&
    normalizeKey(echange.nouveauJoueur) === joueurKey &&
    statsJ2.__apresLimite?.[joueurKey]
  ) {
    stats = statsJ2.__apresLimite[joueurKey];
  }

  if (!stats) return;

  ronde2 +=
    toNumber(stats.buts) * playerPointsByRound[2].but +
    toNumber(stats.passes) * playerPointsByRound[2].passe +
    toNumber(stats.plusMinus) * playerPointsByRound[2].plusMinus +
    toNumber(stats.tirs) * playerPointsByRound[2].tir;
});

    const ronde3 = calculerPointsJoueursPourRonde(
      choixJ3[participantKey] || [],
      statsJ3,
      3,
      participantKey,
      echangesApresLimite
    );

    const ronde4 = calculerPointsJoueursPourRonde(
      choixJ4[participantKey] || [],
      statsJ4,
      4,
      participantKey,
      echangesApresLimite
    );

    const rawName =
      Object.keys(picks1).find(k => normalizeKey(k) === participantKey) ||
      Object.keys(picks2).find(k => normalizeKey(k) === participantKey) ||
      Object.keys(picks3).find(k => normalizeKey(k) === participantKey) ||
      Object.keys(picks4).find(k => normalizeKey(k) === participantKey) ||
      Object.keys(choixJ1).find(k => k === participantKey) ||
      participantKey;

    const displayName = String(rawName || "")
      .split(" ")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const round4 = picks4[participantKey] || {};
    const gcPick = round4.cup_pick || "À déterminer";

    return {
      key: participantKey,
      name: displayName,
      gcLogo: teamLogoMap[gcPick] || teamLogoMap["À déterminer"],
      ronde1,
      ronde2,
      ronde3,
      ronde4,
      totalJoueurs: ronde1 + ronde2 + ronde3 + ronde4
    };
  });

  rows.sort((a, b) => {
    if (b.totalJoueurs !== a.totalJoueurs) return b.totalJoueurs - a.totalJoueurs;
    if (b.ronde4 !== a.ronde4) return b.ronde4 - a.ronde4;
    if (b.ronde3 !== a.ronde3) return b.ronde3 - a.ronde3;
    if (b.ronde2 !== a.ronde2) return b.ronde2 - a.ronde2;
    return b.ronde1 - a.ronde1;
  });

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  const body = document.getElementById("classementJoueursRondesBody");
  if (!body) return;

  body.innerHTML = rows.map(buildRowJoueursRondesHTML).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initialiserClassement().catch(error => {
    console.error("Erreur classement :", error);
  });

  initialiserClassementJoueursParRonde().catch(error => {
    console.error("Erreur classement joueurs par ronde :", error);
  });

  initialiserEchangesJoueurs().catch(error => {
    console.error("Erreur échanges :", error);
  });
});