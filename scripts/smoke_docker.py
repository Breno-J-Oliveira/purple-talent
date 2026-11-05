"""Teste real opcional: requer Docker Desktop/Engine e dependências Python."""
import secrets
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import orchestrator as orch

def fetch(url, data=None):
    for attempt in range(30):
        try:
            return urllib.request.urlopen(url, data=data, timeout=2).read().decode()
        except OSError:
            if attempt == 29:
                raise
            time.sleep(0.5)

def main():
    for number in (1, 2):
        name = f"cti-smoke-{secrets.token_hex(5)}"
        flag = "CTF{" + secrets.token_hex(16) + "}"
        try:
            port = orch.start(name, f"cti-lab/web-0{number}", 5000, flag)
            base = f"http://127.0.0.1:{port}"
            if number == 1:
                assert "/backup-interno" in fetch(base + "/robots.txt")
                assert flag in fetch(base + "/backup-interno")
            else:
                assert flag not in fetch(base, urllib.parse.urlencode({"username":"admin", "password":"wrong"}).encode())
                assert flag in fetch(base, urllib.parse.urlencode({"username":"admin' --", "password":"x"}).encode())
            print(f"OK: web-0{number}, HTTP e flag individual")
        finally:
            orch.stop(name)

if __name__ == "__main__":
    main()
