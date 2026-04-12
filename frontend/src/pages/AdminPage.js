import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUsers, deleteUser, updateUserAdmin, clearError } from "../store/usersSlice";

export default function AdminPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth.user);
  const usersState = useSelector((s) => s.users);

  useEffect(() => {
    if (!auth) return;
    if (!auth.is_admin) return;
    dispatch(fetchUsers());
  }, [auth, dispatch]);

  const users = usersState.items || [];

  if (!auth) {
    return <div style={{ padding: 16 }}>Требуется вход</div>;
  }

  if (!auth.is_admin) {
    return <div style={{ padding: 16 }}>Нет прав администратора</div>;
  }

  return (
    <div className="page">
      <div className="panel">
        <h2 className="panel-title">Администрирование</h2>
        {usersState.status === "loading" && <div>Загрузка...</div>}
        {usersState.error && (
          <div style={{ color: "red", marginBottom: 16 }}>
            Ошибка: {usersState.error}
            <button onClick={() => dispatch(clearError())} style={{ marginLeft: 8 }}>Закрыть</button>
          </div>
        )}

        <table className="cloud-table">
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Admin</th>
            <th>Файлы (кол-во)</th>
            <th>Файлы (размер)</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <div>{u.username}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{u.email}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{u.full_name}</div>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!u.is_admin}
                  disabled={usersState.updating}
                  onChange={(e) => dispatch(updateUserAdmin({ userId: u.id, is_admin: e.target.checked }))}
                />
                {usersState.updating && <span>Обновление...</span>}
              </td>
              <td>{u.files_count}</td>
              <td>{u.files_total_size} B</td>
              <td>
                <div className="action-row">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => navigate(`/storage?user_id=${u.id}`)}
                  >
                    Хранилище
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={usersState.deleting}
                    onClick={() => {
                      const ok = window.confirm(`Удалить пользователя ${u.username}?`);
                      if (ok) dispatch(deleteUser(u.id));
                    }}
                  >
                    {usersState.deleting ? "Удаление..." : "Удалить"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5}>
                Пользователи отсутствуют
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

