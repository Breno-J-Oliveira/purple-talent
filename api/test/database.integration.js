import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';
import { hashPassword, digest } from '../src/security.js';

if (!process.env.TEST_DATABASE_URL) throw new Error('Defina TEST_DATABASE_URL para um PostgreSQL de teste já migrado.');

test('PostgreSQL: sessão persistida e submissões concorrentes pontuam exatamente uma vez', async () => {
  const db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
  const id = `integration-${randomUUID()}`;
  const origin = 'http://localhost:8088';
  const password = randomUUID();
  const flag = randomUUID();
  let app;
  try {
    await db.user.create({ data: { id, email: `${id}@test.invalid`, name: 'Integração', role: 'CANDIDATE', passwordHash: hashPassword(password), candidate: { create: { id, handle: id, track: 'PURPLE', bio: 'Teste temporário', location: 'Local', skills: [] } } } });
    await db.challenge.create({ data: { id, title: 'Integração temporária', description: 'Removido ao final do teste', track: 'PURPLE', points: 300, difficulty: 'Teste', flagHash: digest(flag) } });
    app = await buildApp({ db });
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: `${id}@test.invalid`, password } });
    assert.equal(response.statusCode, 200);
    assert.match(response.headers['set-cookie'], /HttpOnly/i);
    assert.match(response.headers['set-cookie'], /SameSite=Strict/i);
    const cookie = response.headers['set-cookie'].split(';')[0];
    assert.equal(await db.session.count({ where: { userId: id } }), 1);
    const submit = () => app.inject({ method: 'POST', url: `/api/challenges/${id}/submissions`, headers: { origin, cookie }, payload: { flag, writeup: 'Evidência produzida em integração real com banco de dados.' } });
    const responses = await Promise.all([submit(), submit(), submit()]);
    assert.deepEqual(responses.map(r => r.statusCode).sort(), [200, 200, 201]);
    assert.equal(await db.submission.count({ where: { candidateId: id } }), 1);
    const dossier = await app.inject({ url: `/api/candidates/${id}`, headers: { cookie } });
    assert.equal(dossier.statusCode, 200); assert.equal(dossier.json().candidate.score, 300);
    assert.equal(dossier.json().evidence.length, 1);
    assert.equal(JSON.stringify(dossier.json()).includes(flag), false);
    const out = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin, cookie } });
    assert.equal(out.statusCode, 200); assert.equal(await db.session.count({ where: { userId: id } }), 0);
  } finally {
    await app?.close();
    await db.submission.deleteMany({ where: { candidateId: id } });
    await db.user.deleteMany({ where: { id } });
    await db.challenge.deleteMany({ where: { id } });
    await db.$disconnect();
  }
});
