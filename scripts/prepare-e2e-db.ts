import { execFile } from "node:child_process";
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
  const e2eDbUrl = `file:${path.join(process.cwd(), "prisma", "e2e.db")}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: e2eDbUrl
  };

  await run("node", ["--import", "tsx", "scripts/init-db.ts"], env);
  await run("node", ["--import", "tsx", "prisma/seed.ts"], env);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
