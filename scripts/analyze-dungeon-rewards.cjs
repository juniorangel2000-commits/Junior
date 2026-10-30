const { buildSync } = require("esbuild"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "after-rain-rewards-"));
try {
  const file = path.join(folder, "rewards.cjs");
  buildSync({
    stdin: {
      contents:
        'export {applyDungeonResult,createDungeonProgress} from "./src/dungeons/progression"; export {createNewSave} from "./src/systems/save";',
      resolveDir: path.resolve(__dirname, ".."),
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: file,
  });
  const { applyDungeonResult, createDungeonProgress, createNewSave } = require(
    file,
  );
  const paths = process.argv.slice(2);
  if (!paths.length)
    throw Error("Informe arquivos summary.json produzidos pelo simulador.");
  const results = [];
  for (const input of paths)
    for (const row of JSON.parse(fs.readFileSync(input, "utf8")).results) {
      if (!["victory", "defeat", "abandoned"].includes(row.status)) continue;
      const save = createNewSave({
        name: "Análise",
        skin: "#d9a276",
        hairStyle: "curto",
        hairColor: "#754323",
        outfit: "#638a9d",
      });
      save.dungeons = createDungeonProgress();
      save.dungeons.xp = 1000;
      const result = {
        id: "analysis-" + results.length,
        dungeon: row.dungeon,
        outcome: row.status,
        kills: row.kills,
        elapsed: row.elapsed,
        level: row.level,
        round: row.round,
        completedRounds:
          row.dungeon === "mall-parking"
            ? row.status === "victory"
              ? 50
              : Math.max(0, row.round - 1)
            : 0,
      };
      const reward = applyDungeonResult(save, result);
      if (!reward.applied) throw Error("Resultado de análise inválido");
      results.push({
        source: input,
        build: row.build,
        pet: row.pet,
        rare: row.rare,
        permanentRank: row.permanentRank,
        result,
        reward,
      });
    }
  const output =
    process.env.REWARD_ANALYSIS_OUTPUT ||
    "/workspace/mode-rewards/analysis.json";
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(
    output,
    JSON.stringify(
      {
        method:
          "Recompensas recalculadas a partir de partidas simuladas; conta além da janela de apoio inicial. Não altera os combates nem representa uma taxa de vitória humana.",
        results,
      },
      null,
      2,
    ),
  );
  for (const dungeon of ["abandoned-central-square", "mall-parking"]) {
    const rows = results.filter(
      (r) => r.result.dungeon === dungeon && r.result.outcome === "victory",
    );
    console.log(
      JSON.stringify({
        dungeon,
        victories: rows.length,
        minXP: Math.min(...rows.map((r) => r.reward.xp)),
        maxXP: Math.max(...rows.map((r) => r.reward.xp)),
        minCoins: Math.min(...rows.map((r) => r.reward.coins)),
        maxCoins: Math.max(...rows.map((r) => r.reward.coins)),
      }),
    );
  }
} finally {
  fs.rmSync(folder, { recursive: true, force: true });
}
