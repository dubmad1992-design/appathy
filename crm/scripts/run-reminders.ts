import { loadEnvConfig } from "@next/env";
import { runReminderSweep } from "@/server/services/reminders";

loadEnvConfig(process.cwd());

runReminderSweep()
  .then((count) => {
    console.log(`Processed reminder sweep with ${count} due jobs.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
