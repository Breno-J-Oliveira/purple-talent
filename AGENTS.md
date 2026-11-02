# Purple Talent — instruções do projeto

Responda em português brasileiro. Este é um repositório próprio dentro de uma pasta do portfólio; não altere o portfólio pai. O usuário autorizou desenvolvimento integrado, subagentes, testes e publicação neste repositório GitHub. Deploy em produção, custos, alterações de credenciais e exclusão de dados exigem autorização própria.

## Stack e limites

- PHP/HTML compõem a interface; JavaScript consome a API; Tailwind/CSS são compilados localmente.
- Node.js/Fastify é responsável por autenticação, autorização e regras. Somente a API acessa PostgreSQL, por Prisma.
- Mesma origem no gateway, API em /api/. Não armazenar sessão no localStorage.
- Fontes locais: Plus Jakarta Sans, Inter, JetBrains Mono. Referências em stitch_purple_ctf_talent_platform são preservadas.
- Lab intencionalmente vulnerável deve ficar em rede separada, sem acesso ao banco/API/socket Docker. Não expor à internet.

## Coordenação

Use agentes apenas quando houver tarefas independentes. Frentes: web/** (interface), api/** (backend/dados), infra/** + labs/** + Compose + scripts/** + CI (operação), docs/** e integração (gerente). Cada arquivo tem um responsável por vez; comunique mudanças de contrato aos consumidores. Não reverta mudanças de outro agente ou do usuário.

Leia README.md, PLANEJAMENTO.md, docs/ACEITE-V1.md e o contrato atual em api/CONTRACT.md quando existente. Mantenha planejado, implementado e verificado distintos. Testes em memória não comprovam constraints PostgreSQL. Não anunciar contratação automática, antifraude garantido, parceria com empresas ou pesquisa com usuários sem evidência.

## Verificação

- API: npm ci, npm run db:generate, npm test. Migrações: npm run db:deploy; seed demonstrativo: npm run db:seed. Variáveis conforme api/README.md.
- PostgreSQL: npm run test:db com TEST_DATABASE_URL de banco de teste já migrado; não direcionar testes destrutivos a produção.
- Interface: npm ci, npm run build; PHP lint nos arquivos alterados; node --check nos módulos JS.
- Infra: docker compose config --quiet, healthchecks e node --test labs/access-review/server.test.mjs.
- Navegador real: participante e recrutador; 375/768/1440px; teclado, foco, modal, falha/empty/success, console. Evidências locais em output/playwright, ignoradas no Git.
- Registrar resultados e limites em docs/VERIFICACAO.md, sem senhas/flags de ambiente.

## Entrega e segurança

Nunca versionar .env, node_modules, logs de sessão ou credenciais. Não remover volumes para corrigir inicialização. Migrações são incrementais e preservam dados. Seed repetível não deve redefinir senhas ou sobrescrever submissões reais. Fluxos de usuário devem mostrar apenas capacidades implementadas, com consentimento e acesso verificados no servidor.

Preferir npm.cmd no PowerShell deste ambiente quando npm.ps1 travar. Não encerrar processos alheios. Publicar apenas após conferir alterações e executar verificações proporcionais. Se Git Credential Manager travar, a integração GitHub pode publicar blobs/tree/commit verificando os hashes; não force-push e não exponha tokens.
