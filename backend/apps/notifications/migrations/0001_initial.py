# Generated by Django 5.0.2 on 2025-06-25 09:12

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AdminNotification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('review_flagged', 'Review Flagged'), ('seller_review_flagged', 'Seller Review Flagged'), ('seller_registration', 'New Seller Registration'), ('order_issue', 'Order Issue'), ('payment_failed', 'Payment Failed'), ('product_reported', 'Product Reported'), ('system_alert', 'System Alert'), ('promo_request', 'Promo Code Request')], max_length=30)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=10)),
                ('data', models.JSONField(blank=True, default=dict)),
                ('is_read', models.BooleanField(default=False)),
                ('is_resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'admin_notifications',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='NotificationSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_order_updates', models.BooleanField(default=True)),
                ('email_marketing', models.BooleanField(default=True)),
                ('email_product_updates', models.BooleanField(default=False)),
                ('email_review_requests', models.BooleanField(default=True)),
                ('app_order_updates', models.BooleanField(default=True)),
                ('app_marketing', models.BooleanField(default=False)),
                ('app_product_updates', models.BooleanField(default=True)),
                ('app_review_requests', models.BooleanField(default=True)),
                ('sms_order_updates', models.BooleanField(default=False)),
                ('sms_delivery_updates', models.BooleanField(default=False)),
                ('seller_low_stock_alerts', models.BooleanField(default=True)),
                ('seller_new_orders', models.BooleanField(default=True)),
                ('seller_review_alerts', models.BooleanField(default=True)),
                ('seller_performance_reports', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'notification_settings',
            },
        ),
        migrations.CreateModel(
            name='UserNotification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('order_confirmed', 'Order Confirmed'), ('order_shipped', 'Order Shipped'), ('order_delivered', 'Order Delivered'), ('order_cancelled', 'Order Cancelled'), ('payment_success', 'Payment Successful'), ('payment_failed', 'Payment Failed'), ('review_received', 'Review Received'), ('product_back_in_stock', 'Product Back in Stock'), ('promo_code_available', 'Promo Code Available'), ('seller_approved', 'Seller Account Approved'), ('seller_rejected', 'Seller Account Rejected'), ('product_approved', 'Product Approved'), ('product_rejected', 'Product Rejected'), ('low_stock_alert', 'Low Stock Alert'), ('system_message', 'System Message')], max_length=30)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('data', models.JSONField(blank=True, default=dict)),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'user_notifications',
                'ordering': ['-created_at'],
            },
        ),
    ]
