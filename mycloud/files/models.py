import uuid as uuid_lib
from django.db import models
from django.conf import settings

def upload_path(instance, filename):
    return f'{instance.user.id}/{uuid_lib.uuid4()}_{filename}'

class File(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to=upload_path)
    size = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_download = models.DateTimeField(null=True, blank=True)
    uuid = models.UUIDField(default=uuid_lib.uuid4, unique=True)
    link = models.UUIDField(default=uuid_lib.uuid4, unique=True)

    def __str__(self):
        return self.original_name

    def delete(self, using=None, keep_parents=False):
        storage = self.file.storage
        file_name = self.file.name
        super().delete(using=using, keep_parents=keep_parents)
        try:
            if file_name:
                storage.delete(file_name)
        except Exception:
            pass