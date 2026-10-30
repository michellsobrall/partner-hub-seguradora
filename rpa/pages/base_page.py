"""
Classe Base para o padrão Page Object Model (POM) utilizando Playwright.
Estrutura preparatória para a Sprint 04 (Migração Automatizada).
"""

from playwright.sync_api import Page, Locator


class BasePage:
    """Abstração base para páginas do portal legado de operadoras/corretoras."""

    def __init__(self, page: Page, timeout_ms: int = 30000) -> None:
        self.page = page
        self.timeout_ms = timeout_ms
        self.page.set_default_timeout(self.timeout_ms)

    def navigate(self, url: str) -> None:
        """Navega até a URL informada aguardando o carregamento da rede."""
        self.page.goto(url, wait_until="domcontentloaded")

    def find(self, selector: str) -> Locator:
        """Retorna um Locator seguro para o seletor."""
        return self.page.locator(selector)

    def fill_field(self, selector: str, value: str) -> None:
        """Preenche um campo de formulário após aguardar visibilidade."""
        locator = self.find(selector)
        locator.wait_for(state="visible")
        locator.fill(value)

    def click_element(self, selector: str) -> None:
        """Clica em um elemento após aguardar visibilidade."""
        locator = self.find(selector)
        locator.wait_for(state="visible")
        locator.click()

