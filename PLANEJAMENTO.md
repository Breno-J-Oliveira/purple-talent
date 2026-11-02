# Purple Talent — planejamento e controle de entrega

Data de abertura: 02/11/2026. Projeto acadêmico SAGA. Empresa de referência nos materiais: LabWare; validação institucional e parceria não comprovadas.

## 1. Objetivo e limites

Transformar desempenho em desafios controlados de ataque e defesa em evidências úteis para recrutamento de estudantes e profissionais iniciantes. O produto apoia decisões humanas; ranking não equivale a certificação nem aprovação automática para contratação.

Este documento cobre cenários conhecidos e respostas previstas. Não é possível prever todos os acontecimentos: riscos novos entram no registro, com responsável, impacto, decisão e evidência. Alegações das referências como contratação em 72 horas, redução de 70%, integridade de 100% e parceiros comerciais não são resultados comprovados e não devem aparecer como garantias.

## 2. Stack aprovada e arquitetura

| Camada | Tecnologia | Limite de responsabilidade |
| --- | --- | --- |
| Interface | PHP + HTML | Composição de páginas e componentes; sem consultas ao banco ou autenticação duplicada |
| Interação | JavaScript | Formulários, estados, filtros e consumo da API |
| Apresentação | CSS + Tailwind compilado | Tokens, responsividade e identidade existente; sem Tailwind CDN em runtime |
| API | Node.js + Fastify | Identidade, autorização, validação e regras de negócio |
| Persistência | Prisma + PostgreSQL | Migrações, relações, transações e integridade |
| Ambiente | Docker Compose | Serviços locais reproduzíveis e laboratório opcional |

Navegador → gateway único → páginas PHP ou `/api/` → Fastify → Prisma → PostgreSQL.

O laboratório usa uma rede própria e não pode acessar API, banco, arquivos pessoais ou socket Docker. Iniciar/reiniciar laboratório é operação do organizador nesta fase. A API não recebe acesso ao daemon Docker.

Estrutura: `web/` para interface, `api/` para serviço e esquema, `infra/` para gateway e operação, `labs/` para exercícios, `docs/` para evidências. As referências em `stitch_purple_ctf_talent_platform/` ficam preservadas. As camadas FSD da interface seguem app → pages → widgets → features → shared, sem dependências ascendentes. Recursos do portfólio pai e seu service worker não fazem parte desta implantação.

## 3. Personas e jornadas

- Participante (Mateus/Beatriz): entra, lê regras, participa, envia flag e explicação, acompanha o próprio desempenho.
- Recrutadora (Camila): consulta candidatos e filtros, compara evidências e examina dossiês e oportunidades.
- Avaliadora técnica (Marina): define critérios, revisa resultados e fundamenta avaliação de investigação, correção e comunicação.
- Administrador/organizador: prepara evento, contas, desafios e laboratório; controla acesso e encerramento.

Primeira jornada integrada: login → desafio → envio → registro persistido → atualização do resultado → ranking → dossiê. O recrutador acessa a parte de seleção; o candidato não pode consultar dossiês alheios.

## 4. Escopo e fases

### E0 — descoberta e contrato

Confirmar materiais, stack, nomes, perfis, limites e identidade. Fontes: textos fornecidos, matrizes CSD/prioridade, imagens e HTML exportados. Definir contrato antes de integrar. Aceite: decisões e hipóteses distintas neste documento e responsabilidades por pasta.

### E1 — fundação e primeira fatia funcional (execução inicial)

- Layout PHP responsivo e navegação de painel, ranking, arenas, dossiê, vagas e login.
- API com sessão, permissões, validação, listas e submissão de flag.
- PostgreSQL modelado e migração versionada, carga fictícia manual de demonstração.
- Pontos calculados no servidor e submissões corretas sem crédito duplicado.
- Compose com gateway local, healthchecks, volume e laboratório opt-in.
- Estados de carregamento, indisponibilidade, acesso negado e ausência de resultados.
- Testes direcionados e evidência de quais serviços puderam ser executados.

Aceite: sem credenciais reais, referências preservadas, fontes originais, API sem flags/respostas secretas nas consultas, interfaces coerentes com os contratos, comandos documentados. Integração com banco e navegador só é marcada validada quando efetivamente executada.

### E2 — operação do evento

Cadastro e recuperação de conta, convite de avaliadores, gestão de eventos/equipes, calendário e troca Red/Blue, início e encerramento do desafio, versões da rubrica e revisão humana. Auditoria das alterações e contestação de resultados. Aceite: um evento completo com participantes de teste, acesso por papel e pontuação reprodutível.

### E3 — evidências e recrutamento

Write-ups revisados, avaliação comportamental por critérios observáveis, exportação de relatório com contexto e limitações, autorização de compartilhamento, vagas gerenciáveis e correspondência explicável por competências. Aceite: RH entende por que um perfil foi indicado; dados privados seguem restritos. Nenhuma decisão de contratação é automática.

### E4 — laboratórios ampliados

