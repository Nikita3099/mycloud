import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Создаёт суперпользователя из переменных окружения'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_ADMIN_USERNAME', 'admin')
        email = os.environ.get('DJANGO_ADMIN_EMAIL', '')
        password = os.environ.get('DJANGO_ADMIN_PASSWORD')
        full_name = os.environ.get('DJANGO_ADMIN_FULL_NAME', '')

        if not password:
            self.stdout.write(self.style.ERROR(
                'Переменная окружения DJANGO_ADMIN_PASSWORD не задана. '
                'Пропускаем создание администратора.'
            ))
            return

        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                full_name=full_name,
                is_admin=True
            )
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Суперпользователь "{username}" успешно создан.'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f'Суперпользователь "{username}" уже существует.'
            ))