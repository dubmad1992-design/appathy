import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env
    }
  });

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function main() {
  const e2eDbPath = path.join(process.cwd(), "prisma", "e2e.db");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: `file:${e2eDbPath}`
  };

  await rm(e2eDbPath, { force: true });
  await run("npx", ["prisma", "db", "push", "--skip-generate"], env);
  await run("node", ["--import", "tsx", "prisma/seed.ts"], env);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
