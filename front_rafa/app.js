"use strict";
/* CTF Purple Security Lab — protótipo funcional (dados salvos no navegador via localStorage) */
var KEY = "cpl_v1", $ = function (s) { return document.querySelector(s); };
var S; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
S = S || { me: null, solved: {}, purple: 0, co: null, invites: [] };
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
function sha(t) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) {
    return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  });
}
function ctf() { var n = 0; for (var k in S.solved) n += S.solved[k]; return n; }
function code(t) { return '<pre class="code mono">' + esc(t) + "</pre>"; }

/* ---------- Desafios (a flag é conferida pelo hash SHA-256) ---------- */
var LOG = ["10:02:11 sshd: Failed password for root from 185.220.101.7", "10:02:13 sshd: Failed password for root from 185.220.101.7",
  "10:02:15 sshd: Failed password for admin from 185.220.101.7", "10:03:40 sshd: Accepted password for ana from 10.0.0.5",
  "10:04:02 sshd: Failed password for root from 201.17.4.88", "10:04:09 sshd: Accepted password for deploy from 201.17.4.88",
  "10:05:21 sshd: Failed password for oracle from 185.220.101.7", "10:05:23 sshd: Failed password for test from 185.220.101.7",
  "10:06:50 sshd: Accepted password for bruno from 10.0.0.9", "10:07:12 sshd: Failed password for root from 185.220.101.7"].join("\n");
