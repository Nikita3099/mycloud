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


class FileUpdateSerializer(serializers.Serializer):
    original_name = serializers.CharField(required=False, allow_blank=False, max_length=255)
    comment = serializers.CharField(required=False, allow_blank=True)


class FileUploadResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ["id", "original_name", "comment", "size", "created_at", "link"]