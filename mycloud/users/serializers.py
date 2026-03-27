
import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import User

UserModel = get_user_model()


USERNAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9]{3,19}$")
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


class UserSerializer(serializers.ModelSerializer):
    files_count = serializers.SerializerMethodField()
    files_total_size = serializers.SerializerMethodField()
    files_management_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "is_admin",
            "files_count",
            "files_total_size",
            "files_management_url",
        ]

    def get_files_count(self, obj):
        from files.models import File
        return File.objects.filter(user=obj).count()

    def get_files_total_size(self, obj):
        from files.models import File
        from django.db.models import Sum
        total = File.objects.filter(user=obj).aggregate(total=Sum("size")).get("total")
        return total or 0

    def get_files_management_url(self, obj):
        return f"/api/files/?user_id={obj.id}"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["username", "password", "email", "full_name"]

    def validate_username(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError("Логин обязателен.")
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError(
                "Логин должен содержать только латинские буквы и цифры, первый символ — буква, длина 4..20."
            )
        if UserModel.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким логином уже существует.")
        return value

    def validate_email(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError("Email обязателен.")
        if not EMAIL_RE.match(value):
            raise serializers.ValidationError("Некорректный формат email.")
        return value

    def validate_password(self, value: str) -> str:
        if not value:
            raise serializers.ValidationError("Пароль обязателен.")
        if len(value) < 6:
            raise serializers.ValidationError("Пароль должен быть не короче 6 символов.")
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну заглавную букву.")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы одну цифру.")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise serializers.ValidationError("Пароль должен содержать хотя бы один специальный символ.")
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            full_name=validated_data["full_name"],
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        if not username:
            raise serializers.ValidationError({"username": "Логин обязателен."})
        if not password:
            raise serializers.ValidationError({"password": "Пароль обязателен."})

        try:
            user = UserModel.objects.get(username=username)
        except UserModel.DoesNotExist:
            raise serializers.ValidationError({"username": "Пользователь с таким логином не найден."})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Неверный пароль."})

        data["user"] = user
        return data


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["is_admin"]