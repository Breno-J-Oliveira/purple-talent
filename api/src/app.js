import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { digest, token, verifyPassword, publicUser, candidateView, hashPassword } from './security.js';

const candidateInclude = { user: true, submissions: { include: { challenge: true } } };
const challengeSelect = { id: true, title: true, description: true, track: true, points: true, difficulty: true, active: true };
const dummyHash = hashPassword(token());

export async function buildApp({ db, origin = process.env.APP_ORIGIN || 'http://localhost:8088', logger = false, secureCookies = process.env.COOKIE_SECURE === 'true' } = {}) {
  if (!db) throw new Error('Database client required');
  const app = Fastify({ logger, bodyLimit: 65536, trustProxy: false });
  await app.register(cookie);
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Cache-Control', 'no-store');
  });
  app.addHook('preHandler', async (request, reply) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== origin) {
      return reply.code(403).send({ message: 'Origem da requisição não autorizada.' });
    }
  });
  app.setErrorHandler((error, request, reply) => {
    if (error.validation) return reply.code(400).send({ message: 'Confira os campos enviados.' });
    if (error.statusCode && error.statusCode < 500) return reply.code(error.statusCode).send({ message: error.message });
    request.log.error({ code: error.code, requestId: request.id }, 'Falha no processamento');
    return reply.code(503).send({ message: 'Serviço indisponível. Tente novamente em instantes.' });
  });
  async function authenticated(request, reply) {
    const raw = request.cookies.pt_session;
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return reply.code(401).send({ message: 'Entre na sua conta para continuar.' });
    const session = await db.session.findUnique({ where: { tokenHash: digest(raw) }, include: { user: { include: { candidate: true } } } });
    if (!session || session.expiresAt <= new Date()) return reply.code(401).send({ message: 'Sessão expirada. Entre novamente.' });
    request.user = session.user;
  }
  async function recruiter(request, reply) {
    await authenticated(request, reply);
    if (reply.sent) return;
    if (!['RECRUITER', 'ADMIN'].includes(request.user.role)) return reply.code(403).send({ message: 'Acesso exclusivo à equipe de recrutamento.' });
  }
  app.get('/api/health', async () => {
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'purple-talent-api' };
  });
  app.post('/api/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } }, schema: { body: {
    type: 'object', additionalProperties: false, required: ['email', 'password'], properties: {
      email: { type: 'string', minLength: 3, maxLength: 254 }, password: { type: 'string', minLength: 1, maxLength: 256 }
    }
  } } }, async (request, reply) => {
    const user = await db.user.findUnique({ where: { email: request.body.email.trim().toLowerCase() }, include: { candidate: true } });
    const valid = verifyPassword(request.body.password, user?.passwordHash || dummyHash);
    if (!user || !valid) return reply.code(401).send({ message: 'E-mail ou senha inválidos.' });
    const raw = token();
    await db.session.create({ data: { tokenHash: digest(raw), userId: user.id, expiresAt: new Date(Date.now() + 8 * 3600000) } });
    reply.setCookie('pt_session', raw, { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: '/api', maxAge: 8 * 3600 });
    return { user: publicUser(user) };
  });
  app.get('/api/auth/me', { preHandler: authenticated }, request => ({ user: publicUser(request.user) }));
  app.post('/api/auth/logout', { preHandler: authenticated }, async (request, reply) => {
    await db.session.deleteMany({ where: { tokenHash: digest(request.cookies.pt_session) } });
    reply.clearCookie('pt_session', { path: '/api' });
    return { message: 'Sessão encerrada.' };
  });
  app.get('/api/dashboard', { preHandler: recruiter }, async () => {
    const [candidates, challenges, submissions, jobs] = await Promise.all([
      db.candidate.count(), db.challenge.count({ where: { active: true } }), db.submission.count(), db.job.count({ where: { active: true } })
    ]);
    return { candidates, challenges, submissions, jobs };
  });
  app.get('/api/candidates', { preHandler: recruiter, schema: { querystring: { type: 'object', properties: {
    search: { type: 'string', maxLength: 100 }, track: { type: 'string', enum: ['ALL', 'RED', 'BLUE', 'PURPLE'] }
  } } } }, async request => {
    const { search = '', track = 'ALL' } = request.query;
    const rows = await db.candidate.findMany({ where: {
      ...(track !== 'ALL' ? { track } : {}),
      ...(search ? { OR: [{ handle: { contains: search, mode: 'insensitive' } }, { user: { name: { contains: search, mode: 'insensitive' } } }] } : {})
    }, include: candidateInclude });
    return { items: rows.map(candidateView).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'pt-BR')) };
  });
  app.get('/api/candidates/:id', { preHandler: authenticated }, async (request, reply) => {
    if (request.user.role === 'CANDIDATE' && request.user.candidate?.id !== request.params.id) return reply.code(403).send({ message: 'Você pode consultar apenas seu próprio dossiê.' });
    const row = await db.candidate.findUnique({ where: { id: request.params.id }, include: candidateInclude });
    if (!row) return reply.code(404).send({ message: 'Candidato não encontrado.' });
    return { candidate: candidateView(row), evidence: row.submissions.map(s => ({ id: s.id, challenge: s.challenge.title, track: s.challenge.track, points: s.points, writeup: s.writeup, createdAt: s.createdAt })) };
  });
  app.get('/api/challenges', { preHandler: authenticated }, async () => ({ items: await db.challenge.findMany({ where: { active: true }, select: challengeSelect, orderBy: { title: 'asc' } }) }));
  app.post('/api/challenges/:id/submissions', { preHandler: authenticated, config: { rateLimit: { max: 10, timeWindow: '1 minute' } }, schema: { body: {
    type: 'object', additionalProperties: false, required: ['flag', 'writeup'], properties: {
      flag: { type: 'string', minLength: 1, maxLength: 256 }, writeup: { type: 'string', minLength: 20, maxLength: 10000, pattern: '\\S[\\s\\S]{18}\\S' }
    }
  } } }, async (request, reply) => {
    if (request.user.role !== 'CANDIDATE' || !request.user.candidate) return reply.code(403).send({ message: 'Somente candidatos podem enviar resoluções.' });
    const challenge = await db.challenge.findUnique({ where: { id: request.params.id } });
    if (!challenge || !challenge.active) return reply.code(404).send({ message: 'Desafio indisponível.' });
    const candidateId = request.user.candidate.id;
    const previous = await db.submission.findUnique({ where: { candidateId_challengeId: { candidateId, challengeId: challenge.id } } });
    if (previous) return { accepted: true, duplicate: true, points: previous.points };
    if (digest(request.body.flag.trim()) !== challenge.flagHash) return reply.code(422).send({ message: 'Flag inválida. Revise sua investigação.' });
    try {
      await db.submission.create({ data: { candidateId, challengeId: challenge.id, writeup: request.body.writeup.trim(), points: challenge.points } });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
      const accepted = await db.submission.findUnique({ where: { candidateId_challengeId: { candidateId, challengeId: challenge.id } } });
      return { accepted: true, duplicate: true, points: accepted.points };
    }
    return reply.code(201).send({ accepted: true, duplicate: false, points: challenge.points });
  });
  app.get('/api/jobs', { preHandler: authenticated }, async () => ({ items: await db.job.findMany({ where: { active: true }, orderBy: { title: 'asc' } }) }));
  return app;
}
