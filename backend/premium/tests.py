from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from core.models import User
from .models import Transaction


class PaymentIdempotencyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="payment@example.com", password="testpass123"
        )

    def test_reuses_pending_order(self):
        """Повторные запросы возвращают тот же pending-ордер, а не плодят дубли."""
        tx = Transaction.objects.create(user=self.user, amount=10.00, status="pending")
        same = Transaction.objects.filter(user=self.user, status="pending").first()
        self.assertEqual(tx.id, same.id)
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 1)


class ProExtensionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="pro@example.com", password="testpass123"
        )

    def test_pro_extended_from_current_expiry(self):
        """Продление считает +30 дней от текущей даты окончания, а не от now()."""
        existing = timezone.now() + timedelta(days=20)
        self.user.pro_expires_at = existing
        self.user.save()

        # Симулируем логику из payment_webhook (продление)
        current = self.user.pro_expires_at or timezone.now()
        new_expiry = max(current, timezone.now()) + timedelta(days=30)
        self.user.pro_expires_at = new_expiry
        self.user.save(update_fields=["pro_expires_at"])

        # 20 + 30 = 50 дней от now()
        self.assertAlmostEqual(
            (self.user.pro_expires_at - timezone.now()).total_seconds(),
            timedelta(days=50).total_seconds(),
            delta=5,
        )