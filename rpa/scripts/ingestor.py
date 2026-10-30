"""
Cliente HTTP Resiliente para ingestão dos dados higienizados na API REST do Partner Hub (Spring Boot).
"""

import os
from typing import Dict, Any
import requests
from tenacity import retry, stop_after_attempt, wait_exponential


class PartnerHubIngestor:
    """Envia lotes extraídos e higienizados pelo RPA para POST /api/v1/rpa/ingest."""

    def __init__(self, api_base_url: str | None = None, api_token: str | None = None) -> None:
        self.api_base_url = (
            api_base_url or os.getenv("PARTNERHUB_API_URL", "http://localhost:8080/api/v1")
        ).rstrip("/")
        self.api_token = api_token or os.getenv("PARTNERHUB_API_TOKEN", "dev_rpa_token_placeholder")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=5))
    def ingest_migration_batch(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.api_base_url}/rpa/ingest"
        headers = {
            "Content-Type": "application/json",
            "X-RPA-Token": self.api_token,
        }
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        response.raise_for_status()
        return response.json()

