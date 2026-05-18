const fs = require("fs");

const SEASON = "20252026";
const GAME_TYPE = 3;

const url = `https://api-web.nhle.com/v1/skater-stats-leaders/${SEASON}/${GAME_TYPE}?categories=points&limit=100`;

async function main() {
  console.log("URL TESTÉE:");
  console.log(url);

  const res = await fetch(url);
  console.log("STATUS:", res.status);

  const text = await res.text();
  console.log("RÉPONSE NHL:");
  console.log(text.slice(0, 2000));

  fs.writeFileSync("data/debug-nhl.json", text, "utf8");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});