var CH = [
  { id: "web1", cat: "Web", t: "Cookie de admin", lvl: "Estágio", pts: 100, hash: "124c83cda0b01a3d12ac5893dc2f4e10f916c8231d5370a01a83853a23221225",
    d: "O painel guarda a sessão do administrador no seu navegador. Encontre o valor e decodifique.",
    h: "Abra as ferramentas do desenvolvedor (F12), vá em Application (Armazenamento local) e procure a chave sessao_admin. O valor está em base64: use atob() no console.", b: "" },
  { id: "web2", cat: "Web", t: "SQL no login", lvl: "Júnior red", pts: 200, hash: "cb4f95bf64890b73c049105817ecbbde10935be58da83a628e044cd266fa576d",
    d: "O formulário monta a consulta juntando texto. Entre como admin sem saber a senha.",
    h: "Feche a aspa do campo e force uma condição sempre verdadeira, como ' OR '1'='1.",
    b: '<form id="sq" class="card" style="margin-bottom:16px"><label>Usuário<input name="u" value="admin" autocomplete="off"></label><label>Senha<input name="p" autocomplete="off"></label><button class="btn" type="submit">Entrar</button><pre class="code mono" id="sqo" style="margin:0"></pre></form>' },
  { id: "for1", cat: "Forense", t: "Log do servidor", lvl: "Júnior blue", pts: 150, hash: "7533f842575915d46caacd6d23595433ddbf76359a2e975fc8fe578ff651170c",
    d: "Qual IP tentou mais logins que falharam? Envie no formato CTF{ip}.",
    h: "Conte as linhas Failed password por IP. Um dos IPs falhou várias vezes seguidas com usuários diferentes.", b: code(LOG) },
  { id: "cr1", cat: "Cripto", t: "Cifra de César", lvl: "Estágio", pts: 100, hash: "cc4e7b3025b598da8011ecd46401bd6ea6877a6c8d2a08a811d06d30688de1fa",
    d: "A flag foi cifrada deslocando cada letra. Descubra o deslocamento e decifre.",
    h: "Comece pelo prefixo: FWI deve virar CTF. Quantas letras o F andou até o C?", b: code("FWI{iuhtxhqfld}") },
  { id: "cr2", cat: "Cripto", t: "Base64 em camadas", lvl: "Júnior blue", pts: 250, hash: "41a7672e027efed6b619d629bde4bb0e6f87b5d4f528b6a9df3dfa09d69f519e",
    d: "A mensagem foi codificada em base64 duas vezes. Decodifique até aparecer a flag.",
    h: "No console do navegador rode atob(atob(texto)), trocando texto pela mensagem entre aspas.", b: code("UTFSR2UySmhjMlUyTkY5bGJWOWpZVzFoWkdGemZRPT0=") },
  { id: "re1", cat: "Reversa", t: "Senha escondida", lvl: "Júnior red", pts: 300, hash: "ad972fc949647eae33e3a76793507f5c1f6cb48fb359c96eaef7de71b9e24ceb",
    d: "A senha está guardada como números. Descubra qual texto o programa espera e envie CTF{senha}.",
    h: "No console do navegador rode String.fromCharCode(...lista).", b: code("const k = [112,117,114,112,108,101,50,48,50,54];\nfunction check(s){ return s === String.fromCharCode(...k); }") }
];
var cat = "Todos", open = null;
function rCh() {
  var el = $("#v-desafios");
  if (open) return rDet(el);
  var cs = ["Todos"].concat(CH.map(function (c) { return c.cat; }).filter(function (v, i, a) { return a.indexOf(v) == i; }));
  el.innerHTML = "<h2>Desafios CTF</h2><p>Resolva, envie a flag no formato CTF{...} e ganhe pontos. Cada desafio indica a vaga que avalia.</p>" +
    '<div class="tools" role="group" aria-label="Filtrar por categoria">' + cs.map(function (c) { return '<button class="chip" aria-pressed="' + (c == cat) + '" data-c="' + c + '">' + c + "</button>"; }).join("") + "</div>" +
    '<div class="list">' + CH.filter(function (c) { return cat == "Todos" || c.cat == cat; }).map(function (c) {
      var d = S.solved[c.id];
      return '<button class="ch' + (d ? " done" : "") + '" data-o="' + c.id + '"><div><h3>' + c.t + "</h3><p>" + c.d + '</p></div><span class="tag">' + c.cat + " · " + c.lvl + '</span><span class="pts mono">' + (d ? "✓ " : "") + c.pts + "</span></button>";
    }).join("") + "</div>";
  el.querySelectorAll("[data-c]").forEach(function (b) { b.onclick = function () { cat = b.dataset.c; rCh(); }; });
  el.querySelectorAll("[data-o]").forEach(function (b) { b.onclick = function () { open = b.dataset.o; rCh(); scrollTo(0, 0); }; });
}
function rDet(el) {
  var c = CH.filter(function (x) { return x.id == open; })[0];
  if (c.id == "web1") try { localStorage.setItem("sessao_admin", "Q1RGe2Nvb2tpZV9leHBvc3RvXzQyfQ=="); } catch (e) {}
  el.innerHTML = '<button class="btn ghost" id="bk">← Voltar aos desafios</button><h2 style="margin-top:18px">' + c.t + "</h2><p>" + c.d + "</p>" + c.b +
    '<details class="card" style="margin:0 0 16px"><summary>Preciso de uma dica</summary><p style="margin:10px 0 0">' + c.h + "</p></details>" +
    '<form id="fl"><label>Flag<input name="f" placeholder="CTF{...}" autocomplete="off" required></label><button class="btn" type="submit">Enviar flag</button><div class="msg" role="status">' +
    (S.solved[c.id] ? '<span class="good">Já resolvido: +' + S.solved[c.id] + " pontos.</span>" : "") + "</div></form>";
  $("#bk").onclick = function () { open = null; rCh(); };
  if (c.id == "web2") $("#sq").onsubmit = function (e) {
    e.preventDefault(); var u = this.u.value, p = this.p.value;
    var q = "SELECT * FROM usuarios WHERE nome='" + u + "' AND senha='" + p + "'";
    var ok = /'\s*or\s*'?1'?\s*=\s*'?1/i.test(u + p) || /^admin'\s*(--|#)/i.test(u);
    $("#sqo").textContent = q + "\n\n" + (ok ? "Login aceito como admin.\nflag: CTF{sqli_bypass_login}" : "Usuário ou senha incorretos.");
  };
  $("#fl").onsubmit = function (e) {
    e.preventDefault(); var m = this.querySelector(".msg"), v = this.f.value.trim();
    if (!window.crypto || !crypto.subtle) { m.innerHTML = '<span class="bad">Seu navegador bloqueou a verificação. Abra o site por http://localhost (python -m http.server) ou HTTPS.</span>'; return; }
    sha(v).then(function (h) {
      if (h != c.hash) { m.innerHTML = '<span class="bad">Flag incorreta. Confira o formato CTF{...} e tente de novo.</span>'; return; }
      if (!S.solved[c.id]) { S.solved[c.id] = c.pts; save(); upd(); m.innerHTML = '<span class="good">Flag correta! +' + c.pts + " pontos.</span>"; }
      else m.innerHTML = '<span class="good">Correto, mas esse desafio já tinha sido contado.</span>';
    });
  };
}

