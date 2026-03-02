import re

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """5 login attempts per minute per IP — prevents brute force."""
    scope = "login"


class ResetPasswordRateThrottle(AnonRateThrottle):
    """3 password reset requests per minute per IP."""
    scope = "reset_password"


class RegisterRateThrottle(AnonRateThrottle):
    """10 registration attempts per minute per IP — prevents spam."""
    scope = "register"


class OTPResendThrottle(UserRateThrottle):
    """3 OTP resend requests per 15 minutes per user."""
    scope = "otp_resend"

    def parse_rate(self, rate):
        """
        Support standard DRF rates and custom multi-unit rates like `3/15min`.
        """
        if not rate:
            return None, None

        num, period = rate.split("/")
        num_requests = int(num)
        period = period.strip().lower()

        # DRF-compatible aliases
        if period in {"s", "sec", "second", "seconds"}:
            return num_requests, 1
        if period in {"m", "min", "minute", "minutes"}:
            return num_requests, 60
        if period in {"h", "hour", "hours"}:
            return num_requests, 3600
        if period in {"d", "day", "days"}:
            return num_requests, 86400

        # Extended formats like 15min, 2h, 3days
        match = re.fullmatch(r"(?P<count>\d+)\s*(?P<unit>[a-z]+)", period)
        if not match:
            return super().parse_rate(rate)

        count = int(match.group("count"))
        unit = match.group("unit")
        base = {
            "s": 1,
            "sec": 1,
            "second": 1,
            "seconds": 1,
            "m": 60,
            "min": 60,
            "minute": 60,
            "minutes": 60,
            "h": 3600,
            "hour": 3600,
            "hours": 3600,
            "d": 86400,
            "day": 86400,
            "days": 86400,
        }.get(unit)
        if not base:
            return super().parse_rate(rate)

        return num_requests, count * base
