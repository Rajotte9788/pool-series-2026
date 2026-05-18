function ptsJoueur(stats, ronde) {
  const cfg = playerPointsByRound[ronde];
  if (!stats || !cfg) return 0;

  return (
    toNumber(stats.buts) * cfg.but +
    toNumber(stats.passes) * cfg.passe +
    toNumber(stats.plusMinus) * cfg.plusMinus +
    toNumber(stats.tirs) * cfg.tir
  );
}

function cleanValue(v) {
  return String(v ?? "").replace(/^\uFEFF/, "").trim();
}

function parseCsvAuto(text) {
  const lignes = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lignes.length < 2) return [];

  const sep = lignes[0].includes(";") ? ";" : ",";
  const headers = lignes[0].split(sep).map(cleanValue);

  return lignes.slice(1).map(ligne => {
    const cols = ligne.split(sep).map(cleanValue);
    const row = {};
    headers.forEach((h, i) => row[h] = cols[i] || "");
    return row;
  });
}

async function chargerResultatsRonde(ronde) {
  try {
    const response = await fetch(`data/resultats_ronde${ronde}.csv?cache=${Date.now()}`);
    const text = await response.text();
    const rows = parseCsvAuto(text);
    const resultats = {};

    rows.forEach(row => {
      const seriesId = cleanValue(row.seriesId || row.serie || row.series || row.id);
      const winner = cleanValue(row.winner || row.gagnant || row.vainqueur);
      const games = toNumber(row.games || row.matchs || row.parties);

      if (!seriesId || !winner || !games) return;

      resultats[seriesId] = { winner, games };
    });

    return resultats;
  } catch (error) {
    console.warn(`Impossible de charger resultats_ronde${ronde}.csv`, error);
    return {};
  }
}

function getTeamLogo(teamName) {
  return teamLogoMap[teamName] || teamLogoMap["À déterminer"] || "";
}

function getPlayerImage(playerName) {
  return playerImageMap[playerName] || "";
}

