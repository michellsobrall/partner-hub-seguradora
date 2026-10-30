"""
Page Object Model (POM) para a tela de autenticação do portal legado.
"""

from playwright.sync_api import Page
from pages.base_page import BasePage


class LegacyLoginPage(BasePage):
    """Encapsula os seletores e ações de login resiliente no portal legado."""

    USERNAME_INPUT = "#username"
    PASSWORD_INPUT = "#password"
    LOGIN_BUTTON = "#btn-login"
    SESSION_BADGE = "#session-badge"

    def __init__(self, page: Page, timeout_ms: int = 30000) -> None:
        super().__init__(page, timeout_ms)

    def authenticate(self, portal_url: str, username: str, password: str) -> bool:
        """Navega até o portal legado, preenche credenciais e valida sessão ativa."""
        self.navigate(portal_url)
        self.fill_field(self.USERNAME_INPUT, username)
        self.fill_field(self.PASSWORD_INPUT, password)
        self.click_element(self.LOGIN_BUTTON)

        badge = self.find(self.SESSION_BADGE)
        badge.wait_for(state="attached")
        return badge.get_attribute("data-authenticated") == "true"

