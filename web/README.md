# Interface Purple Talent

PHP 8.3 + HTML + JavaScript sem framework. Tailwind 3 compilado e estilos próprios; fontes Plus Jakarta Sans, Inter e JetBrains Mono servidas localmente a partir dos pacotes Fontsource (licenças SIL OFL nos pacotes).

## Desenvolvimento

```powershell
npm ci
npm run build
php -S 127.0.0.1:8086 -t public router.php
```

O servidor PHP isolado permite inspecionar a interface. Para consumir a API, utilize o gateway do Compose descrito no README da raiz. A interface usa `api/` no mesmo endereço, cookies HttpOnly e não armazena tokens em localStorage. O PHP não consulta o banco nem duplica regras de negócio.

## Organização

- `public/index.php`: entrada, cabeçalhos e composição da página.
- `src/pages`: templates de visão geral, ranking, arenas, dossiê, vagas e login.
- `src/widgets`: navegação reutilizável.
- `src/shared`: ícones sem dependências de páginas.
- `src/app/styles/input.css`: tokens e estilos da aplicação.
- `public/assets/app.js`: inicialização e integração com a API.
- `public/assets/app.css` e `fonts/`: saídas locais do build.

## Fluxos

Recrutador acessa visão geral, ranking, dossiês, desafios e vagas. Participante acessa arenas, envia bandeira com relatório e consulta seu dossiê pelo menu de conta. As permissões são verificadas na API. Falhas de conexão, autenticação e listas vazias têm estados explícitos, sem números fictícios de fallback.

As competências informadas no cadastro são separadas das evidências de desafios. As vagas são demonstrativas e não disparam candidaturas nem contatos externos. A criação automática de laboratórios e o matchmaking avançado permanecem no planejamento.

## Verificação

`npm run build`, `node --check public/assets/app.js` e `php -l` nos templates. A inspeção visual e os testes de integração são registrados pelo gerente no relatório de validação da raiz.
