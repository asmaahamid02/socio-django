# Generated by Django 5.0.8 on 2024-08-28 12:01

import django.db.models.deletion
import myapp.utils.image_utils
import profiles.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cover_image', models.ImageField(blank=True, null=True, upload_to=profiles.models.Profile.upload_path, validators=[myapp.utils.image_utils.validate_image_size])),
                ('profile_image', models.ImageField(blank=True, null=True, upload_to=profiles.models.Profile.upload_path, validators=[myapp.utils.image_utils.validate_image_size])),
                ('bio', models.CharField(blank=True, max_length=1000, null=True)),
                ('created_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
