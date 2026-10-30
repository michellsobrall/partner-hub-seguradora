# Partner Hub - Módulo RPA (Python + Playwright)

Estrutura preparatória para a **Sprint 04 (Migração Automatizada)** utilizando arquitetura **Page Object Model (POM)**, **Playwright** e **Pandas**.

## Estrutura
- `pages/`: Classes Page Object Model (`BasePage` e futuras páginas do sistema legado).
- `scripts/`: Pipelines de extração, higienização de dados (Pandas) e ingestão via API REST no Backend Spring Boot.
- `requirements.txt`: Dependências Python fixadas.
- `.env.example`: Modelo de variáveis de ambiente.

## Como configurar localmente
```powershell
cd rpa
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
python scripts/check_api_connection.py
```

