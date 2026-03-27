import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../store/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localErrors, setLocalErrors] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalErrors(null);
    const action = await dispatch(loginUser({ username, password }));
    if (loginUser.fulfilled.match(action)) {
      const user = action.payload;
      navigate(user?.is_admin ? "/admin" : "/storage");
    } else {
      setLocalErrors(action.payload || { error: "Login failed" });
    }
  };

  return (
    <div className="page">
      <div className="panel">
        <h2 className="panel-title">Вход</h2>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            <span className="field-label">Логин</span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label>
            <span className="field-label">Пароль</span>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Войти
          </button>
        </form>

        {localErrors && (
          <pre className="error-box">{JSON.stringify(localErrors, null, 2)}</pre>
        )}
        {!localErrors && auth?.error && (
          <pre className="error-box">{JSON.stringify(auth.error, null, 2)}</pre>
        )}

        <div style={{ marginTop: 12 }}>
          Нет аккаунта?{" "}
          <Link to="/register" className="nav-link">
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}

