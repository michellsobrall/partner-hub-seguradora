"""
Page Object Model (POM) para raspagem (scraping) da tabela de regras de comissão do portal legado.
"""

from typing import List, Dict, Any
from playwright.sync_api import Page
from pages.base_page import BasePage


class RulesLegacyPage(BasePage):
    """Extrai linhas brutas da tabela HTML de regras de comissão legadas."""

    ROWS_SELECTOR = "#legacy-rules-table tbody tr.rule-row"

    def __init__(self, page: Page, timeout_ms: int = 30000) -> None:
        super().__init__(page, timeout_ms)

    def extract_raw_rules(self) -> List[Dict[str, Any]]:
        rows = self.page.locator(self.ROWS_SELECTOR)
        count = rows.count()
        extracted: List[Dict[str, Any]] = []

        for idx in range(count):
            row = rows.nth(idx)
            extracted.append(
                {
                    "ruleCode": row.locator(".col-code").inner_text(),
                    "operatorName": row.locator(".col-operator").inner_text(),
                    "productName": row.locator(".col-product").inner_text(),
                    "agencyPercentage": row.locator(".col-agency").inner_text(),
                    "agencyInstallments": row.locator(".col-installments").inner_text(),
                    "recurringPercentage": row.locator(".col-recurring").inner_text(),
                    "effectiveFrom": row.locator(".col-effective").inner_text(),
                }
            )
        return extracted

