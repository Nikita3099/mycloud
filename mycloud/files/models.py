import uuid as uuid_lib
import re
import logging
from django.db import models
from django.conf import settings

logger = logging.getLogger(__name__)

def sanitize_filename(filename):
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    return filename[:100]

def upload_path(instance, filename):
    safe_name = sanitize_filename(filename)
    return f'{instance.user.id}/{uuid_lib.uuid4()}_{safe_name}'

class File(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to=upload_path)
    size = models.IntegerField()
    comment = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_download = models.DateTimeField(null=True, blank=True)
    link = models.UUIDField(default=uuid_lib.uuid4, unique=True)

    def __str__(self):
        return self.original_name

    def delete(self, using=None, keep_parents=False):
        try:
            if self.file and self.file.name:
                self.file.storage.delete(self.file.name)
        except Exception as e:
            logger.error(f'Не удалось удалить файл {self.file.name}: {e}')
        super().delete(using=using, keep_parents=keep_parents)