# Critérios de entrega — Purple Talent v1

Versão destinada à revisão humana do projeto acadêmico. A conclusão técnica desta versão depende dos critérios abaixo; não equivale à aprovação da LabWare, pesquisa com usuários reais ou homologação para produção.

## Experiência proposta

A interface deve acompanhar a pessoa da intenção ao resultado. O participante sabe o que fazer, encontra materiais do desafio, registra evidências e entende sua evolução. O recrutador encontra informações verificáveis, avalia resoluções e conduz candidaturas sem depender de números decorativos.

Preservar Plus Jakarta Sans nos títulos, Inter na leitura e JetBrains Mono nos materiais técnicos. Base #0f131c, superfícies #181b25, texto #dfe2ef, roxo #ddb7ff para convergência/ações, azul #adc6ff para defesa, vermelho #ffb3ad para ataque. Cores de trilha sempre acompanhadas de texto. Elementos técnicos devem representar dados ou materiais de exercício reais; não simular telemetria operacional inexistente.

## Jornadas obrigatórias

- [ ] Pessoa cria conta de candidato sem escolher privilégios elevados.
- [ ] Entra, sai e recebe mensagem útil para credenciais incorretas ou sessão expirada.
- [ ] Completa perfil e controla sua descoberta por recrutadores.
- [ ] Dashboard apresenta ações e dados adequados ao papel.
- [ ] Participante encontra briefing, objetivo, material, regras e envio de cada desafio ativo.
- [ ] Resolve exercícios Red/Blue/Purple disponíveis e registra flag e relatório.
- [ ] Tentativa incorreta não pontua; reenvio e concorrência não duplicam pontos.
- [ ] Histórico e dossiê explicam a origem dos resultados e distinguem perfil informado de evidências.
- [ ] Recrutador consulta ranking, filtros e perfis autorizados.
- [ ] Recrutador avalia uma resolução por rubrica e registra justificativa visível ao candidato.
- [ ] Dossiê pode ser impresso/salvo em PDF pelo navegador com layout próprio.
- [ ] Recrutador cria e edita vaga com requisitos explícitos.
- [ ] Candidato consulta compatibilidade explicada e se candidata consentindo o compartilhamento necessário.
- [ ] Candidato vê somente candidaturas próprias; recrutador acompanha etapas do processo.
- [ ] Mudanças sensíveis são auditadas sem armazenar segredos nos logs.

## Qualidade e operação

- [ ] PostgreSQL real com migrações e carga demonstrativa validada, sem trocar persistência por mock.
- [ ] Testes cobrem autorização, consentimento, transições e invariantes do domínio.
- [ ] Navegador confirma jornadas autenticadas dos dois papéis.
- [ ] Layout e ações essenciais funcionam em 375, 768 e 1440 px.
- [ ] Menu/dialogs/formulários operáveis por teclado com foco perceptível.
- [ ] Carregamento, vazio, falha e sucesso têm instruções compreensíveis.
- [ ] Fontes/CSS locais, build e lint aprovados; dependências auditadas.
- [ ] Lab vulnerável fica separado dos serviços da plataforma e acessível apenas localmente.
- [ ] Inicialização e restauração são documentadas; não há reset destrutivo automático.
- [ ] Pipeline CI reproduz verificações dos componentes e banco de teste.
- [ ] Código e evidências publicados no repositório autorizado, sem .env ou artefatos temporários.

## Limites desta versão

O laboratório local e as vagas de demonstração usam dados fictícios. Não haverá alegações de antifraude garantido ou seleção automática. A avaliação humana de relatório é parte explícita da solução. Não incluir serviços pagos, envio de emails reais ou integrações externas sem necessidade/autorização. Recuperação de senha por email, isolamento hostil multiusuário com instâncias por equipe, gestão de campeonatos e publicação em produção são expansões condicionadas ao piloto; não serão anunciadas como implementadas.

## Revisão humana final

O dono verifica linguagem, identidade, aderência ao trabalho acadêmico e facilidade das tarefas. Registrar sua decisão e correções após a entrega técnica; os agentes não substituem essa aprovação.
