from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["user", "amount", "payment_method", "status", "paid_at", "created_at"]
    list_filter = ["status", "payment_method", "created_at"]
    search_fields = ["user__full_name", "user__email", "stripe_payment_intent_id"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["user"]
    date_hierarchy = "created_at"
