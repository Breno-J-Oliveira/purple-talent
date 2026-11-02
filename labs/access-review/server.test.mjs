import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';

const request = (url, method = 'GET') => new Promise((resolve, reject) => {
  const req = http.request(url, {method, agent:false}, res => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => resolve({status:res.statusCode, headers:res.headers, body}));
  });
  req.setTimeout(5000, () => req.destroy(new Error('Laboratório não respondeu em 5s.')));
  req.on('error', reject);
  req.end();
});

test('laboratório: acesso visitante negado, falha controlada e flag escapada; sem execução por POST', async () => {
  const flag = 'PURPLE{teste_<local>}';
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('.', import.meta.url),
    env: {...process.env, LAB_FLAG: flag, LAB_PORT:'0'},
    stdio:['ignore','pipe','pipe'],
  });
  const timeout = setTimeout(() => child.kill(), 20000);
  try {
    const output = await Promise.race([
      once(child.stdout, 'data').then(([chunk]) => chunk.toString()),
      once(child, 'exit').then(() => {throw new Error('Laboratório encerrou antes de iniciar.');}),
    ]);
    const port = output.match(/porta (\d+)/)?.[1];
    assert.ok(port, 'porta deve ser informada na inicialização');
    const base = `http://127.0.0.1:${port}`;
    const home = await request(base);
    assert.equal(home.status, 200);
    assert.equal(home.body.includes(flag), false);
    const denied = await request(`${base}/audit?role=visitor`);
    assert.equal(denied.status, 403);
    const captured = await request(`${base}/audit?role=auditor`);
    assert.equal(captured.status, 200);
    assert.match(captured.body, /PURPLE\{teste_&lt;local&gt;\}/);
    assert.equal(captured.headers['cache-control'], 'no-store');
    const rejected = await request(`${base}/audit?role=auditor`, 'POST');
    assert.equal(rejected.status, 405);
    assert.equal((await request(`${base}/unknown`)).status, 404);
  } finally {
    clearTimeout(timeout);
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  }
});
