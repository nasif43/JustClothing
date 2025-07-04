# Generated by Django 5.0.2 on 2025-06-25 09:12

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('productId', models.IntegerField(blank=True, null=True)),
                ('rating', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('content', models.TextField()),
                ('review_type', models.CharField(choices=[('product', 'Product Review'), ('seller', 'Seller Review')], default='product', max_length=10)),
                ('is_approved', models.BooleanField(default=True)),
                ('is_featured', models.BooleanField(default=False)),
                ('moderated_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'reviews',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ReviewImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='reviews/images/')),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'review_images',
            },
        ),
        migrations.CreateModel(
            name='ReviewReply',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_approved', models.BooleanField(default=True)),
                ('moderated_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'review_replies',
            },
        ),
        migrations.CreateModel(
            name='ReviewReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(choices=[('spam', 'Spam'), ('inappropriate', 'Inappropriate Content'), ('fake', 'Fake Review'), ('offensive', 'Offensive Language'), ('other', 'Other')], max_length=20)),
                ('description', models.TextField(blank=True)),
                ('is_resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'review_reports',
            },
        ),
        migrations.CreateModel(
            name='ReviewVote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('vote_type', models.CharField(choices=[('helpful', 'Helpful'), ('not_helpful', 'Not Helpful')], max_length=15)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'review_votes',
            },
        ),
        migrations.CreateModel(
            name='SellerReview',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('rating', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('content', models.TextField()),
                ('communication_rating', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('shipping_rating', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('quality_rating', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('is_approved', models.BooleanField(default=True)),
                ('moderated_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'seller_reviews',
                'ordering': ['-created_at'],
            },
        ),
    ]
