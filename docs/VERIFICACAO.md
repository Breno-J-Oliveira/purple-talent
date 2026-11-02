# Evidências da fundação — 02/11/2026

## Entregue

Planejamento de produto e fases em PLANEJAMENTO.md. Interface PHP com painel, ranking, desafios, dossiê, vagas e login. API Fastify com sessão, autorização e submissão idempotente. Prisma/PostgreSQL com migração e seed explícito. Gateway Compose e laboratório educativo opt-in. Referências originais preservadas.

## Executado

| Verificação | Resultado e alcance |
| --- | --- |
| `node --test api/test/app.test.js` | 8/8 aprovados em memória: autenticação, sessão/logout, origem, permissões, flag incorreta, duplicação concorrente, score, ranking101 perfis e falha de readiness |
| `node --test labs/access-review/server.test.mjs` | 1/1 aprovado com HTTP real: acesso visitante negado, falha controlada, escape da flag, método/rota inválidos |
| `docker compose config --quiet` | Aprovado; valida configuração, não executa containers |
| `npm ci` e `npm run build` em web | Aprovados; CSS Tailwind e fontes locais gerados |
| PHP lint dos 11 arquivos (templates e router) | Aprovado com PHP 8.2 do XAMPP |
| `node --check web/public/assets/app.js` | Aprovado |
| Prisma validate e generate | Aprovados; não comprovam aplicação de migração |
| `npm audit --audit-level=high` em api | Aprovado, zero vulnerabilidades na árvore auditada após overrides de transitivas Prisma |
| Playwright CLI + PHP local em127.0.0.1:8086 | Login e painel renderizados; desktop e mobile inspecionados; menu abre e Escape fecha; fontes carregadas; sem overflow horizontal a375px |

Os testes, lint e build foram repetidos pelo gerente. Screenshots locais em output/playwright: login-desktop.png, login-mobile.png, dashboard-desktop.png. Artefatos temporários fora do Git. Login desktop 1280px, painel 1440px e mobile 375px. Medição adicional do painel a 768px confirmou largura de conteúdo igual ao viewport, sem overflow horizontal. A inspeção não substitui a jornada autenticada com dados reais.

Corrigidos título mobile sem espaço, menu fechado acessível por teclado (agora inert), distinção entre competências informadas e evidências, e desafio sem material (inativo no seed).

## Bloqueado / não executado

- Docker CLI instalado, mas engine Linux indisponível: pipe dockerDesktopLinuxEngine inexistente. Tentativa de iniciar Docker Desktop não disponibilizou o serviço. Sem build/up dos containers.
- Sem PostgreSQL ativo, não aplicadas migrações nem seed. Persistência e concorrência real ainda não verificadas.
- API possui `npm run test:db`, exigindo TEST_DATABASE_URL de banco de teste migrado. Cria registros temporários e remove somente os próprios. Ainda não executado.
- Não houve login/submissão ponta a ponta no navegador com banco. Inspeção verificou apresentação e tratamento de indisponibilidade, sem fallback fictício no runtime.
- Gestão de eventos/equipes, avaliação humana, relatórios exportáveis e matchmaking são etapas futuras.

## Próxima verificação integrada

1. Disponibilizar engine Linux, conferir recursos e portas.
2. Executar Compose e seed conforme README.
3. Executar teste de banco em ambiente de teste migrado.
4. Entrar como candidato, investigar laboratório e registrar resolução; repetir e confirmar crédito único.
5. Conferir logout, ranking e dossiê como recrutador; testar acesso alheio como candidato.
6. Validar375/768/1440px com dados persistidos, teclado, modal e erros.

Não há evidência de prontidão para produção ou validação institucional. A entrega é a fundação local com plano para evolução.
