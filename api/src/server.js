import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

const db = new PrismaClient();
const app = await buildApp({ db, logger: true });
async function stop() { await app.close(); await db.$disconnect(); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
try {
  await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT || 3000) });
} catch (error) {
  app.log.error({ code: error.code }, 'Não foi possível iniciar a API');
  await stop();
  process.exitCode = 1;
}
