"""
Pipeline de Higienização e Normalização de Dados Legados utilizando Pandas.
Remove duplicatas, normaliza CPF/CNPJ, padroniza telefones e converte valores monetários/percentuais.
"""

import re
from typing import List, Dict, Any, Tuple
import pandas as pd


def _only_digits(val: Any) -> str:
    return re.sub(r"\D", "", str(val or ""))


def _clean_percentage(val: Any) -> float:
    text = str(val or "0")
    text = re.sub(r"[^\d,\.]", "", text)
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return round(float(text), 2)
    except ValueError:
        return 0.0


def _clean_installments(val: Any) -> int:
    digits = _only_digits(val)
    return int(digits) if digits else 1


def _normalize_date(val: Any) -> str:
    text = str(val or "").strip()
    if re.match(r"^\d{2}/\d{2}/\d{4}$", text):
        day, month, year = text.split("/")
        return f"{year}-{month}-{day}"
    return text or "2026-01-01"


def sanitize_brokers_dataframe(
    raw_brokers: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Higieniza a lista bruta de corretores com Pandas e retorna:
    (lista_higienizada, quantidade_duplicatas_removidas)
    """
    if not raw_brokers:
        return [], 0

    df = pd.DataFrame(raw_brokers)
    initial_count = len(df)

    df["personType"] = df["personType"].astype(str).str.strip().str.upper()
    df["name"] = df["name"].astype(str).str.strip()
    df["tradeName"] = df["tradeName"].fillna("").astype(str).str.strip()
    df["documentNumber"] = df["documentNumber"].apply(_only_digits)
    df["email"] = df["email"].astype(str).str.strip().str.lower()
    df["phone"] = df["phone"].apply(_only_digits)
    df["susepCode"] = df["susepCode"].fillna("").astype(str).str.strip()
    df["bankCode"] = df["bankCode"].astype(str).str.strip()
    df["bankName"] = df["bankName"].astype(str).str.strip()
    df["agency"] = df["agency"].astype(str).str.strip()
    df["accountNumber"] = df["accountNumber"].astype(str).str.strip()
    df["pixKeyType"] = df["pixKeyType"].astype(str).str.strip().str.upper()
    df["pixKey"] = df.apply(
        lambda r: _only_digits(r["pixKey"])
        if r["pixKeyType"] in ("CPF", "CNPJ", "PHONE")
        else str(r["pixKey"]).strip(),
        axis=1,
    )

    # Remove registros com CPF/CNPJ inválido e deduplica mantendo a primeira ocorrência
    df = df[df["documentNumber"].str.len().isin([11, 14])]
    df = df.drop_duplicates(subset=["documentNumber"], keep="first")

    duplicates_removed = initial_count - len(df)
    return df.to_dict(orient="records"), duplicates_removed


def sanitize_rules_dataframe(
    raw_rules: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Higieniza a lista bruta de regras de comissionamento com Pandas e retorna:
    (lista_higienizada, quantidade_duplicatas_removidas)
    """
    if not raw_rules:
        return [], 0

    df = pd.DataFrame(raw_rules)
    initial_count = len(df)

    df["ruleCode"] = df["ruleCode"].astype(str).str.strip().str.upper()
    df["operatorName"] = df["operatorName"].astype(str).str.strip()
    df["productName"] = df["productName"].astype(str).str.strip()
    df["agencyPercentage"] = df["agencyPercentage"].apply(_clean_percentage)
    df["agencyInstallments"] = df["agencyInstallments"].apply(_clean_installments)
    df["recurringPercentage"] = df["recurringPercentage"].apply(_clean_percentage)
    df["effectiveFrom"] = df["effectiveFrom"].apply(_normalize_date)

    df = df.drop_duplicates(subset=["ruleCode"], keep="first")

    duplicates_removed = initial_count - len(df)
    return df.to_dict(orient="records"), duplicates_removed

