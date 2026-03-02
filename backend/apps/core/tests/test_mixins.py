from django.utils import timezone

from apps.core.mixins import SoftDeleteMixin, TimestampMixin


class _DummySoftDeleteModel:
    def __init__(self):
        self.deleted_at = None
        self.saved_fields = None

    def save(self, update_fields):
        self.saved_fields = update_fields


class TestMixins:
    def test_timestamp_mixin_is_abstract(self):
        assert TimestampMixin._meta.abstract is True

    def test_soft_delete_sets_deleted_at_and_marks_deleted(self):
        obj = _DummySoftDeleteModel()

        SoftDeleteMixin.soft_delete(obj)

        assert obj.deleted_at is not None
        assert obj.saved_fields == ["deleted_at"]
        assert SoftDeleteMixin.is_deleted.fget(obj) is True

    def test_soft_delete_property_false_when_not_deleted(self):
        obj = _DummySoftDeleteModel()
        obj.deleted_at = None

        assert SoftDeleteMixin.is_deleted.fget(obj) is False

    def test_soft_delete_uses_current_time(self):
        obj = _DummySoftDeleteModel()

        before = timezone.now()
        SoftDeleteMixin.soft_delete(obj)
        after = timezone.now()

        assert before <= obj.deleted_at <= after
