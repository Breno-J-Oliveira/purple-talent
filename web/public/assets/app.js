(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
  const initials = (name) => String(name || 'PT').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('');
  const trackName = {RED:'Red Team', BLUE:'Blue Team', PURPLE:'Purple Team'};
  const badge = (track) => `<span class="track-badge ${['RED','BLUE','PURPLE'].includes(track) ? track : ''}">${escape(trackName[track] || track || 'Participante')}</span>`;
  let user = null;
  class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
  async function api(path, options = {}) {
    let response;
    try { response = await fetch(`api/${path}`, {credentials:'same-origin', ...options, headers:{Accept:'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers}}); }
    catch { throw new ApiError('Não foi possível conectar à plataforma. Verifique sua conexão e tente novamente.', 0); }
    let data;
    try { data = await response.json(); } catch { throw new ApiError('A plataforma não retornou uma resposta válida. Tente novamente em instantes.', response.status); }
    if (!response.ok) throw new ApiError(typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : 'Não foi possível concluir a solicitação.', response.status);
    return data;
  }
  function errorState(target, error, retry = true) {
    if (!target) return;
    const restricted = [401,403].includes(error.status);
    target.innerHTML = `<div class="state-box ${restricted ? '' : 'error'}"><h3>${restricted ? 'Acesse sua área de trabalho' : 'Não conseguimos carregar estes dados'}</h3><p>${restricted ? error.status === 403 ? 'Sua conta não tem permissão para consultar esta área. Participantes podem acessar desafios e o próprio dossiê.' : 'Entre com sua conta para consultar as informações desta área.' : escape(error.message)}</p>${restricted ? '<a class="button primary" href="?page=login">Acessar conta</a>' : retry ? '<button class="button secondary" type="button" data-retry>Tentar novamente</button>' : ''}</div>`;
    target.querySelector('[data-retry]')?.addEventListener('click', () => window.location.reload());
  }
  const emptyState = (message) => `<div class="state-box"><h3>Ainda não há registros por aqui.</h3><p>${escape(message)}</p></div>`;
  function candidateRow(candidate, index) {
    return `<article class="candidate-row"><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><span class="avatar" aria-hidden="true">${escape(initials(candidate.name))}</span><div><a class="candidate-name" href="?page=candidate&amp;id=${encodeURIComponent(candidate.id)}">${escape(candidate.name)}</a><div class="candidate-meta"><span>@${escape(String(candidate.handle || '').replace(/^@/, ''))}</span>${badge(candidate.track)}</div></div><div class="candidate-score">${number(candidate.score)}<small>pontos</small></div></article>`;
  }
  async function loadDashboard() {
    const target = $('#featured-candidates');
    try {
      const [stats, candidates] = await Promise.all([api('dashboard'), api('candidates')]);
      const metrics = [['Participantes',stats.candidates,'Talentos cadastrados'],['Desafios disponíveis',stats.challenges,'Ataque, defesa e convergência'],['Submissões registradas',stats.submissions,'Evidências de participação'],['Oportunidades',stats.jobs,'Primeiros passos na carreira']];
      $('#metrics').innerHTML = metrics.map(([label,value,caption]) => `<div class="metric"><span>${label}</span><strong>${number(value)}</strong><small>${caption}</small></div>`).join('');
      target.innerHTML = candidates.items.length ? candidates.items.slice(0, 4).map(candidateRow).join('') : emptyState('Os participantes aparecerão aqui após o cadastro.');
    } catch (error) { errorState(target, error); }
  }
  async function loadRanking() {
    const target = $('#candidate-results');
    const form = $('#filters');
    const search = new URLSearchParams(new FormData(form));
    try {
      target.innerHTML = '<p class="loading">Consultando participantes…</p>';
      const data = await api(`candidates?${search}`);
      target.innerHTML = data.items.length ? data.items.map(candidateRow).join('') : emptyState('Tente outro nome ou selecione uma trilha diferente.');
      $('#result-count').textContent = `${number(data.items.length)} participante(s)`;
    } catch(error) { errorState(target,error); }
  }
  async function loadChallenges() {
    const target = $('#challenge-results');
    try {
      const data = await api('challenges');
      target.innerHTML = data.items.length ? data.items.map(challenge => `<article class="challenge-card ${['RED','BLUE','PURPLE'].includes(challenge.track) ? challenge.track : ''}"><div>${badge(challenge.track)}</div><h2>${escape(challenge.title)}</h2><p>${escape(challenge.description)}</p><div class="card-meta"><span>${escape(challenge.difficulty || 'Prático')}</span><span>${number(challenge.points)} pts</span></div>${challenge.id === 'web-investigation' ? '<a class="button secondary" href="http://localhost:8091" target="_blank" rel="noopener noreferrer">Abrir laboratório local</a><p class="muted">O organizador precisa iniciar o perfil de laboratórios. Investigue somente esse ambiente autorizado.</p>' : ''}<button type="button" class="button primary" data-submit="${escape(challenge.id)}">Enviar resolução</button></article>`).join('') : emptyState('Novos desafios aparecerão aqui quando forem disponibilizados.');
      target.querySelectorAll('[data-submit]').forEach(button => button.addEventListener('click', () => {
        if (!user) { window.location.href = '?page=login'; return; }
        if (user.role !== 'CANDIDATE') { $('#announcement').textContent = 'Somente participantes podem enviar resoluções.'; button.textContent = 'Envio exclusivo para participantes'; return; }
        $('#submission-form').dataset.challenge = button.dataset.submit;
        $('#submission-title').textContent = 'Enviar resolução';
        $('#submission-form').reset();
        $('#submission-message').textContent = '';
        $('#submission-dialog').showModal();
      }));
    } catch(error) { errorState(target, error); }
  }
  async function loadCandidate() {
    const target = $('#candidate-detail');
    const id = new URLSearchParams(window.location.search).get('id') || user?.candidateId;
    if (!id) { target.innerHTML = emptyState('Escolha um participante no Talent Pool para abrir seu dossiê.'); return; }
    try {
      const data = await api(`candidates/${encodeURIComponent(id)}`);
      const c = data.candidate;
      target.innerHTML = `<section class="panel profile-header"><span class="avatar" aria-hidden="true">${escape(initials(c.name))}</span><div><h2>${escape(c.name)}</h2><div class="candidate-meta"><span>@${escape(String(c.handle || '').replace(/^@/,''))}</span>${badge(c.track)}<span>${escape(c.location || '')}</span></div><p>${escape(c.bio || 'Este participante ainda não adicionou uma apresentação.')}</p></div></section><div class="profile-columns"><section class="panel"><h2>Competências & resultados</h2><div class="score-line"><span>Pontuação acumulada</span><strong>${number(c.score)} pts</strong></div><div class="score-line"><span>Red Team</span><strong>${number(c.redScore)} pts</strong></div><div class="score-line"><span>Blue Team</span><strong>${number(c.blueScore)} pts</strong></div><div class="score-line"><span>Purple Team</span><strong>${number(c.purpleScore)} pts</strong></div><h3 style="margin-bottom:12px">Competências informadas no perfil</h3><div class="skill-list">${(c.skills || []).map(skill => `<span class="skill">${escape(skill)}</span>`).join('')}</div><p class="muted" style="margin-top:22px">As pontuações refletem os desafios registrados. Habilidades comportamentais dependem de avaliação humana.</p></section><section class="panel"><h2>Evidências & resoluções</h2>${data.evidence?.length ? data.evidence.map(item => `<article class="evidence"><h3>${escape(item.challenge)}</h3><small>${escape(trackName[item.track] || item.track)} · ${number(item.points)} pontos · ${escape(new Date(item.createdAt).toLocaleDateString('pt-BR'))}</small><p>${escape(item.writeup)}</p></article>`).join('') : emptyState('As resoluções aceitas serão apresentadas aqui com suas evidências.')}</section></div>`;
    } catch(error) { errorState(target,error); }
  }
  async function loadJobs() {
    const target = $('#job-results');
    try {
      const data = await api('jobs');
      target.innerHTML = data.items.length ? data.items.map(job => `<article class="challenge-card ${['RED','BLUE','PURPLE'].includes(job.track) ? job.track : ''}"><div>${badge(job.track)}</div><h2>${escape(job.title)}</h2><div class="card-meta"><span>${escape(job.company)}</span></div><p>${escape(job.description)}</p><div class="skill-list">${(job.requirements || []).map(skill => `<span class="skill">${escape(skill)}</span>`).join('')}</div><p>${escape(job.location || '')}</p><a class="button secondary" href="?page=arenas">Desenvolver minhas competências</a></article>`).join('') : emptyState('As oportunidades serão listadas aqui quando estiverem disponíveis.');
    } catch(error) { errorState(target,error); }
  }
  async function session() {
    try {
      const data = await api('auth/me'); user = data.user;
      if (user) {
        $('#account span').textContent = user.name;
        $('#account').href = user.candidateId ? `?page=candidate&id=${encodeURIComponent(user.candidateId)}` : '?page=dashboard';
        $('#logout').classList.remove('hidden');
      }
    } catch { user = null; }
  }
  const mobileViewport = window.matchMedia('(max-width: 767px)');
  function syncMenuAccess() {
    const sidebar = $('#sidebar');
    if (sidebar) sidebar.inert = mobileViewport.matches && !sidebar.classList.contains('open');
  }
  syncMenuAccess();
  mobileViewport.addEventListener('change', () => {
    $('#sidebar')?.classList.remove('open');
    $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
    syncMenuAccess();
  });
  $('#menu-toggle')?.addEventListener('click', () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    syncMenuAccess();
    if (open) $('#sidebar a')?.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#sidebar')?.classList.contains('open')) {
      $('#sidebar').classList.remove('open');
      $('#menu-toggle')?.setAttribute('aria-expanded','false');
      $('#menu-toggle')?.setAttribute('aria-label','Abrir menu');
      syncMenuAccess();
      $('#menu-toggle')?.focus();
    }
  });
  $('#filters')?.addEventListener('submit', event => { event.preventDefault(); loadRanking(); });
  $('#close-dialog')?.addEventListener('click', () => $('#submission-dialog').close());
  $('#logout')?.addEventListener('click', async () => { try { await api('auth/logout',{method:'POST'}); window.location.href='?page=login'; } catch(error) { $('#announcement').textContent = error.message; $('#logout').textContent = 'Falha ao sair. Tente novamente.'; } });
  $('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button'), message = $('#login-message');
    button.disabled = true; message.textContent = 'Verificando sua conta…'; message.className = '';
    try {
      const data = await api('auth/login', {method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      window.location.href = data.user?.role === 'CANDIDATE' ? '?page=arenas' : '?page=dashboard';
    } catch(error) { message.textContent = [401,403].includes(error.status) ? 'E-mail ou senha inválidos. Confira seus dados e tente novamente.' : error.message; message.className = 'error-message'; }
    finally { button.disabled = false; }
  });
  $('#submission-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button'), message = $('#submission-message');
    button.disabled = true; message.textContent = 'Validando sua resolução…'; message.className = '';
    try {
      const data = await api(`challenges/${encodeURIComponent(form.dataset.challenge)}/submissions`, {method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      message.textContent = data.duplicate ? 'Esta resolução já havia sido registrada. Sua pontuação foi mantida.' : `Resolução aceita! ${number(data.points)} pontos registrados no seu dossiê.`;
      message.className = 'success-message'; form.reset();
    } catch(error) { message.textContent = error.status === 422 ? 'A bandeira não foi aceita. Revise sua investigação e tente novamente.' : error.message; message.className = 'error-message'; }
    finally { button.disabled = false; }
  });
  async function boot() {
    await session();
    const page = document.body.dataset.page;
    if (page === 'dashboard') await loadDashboard();
    if (page === 'ranking') await loadRanking();
    if (page === 'arenas') await loadChallenges();
    if (page === 'candidate') await loadCandidate();
    if (page === 'jobs') await loadJobs();
  }
  boot().catch(error => errorState($('main'),error));
})();
