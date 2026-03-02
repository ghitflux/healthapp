import re
import secrets
import string


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP code."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def mask_cpf(cpf: str) -> str:
    """Mask CPF: 123.456.789-00 → ***.***.789-**"""
    digits = re.sub(r"\D", "", cpf)
    if len(digits) != 11:
        return "***.***.***-**"
    return f"***.***{digits[6:9]}-**"


def mask_email(email: str) -> str:
    """Mask email: john.doe@example.com → j*****e@example.com"""
    if "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    masked_local = local[0] + "*" if len(local) <= 2 else local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


def validate_cpf(cpf: str) -> bool:
    """Validate Brazilian CPF number."""
    digits = re.sub(r"\D", "", cpf)
    if len(digits) != 11:
        return False
    if digits == digits[0] * 11:
        return False

    # First check digit
    total = sum(int(digits[i]) * (10 - i) for i in range(9))
    remainder = total % 11
    first_check = 0 if remainder < 2 else 11 - remainder
    if int(digits[9]) != first_check:
        return False

    # Second check digit
    total = sum(int(digits[i]) * (11 - i) for i in range(10))
    remainder = total % 11
    second_check = 0 if remainder < 2 else 11 - remainder
    return int(digits[10]) == second_check


def validate_cnpj(cnpj: str) -> bool:
    """Validate Brazilian CNPJ number."""
    digits = re.sub(r"\D", "", cnpj)
    if len(digits) != 14:
        return False
    if digits == digits[0] * 14:
        return False

    # First check digit
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(digits[i]) * weights1[i] for i in range(12))
    remainder = total % 11
    first_check = 0 if remainder < 2 else 11 - remainder
    if int(digits[12]) != first_check:
        return False

    # Second check digit
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    total = sum(int(digits[i]) * weights2[i] for i in range(13))
    remainder = total % 11
    second_check = 0 if remainder < 2 else 11 - remainder
    return int(digits[13]) == second_check


def validate_phone_br(phone: str) -> bool:
    """Validate Brazilian phone — accepts +55 followed by 10 or 11 digits."""
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    if not cleaned.startswith("+55"):
        return False
    number_part = cleaned[3:]
    return len(number_part) in (10, 11) and number_part.isdigit()


def validate_crm(crm: str) -> bool:
    """Validate CRM format: 4 to 10 numeric digits."""
    digits = re.sub(r"\D", "", crm)
    return 4 <= len(digits) <= 10


VALID_UF = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}


def validate_uf(uf: str) -> bool:
    """Validate Brazilian state abbreviation (UF)."""
    return uf.upper() in VALID_UF