Instância por equipe, flags exclusivas por execução, reinício, expiração, cotas e isolamento reforçado. Captura de logs e validação de defesa em cenários específicos. Terminal/replay, CTI e integração MITRE somente após comprovar necessidade e segurança. Aceite: teste de isolamento, reset e indisponibilidade sem afetar plataforma.

### E5 — piloto e lançamento

Validação com participantes e recrutadores reais, revisão de conteúdo/marca, campanha de divulgação, capacidade e observabilidade, restauração de backup testada, revisão de segurança e privacidade. Produção, custos e publicação dependem de autorização explícita. Não há deploy autorizado nesta execução.

## 5. Gestão dos agentes

O gerente principal é responsável por escopo, planejamento, contratos, integração, revisão e relatório final. Agentes são acionados por etapa; não ficam trabalhando depois que a execução da conversa termina.

| Frente | Ownership exclusivo | Entregável | Verificação |
| --- | --- | --- | --- |
| Interface/UX | `web/**` | Páginas PHP, CSS, fontes, JS, build | PHP lint, CSS build e navegador |
| Backend/dados | `api/**` | Fastify, Prisma, migração, seed, testes | Testes de acesso, validação e idempotência; banco real quando disponível |
| Infra/lab | `infra/**`, `labs/**`, Compose e arquivos de ambiente | Gateway, redes, laboratório e operação | Compose config, healthchecks e smoke |
| Gerente/QA | planejamento, README, `docs/**` | Contratos integrados e evidências | Revisão cruzada, teste da jornada e limites declarados |

Handoff obrigatório: arquivos alterados, contrato final, comandos/resultados, limitações e nenhuma alegação de sucesso baseada apenas em código escrito. Nenhum agente edita a pasta de outro sem transferência explícita. Mudança em contrato é comunicada a todos os afetados antes da integração. Preservar mudanças do usuário.

Etapas futuras: descoberta → aceite → desenho → implementação → teste → revisão → entrega. QA e segurança revisam os fluxos de risco em cada etapa; especialistas adicionais só entram quando houver trabalho independente claro. Uma falha abre item com reprodução, causa, correção e reteste.

## 6. Modelo de dados previsto

Núcleo: User, Session, Candidate, Challenge, Submission e Job. Usuário tem papel e vínculo opcional com candidato; submissão vincula candidato e desafio. Resultado precisa manter fonte da evidência e instante da realização.

Evolução: Event, Team, Membership, LabInstance, Evaluation, RubricVersion, Evidence, JobRequirement, Match e AuditEvent. Apenas entidades necessárias à etapa são implementadas. Não criar tabelas de expansão sem fluxo correspondente.

Invariantes: email único; referências válidas; pontuação não vem do navegador; uma resolução não pode pontuar duas vezes; segredo da flag não sai na API; tentativas inválidas não recebem crédito; acesso ao dossiê exige papel ou titularidade. Datas em UTC, apresentação local. Exclusão de candidato e retenção requerem política definida antes de dados reais.

## 7. Contratos e erros

Prefixo `/api`. Rotas previstas: health; auth/login, auth/me, auth/logout; dashboard; candidates e candidates/:id; challenges e challenges/:id/submissions; jobs. Listas usam `{items: [...]}`. A implementação final é fonte para detalhes dos campos e deve ser reconciliada com a interface.

Responder com 400 para entrada inválida, 401 sem sessão, 403 sem permissão/origem inválida, 404 inexistente, 409 para conflito quando aplicável e 503 para dependência indisponível. Nunca devolver stack, senha, cookie ou conexão do banco. UI deve tratar falha sem preencher números fictícios como se fossem dados reais. Em duplicação de submissão correta, retornar resultado idempotente sem novo crédito.

## 8. Pontuação e justiça

Na primeira fatia: pontos definidos por desafio e trilha; flags corretas validadas no servidor; desempate determinístico. Isso é pontuação técnica simplificada, sem inferir soft skills automaticamente.

Antes do piloto: validar pesos Red/Blue/Purple, contribuição individual, dificuldade e equivalência entre rodadas, critérios de defesa e formato de contestação. Velocidade isolada não comprova competência. Write-up exige avaliação humana para atribuir qualidade; armazenar texto não equivale a avaliá-lo. Métricas MITRE exigem associação revisada entre tarefa e técnica.

## 9. Segurança e privacidade

- Sessão em cookie HttpOnly, SameSite, expiração e invalidação em logout; Secure obrigatório com HTTPS em produção.
- Verificação de origem em mutações e autorização na API; ocultar botões não é controle de acesso.
- Hash resistente para senhas; comparação apropriada dos segredos; limites de tentativas e tamanho de entrada.
- Consultas via Prisma; renderização de texto sem HTML do usuário; prevenção de XSS e travessia de caminho.
- Segredos só por ambiente local ignorado no Git; exemplo contém apenas instruções/valores fictícios.
- Ambientes de treino sem dados reais. Não expor containers vulneráveis à internet.
- Sem privileged, host networking ou montagem do socket; redes e limites por serviço. Container não substitui VM como fronteira para usuários hostis.
- Dados comportamentais e replay podem conter informações pessoais; consentimento, acesso, prazo e finalidade devem ser definidos antes de coleta.
- Não apresentar métricas de antifraude como garantia. Auditoria técnica e revisão humana são complementares.