/* ---------- Arena Purple Team ---------- */
var TECH = [["T1566.001", "Phishing com anexo"], ["T1059.001", "Execução via PowerShell"], ["T1003.001", "Dump de memória do LSASS"], ["T1021.002", "Compartilhamento SMB/Admin"], ["T1053.005", "Tarefa agendada"]];
var PS = [["Uma funcionária abre um e-mail com anexo .docm.", "T1566.001", "s"], ["A macro executa PowerShell com comando codificado.", "T1059.001", "s"],
  ["O atacante extrai senhas da memória do processo lsass.exe.", "T1003.001", "n"], ["As credenciais roubadas são usadas para entrar em outro servidor por SMB.", "T1021.002", "n"], ["Uma tarefa agendada é criada para manter o acesso.", "T1053.005", "s"]];
function rPu() {
  var op = '<option value="">Escolha</option>' + TECH.map(function (t) { return '<option value="' + t[0] + '">' + t[0] + " · " + t[1] + "</option>"; }).join("");
  $("#v-purple").innerHTML = "<h2>Arena Purple Team</h2><p>Rodada 1: phishing até movimento lateral. Como red team, identifique a técnica de cada passo. Como blue team, diga se o SIEM gerou alerta. Depois escreva o relatório. Nota máxima: 200 pontos.</p>" +
    '<form id="pu" style="max-width:none">' + PS.map(function (s, i) {
      return '<div class="card" style="display:grid;gap:10px"><h3>Passo ' + (i + 1) + "</h3><p>" + s[0] + '</p><label>Técnica ATT&amp;CK<select name="t' + i + '" required>' + op + '</select></label><label>Houve alerta?<select name="d' + i + '" required><option value="">Escolha</option><option value="s">Sim, o SIEM alertou</option><option value="n">Não, passou sem alerta</option></select></label></div>';
    }).join("") + '<label>Relatório: liste as técnicas sem alerta e a regra de detecção que você criaria (mínimo 100 caracteres)<textarea name="rel" rows="5" required></textarea></label><button class="btn" type="submit" style="justify-self:start">Enviar rodada</button><div class="merge" id="pur" hidden></div></form>' +
    '<p class="mono" style="margin-top:14px">Melhor nota salva: ' + S.purple + " / 200</p>";
  $("#pu").onsubmit = function (e) {
    e.preventDefault(); var f = this.elements, sc = 0, fb = [];
    PS.forEach(function (s, i) {
      var a = f["t" + i].value == s[1], b = f["d" + i].value == s[2]; sc += (a ? 20 : 0) + (b ? 10 : 0);
      fb.push((a && b ? "✓" : "✗") + " Passo " + (i + 1) + ": " + s[1] + ", " + (s[2] == "s" ? "com alerta" : "sem alerta"));
    });
    var rep = f.rel.value.trim().length >= 100; if (rep) sc += 50;
    S.purple = Math.max(S.purple, sc); save(); upd();
    var r = $("#pur"); r.hidden = false;
    r.innerHTML = "<h3 class=\"p\">Nota desta tentativa: " + sc + " / 200</h3><p style=\"margin:0;white-space:pre-line\">" + fb.join("\n") + "\nRelatório: " + (rep ? "✓ completo" : "✗ escreva ao menos 100 caracteres") + "</p>";
    r.scrollIntoView({ block: "nearest" });
  };
}

