# Generated by Django 5.0.2 on 2025-06-25 09:12

import django.core.validators
import djmoney.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='FeaturedPromo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('placement', models.CharField(choices=[('homepage_banner', 'Homepage Banner'), ('search_results', 'Search Results'), ('product_page', 'Product Page'), ('cart_page', 'Cart Page'), ('checkout_page', 'Checkout Page')], max_length=20)),
                ('priority', models.PositiveIntegerField(default=0, help_text='Higher numbers appear first')),
                ('promotion_start', models.DateTimeField()),
                ('promotion_end', models.DateTimeField()),
                ('daily_budget_currency', djmoney.models.fields.CurrencyField(choices=[('BDT', 'Bangladeshi Taka'), ('USD', 'US Dollar')], default='BDT', editable=False, max_length=3, null=True)),
                ('daily_budget', djmoney.models.fields.MoneyField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('max_impressions', models.PositiveIntegerField(blank=True, null=True)),
                ('current_impressions', models.PositiveIntegerField(default=0)),
                ('max_clicks', models.PositiveIntegerField(blank=True, null=True)),
                ('current_clicks', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'featured_promos',
                'ordering': ['-priority', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PromoCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('usage_count', models.PositiveIntegerField(default=0)),
                ('usage_limit', models.PositiveIntegerField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'promo_codes',
            },
        ),
        migrations.CreateModel(
            name='PromoImpression',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(blank=True, max_length=100)),
                ('user_agent', models.TextField(blank=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('referrer', models.URLField(blank=True)),
                ('viewed_at', models.DateTimeField(auto_now_add=True)),
                ('clicked_at', models.DateTimeField(blank=True, null=True)),
                ('converted_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'promo_impressions',
            },
        ),
        migrations.CreateModel(
            name='PromoRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request_type', models.CharField(choices=[('featured_product', 'Featured Product'), ('banner_ad', 'Banner Advertisement'), ('newsletter', 'Newsletter Inclusion'), ('social_media', 'Social Media Promotion')], max_length=20)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('budget', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('duration_days', models.PositiveIntegerField()),
                ('media_files', models.FileField(blank=True, null=True, upload_to='promo_requests/')),
                ('status', models.CharField(choices=[('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('completed', 'Completed')], default='pending', max_length=15)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'promo_requests',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Promotion',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('promotion_type', models.CharField(choices=[('percentage', 'Percentage Discount'), ('fixed_amount', 'Fixed Amount Discount'), ('buy_x_get_y', 'Buy X Get Y'), ('free_shipping', 'Free Shipping')], max_length=20)),
                ('discount_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('discount_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('buy_quantity', models.PositiveIntegerField(blank=True, null=True)),
                ('get_quantity', models.PositiveIntegerField(blank=True, null=True)),
                ('minimum_order_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('minimum_quantity', models.PositiveIntegerField(blank=True, null=True)),
                ('usage_limit', models.PositiveIntegerField(blank=True, help_text='Total usage limit', null=True)),
                ('usage_limit_per_customer', models.PositiveIntegerField(blank=True, help_text='Usage limit per customer', null=True)),
                ('usage_count', models.PositiveIntegerField(default=0)),
                ('start_date', models.DateTimeField()),
                ('end_date', models.DateTimeField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('active', 'Active'), ('paused', 'Paused'), ('expired', 'Expired'), ('completed', 'Completed')], default='draft', max_length=15)),
                ('is_featured', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'promotions',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PromotionalCampaign',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('start_date', models.DateTimeField()),
                ('end_date', models.DateTimeField()),
                ('budget', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending Approval'), ('approved', 'Approved'), ('active', 'Active'), ('paused', 'Paused'), ('completed', 'Completed'), ('rejected', 'Rejected')], default='pending', max_length=15)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('rejection_reason', models.TextField(blank=True)),
                ('impressions', models.PositiveIntegerField(default=0)),
                ('clicks', models.PositiveIntegerField(default=0)),
                ('conversions', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'promotional_campaigns',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PromoUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('discount_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('used_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'promo_usages',
            },
        ),
        migrations.CreateModel(
            name='SellerPromoRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('requested_code', models.CharField(max_length=50)),
                ('requested_name', models.CharField(max_length=200)),
                ('requested_description', models.TextField()),
                ('requested_type', models.CharField(choices=[('percentage', 'Percentage Discount'), ('fixed_amount', 'Fixed Amount Discount'), ('buy_x_get_y', 'Buy X Get Y'), ('free_shipping', 'Free Shipping')], max_length=20)),
                ('requested_discount_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(50)])),
                ('requested_discount_amount_currency', djmoney.models.fields.CurrencyField(choices=[('BDT', 'Bangladeshi Taka'), ('USD', 'US Dollar')], default='BDT', editable=False, max_length=3, null=True)),
                ('requested_discount_amount', djmoney.models.fields.MoneyField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('requested_minimum_order_amount_currency', djmoney.models.fields.CurrencyField(choices=[('BDT', 'Bangladeshi Taka'), ('USD', 'US Dollar')], default='BDT', editable=False, max_length=3, null=True)),
                ('requested_minimum_order_amount', djmoney.models.fields.MoneyField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('requested_usage_limit', models.PositiveIntegerField(blank=True, null=True)),
                ('requested_start_date', models.DateTimeField()),
                ('requested_end_date', models.DateTimeField()),
                ('status', models.CharField(choices=[('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('expired', 'Expired')], default='pending', max_length=15)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'seller_promo_requests',
                'ordering': ['-created_at'],
            },
        ),
    ]
