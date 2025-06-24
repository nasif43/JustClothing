# Generated migration file
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SellerHomepageProduct',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='homepage_selections', to='products.product')),
                ('seller', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='homepage_products', to='users.sellerprofile')),
            ],
            options={
                'db_table': 'seller_homepage_products',
            },
        ),
        migrations.AddIndex(
            model_name='sellerhomepageproduct',
            index=models.Index(fields=['seller', 'order'], name='seller_homepage_products_seller_id_order_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='sellerhomepageproduct',
            unique_together={('seller', 'order')},
        ),
    ] 