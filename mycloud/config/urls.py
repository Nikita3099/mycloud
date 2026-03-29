from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.urls import path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.cache import never_cache

from pathlib import Path

from users.views import RegisterView, LoginView, LogoutView
from files.views import (
    FileDownloadView,
    FileLinkView,
    FileManageView,
    FilePublicDownloadView,
    FilesListView,
    UploadFileView,
)
from users.views import DeleteUserView, MeView, UserAdminUpdateView, UsersListView

def home(request):
    return JsonResponse({'status': 'My Cloud API работает'})


@never_cache
def spa_index(request):
    index_path = Path(settings.BASE_DIR).parent / "frontend" / "build" / "index.html"
    if not index_path.exists():
        return JsonResponse({"error": "frontend build not found"}, status=500)
    return HttpResponse(index_path.read_text(encoding="utf-8"))


@never_cache
def spa_root_asset(request, filename):
    asset_path = Path(settings.BASE_DIR).parent / "frontend" / "build" / filename
    if not asset_path.exists():
        return JsonResponse({"error": f"{filename} not found"}, status=404)
    if filename.endswith(".json"):
        content_type = "application/json; charset=utf-8"
    elif filename.endswith(".ico"):
        content_type = "image/x-icon"
    elif filename.endswith(".png"):
        content_type = "image/png"
    elif filename.endswith(".txt"):
        content_type = "text/plain; charset=utf-8"
    else:
        content_type = "application/octet-stream"
    return HttpResponse(asset_path.read_bytes(), content_type=content_type)


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),

    re_path(
        r"^(?P<filename>manifest\.json|asset-manifest\.json|favicon\.ico|logo192\.png|logo512\.png|robots\.txt)$",
        spa_root_asset,
    ),
    path('', spa_index),

    re_path(r"^(?!api/|admin/|static/|media/).*$", spa_index),

    path('api/health/', home),
    path('api/csrf/', csrf),
    path('api/register/', RegisterView.as_view()),
    path('api/login/', LoginView.as_view()),
    path('api/logout/', LogoutView.as_view()),
    path('api/me/', MeView.as_view()),
    path('api/users/', UsersListView.as_view()),
    path('api/users/<int:user_id>/delete/', DeleteUserView.as_view()),
    path('api/users/<int:user_id>/', UserAdminUpdateView.as_view()),

    path('api/files/', FilesListView.as_view()),
    path('api/upload/', UploadFileView.as_view()),
    path('api/files/upload/', UploadFileView.as_view()),

    path('api/files/<int:file_id>/', FileManageView.as_view()),
    path('api/files/<int:file_id>/download/', FileDownloadView.as_view()),
    path('api/files/<int:file_id>/link/', FileLinkView.as_view()),
    path('api/files/public/<uuid:link>/download/', FilePublicDownloadView.as_view()),
]


if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()

