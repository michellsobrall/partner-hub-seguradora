"""
Orquestrador End-to-End do Robô RPA (Playwright Headless + POM + Pandas + REST API Ingest).
Execução: python scripts/run_migration.py
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

# Adiciona raiz do pacote /rpa ao sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from pages.login_page import LegacyLoginPage
from pages.brokers_legacy_page import BrokersLegacyPage
from pages.rules_legacy_page import RulesLegacyPage
from scripts.sanitizer import sanitize_brokers_dataframe, sanitize_rules_dataframe
from scripts.ingestor import PartnerHubIngestor

load_dotenv()


def run_rpa_pipeline() -> int:
    start_time = time.time()
    headless = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"

    mock_html_path = (ROOT_DIR / "mock_legacy_portal" / "legacy_portal.html").resolve().as_uri()
    portal_url = os.getenv("LEGACY_PORTAL_URL", mock_html_path)
    if "exemplo.com.br" in portal_url:
        portal_url = mock_html_path

    username = os.getenv("LEGACY_USERNAME", "usuario_automacao")
    password = os.getenv("LEGACY_PASSWORD", "senha_segura")

    print(f"[RPA-Playwright] Iniciando navegador Chromium (headless={headless})...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context()
        page = context.new_page()

        login_page = LegacyLoginPage(page)
        authenticated = login_page.authenticate(portal_url, username, password)
        if not authenticated:
            print("[RPA-Playwright] Falha na autenticação do portal legado.", file=sys.stderr)
            return 1

        print("[RPA-Playwright] Sessão autenticada! Extraindo tabelas via Page Object Model...")
        brokers_page = BrokersLegacyPage(page)
        rules_page = RulesLegacyPage(page)

        raw_brokers = brokers_page.extract_raw_brokers()
        raw_rules = rules_page.extract_raw_rules()
        browser.close()

    print(
        f"[RPA-Pandas] Extraídos {len(raw_brokers)} corretores brutos e {len(raw_rules)} regras brutas. Higienizando..."
    )
    clean_brokers, dup_brokers = sanitize_brokers_dataframe(raw_brokers)
    clean_rules, dup_rules = sanitize_rules_dataframe(raw_rules)

    duration_ms = int((time.time() - start_time) * 1000)
    payload = {
        "sourcePortal": "SGP-Saúde Legado v4.2 (Playwright POM)",
        "triggerMode": "PYTHON_PLAYWRIGHT_CLI",
        "rawBrokersCount": len(raw_brokers),
        "rawRulesCount": len(raw_rules),
        "duplicatesRemoved": dup_brokers + dup_rules,
        "durationMs": duration_ms,
        "brokers": clean_brokers,
        "rules": clean_rules,
    }

    print("[RPA-Ingestor] Enviando lote higienizado para POST /api/v1/rpa/ingest...")
    ingestor = PartnerHubIngestor()
    result = ingestor.ingest_migration_batch(payload)
    print(f"[RPA-Success] Lote ingerido com sucesso! Job: {result.get('jobCode')}")
    return 0


if __name__ == "__main__":
    sys.exit(run_rpa_pipeline())

