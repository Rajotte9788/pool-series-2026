const fs = require("fs");
const path = require("path");

const SEASON = "20252026";
const GAME_TYPE = 3;

const OUTPUT = path.join(__dirname, "../data/stats-joueurs-auto.csv");

const url =
  `https://api-web.nhle.com/v1/skater-stats-leaders/${SEASON}/${GAME_TYPE}?categories=points&limit=-1`;

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function main() {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Erreur NHL API : ${res.status}`);
  }

  const data = await res.json();

  const joueurs = data.data || [];

  const lignes = [];

  lignes.push(
    "Nom,Equipe,Position,Matchs,Buts,Passes,Points,Tirs"
  );

  for (const j of joueurs) {
    const nom =
      `${j.firstName?.default || ""} ${j.lastName?.default || ""}`.trim();

    lignes.push([
      csvEscape(nom),
      csvEscape(j.teamAbbrev),
      csvEscape(j.position),
      j.gamesPlayed || 0,
      j.goals || 0,
      j.assists || 0,
      j.points || 0,
      j.shots || 0
    ].join(","));
  }

  fs.writeFileSync(OUTPUT, lignes.join("\n"), "utf8");

  console.log("CSV généré !");
  console.log(`${joueurs.length} joueurs exportés`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});