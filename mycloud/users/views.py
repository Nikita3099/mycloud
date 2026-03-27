from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import User
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserAdminUpdateSerializer,
    UserSerializer,
)

logger = logging.getLogger("mycloud")

class UsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.debug("UsersListView.get: admin=%s user_id=%s", request.user.is_admin, request.user.id)
        if not request.user.is_admin:
            return Response({'error': 'forbidden'}, status=403)

        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.debug("RegisterView.post: payload_keys=%s", list(request.data.keys()))
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info("User registered: id=%s username=%s", user.id, user.username)
            return Response({"status": "ok"}, status=status.HTTP_201_CREATED)
        logger.warning("Register validation failed: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.debug("LoginView.post: username=%s", request.data.get("username"))
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        logger.info("Login success: id=%s username=%s", user.id, user.username)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = getattr(request.user, "id", None)
        logger.debug("LogoutView.post: user_id=%s", user_id)
        logout(request)
        logger.info("Logout: user_id=%s", user_id)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        logger.debug("DeleteUserView.delete: admin_id=%s target_id=%s", request.user.id, user_id)
        if not request.user.is_admin:
            return Response({'error': 'forbidden'}, status=403)

        user = get_object_or_404(User, id=user_id)
        user.delete()
        logger.info("User deleted by admin: admin_id=%s deleted_id=%s", request.user.id, user_id)
        return Response({'status': 'deleted'})


class UserAdminUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        logger.debug("UserAdminUpdateView.patch: admin_id=%s target_id=%s", request.user.id, user_id)
        if not request.user.is_admin:
            return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user = get_object_or_404(User, id=user_id)
        serializer = UserAdminUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(
                "User admin flag updated: admin_id=%s target_id=%s is_admin=%s",
                request.user.id,
                user_id,
                serializer.validated_data.get("is_admin"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.warning("User admin update validation failed: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.debug("MeView.get: user_id=%s", request.user.id)
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)