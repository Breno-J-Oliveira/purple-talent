<aside class="sidebar" id="sidebar" aria-label="Menu principal">
<a class="brand" href="?page=dashboard"><span class="brand-icon"><?= icon('shield') ?></span><span>Purple<span class="brand-accent">Talent</span><small>Cyber recruiting platform</small></span></a>
<div class="workspace-label">Workspace de talentos</div>
<nav>
<?php foreach ([['dashboard','grid','Visão geral','O panorama da plataforma'],['ranking','rank','Talent Pool & Ranking','Talentos e competências'],['arenas','flag','CTF Arenas & Desafios','Ataque, defesa e evidências'],['jobs','briefcase','Vagas & Matchmaking','Conectando oportunidades']] as [$key,$symbol,$label,$hint]): ?>
<a class="nav-link <?= $page === $key || ($page === 'candidate' && $key === 'ranking') ? 'active' : '' ?>" href="?page=<?= $key ?>" <?= $page === $key ? 'aria-current="page"' : '' ?>><?= icon($symbol) ?><span><?= $label ?><small><?= $hint ?></small></span></a>
<?php endforeach; ?>
</nav>
<div class="sidebar-method"><div class="team-line"><span class="team-dot red"></span><span class="team-dot purple"></span><span class="team-dot blue"></span></div><strong>Uma visão. Os dois lados.</strong><p>Conecte ataque e defesa para revelar competências reais.</p><a href="?page=arenas">Explorar os desafios <?= icon('arrow') ?></a></div>
<div class="sidebar-bottom"><?= icon('shield') ?><div>Laboratório de aprendizagem<small>Dados demonstrativos identificados</small></div></div>
</aside>
