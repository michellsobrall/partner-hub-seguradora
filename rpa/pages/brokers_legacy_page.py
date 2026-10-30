"""
Page Object Model (POM) para raspagem (scraping) da tabela de corretores do portal legado.
"""

from typing import List, Dict, Any
from playwright.sync_api import Page
from pages.base_page import BasePage


class BrokersLegacyPage(BasePage):
    """Extrai linhas brutas da tabela HTML de corretores legados."""

    ROWS_SELECTOR = "#legacy-brokers-table tbody tr.broker-row"

    def __init__(self, page: Page, timeout_ms: int = 30000) -> None:
        super().__init__(page, timeout_ms)

    def extract_raw_brokers(self) -> List[Dict[str, Any]]:
        rows = self.page.locator(self.ROWS_SELECTOR)
        count = rows.count()
        extracted: List[Dict[str, Any]] = []

        for idx in range(count):
            row = rows.nth(idx)
            extracted.append(
                {
                    "personType": row.locator(".col-type").inner_text(),
                    "name": row.locator(".col-name").inner_text(),
                    "tradeName": row.locator(".col-trade").inner_text(),
                    "documentNumber": row.locator(".col-doc").inner_text(),
                    "email": row.locator(".col-email").inner_text(),
                    "phone": row.locator(".col-phone").inner_text(),
                    "susepCode": row.locator(".col-susep").inner_text(),
                    "bankCode": row.locator(".col-bank-code").inner_text(),
                    "bankName": row.locator(".col-bank-name").inner_text(),
                    "agency": row.locator(".col-agency").inner_text(),
                    "accountNumber": row.locator(".col-account").inner_text(),
                    "pixKeyType": row.locator(".col-pix-type").inner_text(),
                    "pixKey": row.locator(".col-pix-key").inner_text(),
                }
            )
        return extracted

