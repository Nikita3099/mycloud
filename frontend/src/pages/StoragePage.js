import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { api } from "../api/client";
import { deleteFile, fetchFiles, uploadFile, updateFile } from "../store/filesSlice";
import { fetchUsers } from "../store/usersSlice";

export default function StoragePage() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth.user);
  const users = useSelector((s) => s.users.items);
  const filesState = useSelector((s) => s.files);
  const location = useLocation();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [uploadComment, setUploadComment] = useState("");
  const [uploadFileObj, setUploadFileObj] = useState(null);

  const isAdmin = !!auth?.is_admin;

  useEffect(() => {
    if (!auth) return;

    if (isAdmin) {
      dispatch(fetchUsers());
      setSelectedUserId((p) => p ?? auth.id);
    } else {
      setSelectedUserId(auth.id);
    }
  }, [auth, isAdmin, dispatch]);

  useEffect(() => {
    if (!auth || !isAdmin) return;
    const params = new URLSearchParams(location.search);
    const q = params.get("user_id");
    if (!q) return;
    const next = Number(q);
    if (Number.isFinite(next)) setSelectedUserId(next);
  }, [location.search, auth, isAdmin]);

  useEffect(() => {
    if (!auth) return;
    if (isAdmin) {
      dispatch(fetchFiles({ userId: selectedUserId }));
    } else {
      dispatch(fetchFiles());
    }
  }, [dispatch, auth, isAdmin, selectedUserId]);

  const files = filesState.items || [];

  const sizeLabel = useMemo(() => {
    const formatBytes = (bytes) => {
      const n = Number(bytes || 0);
      if (n < 1024) return `${n} B`;
      const units = ["KB", "MB", "GB", "TB"];
      let i = -1;
      let v = n;
      do {
        v /= 1024;
        i++;
      } while (v >= 1024 && i < units.length - 1);
      return `${v.toFixed(1)} ${units[i]}`;
    };
    return formatBytes;
  }, []);

  const onCopyLink = async (fileId) => {
    try {
      const data = await api.get(`/api/files/${fileId}/link/`);
      const url = data?.download_url;
      if (!url) return;
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована в буфер обмена");
    } catch (e) {
      alert(`Не удалось скопировать ссылку: ${e?.message || e}`);
    }
  };

  const onView = (fileId) => {
    window.open(`/api/files/${fileId}/download/?inline=1`, "_blank");
  };

  const onDownload = (fileId) => {
    window.open(`/api/files/${fileId}/download/`, "_blank");
  };

  const onDelete = (fileId) => {
    const confirmDelete = window.confirm("Удалить файл?");
    if (!confirmDelete) return;
    dispatch(deleteFile({ fileId, userId: isAdmin ? selectedUserId : null }));
  };

  const onRename = (file) => {
    const nextName = window.prompt("Новое имя файла:", file.original_name);
    if (!nextName) return;
    dispatch(
      updateFile({
        fileId: file.id,
        original_name: nextName,
        comment: file.comment || "",
        userId: isAdmin ? selectedUserId : null,
      })
    );
  };

  const onEditComment = (file) => {
    const nextComment = window.prompt("Комментарий к файлу:", file.comment || "");
    if (nextComment === null) return;
    dispatch(
      updateFile({
        fileId: file.id,
        original_name: file.original_name,
        comment: nextComment,
        userId: isAdmin ? selectedUserId : null,
      })
    );
  };

  const onUpload = (e) => {
    e.preventDefault();
    if (!uploadFileObj) {
      alert("Выберите файл для загрузки");
      return;
    }
    dispatch(
      uploadFile({
        file: uploadFileObj,
        comment: uploadComment,
        userId: isAdmin ? selectedUserId : null,
      })
    );
    setUploadComment("");
    setUploadFileObj(null);
  };

  return (
    <div className="page">
      <div className="panel">
        <h2 className="panel-title">Хранилище файлов</h2>

      {!auth && <div style={{ marginTop: 12 }}>Требуется вход</div>}

      {isAdmin && (
        <div style={{ marginBottom: 12 }}>
          <label>
            Пользователь:&nbsp;
            <select
              className="input"
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.full_name})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {auth && (
        <>
          <form onSubmit={onUpload} style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <label>
          Файл:&nbsp;
          <input
            className="input"
            type="file"
            onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Комментарий:
          <input
            className="input"
            value={uploadComment}
            onChange={(e) => setUploadComment(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Загрузить
        </button>
          </form>

        <hr className="hr" />

        {filesState.status === "loading" && <div>Загрузка...</div>}

        <table className="cloud-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Размер</th>
            <th>Загрузка</th>
            <th>Последняя скачка</th>
            <th>Комментарий</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}>
              <td>{f.original_name}</td>
              <td>{sizeLabel(f.size)}</td>
              <td>{f.created_at ? new Date(f.created_at).toLocaleString() : ""}</td>
              <td>
                {f.last_download ? new Date(f.last_download).toLocaleString() : "—"}
              </td>
              <td>{f.comment || ""}</td>
              <td>
                <div className="action-row">
                  <button type="button" className="btn" onClick={() => onView(f.id)}>
                    Просмотр
                  </button>
                  <button type="button" className="btn" onClick={() => onDownload(f.id)}>
                    Скачать
                  </button>
                  <button type="button" className="btn" onClick={() => onCopyLink(f.id)}>
                    Копировать ссылку
                  </button>
                  <button type="button" className="btn" onClick={() => onRename(f)}>
                    Переименовать
                  </button>
                  <button type="button" className="btn" onClick={() => onEditComment(f)}>
                    Изменить коммент
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => onDelete(f.id)}>
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {files.length === 0 && (
            <tr>
              <td colSpan={6}>
                Файлы отсутствуют
              </td>
            </tr>
          )}
        </tbody>
      </table>
        </>
      )}
      </div>
    </div>
  );
}

