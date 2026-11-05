# CTI Purple Security Lab

MVP da proposta de recrutamento e capacitação: desafios CTF, exercícios Purple Team e acompanhamento de mentores. Implementado com Flask, SQLite e Docker Engine. O visual do front fornecido em `Desafio_Ideias` foi adaptado para templates Flask; autenticação, flags, relatórios e pontuação ficam no servidor.

## Iniciar com Docker no Windows

Pré-requisito: [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) aberto, usando **containers Linux** e integração WSL 2 habilitada.

Na pasta deste projeto, execute no PowerShell:

```powershell
.\scripts\setup.ps1
```

O script gera `.env` com chaves aleatórias, constrói a plataforma e as duas imagens dos desafios, e inicia somente a plataforma. Não imprime a senha. Abra **http://localhost:5000**.

- Mentor: `mentor@cti.local`. A senha está em `MENTOR_PASSWORD` no `.env`.
- Participantes: use **Criar perfil**; não há participantes fictícios no ranking.
- Se o PowerShell bloquear scripts, execute `powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1` para esta execução.
- A senha de mentor é aplicada apenas ao criar um banco vazio. Alterar `.env` não altera contas já existentes.

Com `.env` já configurado, os comandos equivalentes são:

```powershell
docker compose --profile images build
docker compose up -d platform
docker compose logs -f platform
```

Dentro de **Desafios CTF**, abra **Intranet esquecida** ou **SQL no login** e clique em **Iniciar ambiente**. O servidor cria um container individual e mostra um endereço `http://127.0.0.1:PORTA`. Não é necessário iniciar os serviços de imagem com `compose up`; são apenas definições para build.

## Funcionalidades

- Cadastro, login e separação de permissões entre mentor e participante.
- Oito desafios: aquecimento, intranet, base64, análise de logs, César, base64 em camadas, reversa e SQL no login.
- Dois alvos Docker com flags aleatórias por instância; demais exercícios são resolvidos na plataforma.
- Validação de flags e contagem de pontos no servidor. Cada CTF conta uma vez por usuário.
- Arena Purple Team: cinco ações, comparação com alertas simulados e relatório persistido. Até 150 pontos técnicos; usa-se a melhor tentativa.
- Dashboard com resultados individuais e por equipe, tentativas, tempo médio e avaliações de 1 a 5 em lógica, comunicação, colaboração e decisão.
- Relatórios disponíveis na ficha do participante para revisão humana. O tamanho do texto não gera nota de qualidade automática.
- Ranking autenticado com dados reais.

As telas fictícias de empresas/convites e os resultados locais do protótipo não foram transportados como funcionalidades operacionais. A proposta entregue enfatiza desafios, treinamento e mentoria. Não há envio de e-mails ou integração com recrutadores externos. A rodada Purple é um exercício guiado com logs simulados, sem provisionar Windows, SIEM ou EDR reais.

## Ciclo de vida dos ambientes

Cada alvo recebe rede própria e porta aleatória vinculada ao loopback do host Docker. Possui limites de memória, CPU e processos, usuário sem privilégios, filesystem somente leitura e nenhuma montagem do host. A rede interna restringe saída externa. Veja [publicação de portas](https://docs.docker.com/engine/network/port-publishing/) e [opções do SDK](https://docker-py.readthedocs.io/en/stable/containers.html).

Padrões em `.env`: `LAB_TTL_SECONDS=3600`, `LAB_MAX_ACTIVE=10` e `LAB_MAX_PER_USER=2`. Um processo de limpeza verifica expiração a cada minuto enquanto a plataforma está ativa. Reinícios reconciliam containers e registros sem apagar sessões ativas válidas. Se a plataforma estiver parada, a limpeza só será retomada quando ela iniciar.

**Escopo local:** abra a plataforma e os alvos no mesmo computador do Docker. O socket Docker montado na plataforma concede poder administrativo sobre o Engine. Essa configuração é para demonstração controlada, com usuários confiáveis; publicação em rede exige arquitetura e isolamento adicionais. Containers compartilham o kernel e não equivalem a máquinas virtuais completas. Use um único processo/replica da plataforma.

Para encerrar os alvos, entre como mentor em **Ambientes → Encerrar todos**; depois rode `docker compose down`. O `compose down` sozinho não remove containers dinâmicos criados pelo SDK. O volume `lab-data` preserva contas e resultados. O `lab.db` original da pasta não é copiado para a imagem nem alterado pelo Compose.

## Executar sem containerizar a plataforma

O ambiente `.venv` foi criado nesta pasta. Para recriar:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:SECRET_KEY = 'defina-uma-chave-longa-aleatoria'
$env:MENTOR_PASSWORD = 'defina-uma-senha-forte'
.\.venv\Scripts\python.exe app.py
```

Sem Docker, cadastro, desafios estáticos, Purple, ranking e mentoria funcionam; os alvos individuais ficam indisponíveis. Em modo local, variáveis de `.env` não são carregadas automaticamente. O banco padrão é `lab.db`; use `DATABASE_PATH` para escolher outro arquivo. Se `MENTOR_PASSWORD` não for definida em um banco novo local, a credencial de desenvolvimento é `mentor123`. Configure-a antes de usar dados reais. `HOST` e `PORT` também podem ser definidos; o padrão local é `127.0.0.1:5000`.

## Validação

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

A suíte usa bancos temporários e simula o Engine nos testes de ciclo de vida: verifica permissões, CSRF, pontuação, relatórios, avaliação, exclusividade de flags entre usuários, limites, expiração, recuperação após reinício e o alvo SQL. Não substitui um teste com Docker real.

Com Docker aberto e imagens construídas, valide os dois alvos reais:

```powershell
.\.venv\Scripts\python.exe scripts/smoke_docker.py
```

Esse teste cria alvos temporários, acessa as flags via HTTP e remove containers/redes no final. No ambiente em que esta implementação foi preparada, Docker não estava instalado/disponível; build, Compose e isolamento em execução ainda precisam dessa validação.
