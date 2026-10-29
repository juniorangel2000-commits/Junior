// Bundle the real TypeScript simulation without adding runtime dependencies.
const { buildSync } = require("esbuild");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const dir = mkdtempSync(join(tmpdir(), "after-rain-sim-"));
try {
  const outfile = join(dir, "simulate.cjs");
  buildSync({
    entryPoints: [join(__dirname, "dungeon-playthrough.ts")],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  const result = spawnSync(
    process.execPath,
    [outfile, ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
