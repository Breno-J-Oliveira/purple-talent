<?php
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
require __DIR__ . '/../src/shared/icons.php';
$pages = ['dashboard'=>'Visão geral','ranking'=>'Talent Pool & Ranking','arenas'=>'CTF Arenas & Desafios','candidate'=>'Dossiê do candidato','jobs'=>'Vagas & Matchmaking','login'=>'Acessar plataforma'];
$page = $_GET['page'] ?? 'dashboard';
if (!is_string($page) || !isset($pages[$page])) { http_response_code(404); $page = 'notfound'; }
$title = $pages[$page] ?? 'Página não encontrada';
?>
<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0f131c"><title><?= htmlspecialchars($title) ?> · Purple Talent</title><link rel="stylesheet" href="assets/app.css"><script src="assets/app.js" defer></script></head>
<body data-page="<?= $page ?>">
<a class="skip-link" href="#main">Ir para o conteúdo</a>
<?php require __DIR__ . '/../src/widgets/sidebar.php'; ?>
<div class="workspace">
<header class="topbar"><div class="topbar-left"><button class="icon-button mobile-menu" id="menu-toggle" aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menu"><?= icon('menu') ?></button><span class="breadcrumb">Workspace <span>/</span> <strong><?= htmlspecialchars($title) ?></strong></span></div><div class="topbar-right"><span class="academic"><span></span> Ambiente acadêmico</span><a class="account" id="account" href="?page=login"><?= icon('user') ?><span>Acessar conta</span></a><button class="icon-button hidden" id="logout" aria-label="Sair da conta"><?= icon('logout') ?></button></div></header>
<main id="main" tabindex="-1"><?php require __DIR__ . '/../src/pages/' . ($page === 'notfound' ? 'notfound' : $page) . '.php'; ?></main>
<footer class="footer"><span>Purple Talent · Projeto SAGA</span><span>Competência se demonstra na prática.</span></footer>
</div><div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
</body></html>
