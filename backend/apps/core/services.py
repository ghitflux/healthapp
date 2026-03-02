from __future__ import annotations

from django.core.cache import cache

from .models import PlatformSettings


class PlatformSettingsService:
    CACHE_KEY = "platform_settings:singleton"
    CACHE_TTL = 60 * 5

    @classmethod
    def get_settings(cls) -> PlatformSettings:
        cached = cache.get(cls.CACHE_KEY)
        if cached is not None:
            return cached
        settings_obj = PlatformSettings.load()
        cache.set(cls.CACHE_KEY, settings_obj, timeout=cls.CACHE_TTL)
        return settings_obj

    @classmethod
    def update_settings(cls, data: dict, updated_by) -> PlatformSettings:
        settings_obj = PlatformSettings.load()
        for field, value in data.items():
            setattr(settings_obj, field, value)
        settings_obj.updated_by = updated_by
        settings_obj.save()
        cls.invalidate_cache()
        return settings_obj

    @classmethod
    def get_setting(cls, key: str):
        settings_obj = cls.get_settings()
        return getattr(settings_obj, key)

    @classmethod
    def invalidate_cache(cls) -> None:
        cache.delete(cls.CACHE_KEY)
