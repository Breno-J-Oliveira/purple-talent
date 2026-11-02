import http from 'node:http';

const flag = process.env.LAB_FLAG;
if (!flag || flag.length < 12) throw new Error('LAB_FLAG deve ter pelo menos 12 caracteres.');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const page = content => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laboratório • Revisão de acesso</title><style>body{background:#0f131c;color:#dfe2ef;font:18px/1.65 system-ui;max-width:760px;margin:60px auto;padding:24px}a{color:#ddb7ff}code,pre{background:#181b25;padding:8px;overflow-wrap:anywhere;white-space:pre-wrap}small{color:#cfc2d6}</style><main><small>Purple Talent • Laboratório acadêmico local</small>${content}</main></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://lab.local');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if (req.method !== 'GET') {
    res.writeHead(405, {Allow:'GET'});
    return res.end(page('<h1>Método não permitido</h1>'));
  }
  if (url.pathname === '/health') {
    res.setHeader('Content-Type', 'application/json');
    return res.end('{"status":"ok","mode":"educational-lab"}');
  }
  if (url.pathname === '/audit') {
    // Falha intencional: confiar no papel informado pelo cliente.
    // Não reutilizar esta autorização na plataforma Purple Talent.
    const authorized = url.searchParams.get('role') === 'auditor';
    console.log(JSON.stringify({event:'audit_access',role:url.searchParams.get('role')?.slice(0,32) ?? null,granted:authorized}));
    if (!authorized) {
      res.statusCode = 403;
      return res.end(page('<h1>Acesso restrito</h1><p>Este relatório exige o papel <code>auditor</code>. Investigue como o portal transmite o papel do usuário.</p><p><a href="./">Voltar ao portal</a></p>'));
    }
    return res.end(page(`<h1>Relatório de auditoria</h1><p>Você identificou uma falha de controle de acesso.</p><pre>${escape(flag)}</pre><p>Registre a evidência, explique a causa e proponha uma validação de permissões no servidor. Envie a bandeira na plataforma.</p>`));
  }
  if (url.pathname !== '/') {
    res.statusCode = 404;
    return res.end(page('<h1>Página não encontrada</h1>'));
  }
  res.end(page('<h1>Portal de revisão de acesso</h1><p>Uma equipe publicou um relatório de auditoria restrito. Verifique se um visitante consegue acessá-lo alterando apenas informações controladas pelo navegador.</p><p><a href="audit?role=visitor">Consultar relatório como visitante</a></p><h2>Etapa defensiva</h2><p>Explique qual informação não pode ser aceita como prova de autorização e descreva como verificar a identidade e as permissões no servidor. Consulte os logs com o organizador.</p><p>Use somente este laboratório. Todos os dados são fictícios.</p>'));
});
server.listen(Number(process.env.LAB_PORT ?? 8091), '0.0.0.0', () => console.log(`Laboratório acadêmico disponível na porta ${server.address().port}.`));