/* ---------- Ranking, empresas e perfil ---------- */
var SEED = [["Ana L.", "Blue team", 450, 170], ["Bruno M.", "Red team", 500, 120], ["Carla S.", "Red team", 350, 150], ["Diego P.", "Blue team", 250, 140], ["Elisa R.", "Red team", 300, 60], ["Felipe T.", "Estágio", 200, 80]];
function cands() {
  var a = SEED.map(function (s) { return { n: s[0], p: s[1], c: s[2], u: s[3] }; });
  if (S.me && S.me.vis) a.push({ n: S.me.nome, p: S.me.vaga, c: ctf(), u: S.purple, me: 1 });
  a.forEach(function (x) { x.t = x.c + x.u; });
  return a.sort(function (a, b) { return b.t - a.t; });
}
function rRk() {
  var a = cands(), mx = Math.max.apply(null, a.map(function (x) { return x.t; })) || 1;
  $("#v-ranking").innerHTML = "<h2>Ranking de candidatos</h2><p>Os seis primeiros nomes são de exemplo. Seu nome aparece aqui quando você cria um perfil e autoriza.</p>" +
    '<div class="wrap"><table><thead><tr><th>#</th><th>Candidato</th><th>Perfil</th><th>CTF</th><th>Purple</th><th>Total</th></tr></thead><tbody>' +
    a.map(function (x, i) { return '<tr><td class="mono">' + (i + 1) + "</td><td>" + esc(x.n) + (x.me ? " (você)" : "") + "</td><td>" + esc(x.p) + '</td><td class="mono">' + x.c + '</td><td class="mono">' + x.u + '</td><td><div class="bar-s"><i style="width:' + Math.round(x.t / mx * 100) + '%"></i></div></td></tr>'; }).join("") + "</tbody></table></div>";
}
function rEm() {
  var el = $("#v-empresas");
  if (!S.co) {
    el.innerHTML = '<h2>Para empresas</h2><p>Cadastre sua empresa para ver candidatos e enviar convites.</p><form id="fe"><label>Empresa<input name="n" required></label><label>E-mail de contato<input name="e" type="email" required></label><button class="btn" type="submit">Entrar como empresa</button></form>';
    $("#fe").onsubmit = function (e) { e.preventDefault(); S.co = { n: this.n.value.trim(), e: this.e.value.trim() }; save(); rEm(); };
    return;
  }
  var min = +(el.dataset.min || 0), a = cands().filter(function (x) { return x.t >= min; });
  el.innerHTML = "<h2>Candidatos para " + esc(S.co.n) + "</h2><p>Filtre por nota mínima e convide quem você quer entrevistar.</p>" +
    '<div class="tools"><label style="display:flex;gap:8px;align-items:center">Nota mínima <select id="mn">' + [0, 200, 400, 600].map(function (n) { return '<option value="' + n + '"' + (n == min ? " selected" : "") + ">" + n + "</option>"; }).join("") + '</select></label><button class="chip" id="so">Sair da conta da empresa</button></div><div class="list">' +
    (a.length ? a.map(function (x) {
      var inv = S.invites.some(function (i) { return i.to == x.n && i.from == S.co.n; });
      return '<div class="ch"><div><h3>' + esc(x.n) + (x.me ? " (você)" : "") + "</h3><p>" + esc(x.p) + " · CTF " + x.c + " · Purple " + x.u + '</p></div><span class="pts mono">' + x.t + '</span><button class="btn' + (inv ? " ghost" : "") + '" data-i="' + esc(x.n) + '"' + (inv ? " disabled" : "") + ">" + (inv ? "Convidado ✓" : "Convidar") + "</button></div>";
    }).join("") : "<p>Nenhum candidato com essa nota ainda.</p>") + "</div>";
  $("#mn").onchange = function () { el.dataset.min = this.value; rEm(); };
  $("#so").onclick = function () { S.co = null; save(); rEm(); };
  el.querySelectorAll("[data-i]").forEach(function (b) { b.onclick = function () { S.invites.push({ to: b.dataset.i, from: S.co.n }); save(); rEm(); }; });
}
function rCa() {
  var el = $("#v-candidatura");
  if (!S.me) {
    el.innerHTML = '<h2>Crie seu perfil</h2><p>Leva um minuto. Seus dados ficam salvos só neste navegador.</p><form id="fc"><label>Nome<input name="n" required></label><label>E-mail<input name="e" type="email" required></label><label>Quero uma vaga de<select name="v"><option>Estágio em segurança</option><option>Júnior blue team</option><option>Júnior red team</option></select></label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="vis" checked style="width:auto"> Aparecer no ranking e para empresas</label><button class="btn" type="submit">Criar perfil</button></form>';
    $("#fc").onsubmit = function (e) { e.preventDefault(); S.me = { nome: this.n.value.trim(), email: this.e.value.trim(), vaga: this.v.value, vis: this.vis.checked }; save(); rCa(); upd(); };
    return;
  }
  var inv = S.invites.filter(function (i) { return i.to == S.me.nome; });
  el.innerHTML = "<h2>Olá, " + esc(S.me.nome) + "</h2><p>Vaga desejada: " + esc(S.me.vaga) + '.</p><div class="stats" style="grid-template-columns:repeat(3,1fr)"><div><b>' + ctf() + "</b><span>pontos em CTF (" + Object.keys(S.solved).length + " de " + CH.length + ' resolvidos)</span></div><div><b>' + S.purple + "</b><span>melhor nota Purple Team</span></div><div><b>" + inv.length + "</b><span>convites de empresas</span></div></div>" +
    (inv.length ? "<h3>Convites</h3><p>" + inv.map(function (i) { return esc(i.from); }).join(", ") + " quer conversar com você.</p>" : "<p>Resolva mais desafios para subir no ranking e receber convites.</p>") +
    '<a class="btn" href="#desafios">Ir para os desafios</a> <button class="btn ghost" id="rs">Apagar meus dados</button>';
  $("#rs").onclick = function () { if (confirm("Apagar perfil, pontos e convites deste navegador?")) { S = { me: null, solved: {}, purple: 0, co: null, invites: [] }; save(); upd(); rCa(); } };
}

