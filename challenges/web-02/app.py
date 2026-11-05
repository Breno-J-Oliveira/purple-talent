"""Aplicação intencionalmente vulnerável, restrita ao container do exercício."""
import os
import sqlite3
from flask import Flask, request, render_template_string
app = Flask(__name__)
PAGE = """<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Portal interno CTI</title>
<h1>Portal interno</h1><p>Exercício autorizado: investigue o login.</p>
<form method="post"><label>Usuário <input name="username" required></label>
<label>Senha <input name="password" type="password" required></label><button>Entrar</button></form>
<p>{{ message }}</p></html>"""
@app.route("/", methods=["GET", "POST"])
def login():
    message = ""
    if request.method == "POST":
        con = sqlite3.connect(":memory:")
        try:
            con.execute("CREATE TABLE users (username TEXT, password TEXT)")
            con.execute("INSERT INTO users VALUES (?, ?)", ("admin", os.urandom(24).hex()))
            username = request.form.get("username", "")[:200]
            password = request.form.get("password", "")[:200]
            # Vulnerabilidade didática: concatenação SQL apenas neste alvo isolado.
            user = con.execute(f"SELECT username FROM users WHERE username='{username}' AND password='{password}'").fetchone()
            message = "FLAG: " + os.environ.get("FLAG", "CTF{teste_local}") if user else "Credenciais inválidas."
        except sqlite3.Error:
            message = "Erro na consulta SQL. Confira as aspas."
        finally:
            con.close()
    return render_template_string(PAGE, message=message)
if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
