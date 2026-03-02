
from apps.core.utils import generate_otp, mask_cpf, mask_email, validate_cpf


class TestGenerateOTP:
    def test_default_length(self):
        otp = generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()

    def test_custom_length(self):
        otp = generate_otp(length=8)
        assert len(otp) == 8


class TestMaskCPF:
    def test_mask_cpf(self):
        result = mask_cpf("123.456.789-00")
        assert result == "***.***789-**"

    def test_mask_cpf_digits_only(self):
        result = mask_cpf("12345678900")
        assert result == "***.***789-**"

    def test_mask_invalid_cpf(self):
        result = mask_cpf("123")
        assert result == "***.***.***-**"


class TestMaskEmail:
    def test_mask_email(self):
        result = mask_email("john.doe@example.com")
        assert result.endswith("@example.com")
        assert result.startswith("j")
        assert "*" in result

    def test_mask_short_email(self):
        result = mask_email("ab@test.com")
        assert "@test.com" in result


class TestValidateCPF:
    def test_valid_cpf(self):
        assert validate_cpf("529.982.247-25") is True

    def test_invalid_cpf(self):
        assert validate_cpf("111.111.111-11") is False

    def test_invalid_length(self):
        assert validate_cpf("123") is False
