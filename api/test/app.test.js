import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { hashPassword, digest, candidateView } from '../src/security.js';

const origin = 'http://localhost:8088';
function fixture(role = 'CANDIDATE') {
  const user = { id: 'u1', name: 'Pessoa Teste', email: 'teste@local.test', role, passwordHash: hashPassword('test-password-long'), candidate: { id: 'c1' } };
  const sessions = new Map(), submissions = new Map();
  const challenge = { id: 'ch1', active: true, flagHash: digest('test-flag-value'), points: 300, title: 'Teste', track: 'PURPLE' };
  const db = {
    $queryRaw: async () => [{ '?column?': 1 }],
    user: { findUnique: async ({ where }) => where.email === user.email ? user : null },
    session: {
      create: async ({ data }) => { sessions.set(data.tokenHash, { ...data, user }); },
      findUnique: async ({ where }) => sessions.get(where.tokenHash),
      deleteMany: async ({ where }) => sessions.delete(where.tokenHash)
    },
    challenge: { findUnique: async ({ where }) => where.id === 'ch1' ? challenge : null, findMany: async () => [{ id: 'ch1', title: 'Teste' }] },
    submission: {
      findUnique: async ({ where }) => submissions.get(JSON.stringify(where.candidateId_challengeId)),
      create: async ({ data }) => {
        const key = JSON.stringify({ candidateId: data.candidateId, challengeId: data.challengeId });
        if (submissions.has(key)) throw Object.assign(new Error('unique'), { code: 'P2002' });
        submissions.set(key, data); return data;
      }
    }
  };
  return { db, user, sessions, submissions };
}
async function login(app) {
  const reply = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: 'teste@local.test', password: 'test-password-long' } });
  assert.equal(reply.statusCode, 200);
  return reply.headers['set-cookie'].split(';')[0];
}

test('login sets protected cookie; me and logout use persisted session', async t => {
  const f = fixture(); const app = await buildApp({ db: f.db }); t.after(() => app.close());
  const cookie = await login(app);
  const response = await app.inject({ url: '/api/auth/me', headers: { cookie } });
  assert.equal(response.statusCode, 200); assert.equal(response.json().user.role, 'CANDIDATE');
  assert.equal(response.json().user.passwordHash, undefined);
  const out = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie, origin } });
  assert.equal(out.statusCode, 200);
  assert.equal((await app.inject({ url: '/api/auth/me', headers: { cookie } })).statusCode, 401);
});
test('rejects foreign and missing Origin; unknown user and bad password return 401', async t => {
  const app = await buildApp({ db: fixture().db }); t.after(() => app.close());
  for (const headers of [{}, { origin: 'https://evil.test' }]) {
    assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login', headers, payload: { email: 'teste@local.test', password: 'x' } })).statusCode, 403);
  }
  for (const email of ['teste@local.test', 'absent@local.test']) {
    assert.equal((await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email, password: 'wrong' } })).statusCode, 401);
  }
});
test('anonymous, expired, cross-candidate and recruiter authorization boundaries', async t => {
  const f = fixture(); const app = await buildApp({ db: f.db }); t.after(() => app.close());
  assert.equal((await app.inject({ url: '/api/candidates' })).statusCode, 401);
  const cookie = await login(app);
  assert.equal((await app.inject({ url: '/api/candidates', headers: { cookie } })).statusCode, 403);
  assert.equal((await app.inject({ url: '/api/candidates/other', headers: { cookie } })).statusCode, 403);
  for (const session of f.sessions.values()) session.expiresAt = new Date(0);
  assert.equal((await app.inject({ url: '/api/auth/me', headers: { cookie } })).statusCode, 401);
});
test('invalid flag creates no points; duplicate valid submissions award once', async t => {
  const f = fixture(); const app = await buildApp({ db: f.db }); t.after(() => app.close());
  const cookie = await login(app);
  const submit = flag => app.inject({ method: 'POST', url: '/api/challenges/ch1/submissions', headers: { origin, cookie }, payload: { flag, writeup: 'Investigação técnica documentada com uma correção recomendada.' } });
  assert.equal((await submit('wrong')).statusCode, 422); assert.equal(f.submissions.size, 0);
  const responses = await Promise.all([submit('test-flag-value'), submit('test-flag-value')]);
  assert.deepEqual(responses.map(r => r.statusCode).sort(), [200, 201]);
  assert.equal(f.submissions.size, 1);
  assert.equal(responses.filter(r => r.json().duplicate).length, 1);
});
test('recruiters cannot submit flags and blank writeups are rejected', async t => {
  const f = fixture('RECRUITER'); const app = await buildApp({ db: f.db }); t.after(() => app.close());
  const cookie = await login(app);
  assert.equal((await app.inject({ method: 'POST', url: '/api/challenges/ch1/submissions', headers: { origin, cookie }, payload: { flag: 'test-flag-value', writeup: 'Documentação técnica descritiva suficiente.' } })).statusCode, 403);
  assert.equal((await app.inject({ method: 'POST', url: '/api/challenges/ch1/submissions', headers: { origin, cookie }, payload: { flag: 'test-flag-value', writeup: ' '.repeat(30) } })).statusCode, 400);
});
test('ranking sums immutable awarded points by track and never exposes credentials', () => {
  const view = candidateView({ id: 'c1', user: { name: 'Pessoa' }, skills: [], submissions: [
    { points: 200, challenge: { track: 'RED' } }, { points: 100, challenge: { track: 'BLUE' } }, { points: 300, challenge: { track: 'PURPLE' } }
  ] });
  assert.equal(view.score, 600); assert.equal(view.redScore, 200); assert.equal(view.blueScore, 100); assert.equal(view.purpleScore, 300);
  assert.equal(view.user, undefined);
});
test('health reports database failure instead of false readiness', async t => {
  const db = { $queryRaw: async () => { throw new Error('offline'); } };
  const app = await buildApp({ db }); t.after(() => app.close());
  const reply = await app.inject({ url: '/api/health' });
  assert.equal(reply.statusCode, 503); assert.equal(reply.body.includes('offline'), false);
});
test('recruiter ranking includes highest score beyond first hundred candidates', async t => {
  const f = fixture('RECRUITER');
  f.db.candidate = { findMany: async options => {
    assert.equal(options.take, undefined);
    return Array.from({ length: 101 }, (_, index) => ({ id: `c${index}`, user: { name: `Pessoa ${index}` }, skills: [],
      submissions: index === 100 ? [{ points: 300, challenge: { track: 'PURPLE' } }] : [] }));
  } };
  const app = await buildApp({ db: f.db }); t.after(() => app.close());
  const cookie = await login(app);
  const response = await app.inject({ url: '/api/candidates', headers: { cookie } });
  assert.equal(response.statusCode, 200); assert.equal(response.json().items.length, 101);
  assert.equal(response.json().items[0].id, 'c100');
});
