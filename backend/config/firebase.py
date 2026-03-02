from __future__ import annotations

import json
import logging
from pathlib import Path

import firebase_admin
from django.conf import settings
from firebase_admin import credentials

logger = logging.getLogger(__name__)

_firebase_app = None


def get_firebase_app():
    """Initialize and return Firebase app once. Returns None when not configured."""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    credentials_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", "")
    credentials_json = getattr(settings, "FIREBASE_CREDENTIALS_JSON", "")

    if not credentials_path and not credentials_json:
        logger.warning("Firebase credentials are not configured. Push notifications are disabled.")
        return None

    try:
        if credentials_json:
            credential_data = json.loads(credentials_json)
            cred = credentials.Certificate(credential_data)
        else:
            path = Path(credentials_path)
            if not path.exists():
                logger.warning("Firebase credentials file was not found at %s", path)
                return None
            cred = credentials.Certificate(str(path))
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception:  # noqa: BLE001
        logger.exception("Failed to initialize Firebase app.")
        return None