/* ---------- Navegação e início ---------- */
var V = ["inicio", "desafios", "purple", "ranking", "empresas", "candidatura"], R = { desafios: rCh, purple: rPu, ranking: rRk, empresas: rEm, candidatura: rCa };
function upd() { var p = $("#pts"); if (p) p.textContent = ctf() + S.purple; }
function route() {
  var h = (location.hash || "#inicio").slice(1); if (V.indexOf(h) < 0) h = "inicio";
  V.forEach(function (v) { $("#v-" + v).hidden = v != h; });
  document.querySelectorAll("nav a").forEach(function (a) { if (a.getAttribute("href") == "#" + h) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (R[h]) R[h](); upd(); scrollTo(0, 0);
}
addEventListener("hashchange", route); route();

var L = [["r", "[red]  login com credencial vazada em srv-fin02"], ["b", "[blue] SIEM: autenticação fora do horário"], ["r", "[red]  execução de PowerShell codificado"], ["b", "[blue] EDR: processo filho suspeito do Office"], ["p", "[purple] técnica T1059 detectada em 41 s"], ["r", "[red]  dump de credenciais tentado"], ["p", "[purple] T1003 sem alerta: criar regra"], ["g", "[ok]   regra criada e testada, relatório enviado"]];
var lg = $("#log"), li = 0, still = false;
try { still = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
function line() { var s = document.createElement("span"); s.className = L[li][0]; s.textContent = L[li][1] + "\n"; lg.appendChild(s); li++; }
(function tick() { if (li >= L.length) return; line(); if (still) tick(); else setTimeout(tick, 900); })();
