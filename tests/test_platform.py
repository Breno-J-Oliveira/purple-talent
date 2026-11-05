from contextlib import closing
import importlib.util
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch
import app as lab

class PlatformTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.old_db = lab.DB
        lab.DB = str(Path(self.tmp.name) / "lab.db")
        lab.app.config.update(TESTING=True, SECRET_KEY="test-only")
        lab.init_db()
        self.client = lab.app.test_client()

    def tearDown(self):
        lab.DB = self.old_db
        self.tmp.cleanup()

    def post(self, path, data=None, client=None):
        client = client or self.client
        client.get("/login")
        with client.session_transaction() as session:
            token = session["csrf_token"]
        return client.post(path, data={**(data or {}), "csrf_token": token}, follow_redirects=True)

    def participant(self, email="ana@example.test", client=None):
        self.post("/register", dict(name="Ana", email=email, password="testpassword", team="Alfa"), client)
        return self.post("/login", dict(email=email, password="testpassword"), client)

    def query(self, sql, args=()):
        with closing(sqlite3.connect(lab.DB)) as con, con:
            return con.execute(sql, args).fetchall()

    def test_auth_csrf_and_roles(self):
        self.assertEqual(self.client.get("/challenges").status_code, 302)
        self.assertEqual(self.client.post("/login", data={}).status_code, 400)
        self.assertEqual(self.post("/register", dict(name="A", email="a@b.c", password="x")).status_code, 400)
        self.participant()
        self.assertEqual(self.client.get("/dashboard").status_code, 403)
        self.assertEqual(self.client.get("/ambientes").status_code, 403)
        self.assertEqual(self.client.get("/logout").status_code, 405)

    def test_scoring_is_server_side_and_unique(self):
        self.participant()
        for flag in ["incorrect", "CTF{bem_vindo_ao_purple_lab}", "CTF{bem_vindo_ao_purple_lab}"]:
            self.assertEqual(self.post("/challenge/1", {"flag": flag}).status_code, 200)
        self.assertEqual(self.query("SELECT COUNT(*) FROM attempts WHERE correct=1")[0][0], 1)
        with lab.app.test_request_context():
            self.assertEqual(lab.stats()[0]["points"], 50)
        self.assertIn(b"50", self.client.get("/ranking").data)

    def test_purple_reports_and_mentor_review(self):
        self.participant()
        data = {"report": "Investigar o acesso ao LSASS e os logons SMB; correlacionar eventos e validar as regras em uma nova rodada. " * 2}
        for i, (_, technique, detection) in enumerate(lab.PURPLE_STEPS):
            data.update({f"t{i}": technique, f"d{i}": detection})
        for _ in range(2):
            self.assertEqual(self.post("/purple", data).status_code, 200)
        with lab.app.test_request_context():
            self.assertEqual(lab.stats()[0]["total"], 150)
        self.post("/logout")
        self.post("/login", dict(email="mentor@cti.local", password="mentor123"))
        self.assertEqual(self.client.get("/dashboard").status_code, 200)
        self.assertIn(b"LSASS", self.client.get("/participante/2").data)
        self.assertEqual(self.post("/participante/2", dict(logica="bad")).status_code, 400)
        data = dict(logica=5, comunicacao=4, colaboracao=3, decisao=4, notes="Boa análise")
        self.assertEqual(self.post("/participante/2", data).status_code, 200)
        self.assertEqual(self.query("SELECT COUNT(*) FROM evaluations")[0][0], 1)

    @patch("app.orch.stop")
    @patch("app.orch.start", return_value=34567)
    def test_individual_environments_limits_and_expiry(self, start, stop):
        self.participant()
        self.post("/challenge/2/start")
        self.post("/challenge/2/start")
        self.assertEqual(start.call_count, 1)
        flag = start.call_args.args[3]
        self.assertEqual(self.post("/challenge/2", {"flag": flag}).status_code, 200)
        other = lab.app.test_client()
        self.participant("bia@example.test", other)
        self.post("/challenge/2/start", client=other)
        self.post("/challenge/2", {"flag": flag}, other)
        self.assertEqual(self.query("SELECT COUNT(*) FROM attempts WHERE user_id=3 AND correct=1")[0][0], 0)
        with patch("app.MAX_PER_USER", 1):
            self.post("/challenge/8/start", client=other)
            self.assertEqual(start.call_count, 2)
        with closing(sqlite3.connect(lab.DB)) as con, con:
            con.execute("UPDATE instances SET expires_at=?", (int(time.time())-1,))
        lab.reap_expired()
        self.assertEqual(self.query("SELECT COUNT(*) FROM instances WHERE active=1")[0][0], 0)
        self.assertEqual(stop.call_count, 2)

    @patch("app.orch.start", side_effect=lab.orch.DockerError("indisponível"))
    def test_unavailable_docker_does_not_create_instance(self, start):
        self.participant()
        self.assertEqual(self.post("/challenge/2/start").status_code, 200)
        self.assertEqual(self.query("SELECT COUNT(*) FROM instances")[0][0], 0)

    @patch("app.orch.stop")
    @patch("app.orch.running_names", return_value={"kept", "expired", "orphan"})
    def test_restart_preserves_live_instances(self, names, stop):
        with closing(sqlite3.connect(lab.DB)) as con, con:
            for name, expires in [("kept", int(time.time())+600), ("expired", 1), ("missing", int(time.time())+600)]:
                con.execute("INSERT INTO instances(user_id,challenge_id,container,expires_at,active) VALUES(1,2,?,?,1)", (name, expires))
        lab.init_db()
        lab.reconcile_instances()
        self.assertEqual(self.query("SELECT container FROM instances WHERE active=1"), [("kept",)])
        self.assertEqual({c.args[0] for c in stop.call_args_list}, {"expired", "missing", "orphan"})

    def test_pages_and_static_assets(self):
        self.participant()
        for path in ["/", "/challenges", "/challenges?category=Web", "/challenge/1", "/challenge/2", "/purple", "/ranking", "/health", "/static/app.js", "/static/style.css"]:
            with self.client.get(path) as response:
                self.assertEqual(response.status_code, 200, path)
        self.assertEqual(len(self.query("SELECT * FROM challenges")), 8)

    def test_sql_target_is_exploitable_only_in_lab(self):
        spec = importlib.util.spec_from_file_location("sql_target", Path("challenges/web-02/app.py"))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        client = module.app.test_client()
        self.assertNotIn(b"FLAG:", client.post("/", data={"username":"admin", "password":"wrong"}).data)
        self.assertIn(b"FLAG:", client.post("/", data={"username":"admin' --", "password":"x"}).data)

if __name__ == "__main__":
    unittest.main()
