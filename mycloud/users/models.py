from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import models


class User(AbstractUser):
    full_name = models.CharField(max_length=255)
    is_admin = models.BooleanField(default=False)

    def clean(self):
        super().clean()
        if self.email:
            validate_email(self.email)

    def __str__(self):
        return self.username
