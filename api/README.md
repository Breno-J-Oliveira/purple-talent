# Purple Talent API

Node.js 22+, Fastify 5, Prisma 6 e PostgreSQL. Plataforma local de demonstração: não há integração com serviços reais da LabWare.

Dependências transitivas do CLI Prisma possuem overrides para `effect >=3.20` e `deepmerge-ts >=8`, corrigindo os avisos GHSA-38f7-945m-qr2g e GHSA-ggr8-5vv4-36mx identificados no audit de 02/11/2026. Ao atualizar Prisma, revisar esses overrides e repetir validate, generate, audit e integração PostgreSQL antes de removê-los.

## Variáveis

- `DATABASE_URL`: conexão PostgreSQL, obrigatória nos comandos Prisma e runtime.
- `APP_ORIGIN`: origem exata do gateway, padrão `http://localhost:8088`.
- `DEMO_PASSWORD`: senha local das contas fictícias, mínimo 12 caracteres, usada somente no seed.
- `LAB_FLAG`: flag do desafio `web-investigation`, mínimo 12 caracteres, usada somente no seed.
- `COOKIE_SECURE=true`: habilita cookie HTTPS; em localhost HTTP manter false.
- `PORT`: padrão 3000.

Execute `npm ci`, `npm run db:generate`, `npm run db:deploy`, `npm run db:seed`, `npm start`. O seed não redefine contas e desafios existentes. Para alterar senha ou flag já semeada, é necessária uma operação administrativa explícita; mudar variáveis não altera os registros existentes.

Contas fictícias: `recrutador@purpletalent.local`, `candidato@purpletalent.local`, `bia@purpletalent.local`, `lucas@purpletalent.local`. Todas usam `DEMO_PASSWORD` no primeiro seed. Não use senhas reais.

Somente `web-investigation` está ativo, integrado ao laboratório inicial. `log-triage` e `web-recon` são registros planejados e inativos: não aparecem como exercícios disponíveis até receberem material e validação próprios.

## Contrato

Todas as rotas começam com `/api`. POST exige `Origin` igual a `APP_ORIGIN`. Cookie `pt_session` HttpOnly, SameSite Strict, validade de 8h; somente hash da sessão é persistido.

- GET `/health`: testa conexão PostgreSQL, retorna 503 quando indisponível.
- POST `/auth/login` `{email,password}` e GET `/auth/me`: `{user:{id,name,email,role,candidateId}}`.
- POST `/auth/logout`: revoga sessão.
- GET `/dashboard`: `{candidates,challenges,submissions,jobs}`, somente recrutador/admin.
- GET `/candidates?search=&track=ALL|RED|BLUE|PURPLE`: `{items}`, somente recrutador/admin. Ranking completo em memória; paginação e agregação no banco para escala são backlog.
- GET `/candidates/:id`: `{candidate,evidence}`; candidato só acessa próprio dossiê.
- GET `/challenges`: `{items}`, autenticado; não expõe hashes ou flags.
- POST `/challenges/:id/submissions` `{flag,writeup}`: writeup 20–10000 caracteres, candidato autenticado. 201 primeira aceitação; 200 repetição sem pontuar novamente; 422 flag incorreta; 404 desafio inativo/inexistente.
- GET `/jobs`: `{items}`, autenticado. Vagas fictícias, sem candidatura ou matching automático nesta etapa.

Pontuação soma somente submissões aceitas persistidas. Desempates usam nome na listagem inicial, sem pretender medir tempo real de resolução. Writeup é evidência textual, não avaliação automática de qualidade ou comportamento. A validação de flag não comprova sozinha execução técnica; parecer humano e critérios completos são backlog.

## Verificação

`npm test`: testes de rota com repositório em memória para autenticação, Origin, autorização, flags, duplicação concorrente e pontuação. Não substituem teste real das constraints e transações PostgreSQL. A migração define chave única candidato/desafio, que é a garantia de pontuação única no banco real.

`npm run test:db`: integração real PostgreSQL. Exige `TEST_DATABASE_URL` apontando para um banco de teste com migrações aplicadas; falha claramente se a variável estiver ausente. Cria registros identificados por UUID e remove somente os registros criados pelo próprio teste. Não usa nem redefine o seed. Verifica cookie/sessão persistida, competição de submissões contra constraint real e cálculo do dossiê. Não execute contra produção.

Limitações: cadastro administrativo de desafios/contas, avaliação humana, recuperação de senha, exclusão/expiração automática de dados, CSRF token para integrações externas, eventos de auditoria, rastreamento de tentativas e proteção de tentativas distribuídas ainda não implementados. A proteção de requisições mutáveis inicial usa Origin obrigatório e cookies SameSite Strict.
