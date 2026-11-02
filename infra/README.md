# Execução local e laboratório

Requisitos: Docker Engine ativo, Docker Compose e virtualização/WSL 2 configurados no Windows. Não é necessário usar XAMPP para executar o Compose.

## Primeira execução

Na raiz de `desafio-de-ideias`, copie `.env.example` para `.env`. Substitua as três senhas/bandeira fictícias antes de executar. `DEMO_PASSWORD` e `LAB_FLAG` precisam ter pelo menos 12 caracteres. Não envie `.env` ao Git. `POSTGRES_PASSWORD` deve usar letras e números nesta configuração para compor a URL sem escapes.

```powershell
Copy-Item .env.example .env
docker compose config --quiet
docker compose up --build -d
docker compose run --rm api npm run db:seed
docker compose ps
```

Plataforma: http://localhost:8088. A API fica no mesmo endereço em `/api/`; banco e API não têm portas publicadas no host. Use exatamente a origem configurada em `APP_ORIGIN` para login e submissões. O seed é explícito; reiniciar a stack não deve recriar as demonstrações.

O seed usa `DEMO_PASSWORD` nas contas fictícias documentadas pelo backend. Nunca reutilize essa senha fora deste ambiente acadêmico.

## Laboratório opcional

```powershell
docker compose --profile labs up --build -d lab
docker compose logs --tail 30 lab
```

Abra http://localhost:8091. O exercício é uma falha intencional de controle de acesso via papel enviado pelo cliente. O participante investiga o portal, captura a bandeira e escreve a análise e a proposta defensiva. Os logs registram tentativa e resultado sem imprimir a bandeira. A correção defensiva é um parecer nesta primeira versão; não há aplicação automática de patches nem avaliação comportamental automática.

O organizador configura `LAB_FLAG` antes do seed: o mesmo valor abastece o hash esperado pela plataforma e o laboratório. O desafio correspondente tem id `web-investigation`. Se mudar a bandeira, coordene atualização do desafio e dos resultados; não execute seed sobre uma turma em andamento sem avaliar o impacto.

O laboratório está em rede interna própria, sem conexão direta com os serviços da plataforma, sem mounts do host e sem socket Docker. A porta é publicada somente em loopback. Não exponha este Compose na internet. Containers não substituem isolamento por VM para participantes hostis ou ambientes públicos.

## Parar e reiniciar

```powershell
docker compose --profile labs stop
docker compose up -d
docker compose --profile labs up -d lab
```

Para restaurar somente o estado efêmero do laboratório, recrie seu container:

```powershell
docker compose --profile labs up -d --force-recreate lab
```

O banco persiste no volume `database`. Não use opções de remoção de volumes para reiniciar o ambiente. Exclusão de dados e resets do banco exigem decisão explícita, backup e validação de restauração.

## Diagnóstico

| Sintoma | Verificação / ação |
| --- | --- |
| Pipe Docker inexistente | Abra o Docker Desktop e aguarde o engine Linux; confira `docker version`. |
| Porta 8088/8091 ocupada | Identifique o processo; ajuste publicação e `APP_ORIGIN` de maneira consistente. |
| API indisponível | Veja `docker compose logs --tail 50 api` e o estado saudável do banco. |
| Banco rejeita senha após editar `.env` | O volume preserva a senha inicial; restaure a configuração anterior ou faça rotação planejada, sem apagar o volume. |
| Login/submissão recebe erro de origem | Use `http://localhost:8088`, evitando trocar por IP sem atualizar `APP_ORIGIN`. |
| Ranking sem participantes | Execute o seed apenas no ambiente de demonstração inicial. |
| Falha de memória | Pare o laboratório; confira recursos no Docker Desktop e reduza participantes simultâneos. |

Tags de imagens são versões explícitas, mas ainda não estão fixadas por digest. Antes de distribuição ou produção, gerar inventário, varrer imagens e registrar digests, backup/restauração e teste de capacidade. Esta configuração é de desenvolvimento local.

Teste isolado do laboratório, sem Docker: `node --test labs/access-review/server.test.mjs`. Ele usa uma bandeira fictícia e porta efêmera; não acessa o banco.
