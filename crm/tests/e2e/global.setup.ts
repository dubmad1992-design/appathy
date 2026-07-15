import { cleanupOutgoingsQaArtifacts, disconnectOutgoingsE2EPrisma, ensureE2EAdmin } from "./support/outgoings-e2e";

async function globalSetup() {
  await ensureE2EAdmin();
  await cleanupOutgoingsQaArtifacts();
  await disconnectOutgoingsE2EPrisma();
}

export default globalSetup;
