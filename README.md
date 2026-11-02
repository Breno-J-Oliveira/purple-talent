# Purple Talent

Plataforma acadêmica SAGA para avaliação prática de talentos em cibersegurança por desafios CTF Purple Team. PHP/HTML, JavaScript, CSS/Tailwind, Node.js/Fastify, Prisma/PostgreSQL e Docker Compose.

## Documentação

- [Planejamento e etapas](PLANEJAMENTO.md): escopo, personas, arquitetura, critérios de aceite, riscos e gestão dos agentes.
- [Execução Docker e laboratório](infra/README.md): configuração, inicialização e diagnóstico.
- [Contrato e operação da API](api/README.md).
- [Evidências de verificação](docs/VERIFICACAO.md).

Os arquivos em `stitch_purple_ctf_talent_platform/` são referências preservadas. A interface utiliza Plus Jakarta Sans, Inter e JetBrains Mono, com fontes locais e CSS compilado. A empresa, as oportunidades e os candidatos da demonstração não representam parceria comercial ou processo seletivo real.

## Iniciar no Windows

Requer Docker Desktop com engine Linux ativo e Compose. Em uma instalação nova, copie `.env.example` para `.env` e preencha os valores locais conforme `infra/README.md`. Se `.env` já existe, preserve-o: mudar a senha na configuração não muda automaticamente a senha do volume PostgreSQL.

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose run --rm api npm run db:seed
docker compose ps
```

Abra [a plataforma local](http://localhost:8088). Contas fictícias: `recrutador@purpletalent.local` e `candidato@purpletalent.local`; a senha é o valor de `DEMO_PASSWORD` no seu ambiente local. Não há senha pública fixa no código.

Para incluir o exercício opcional:

```powershell
docker compose --profile labs up --build -d lab
```

O laboratório fica em [localhost:8091](http://localhost:8091). O desafio `web-investigation` usa a mesma `LAB_FLAG` configurada antes do primeiro seed. Reiniciar o laboratório não apaga o banco. Não exponha este ambiente vulnerável à internet.

## Estrutura e responsabilidades

| Pasta | Conteúdo |
| --- | --- |
| `web/` | Páginas PHP, componentes, interação JS, estilos e fontes |
| `api/` | API Fastify, autenticação, regras, Prisma, migração e seed |
| `infra/` | Gateway Nginx e operação local |
| `labs/` | Laboratório independente e testes |
| `docs/` | Evidências e pendências da entrega |

O PHP compõe a interface. A API é a única camada que autentica usuários, aplica permissões e acessa o banco. O gateway publica páginas e `/api/` na mesma origem. O laboratório não compartilha a rede do banco ou da API.

## Verificar componentes

```powershell
Push-Location api
npm ci
npm run db:generate
npm test
Pop-Location
Push-Location web
npm ci
npm run build
Pop-Location
node --test labs/access-review/server.test.mjs
docker compose config --quiet
```

Os testes da API com repositório em memória não comprovam migrações ou concorrência no PostgreSQL. Consulte as evidências para distinguir verificações executadas de integrações ainda pendentes.

## Estado e próximos passos

A fundação inclui páginas de painel, ranking, arenas, dossiê, vagas e login, contrato de API, pontuação por submissão aceita e exercício educativo. O avanço depende dos critérios em `PLANEJAMENTO.md`: evento/equipes, revisão humana de evidências, relatório, proteção de dados, piloto e posterior produção.

Não há contratação automática, antifraude garantido, correção automática de defesa, terminal remoto nem matchmaking implementado nesta primeira etapa. Publicação e uso com dados reais exigem preparação e autorização próprias.

Este subprojeto tem repositório próprio: [Breno-J-Oliveira/purple-talent](https://github.com/Breno-J-Oliveira/purple-talent). O versionamento é independente do portfólio pai; seu `.gitignore` não foi alterado. Arquivos `.env`, dependências e artefatos temporários ficam fora do Git.
