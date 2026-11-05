import base64, hashlib, os, secrets, sqlite3, threading, time
from functools import wraps
from flask import Flask, g, render_template, request, redirect, session, flash, abort
from werkzeug.security import generate_password_hash, check_password_hash
import orchestrator as orch

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(32)
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax", MAX_CONTENT_LENGTH=65536)
ENV_LOCK = threading.RLock()
DB = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "lab.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'participante', team TEXT);
CREATE TABLE IF NOT EXISTS challenges(id INTEGER PRIMARY KEY, title TEXT, category TEXT, side TEXT, points INTEGER, description TEXT, hint TEXT, url TEXT, flag_hash TEXT);
CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY, user_id INTEGER, challenge_id INTEGER, correct INTEGER, created_at INTEGER);
CREATE TABLE IF NOT EXISTS instances(id INTEGER PRIMARY KEY, user_id INTEGER, challenge_id INTEGER, container TEXT, port INTEGER, flag_hash TEXT, started_at INTEGER, expires_at INTEGER, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS starts(user_id INTEGER, challenge_id INTEGER, started_at INTEGER, PRIMARY KEY(user_id, challenge_id));
CREATE TABLE IF NOT EXISTS evaluations(id INTEGER PRIMARY KEY, user_id INTEGER, mentor_id INTEGER, logica INTEGER, comunicacao INTEGER, colaboracao INTEGER, decisao INTEGER, notes TEXT, created_at INTEGER);
"""

LOG = """10.0.0.5 - login falhou - usuario=maria
192.168.56.23 - login falhou - usuario=admin
192.168.56.23 - login falhou - usuario=root
10.0.0.8 - login ok - usuario=joao
192.168.56.23 - login falhou - usuario=admin
172.16.0.4 - login falhou - usuario=ana
192.168.56.23 - login falhou - usuario=teste"""

# (titulo, categoria, lado, pontos, descricao, dica, url, flag)
SEED = [
    ("Boas-vindas", "Geral", "Aquecimento", 50,
     "Sua primeira flag: CTF{bem_vindo_ao_purple_lab}. Copie e envie abaixo.", "Copie e cole.", "",
     "CTF{bem_vindo_ao_purple_lab}"),
    ("Intranet esquecida", "Web", "Red Team", 100,
     "Suba o container deste desafio (veja o README) e acesse a intranet. Existe um arquivo que os robôs de busca "
     "foram instruídos a ignorar. Encontre a flag.", "Todo site pode ter um /robots.txt.", "http://localhost:5001",
     "CTF{robots_txt_entrega_segredos}"),
    ("Texto estranho", "Criptografia", "Red Team", 100,
     "Interceptamos esta mensagem: " + base64.b64encode(b"CTF{base64_nao_e_criptografia}").decode()
     + "\nDecodifique-a para obter a flag.", "Isso é uma codificação, não uma cifra.", "",
     "CTF{base64_nao_e_criptografia}"),
    ("Quem está atacando?", "Análise de logs", "Blue Team", 150,
     "O servidor registrou os logs abaixo. Identifique o IP com mais falhas de login e envie a flag no formato "
     "CTF{ip}.\n\n" + LOG, "Conte as linhas 'login falhou' por IP.", "", "CTF{192.168.56.23}"),
]

def h(flag):
    return hashlib.sha256(flag.strip().encode()).hexdigest()

def init_db():
    os.makedirs(os.path.dirname(os.path.abspath(DB)), exist_ok=True)
    con = sqlite3.connect(DB, timeout=30)
    con.executescript(SCHEMA)
    if not con.execute("SELECT 1 FROM users").fetchone():
        con.execute("INSERT INTO users(name,email,password,role,team) VALUES(?,?,?,?,?)",
                    ("Mentor", "mentor@cti.local", generate_password_hash(os.environ.get("MENTOR_PASSWORD", "mentor123")), "mentor", "Mentoria"))
    if not con.execute("SELECT 1 FROM challenges").fetchone():
        for t, c, s, p, d, hint, url, flag in SEED:
            con.execute("INSERT INTO challenges(title,category,side,points,description,hint,url,flag_hash) VALUES(?,?,?,?,?,?,?,?)",
                        (t, c, s, p, d, hint, url, h(flag)))
    cols = {r[1] for r in con.execute("PRAGMA table_info(challenges)")}
    for col, typ in (("image", "TEXT"), ("container_port", "INTEGER")):
        if col not in cols:
            con.execute(f"ALTER TABLE challenges ADD COLUMN {col} {typ}")
    con.execute("UPDATE challenges SET image='cti-lab/web-01', container_port=5000, url='', description=? "
                "WHERE title='Intranet esquecida' AND image IS NULL",
                ("Clique em 'Iniciar ambiente' para criar a sua intranet isolada e acesse o endereço mostrado. "
                 "Existe um arquivo que os robôs de busca foram instruídos a ignorar. Encontre a flag.",))
    con.execute("""CREATE TABLE IF NOT EXISTS purple_reports (
        id INTEGER PRIMARY KEY, user_id INTEGER, report TEXT, score INTEGER, created_at INTEGER)""")
    extras = [
        ("Cifra de César", "Criptografia", "Red Team", 100,
         "Decifre a mensagem deslocando as letras: FWI{iuhtxhqfld}", "FWI deve virar CTF: volte três letras.", "CTF{frequencia}"),
        ("Base64 em camadas", "Criptografia", "Blue Team", 250,
         "Decodifique duas vezes: UTFSR2UySmhjMlUyTkY5bGJWOWpZVzFoWkdGemZRPT0=", "Base64 pode ser aplicado mais de uma vez.", "CTF{base64_em_camadas}"),
        ("Senha escondida", "Reversa", "Red Team", 300,
         "Converta os códigos ASCII e envie CTF{senha}: [112,117,114,112,108,101,50,48,50,54]", "String.fromCharCode pode ajudar.", "CTF{purple2026}"),
        ("SQL no login", "Web", "Red Team", 200,
         "Inicie seu ambiente e entre como admin sem conhecer a senha. Investigue o formulário de login.", "Como uma aspa altera uma consulta SQL concatenada?", "unused"),
    ]
    for title, category, side, points, description, hint, flag in extras:
        if not con.execute("SELECT 1 FROM challenges WHERE title=?", (title,)).fetchone():
            con.execute("INSERT INTO challenges(title,category,side,points,description,hint,url,flag_hash) VALUES(?,?,?,?,?,?,?,?)",
                        (title, category, side, points, description, hint, "", h(flag)))
    con.execute("UPDATE challenges SET image='cti-lab/web-02', container_port=5000 WHERE title='SQL no login'")
    con.commit(); con.close()

def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB, timeout=30)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(_):
    d = g.pop("db", None)
    if d:
        d.close()

def login_required(f):
    @wraps(f)
    def w(*a, **k):
        if "user_id" not in session:
            return redirect("/login")
        return f(*a, **k)
    return w

def mentor_required(f):
    @wraps(f)
    @login_required
    def w(*a, **k):
        if session.get("role") != "mentor":
            abort(403)
        return f(*a, **k)
    return w

@app.route("/")
def index():
    return render_template("home.html", count=db().execute("SELECT COUNT(*) FROM challenges").fetchone()[0],
                           points=db().execute("SELECT SUM(points) FROM challenges").fetchone()[0])

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        f = request.form
        if not f.get("name", "").strip() or "@" not in f.get("email", "") or len(f.get("password", "")) < 8:
            flash("Informe nome, e-mail válido e senha com pelo menos 8 caracteres.")
            return render_template("register.html"), 400
        try:
            db().execute("INSERT INTO users(name,email,password,team) VALUES(?,?,?,?)",
                         (f["name"].strip(), f["email"].strip().lower(),
                          generate_password_hash(f["password"]), f.get("team", "").strip() or "Sem equipe"))
            db().commit()
            flash("Conta criada! Faça login.")
            return redirect("/login")
        except sqlite3.IntegrityError:
            flash("Este e-mail já está cadastrado.")
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        u = db().execute("SELECT * FROM users WHERE email=?", (request.form["email"].strip().lower(),)).fetchone()
        if u and check_password_hash(u["password"], request.form["password"]):
            session.clear()
            session.update(user_id=u["id"], name=u["name"], role=u["role"])
            return redirect("/")
        flash("E-mail ou senha inválidos.")
    return render_template("login.html")

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect("/login")

@app.route("/challenges")
@login_required
def challenges():
    d = db()
    solved = {r[0] for r in d.execute("SELECT challenge_id FROM attempts WHERE user_id=? AND correct=1", (session["user_id"],))}
    category = request.args.get("category", "")
    categories = [row[0] for row in d.execute("SELECT DISTINCT category FROM challenges ORDER BY category")]
    items = d.execute("SELECT * FROM challenges WHERE (?='' OR category=?) ORDER BY id", (category, category)).fetchall()
    return render_template("challenges.html", items=items, solved=solved, categories=categories, category=category)

TTL = int(os.environ.get("LAB_TTL_SECONDS", "3600"))
MAX_ACTIVE = int(os.environ.get("LAB_MAX_ACTIVE", "10"))
MAX_PER_USER = int(os.environ.get("LAB_MAX_PER_USER", "2"))

def reap_expired():
    with ENV_LOCK:
        con = sqlite3.connect(DB, timeout=30)
        try:
            now = int(time.time())
            for iid, name in con.execute("SELECT id, container FROM instances WHERE active=1 AND expires_at<=?", (now,)).fetchall():
                orch.stop(name)
                con.execute("UPDATE instances SET active=0 WHERE id=?", (iid,))
                con.commit()
        finally:
            con.close()

def reaper_loop():
    while True:
        time.sleep(60)
        try:
            reap_expired()
        except Exception:
            app.logger.exception("Falha ao encerrar ambientes expirados")

def active_instance(d, uid, cid):
    return d.execute("SELECT * FROM instances WHERE user_id=? AND challenge_id=? AND active=1 AND expires_at>=?",
                     (uid, cid, int(time.time()))).fetchone()

def stop_instance(d, row):
    with ENV_LOCK:
        orch.stop(row["container"])
        d.execute("UPDATE instances SET active=0 WHERE id=?", (row["id"],))
        d.commit()

@app.route("/challenge/<int:cid>", methods=["GET", "POST"])
@login_required
def challenge(cid):
    d, uid = db(), session["user_id"]
    c = d.execute("SELECT * FROM challenges WHERE id=?", (cid,)).fetchone()
    if not c:
        abort(404)
    d.execute("INSERT OR IGNORE INTO starts VALUES(?,?,?)", (uid, cid, int(time.time())))
    d.commit()
    solved = d.execute("SELECT 1 FROM attempts WHERE user_id=? AND challenge_id=? AND correct=1", (uid, cid)).fetchone() is not None
    if request.method == "POST" and not solved:
        flag = request.form.get("flag", "")
        if c["image"]:   # desafio com ambiente: a flag é única por participante
            hashes = [r[0] for r in d.execute("SELECT flag_hash FROM instances WHERE user_id=? AND challenge_id=?", (uid, cid))]
            if not hashes:
                flash("Inicie o seu ambiente antes de enviar a flag.")
                return redirect(f"/challenge/{cid}")
            ok = h(flag) in hashes
        else:
            ok = h(flag) == c["flag_hash"]
        d.execute("INSERT INTO attempts(user_id,challenge_id,correct,created_at) VALUES(?,?,?,?)", (uid, cid, int(ok), int(time.time())))
        d.commit()
        flash("Flag correta! 🎉" if ok else "Flag incorreta. Tente de novo.")
        return redirect(f"/challenge/{cid}")
    inst = active_instance(d, uid, cid) if c["image"] else None
    return render_template("challenge.html", c=c, solved=solved, inst=inst, now=int(time.time()))

@app.route("/challenge/<int:cid>/start", methods=["POST"])
@login_required
def start_env(cid):
    with ENV_LOCK:
        return _start_env(cid)

def _start_env(cid):
    d, uid = db(), session["user_id"]
    c = d.execute("SELECT * FROM challenges WHERE id=?", (cid,)).fetchone()
    if not c or not c["image"]:
        abort(404)
    reap_expired()
    back = redirect(f"/challenge/{cid}")
    if active_instance(d, uid, cid):
        return back
    if d.execute("SELECT COUNT(*) FROM instances WHERE active=1").fetchone()[0] >= MAX_ACTIVE:
        flash("O laboratório está cheio no momento. Tente novamente em alguns minutos.")
        return back
    if d.execute("SELECT COUNT(*) FROM instances WHERE user_id=? AND active=1", (uid,)).fetchone()[0] >= MAX_PER_USER:
        flash(f"Você já tem {MAX_PER_USER} ambientes ativos. Encerre um antes de iniciar outro.")
        return back
    flag = "CTF{" + secrets.token_hex(8) + "}"
    name = f"lab-u{uid}-c{cid}-{secrets.token_hex(3)}"
    try:
        port = orch.start(name, c["image"], c["container_port"], flag)
    except orch.DockerError as e:
        flash(f"Não foi possível iniciar o ambiente: {e}")
        return back
    now = int(time.time())
    try:
        d.execute("INSERT INTO instances(user_id,challenge_id,container,port,flag_hash,started_at,expires_at,active) VALUES(?,?,?,?,?,?,?,1)",
                  (uid, cid, name, port, h(flag), now, now + TTL))
        d.commit()
    except Exception:
        d.rollback()
        orch.stop(name)
        raise
    flash(f"Ambiente iniciado! Ele expira em {TTL // 60} minutos.")
    return back

@app.route("/challenge/<int:cid>/stop", methods=["POST"])
@login_required
def stop_env(cid):
    d = db()
    row = d.execute("SELECT * FROM instances WHERE user_id=? AND challenge_id=? AND active=1", (session["user_id"], cid)).fetchone()
    if row:
        stop_instance(d, row)
        flash("Ambiente encerrado.")
    return redirect(f"/challenge/{cid}")

@app.route("/ambientes")
@mentor_required
def ambientes():
    reap_expired()
    rows = db().execute("""SELECT i.*, u.name uname, c.title FROM instances i
                           JOIN users u ON u.id=i.user_id JOIN challenges c ON c.id=i.challenge_id
                           WHERE i.active=1 ORDER BY i.id""").fetchall()
    return render_template("ambientes.html", rows=rows, now=int(time.time()), max=MAX_ACTIVE)

@app.route("/ambientes/<int:iid>/encerrar", methods=["POST"])
@mentor_required
def encerrar_ambiente(iid):
    d = db()
    row = d.execute("SELECT * FROM instances WHERE id=? AND active=1", (iid,)).fetchone()
    if row:
        stop_instance(d, row)
    return redirect("/ambientes")

@app.route("/ambientes/encerrar-todos", methods=["POST"])
@mentor_required
def encerrar_todos():
    d = db()
    for row in d.execute("SELECT * FROM instances WHERE active=1").fetchall():
        stop_instance(d, row)
    flash("Todos os ambientes foram encerrados.")
    return redirect("/ambientes")

def stats():
    d = db()
    rows = []
    for u in d.execute("SELECT * FROM users WHERE role='participante'").fetchall():
        solved = d.execute("""SELECT c.id cid, c.points, MIN(a.created_at) t FROM attempts a
                              JOIN challenges c ON c.id=a.challenge_id
                              WHERE a.user_id=? AND a.correct=1 GROUP BY c.id""", (u["id"],)).fetchall()
        attempts = d.execute("SELECT COUNT(*) FROM attempts WHERE user_id=?", (u["id"],)).fetchone()[0]
        times = []
        for s in solved:
            st = d.execute("SELECT started_at FROM starts WHERE user_id=? AND challenge_id=?", (u["id"], s["cid"])).fetchone()
            if st:
                times.append(s["t"] - st["started_at"])
        rating = d.execute("SELECT AVG((logica+comunicacao+colaboracao+decisao)/4.0) FROM evaluations WHERE user_id=?", (u["id"],)).fetchone()[0]
        rows.append(dict(id=u["id"], name=u["name"], team=u["team"], solved=len(solved),
                         points=sum(s["points"] for s in solved), attempts=attempts,
                         avg_min=round(sum(times) / len(times) / 60, 1) if times else None,
                         rating=round(rating, 1) if rating else None))
    for row in rows:
        row["purple"] = d.execute("SELECT COALESCE(MAX(score),0) FROM purple_reports WHERE user_id=?", (row["id"],)).fetchone()[0]
        row["total"] = row["points"] + row["purple"]
    return sorted(rows, key=lambda r: (-r["total"], r["id"]))

@app.route("/dashboard")
@mentor_required
def dashboard():
    rows = stats()
    teams = {}
    for r in rows:
        t = teams.setdefault(r["team"], dict(team=r["team"], members=0, solved=0, points=0, purple=0, total=0, attempts=0))
        t["members"] += 1
        for k in ("solved", "points", "purple", "total", "attempts"):
            t[k] += r[k]
    total = db().execute("SELECT COUNT(*) FROM challenges").fetchone()[0]
    return render_template("dashboard.html", rows=rows, teams=sorted(teams.values(), key=lambda t: -t["total"]), total=total)

@app.route("/participante/<int:uid>", methods=["GET", "POST"])
@mentor_required
def participante(uid):
    d = db()
    u = d.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    if not u:
        abort(404)
    if request.method == "POST":
        try:
            v = [int(request.form.get(k, "")) for k in ("logica", "comunicacao", "colaboracao", "decisao")]
            if not all(1 <= value <= 5 for value in v):
                raise ValueError()
        except ValueError:
            abort(400, "As notas devem ser inteiros entre 1 e 5.")
        d.execute("INSERT INTO evaluations(user_id,mentor_id,logica,comunicacao,colaboracao,decisao,notes,created_at) VALUES(?,?,?,?,?,?,?,?)",
                  (uid, session["user_id"], *v, request.form.get("notes", ""), int(time.time())))
        d.commit()
        flash("Avaliação registrada.")
        return redirect(f"/participante/{uid}")
    attempts = d.execute("""SELECT c.title, a.correct, a.created_at FROM attempts a JOIN challenges c ON c.id=a.challenge_id
                            WHERE a.user_id=? ORDER BY a.id DESC""", (uid,)).fetchall()
    evals = d.execute("SELECT * FROM evaluations WHERE user_id=? ORDER BY id DESC", (uid,)).fetchall()
    reports = d.execute("SELECT * FROM purple_reports WHERE user_id=? ORDER BY id DESC", (uid,)).fetchall()
    return render_template("participante.html", u=u, attempts=attempts, evals=evals, reports=reports,
                           s=next((r for r in stats() if r["id"] == uid), None), fmt=lambda t: time.strftime("%d/%m %H:%M", time.localtime(t)))

# As respostas de todos os formulários são validadas no servidor.
@app.before_request
def csrf_protect():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    if request.method == "POST":
        token = request.form.get("csrf_token", "")
        if not secrets.compare_digest(token, session["csrf_token"]):
            abort(400, "Formulário expirado. Recarregue a página.")

@app.context_processor
def template_helpers():
    return {"csrf_token": lambda: session.get("csrf_token", "")}

@app.route("/health")
def health():
    db().execute("SELECT 1")
    return {"status": "ok"}

@app.route("/ranking")
@login_required
def ranking():
    return render_template("ranking.html", rows=stats())

PURPLE_STEPS = [
    ("Uma funcionária abre um e-mail com anexo .docm.", "T1566.001", "s"),
    ("A macro executa PowerShell com comando codificado.", "T1059.001", "s"),
    ("O atacante extrai senhas da memória de lsass.exe.", "T1003.001", "n"),
    ("Credenciais roubadas são usadas para acessar outro servidor por SMB.", "T1021.002", "n"),
    ("Uma tarefa agendada é criada para manter o acesso.", "T1053.005", "s"),
]

@app.route("/purple", methods=["GET", "POST"])
@login_required
def purple():
    feedback = None
    score = None
    if request.method == "POST":
        report = request.form.get("report", "").strip()
        if len(report) < 100:
            flash("Escreva um relatório com pelo menos 100 caracteres.")
            return redirect("/purple")
        feedback, score = [], 0
        for i, (description, technique, detection) in enumerate(PURPLE_STEPS):
            if request.form.get(f"t{i}") not in {step[1] for step in PURPLE_STEPS} or request.form.get(f"d{i}") not in {"s", "n"}:
                abort(400)
            score += 20 * (request.form.get(f"t{i}") == technique) + 10 * (request.form.get(f"d{i}") == detection)
            feedback.append(f"Passo {i+1}: {technique}, " + ("com alerta" if detection == "s" else "sem alerta"))
        # O texto é evidência para o mentor; tamanho não mede qualidade.
        db().execute("INSERT INTO purple_reports(user_id,report,score,created_at) VALUES(?,?,?,?)",
                     (session["user_id"], report, score, int(time.time())))
        db().commit()
    best = db().execute("SELECT COALESCE(MAX(score),0) FROM purple_reports WHERE user_id=?", (session["user_id"],)).fetchone()[0]
    return render_template("purple.html", steps=PURPLE_STEPS, techniques=[s[1] for s in PURPLE_STEPS], feedback=feedback, score=score, best=best)

@app.errorhandler(orch.DockerError)
def docker_error(error):
    app.logger.warning("Falha no Docker: %s", error)
    return render_template("error.html", message="Docker indisponível. Verifique se o Docker Desktop está aberto e tente novamente."), 503

def bootstrap():
    init_db()
    # Uma única instância do servidor; o banco preserva ambientes durante reinícios.
    try:
        reconcile_instances()
    except orch.DockerError:
        app.logger.warning("Docker indisponível; desafios sem container continuam disponíveis.")
    threading.Thread(target=reaper_loop, daemon=True, name="environment-reaper").start()

def reconcile_instances():
    with ENV_LOCK:
        running = orch.running_names()
        con = sqlite3.connect(DB, timeout=30)
        try:
            known = set()
            for iid, name, expires in con.execute("SELECT id, container, expires_at FROM instances WHERE active=1").fetchall():
                if name not in running or expires <= int(time.time()):
                    orch.stop(name)
                    con.execute("UPDATE instances SET active=0 WHERE id=?", (iid,))
                else:
                    known.add(name)
            for name in running - known:
                orch.stop(name)
            con.commit()
        finally:
            con.close()

if __name__ == "__main__":
    from waitress import serve
    bootstrap()
    serve(app, host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "5000")), threads=8)
