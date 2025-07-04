# Generated by Django 5.0.2 on 2025-06-25 09:12

import django.db.models.deletion
import taggit.managers
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('products', '0001_initial'),
        ('taggit', '0006_rename_taggeditem_content_type_object_id_taggit_tagg_content_8fc721_idx'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='seller',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='users.sellerprofile'),
        ),
        migrations.AddField(
            model_name='product',
            name='tags',
            field=taggit.managers.TaggableManager(blank=True, help_text='A comma-separated list of tags.', through='taggit.TaggedItem', to='taggit.Tag', verbose_name='Tags'),
        ),
        migrations.AddField(
            model_name='productattribute',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='products.product'),
        ),
        migrations.AddIndex(
            model_name='productattributetype',
            index=models.Index(fields=['slug'], name='product_att_slug_868c94_idx'),
        ),
        migrations.AddIndex(
            model_name='productattributetype',
            index=models.Index(fields=['is_variant_attribute'], name='product_att_is_vari_6caade_idx'),
        ),
        migrations.AddField(
            model_name='productattribute',
            name='attribute_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.productattributetype'),
        ),
        migrations.AddField(
            model_name='productimage',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='products.product'),
        ),
        migrations.AddField(
            model_name='productoffer',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offers', to='products.product'),
        ),
        migrations.AddField(
            model_name='productoffer',
            name='seller',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='product_offers', to='users.sellerprofile'),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='variants', to='products.product'),
        ),
        migrations.AddField(
            model_name='productvariantattribute',
            name='attribute_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.productattributetype'),
        ),
        migrations.AddField(
            model_name='productvariantattribute',
            name='variant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='products.productvariant'),
        ),
        migrations.AddField(
            model_name='productvideo',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='videos', to='products.product'),
        ),
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['name'], name='categories_name_98d7d5_idx'),
        ),
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['slug'], name='categories_slug_b4303a_idx'),
        ),
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['is_active'], name='categories_is_acti_aae090_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['seller', 'status'], name='products_seller__87e71e_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['category', 'status'], name='products_categor_29e98f_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['collection', 'status'], name='products_collect_8f66a3_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['is_featured', 'status'], name='products_is_feat_a3b38e_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['rating'], name='products_rating_53cb37_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['created_at'], name='products_created_e1ba5f_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['slug'], name='products_slug_5e91f2_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='productattribute',
            unique_together={('product', 'attribute_type')},
        ),
        migrations.AddIndex(
            model_name='productimage',
            index=models.Index(fields=['product', 'is_primary'], name='product_ima_product_c8c86a_idx'),
        ),
        migrations.AddIndex(
            model_name='productimage',
            index=models.Index(fields=['sort_order'], name='product_ima_sort_or_e48c66_idx'),
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['product', 'status'], name='product_off_product_9b606f_idx'),
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['seller', 'status'], name='product_off_seller__5adc4b_idx'),
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['start_date', 'end_date'], name='product_off_start_d_5ca00b_idx'),
        ),
        migrations.AddIndex(
            model_name='productoffer',
            index=models.Index(fields=['status'], name='product_off_status_d102e6_idx'),
        ),
        migrations.AddIndex(
            model_name='productvariant',
            index=models.Index(fields=['product', 'is_active'], name='product_var_product_b96575_idx'),
        ),
        migrations.AddIndex(
            model_name='productvariant',
            index=models.Index(fields=['sku'], name='product_var_sku_3a95f0_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='productvariant',
            unique_together={('product', 'size', 'color')},
        ),
        migrations.AlterUniqueTogether(
            name='productvariantattribute',
            unique_together={('variant', 'attribute_type')},
        ),
        migrations.AddIndex(
            model_name='productvideo',
            index=models.Index(fields=['product'], name='product_vid_product_b2de46_idx'),
        ),
        migrations.AddIndex(
            model_name='productvideo',
            index=models.Index(fields=['sort_order'], name='product_vid_sort_or_a27156_idx'),
        ),
    ]
