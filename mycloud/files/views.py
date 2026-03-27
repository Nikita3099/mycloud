import logging
import os

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import File
from .serializers import (
    FileListSerializer,
    FileUploadResponseSerializer,
    FileUpdateSerializer,
)

logger = logging.getLogger("mycloud")


def _user_can_access_file(request_user, file_obj: File) -> bool:
    return request_user.is_admin or file_obj.user_id == request_user.id


class FilesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.GET.get("user_id")
        logger.debug(
            "FilesListView.get: user_id_param=%s admin=%s user_id=%s",
            user_id,
            request.user.is_admin,
            request.user.id,
        )

        if request.user.is_admin:
            if user_id:
                files = File.objects.filter(user_id=user_id).order_by("-created_at")
            else:
                files = File.objects.all().order_by("-created_at")
        else:
            files = File.objects.filter(user=request.user).order_by("-created_at")

        serializer = FileListSerializer(files, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UploadFileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        comment = request.data.get("comment", "")
        logger.debug(
            "UploadFileView.post: user_id=%s file_name=%s comment_present=%s",
            request.user.id,
            getattr(file_obj, "name", None),
            bool(comment),
        )
        new_file = File.objects.create(
            user=request.user,
            original_name=file_obj.name,
            file=file_obj,
            size=getattr(file_obj, "size", 0),
            comment=comment,
        )
        logger.info("File uploaded: user_id=%s file_id=%s name=%s", request.user.id, new_file.id, new_file.original_name)

        serializer = FileUploadResponseSerializer(new_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FileManageView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_accessible_file(self, request, file_id: int) -> File:
        file_obj = get_object_or_404(File, id=file_id)
        if not _user_can_access_file(request.user, file_obj):
            return None
        return file_obj

    def delete(self, request, file_id: int):
        logger.debug("FileManageView.delete: user_id=%s file_id=%s", request.user.id, file_id)
        file_obj = get_object_or_404(File, id=file_id)
        if not _user_can_access_file(request.user, file_obj):
            return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        file_obj.delete()
        logger.info("File deleted: admin_or_owner_id=%s file_id=%s", request.user.id, file_id)
        return Response({"status": "deleted"}, status=status.HTTP_200_OK)

    def patch(self, request, file_id: int):
        logger.debug("FileManageView.patch: user_id=%s file_id=%s payload_keys=%s", request.user.id, file_id, list(request.data.keys()))
        file_obj = get_object_or_404(File, id=file_id)
        if not _user_can_access_file(request.user, file_obj):
            return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = FileUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("File update validation failed: file_id=%s errors=%s", file_id, serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if "original_name" in serializer.validated_data:
            file_obj.original_name = serializer.validated_data["original_name"]
        if "comment" in serializer.validated_data:
            file_obj.comment = serializer.validated_data["comment"]
        file_obj.save(update_fields=["original_name", "comment"])

        logger.info("File updated: owner_id=%s file_id=%s", request.user.id, file_id)
        return Response(FileListSerializer(file_obj).data, status=status.HTTP_200_OK)


class FileLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id: int):
        logger.debug("FileLinkView.get: user_id=%s file_id=%s", request.user.id, file_id)
        file_obj = get_object_or_404(File, id=file_id)
        if not _user_can_access_file(request.user, file_obj):
            return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            {
                "link": str(file_obj.link),
                "download_url": f"/api/files/public/{file_obj.link}/download/",
            },
            status=status.HTTP_200_OK,
        )


class FileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id: int):
        logger.debug("FileDownloadView.get: user_id=%s file_id=%s", request.user.id, file_id)
        file_obj = get_object_or_404(File, id=file_id)
        if not _user_can_access_file(request.user, file_obj):
            return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)
        inline = request.GET.get("inline") == "1"
        file_obj.last_download = timezone.now()
        file_obj.save(update_fields=["last_download"])

        try:
            f = file_obj.file.open("rb")
        except Exception as e:
            logger.error("Open file failed: file_id=%s err=%s", file_id, e)
            return Response({"error": "file not available"}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(f, as_attachment=not inline)
        disposition = "inline" if inline else "attachment"
        response["Content-Disposition"] = f'{disposition}; filename="{file_obj.original_name}"'

        logger.info("File downloaded (internal): user_id=%s file_id=%s inline=%s", request.user.id, file_id, inline)
        return response


class FilePublicDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, link):
        logger.debug("FilePublicDownloadView.get: link=%s", link)
        file_obj = get_object_or_404(File, link=link)
        file_obj.last_download = timezone.now()
        file_obj.save(update_fields=["last_download"])

        try:
            f = file_obj.file.open("rb")
        except Exception as e:
            logger.error("Open public file failed: link=%s err=%s", link, e)
            return Response({"error": "file not available"}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(f, as_attachment=True)
        response["Content-Disposition"] = f'attachment; filename="{file_obj.original_name}"'

        logger.info("File downloaded (public): link=%s file_id=%s", link, file_obj.id)
        return response