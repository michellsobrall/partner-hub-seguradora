"""
Script de verificação de conectividade entre o módulo RPA (Python) e a API do Partner Hub.
"""

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("PARTNERHUB_API_URL", "http://localhost:8080/api/v1")


def check_backend_health() -> int:
    endpoint = f"{API_URL.rstrip('/')}/health"
    print(f"[RPA] Verificando conectividade com o Backend em: {endpoint}")

    try:
        response = requests.get(endpoint, timeout=10)
        response.raise_for_status()
        payload = response.json()
        print(
            f"[RPA] Sucesso! Status={payload.get('status')} | "
            f"DB={payload.get('database')} | "
            f"Schema={payload.get('details', {}).get('schemaVersion')}"
        )
        return 0
    except Exception as exc:
        print(f"[RPA] Erro ao conectar na API do Partner Hub: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(check_backend_health())