function formatNomParticipant(value) {
  return String(value || "")
    .split(" ")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function getParticipantCupPick(participantName) {
  const key = normalizeKey(participantName);
  return window.poolPicks4?.[key]?.cup_pick || "À déterminer";
}

function renderPeopleBadges(people = []) {
  return people.map(name => {
    const clean = name.replace(/\s\(R\d+(,\sR\d+)*\)$/g, "");
    const team = getParticipantCupPick(clean);
    const logo = getTeamLogo(team);

    return `
      <span class="person-chip">
        ${logo ? `<img src="${logo}" alt="${team}">` : ""}
        ${name}
      </span>
    `;
  }).join("");
}

function createCard(title, content, cls = "card") {
  return `
    <article class="${cls}">
      <h3>${title}</h3>
      ${content}
    </article>
  `;
}

function renderDetailedRows(rows, suffix = "") {
  if (!rows.length) return `<p class="empty-stat">Aucune donnée disponible.</p>`;

  return `
    <div class="detail-stat-list">
      ${rows.map(row => `
        <div class="detail-stat">
          <div class="detail-stat__top">
            <div class="stat-media">
              ${row.image ? `<img src="${row.image}" alt="${row.name}">` : ""}
              <span>${row.name}</span>
            </div>
            <strong>${formatPoints(row.value)}${suffix}</strong>
          </div>

          <div class="detail-stat__people">
            ${renderPeopleBadges(row.people || [])}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSimpleRows(rows, suffix = "") {
  if (!rows.length) return `<p class="empty-stat">Aucune donnée disponible.</p>`;

  return `
    <div class="simple-stat-list">
      ${rows.map(row => `
        <div class="stat-line stat-line--media">
          <div class="stat-media">
            ${row.image ? `<img src="${row.image}" alt="${row.name}">` : ""}
            <span>${row.name}</span>
          </div>
          <strong>${formatPoints(row.value)}${suffix}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function addPerson(obj, key, name) {
  if (!obj[key]) obj[key] = [];
  if (!obj[key].includes(name)) obj[key].push(name);
}

function fusionnerChoixJoueurs(...choixRounds) {
  const fusion = {};

  choixRounds.forEach(choixRonde => {
    Object.entries(choixRonde || {}).forEach(([participantKey, joueurs]) => {
      if (!fusion[participantKey]) fusion[participantKey] = [];

      (joueurs || []).forEach(joueur => {
        if (!joueur) return;

        const existe = fusion[participantKey].some(
          j => normalizeKey(j) === normalizeKey(joueur)
        );

        if (!existe) fusion[participantKey].push(joueur);
      });
    });
  });

  return fusion;
}

/* =========================
   IQ DU POOL
========================= */

function calculerIQPool(picksRounds, resultatsRounds, rondeCible = null) {
  let totalSeries = 0;
  let bonnesEquipes = 0;
  let totalMatchs = 0;
  let scoreMatchs = 0;

  const rondes = rondeCible ? [rondeCible] : [1, 2, 3, 4];

  rondes.forEach(ronde => {
    const picks = picksRounds[ronde] || {};
    const resultats = resultatsRounds[ronde] || {};

    Object.values(picks).forEach(participant => {
      Object.entries(participant || {}).forEach(([serieId, pick]) => {
        if (!serieId.startsWith("r")) return;

        const resultat = resultats[serieId];
        if (!resultat) return;

        const equipePredite = cleanValue(pick?.pick);
        const equipeReelle = cleanValue(resultat.winner);
        const matchsPredits = toNumber(pick?.games);
        const matchsReels = toNumber(resultat.games);

        if (!equipePredite || !equipeReelle) return;

        totalSeries++;

        if (normalizeKey(equipePredite) === normalizeKey(equipeReelle)) {
          bonnesEquipes++;
        }

        if (matchsPredits && matchsReels) {
          const diff = Math.abs(matchsPredits - matchsReels);
          scoreMatchs += Math.max(0, 1 - diff / 3);
          totalMatchs++;
        }
      });
    });
  });

  const precisionEquipes = totalSeries ? (bonnesEquipes / totalSeries) * 100 : 0;
  const precisionMatchs = totalMatchs ? (scoreMatchs / totalMatchs) * 100 : 0;
  const iq = totalSeries ? precisionEquipes * 0.6 + precisionMatchs * 0.4 : 0;

  return {
    hasData: totalSeries > 0,
    precisionEquipes,
    precisionMatchs,
    iq
  };
}

function renderIQPool(iqData) {
  if (!iqData.hasData) {
    return `<p class="empty-stat">Aucun résultat disponible pour calculer l’IQ.</p>`;
  }

  return `
    <div class="iq-grid">
      <div class="iq-box">
        <span>Précision équipes</span>
        <strong>${iqData.precisionEquipes.toFixed(1)}%</strong>
      </div>

      <div class="iq-box">
        <span>Précision matchs</span>
        <strong>${iqData.precisionMatchs.toFixed(1)}%</strong>
      </div>

      <div class="iq-box iq-box--main">
        <span>IQ du Pool</span>
        <strong>${iqData.iq.toFixed(1)}%</strong>
      </div>
    </div>
  `;
}

/* =========================
   ÉQUIPES / MATCHS
========================= */

function buildTeamStatsForRound(picks, participants, rondeLabel = "") {
  const teamCount = {};
  const teamPeople = {};

  participants.forEach(participantKey => {
    const name = formatNomParticipant(participantKey);
    const data = picks[participantKey] || {};

    Object.keys(data).forEach(seriesId => {
      if (!seriesId.startsWith("r")) return;

      const team = data[seriesId]?.pick;
      if (!team) return;

      teamCount[team] = (teamCount[team] || 0) + 1;
      addPerson(teamPeople, team, rondeLabel ? `${name} (${rondeLabel})` : name);
    });
  });

  return { teamCount, teamPeople };
}

function buildTeamGamesStatsForRound(picks, participants) {
  const teamGames = {};

  participants.forEach(participantKey => {
    const name = formatNomParticipant(participantKey);
    const data = picks[participantKey] || {};

    Object.keys(data).forEach(seriesId => {
      if (!seriesId.startsWith("r")) return;

      const pick = data[seriesId];
      const team = pick?.pick;
      const games = String(pick?.games || "").trim();

      if (!team || !games) return;

      if (!teamGames[team]) {
        teamGames[team] = {
          total: 0,
          games: {}
        };
      }

      if (!teamGames[team].games[games]) {
        teamGames[team].games[games] = [];
      }

      teamGames[team].total += 1;
      addPerson(teamGames[team].games, games, name);
    });
  });

  return teamGames;
}

function renderTeamGamesRows(teamGames) {
  const rows = Object.entries(teamGames)
    .map(([team, data]) => ({
      team,
      total: data.total,
      image: getTeamLogo(team),
      games: data.games
    }))
    .sort((a, b) => b.total - a.total);

  if (!rows.length) return `<p class="empty-stat">Aucune donnée disponible.</p>`;

  return `
    <div class="team-games-list">
      ${rows.map(row => {
        const gamesBlocks = Object.entries(row.games)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([games, people]) => `
            <div class="games-choice-block">
              <div class="games-choice-block__title">
                <strong>${games} matchs</strong>
                <span>${people.length} choix</span>
              </div>

              <div class="detail-stat__people games-choice-block__people">
                ${renderPeopleBadges(people)}
              </div>
            </div>
          `).join("");

        return `
          <div class="team-games-stat">
            <div class="detail-stat__top">
              <div class="stat-media">
                ${row.image ? `<img src="${row.image}" alt="${row.team}">` : ""}
                <span>${row.team}</span>
              </div>
              <strong>${row.total} choix</strong>
            </div>

            <div class="team-games-stat__grid">
              ${gamesBlocks}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* =========================
   FACE-À-FACE
========================= */

function renderFaceAFaceSelector(participants) {
  const options = participants
    .map(p => `<option value="${p}">${formatNomParticipant(p)}</option>`)
    .join("");

  return `
    <div class="faceoff-box">
      <div class="faceoff-selects">
        <select id="faceoffA">${options}</select>
        <select id="faceoffB">${options}</select>
      </div>

      <div id="faceoffResult" class="faceoff-result"></div>
    </div>
  `;
}

function setupFaceAFace(participants, picksRounds, choixJoueurs, playerPoints) {
  const selectA = document.getElementById("faceoffA");
  const selectB = document.getElementById("faceoffB");
  const result = document.getElementById("faceoffResult");

  if (!selectA || !selectB || !result) return;

  if (participants.length > 1) {
    selectA.value = participants[0];
    selectB.value = participants[1];
  }

  function update() {
    const a = selectA.value;
    const b = selectB.value;

    if (!a || !b || a === b) {
      result.innerHTML = `<p class="empty-stat">Choisis deux participants différents.</p>`;
      return;
    }

    result.innerHTML = renderFaceAFaceResult(a, b, picksRounds, choixJoueurs, playerPoints);
  }

  selectA.addEventListener("change", update);
  selectB.addEventListener("change", update);

  update();
}

function getPlayerTotalPoints(playerName, playerPoints) {
  const key = normalizeKey(playerName);
  return playerPoints[key] || 0;
}

function renderFaceAFaceResult(a, b, picksRounds, choixJoueurs, playerPoints) {
  const nomA = formatNomParticipant(a);
  const nomB = formatNomParticipant(b);

  const joueursA = choixJoueurs[a] || [];
  const joueursB = choixJoueurs[b] || [];

  const pointsA = joueursA.reduce((total, j) => total + getPlayerTotalPoints(j, playerPoints), 0);
  const pointsB = joueursB.reduce((total, j) => total + getPlayerTotalPoints(j, playerPoints), 0);

  const cupA = picksRounds[4]?.[a]?.cup_pick || "À déterminer";
  const cupB = picksRounds[4]?.[b]?.cup_pick || "À déterminer";

  const differences = [];

  [1, 2, 3, 4].forEach(ronde => {
    const picksA = picksRounds[ronde]?.[a] || {};
    const picksB = picksRounds[ronde]?.[b] || {};

    Object.keys(picksA).forEach(seriesId => {
      if (!seriesId.startsWith("r")) return;
      if (!picksB[seriesId]) return;

      const pickA = picksA[seriesId];
      const pickB = picksB[seriesId];

      if (pickA.pick !== pickB.pick || String(pickA.games) !== String(pickB.games)) {
        differences.push({
          ronde,
          seriesId,
          aTeam: pickA.pick,
          aGames: pickA.games,
          bTeam: pickB.pick,
          bGames: pickB.games
        });
      }
    });
  });

  const avantage =
    pointsA > pointsB
      ? `${nomA} +${formatPoints(pointsA - pointsB)} pts joueurs`
      : pointsB > pointsA
        ? `${nomB} +${formatPoints(pointsB - pointsA)} pts joueurs`
        : "Égalité parfaite côté joueurs";

  return `
    <div class="faceoff-head">
      <div>
        <strong>${nomA}</strong>
        <span>${formatPoints(pointsA)} pts joueurs</span>
      </div>

      <div class="faceoff-vs">VS</div>

      <div>
        <strong>${nomB}</strong>
        <span>${formatPoints(pointsB)} pts joueurs</span>
      </div>
    </div>

    <div class="faceoff-advantage">
      Avantage actuel : <strong>${avantage}</strong>
    </div>

    <div class="faceoff-cup">
      <div>
        ${getTeamLogo(cupA) ? `<img src="${getTeamLogo(cupA)}" alt="${cupA}">` : ""}
        <span>${nomA} : ${cupA}</span>
      </div>

      <div>
        ${getTeamLogo(cupB) ? `<img src="${getTeamLogo(cupB)}" alt="${cupB}">` : ""}
        <span>${nomB} : ${cupB}</span>
      </div>
    </div>

    <h4 class="faceoff-subtitle">Choix différents</h4>

    ${
      differences.length
        ? differences.map(diff => `
          <div class="faceoff-diff">
            <span>R${diff.ronde} — ${diff.seriesId}</span>

            <div>
              <strong>${nomA}</strong>
              ${getTeamLogo(diff.aTeam) ? `<img src="${getTeamLogo(diff.aTeam)}" alt="${diff.aTeam}">` : ""}
              ${diff.aTeam} en ${diff.aGames}
            </div>

            <div>
              <strong>${nomB}</strong>
              ${getTeamLogo(diff.bTeam) ? `<img src="${getTeamLogo(diff.bTeam)}" alt="${diff.bTeam}">` : ""}
              ${diff.bTeam} en ${diff.bGames}
            </div>
          </div>
        `).join("")
        : `<p class="empty-stat">Aucune différence dans les choix d’équipes.</p>`
    }
  `;
}

/* =========================
   MENU RONDES
========================= */

function setupRoundMenu() {
  const buttons = document.querySelectorAll(".round-tab");
  const viewGlobal = document.getElementById("viewGlobal");
  const viewRounds = document.getElementById("viewRounds");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;

      buttons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      if (view === "global") {
        viewGlobal.classList.add("active");
        viewRounds.classList.remove("active");

        document.querySelectorAll(".round-section").forEach(section => {
          section.classList.remove("active");
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      viewGlobal.classList.remove("active");
      viewRounds.classList.add("active");

      document.querySelectorAll(".round-section").forEach(section => {
        section.classList.toggle("active", section.dataset.round === view);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* =========================
   INIT
========================= */

async function initialiserStats() {
  const [
    picks1, picks2, picks3, picks4,
    choixJ1, choixJ2, choixJ3, choixJ4,
    stats1, stats2, stats3, stats4,
    resultats1, resultats2, resultats3, resultats4
  ] = await Promise.all([
    chargerPicksRonde(1).catch(() => ({})),
    chargerPicksRonde(2).catch(() => ({})),
    chargerPicksRonde(3).catch(() => ({})),
    chargerPicksRonde(4).catch(() => ({})),

    chargerChoixJoueursRonde(1).catch(() => ({})),
    chargerChoixJoueursRonde(2).catch(() => ({})),
    chargerChoixJoueursRonde(3).catch(() => ({})),
    chargerChoixJoueursRonde(4).catch(() => ({})),

    chargerStatsJoueursRonde(1).catch(() => ({})),
    chargerStatsJoueursRonde(2).catch(() => ({})),
    chargerStatsJoueursRonde(3).catch(() => ({})),
    chargerStatsJoueursRonde(4).catch(() => ({})),

    chargerResultatsRonde(1).catch(() => ({})),
    chargerResultatsRonde(2).catch(() => ({})),
    chargerResultatsRonde(3).catch(() => ({})),
    chargerResultatsRonde(4).catch(() => ({}))
  ]);

  window.poolPicks4 = picks4;

  const picksRounds = { 1: picks1, 2: picks2, 3: picks3, 4: picks4 };
  const statsRounds = { 1: stats1, 2: stats2, 3: stats3, 4: stats4 };
  const resultatsRounds = { 1: resultats1, 2: resultats2, 3: resultats3, 4: resultats4 };

  const tousLesChoixJoueurs = fusionnerChoixJoueurs(choixJ1, choixJ2, choixJ3, choixJ4);

  const participants = mergeParticipants(
    picks1, picks2, picks3, picks4,
    choixJ1, choixJ2, choixJ3, choixJ4
  );

  const nbParticipants = participants.length;

  const cupCount = {};
  const cupPeople = {};
  const playerPickCount = {};
  const playerPeople = {};
  const playerNames = {};
  const playerPoints = {};
  const globalTeamCount = {};
  const globalTeamPeople = {};

  participants.forEach(participantKey => {
    const name = formatNomParticipant(participantKey);

    const cup = picks4[participantKey]?.cup_pick || "À déterminer";
    cupCount[cup] = (cupCount[cup] || 0) + 1;
    addPerson(cupPeople, cup, name);

    (tousLesChoixJoueurs[participantKey] || []).forEach(joueur => {
      if (!joueur) return;

      const key = normalizeKey(joueur);

      playerPickCount[key] = (playerPickCount[key] || 0) + 1;
      playerNames[key] = joueur;
      addPerson(playerPeople, key, name);
    });
  });

  [1, 2, 3, 4].forEach(ronde => {
    Object.values(statsRounds[ronde]).forEach(stats => {
      if (!stats?.joueur) return;

      const key = normalizeKey(stats.joueur);

      playerNames[key] = stats.joueur;
      playerPoints[key] = (playerPoints[key] || 0) + ptsJoueur(stats, ronde);
    });

    const roundTeamStats = buildTeamStatsForRound(
      picksRounds[ronde],
      participants,
      `R${ronde}`
    );

    Object.entries(roundTeamStats.teamCount).forEach(([team, count]) => {
      globalTeamCount[team] = (globalTeamCount[team] || 0) + count;

      (roundTeamStats.teamPeople[team] || []).forEach(person => {
        addPerson(globalTeamPeople, team, person);
      });
    });
  });

  const topCup = Object.entries(cupCount).sort((a, b) => b[1] - a[1])[0];
  const topPlayer = Object.entries(playerPickCount).sort((a, b) => b[1] - a[1])[0];
  const topPayant = Object.entries(playerPoints)
    .filter(([key]) => playerPickCount[key] > 0)
    .sort((a, b) => b[1] - a[1])[0];

  const globalStats = document.getElementById("globalStats");

  if (globalStats) {
    globalStats.innerHTML = `
      ${createCard("Résumé du pool", `
        <div id="resumeStats">
          <div class="stat-line"><span>Participants</span><strong>${nbParticipants}</strong></div>
          <div class="stat-line"><span>Équipe Coupe populaire</span><strong>${topCup ? topCup[0] : "Aucune"}</strong></div>
          <div class="stat-line"><span>Joueur le plus choisi</span><strong>${topPlayer ? playerNames[topPlayer[0]] : "Aucun"}</strong></div>
          <div class="stat-line"><span>Joueur le plus payant</span><strong>${topPayant ? playerNames[topPayant[0]] : "Aucun"}</strong></div>
        </div>
      `, "card card-summary")}

      ${createCard(
        "IQ du Pool — Global",
        renderIQPool(calculerIQPool(picksRounds, resultatsRounds)),
        "card card-summary"
      )}

      ${createCard(
        "Face-à-face participants",
        renderFaceAFaceSelector(participants),
        "card card-summary"
      )}

      ${createCard("Choix de la Coupe", renderDetailedRows(
        Object.entries(cupCount)
          .map(([name, value]) => ({
            name,
            value,
            image: getTeamLogo(name),
            people: cupPeople[name] || []
          }))
          .sort((a, b) => b.value - a.value),
        " choix"
      ), "card card-wide")}

      ${createCard("Joueurs les plus payants — global", renderSimpleRows(
        Object.entries(playerPoints)
          .filter(([key]) => playerPickCount[key] > 0)
          .map(([key, value]) => ({
            name: `${playerNames[key]} (${playerPickCount[key]} choix)`,
            value,
            image: getPlayerImage(playerNames[key])
          }))
          .sort((a, b) => b.value - a.value),
        " pts"
      ), "card card-wide")}

      ${createCard("Équipes les plus choisies — global", renderDetailedRows(
        Object.entries(globalTeamCount)
          .map(([name, value]) => ({
            name,
            value,
            image: getTeamLogo(name),
            people: globalTeamPeople[name] || []
          }))
          .sort((a, b) => b.value - a.value),
        " choix"
      ), "card card-full")}

      ${createCard("Tous les joueurs sélectionnés", renderDetailedRows(
        Object.entries(playerPickCount)
          .map(([key, value]) => ({
            name: playerNames[key],
            value,
            image: getPlayerImage(playerNames[key]),
            people: playerPeople[key] || []
          }))
          .sort((a, b) => b.value - a.value),
        " choix"
      ), "card card-full")}
    `;
  }

  const roundStats = document.getElementById("roundStats");

  if (roundStats) {
    roundStats.innerHTML = [1, 2, 3, 4].map(ronde => {
      const roundTeamGamesStats = buildTeamGamesStatsForRound(picksRounds[ronde], participants);

      const roundPlayerPoints = Object.values(statsRounds[ronde])
        .filter(stats => stats?.joueur)
        .map(stats => ({
          name: stats.joueur,
          value: ptsJoueur(stats, ronde),
          image: getPlayerImage(stats.joueur)
        }))
        .filter(row => row.value > 0)
        .sort((a, b) => b.value - a.value);

      return `
        <section class="round-section" data-round="${ronde}">
          <h2 class="round-title">Ronde ${ronde}</h2>

          <div class="stats-masonry">
            ${createCard(
              `IQ du Pool — Ronde ${ronde}`,
              renderIQPool(calculerIQPool(picksRounds, resultatsRounds, ronde)),
              "card card-summary"
            )}

            ${createCard(
              `Joueurs les plus payants — Ronde ${ronde}`,
              renderSimpleRows(roundPlayerPoints, " pts"),
              "card card-full"
            )}

            ${createCard(
              `Choix des matchs par équipe — Ronde ${ronde}`,
              renderTeamGamesRows(roundTeamGamesStats),
              "card card-full"
            )}
          </div>
        </section>
      `;
    }).join("");
  }

  setupFaceAFace(participants, picksRounds, tousLesChoixJoueurs, playerPoints);
  setupRoundMenu();
}

document.addEventListener("DOMContentLoaded", () => {
  initialiserStats().catch(error => {
    console.error("Erreur stats :", error);
  });
});