## 10. Registro de riscos e contingências

| Cenário | Resposta prevista | Responsável |
| --- | --- | --- |
| Docker/WSL indisponível | Registrar diagnóstico, validar configuração e componentes localmente; não afirmar stack executada | Infra |
| Porta ocupada | Verificar dono, escolher porta de desenvolvimento e atualizar origem/gateway juntos; não encerrar processo alheio | Infra |
| Banco fora do ar | Healthcheck e erro recuperável; preservar volumes; diagnóstico antes de reset | Backend/infra |
| Migração falha | Parar avanço, preservar banco, revisar migração; backup antes de alterações em dados reais | Backend |
| Submissões concorrentes | Restrição única/transação; teste paralelo contra PostgreSQL | Backend/QA |
| Flag vazada/compartilhada | Invalidar desafio conforme regra do evento, flags por instância na evolução; histórico de auditoria | Organizador |
| Consulta de candidato alheio | Negar no servidor e testar tentativa por ID | Backend/QA |
| Ataque escapa do exercício | Interromper laboratório e isolar host; nunca dar acesso de rede à plataforma | Infra |
| Falta de RAM/disco | Limitar containers e simultaneidade, iniciar lab só sob demanda, medir máquina | Infra |
| Internet/fontes indisponíveis | CSS e fontes locais; dependências por lockfile e imagens previamente construídas | Interface/infra |
| Falha de requisição/double click | Mensagem clara, botão em andamento e idempotência no servidor | Interface/backend |
| Conteúdo longo/mobile | Quebra de texto, navegação acessível e teste 375/768/1440 | Interface/QA |
| Conteúdo malicioso em write-up | Exibir como texto; uploads exigem limites e isolamento em etapa posterior | Backend/interface |
| Viés no ranking | Critérios públicos, avaliação humana e contestação; nenhuma promessa de precisão | Produto |
| Mudança de escopo | Avaliar impacto, atualizar fase e aceite; não incorporar integrações de forma implícita | Gerente |
| Falha de backup | Ensaio de restauração em ambiente separado antes de piloto | Infra |
| Vazamento de dados | Restringir acesso, preservar evidências e avaliar comunicação conforme política do projeto | Gerente/segurança |
| Dependência vulnerável | Triar exposição, atualizar com lockfile e retestar; não usar force sem análise | Gerente |

## 11. Estratégia de verificação

Unidade: normalização/validação e regras relevantes. API: login incorreto, sessão expirada, logout, 401/403, origem externa, entrada inválida, flag incorreta, duplicação e ausência de segredo na resposta. Banco real: migração/seed, persistência após restart e concorrência. Navegador: login recrutador, consulta/filtro/dossiê, login candidato, submissão e erro; teclado, foco, menu mobile, rolagem e console. Infra: Compose config, serviços saudáveis e isolamento de lab.

Resoluções: 375, 768 e 1440 px; incluir 320 px se elementos não couberem. Falha de API deve ter ação de recuperação. Comparar screenshots com paleta e tipografia do DESIGN.md; corrigir sobreposições das referências em vez de reproduzi-las.

Uma etapa só passa de implementada para verificada quando houver comando ou interação executada e resultado registrado em `docs/VERIFICACAO.md`. Teste com repositório em memória não comprova restrição no PostgreSQL. Build não comprova funcionamento do sistema completo.

## 12. Operação e recuperação

Manter banco em volume nomeado. Reiniciar serviços sem apagar volume. `down -v`, exclusão ampla, custo externo e deploy em produção exigem autorização. Seed é manual e deve ser seguro para repetição, sem sobrescrever dados reais. Nunca confundir seed com cadastro em produção.

Antes do piloto: backup automatizado, política de retenção, teste de restauração, logs sem segredos, coleta de falhas, limites de concorrência medidos, atualização de dependências e roteiro de demonstração. Reinício do laboratório deve preservar submissões e relatórios na plataforma.

## 13. Decisões pendentes com o dono/empresa

Prazo de apresentação; tamanho da equipe e máquina; protótipo versus piloto; autorização de marca; evento individual ou equipes; número de participantes simultâneos; critérios de pontuação; revisores; tratamento dos dados; relatório desejado pelo RH. A primeira fatia usa dados fictícios e critérios demonstrativos explicitamente identificados para não bloquear o início.

## 14. Status

- [x] Stack alinhada com o dono e referências inventariadas.
- [x] Planejamento e frentes com ownership definidos.
- [x] Fundação implementada e revisada; limites em `docs/VERIFICACAO.md`.
- [ ] Banco e Compose executados.
- [ ] Jornada integrada e visual verificada.
- [ ] Piloto validado com pessoas reais.
- [ ] Produção autorizada e preparada.

O resultado desta execução, os bloqueios e próximos passos serão registrados separadamente para não confundir planejamento com funcionalidade entregue.
