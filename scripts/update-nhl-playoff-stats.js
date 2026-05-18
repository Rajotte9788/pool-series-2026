const fs = require("fs");
const path = require("path");

const OUTPUT = path.join(__dirname, "../data/stats-joueurs-auto.csv");

const url =
  "https://site.web.api.espn.com/apis/common/v3/sports/hockey/nhl/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=500&sort=points%3Adesc&seasontype=3&season=2026";

function clean(v) {
  if (v === null || v === undefined) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

async function main() {
  const res = await fetch(url);
  const data = await res.json();

  const athletes = data.athletes || [];

  const lignes = [
    "Nom,Equipe,Position,Matchs,Buts,Passes,Points,Tirs"
  ];

  for (const item of athletes) {
    const a = item.athlete || {};
    const stats = item.categories?.[0]?.statistics || [];

    const get = (name) => {
      const s = stats.find(x => x.name === name || x.abbreviation === name);
      return s?.value ?? s?.displayValue ?? 0;
    };

    lignes.push([
      clean(a.displayName),
      clean(a.teamShortName || a.teamName || ""),
      clean(a.position?.abbreviation || ""),
      get("gamesPlayed"),
      get("goals"),
      get("assists"),
      get("points"),
      get("shotsTotal")
    ].join(","));
  }

  fs.writeFileSync(OUTPUT, lignes.join("\n"), "utf8");
  console.log(`${athletes.length} joueurs exportés`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});