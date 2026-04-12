import os
from rest_framework import serializers
from .models import File

class FileListSerializer(serializers.ModelSerializer):
    path = serializers.SerializerMethodField()
    public_download_url = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            "id",
            "original_name",
            "comment",
            "size",
            "created_at",
            "last_download",
            "path",
            "link",
            "public_download_url",
        ]

    def get_path(self, obj: File) -> str:
        return obj.file.name

    def get_public_download_url(self, obj: File) -> str:
        return f"/api/files/public/{obj.link}/download/"


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate_file(self, value):
        max_size = int(os.environ.get('MAX_UPLOAD_BYTES', 50 * 1024 * 1024))
        if value.size > max_size:
            raise serializers.ValidationError(
                f'Размер файла превышает {max_size // (1024*1024)} МБ.'
            )

        allowed_ext = os.environ.get('ALLOWED_UPLOAD_EXTENSIONS', '')
        if allowed_ext and allowed_ext != '*':
            ext = os.path.splitext(value.name)[1].lower()
            allowed_list = [e.strip().lower() for e in allowed_ext.split(',')]
            if ext not in allowed_list:
                raise serializers.ValidationError(
                    f'Недопустимый тип файла. Разрешены: {allowed_ext}'
                )
        return value


class FileUpdateSerializer(serializers.Serializer):
    original_name = serializers.CharField(required=False, allow_blank=False, max_length=255)
    comment = serializers.CharField(required=False, allow_blank=True)


class FileUploadResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ["id", "original_name", "comment", "size", "created_at", "link"]