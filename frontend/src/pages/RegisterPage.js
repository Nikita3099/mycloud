import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../store/authSlice";

const usernameRe = /^[A-Za-z][A-Za-z0-9]{3,19}$/;
const emailRe = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validate({ username, full_name, email, password }) {
  const errors = {};
  if (!username) errors.username = "Логин обязателен.";
  else if (!usernameRe.test(username)) errors.username = "Логин: латинские буквы/цифры, первый символ буква, длина 4..20.";

  if (!full_name) errors.full_name = "Полное имя обязательно.";

  if (!email) errors.email = "Email обязателен.";
  else if (!emailRe.test(email)) errors.email = "Некорректный формат email.";

  if (!password) errors.password = "Пароль обязателен.";
  else {
    if (password.length < 6) errors.password = "Пароль: минимум 6 символов.";
    else if (!/[A-Z]/.test(password)) errors.password = "Пароль: нужна хотя бы одна заглавная буква.";
    else if (!/[0-9]/.test(password)) errors.password = "Пароль: нужна хотя бы одна цифра.";
    else if (!/[^A-Za-z0-9]/.test(password)) errors.password = "Пароль: нужен хотя бы один специальный символ.";
  }
  return errors;
}

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);

  const [form, setForm] = useState({ username: "", full_name: "", email: "", password: "" });
  const [errors, setErrors] = useState(null);

  const localErrors = useMemo(() => {
    if (!errors) return null;
    return errors;
  }, [errors]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const action = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(action)) {
      navigate("/login");
    } else {
      setErrors(action.payload || { error: "Registration failed" });
    }
  };

  return (
    <div className="page">
      <div className="panel">
        <h2 className="panel-title">Регистрация</h2>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            <span className="field-label">Логин</span>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            />
          </label>

          <label>
            <span className="field-label">Полное имя</span>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            />
          </label>

          <label>
            <span className="field-label">Email</span>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </label>

          <label>
            <span className="field-label">Пароль</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Зарегистрироваться
          </button>
        </form>

        {localErrors && <pre className="error-box">{JSON.stringify(localErrors, null, 2)}</pre>}
        {!localErrors && auth?.error && <pre className="error-box">{JSON.stringify(auth.error, null, 2)}</pre>}

        <div style={{ marginTop: 12 }}>
          Есть аккаунт?{" "}
          <Link to="/login" className="nav-link">
            Вход
          </Link>
        </div>
      </div>
    </div>
  );
}

