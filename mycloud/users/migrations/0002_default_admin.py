from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_default_admin(apps, schema_editor):
    User = apps.get_model("users", "User")

    username = "admin"
    if User.objects.filter(username=username).exists():
        return

    raw_password = "Admin1!"

    User.objects.create(
        username=username,
        email="admin@example.com",
        full_name="Administrator",
        is_admin=True,
        password=make_password(raw_password),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_admin),
    ]

