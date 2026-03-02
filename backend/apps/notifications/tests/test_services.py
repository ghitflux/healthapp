import pytest

from apps.notifications.services import EmailService, PushService, SMSService
from apps.notifications.tests.factories import NotificationFactory
from apps.users.tests.factories import PatientFactory


@pytest.mark.django_db
class TestNotificationServices:
    def test_push_send_to_user_without_tokens(self):
        user = PatientFactory()
        result = PushService.send_to_user(str(user.id), "Titulo", "Corpo")
        assert result["success_count"] == 0
        assert result["failure_count"] == 0

    def test_email_service_plain_message(self, settings, monkeypatch):
        sent = {"called": False}

        class _DummyEmail:
            def __init__(self, *args, **kwargs):
                del args, kwargs

            def attach_alternative(self, *args, **kwargs):
                del args, kwargs

            def send(self, fail_silently=False):
                del fail_silently
                sent["called"] = True
                return 1

        settings.DEFAULT_FROM_EMAIL = "noreply@healthapp.com.br"
        monkeypatch.setattr("apps.notifications.services.EmailMultiAlternatives", _DummyEmail)

        ok = EmailService.send_email(
            to="patient@example.com",
            subject="Assunto",
            template_name="Corpo simples",
            context={},
        )
        assert ok is True
        assert sent["called"] is True

    def test_sms_service_without_credentials(self, settings):
        settings.TWILIO_ACCOUNT_SID = ""
        settings.TWILIO_AUTH_TOKEN = ""
        settings.TWILIO_PHONE_NUMBER = ""
        result = SMSService.send_sms("+5511999999999", "Mensagem")
        assert result["success"] is False

    def test_notification_factory_smoke(self):
        notification = NotificationFactory()
        assert notification.id is not None
