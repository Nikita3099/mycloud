import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";

import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StoragePage from "./pages/StoragePage";
import { initCsrf, loadMe, logoutUser } from "./store/authSlice";

function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const onLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          My Cloud
        </Link>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/storage" className="nav-link">
                Хранилище
              </Link>
              {user?.is_admin && (
                <Link to="/admin" className="nav-link">
                  Админ
                </Link>
              )}
              <button type="button" className="btn" onClick={onLogout}>
                Выход
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Вход
              </Link>
              <Link to="/register" className="nav-link">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.auth.status);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(initCsrf());
    dispatch(loadMe());
  }, [dispatch]);

  return (
    <div>
      <NavBar />
      {status === "loading" && !user ? <div style={{ padding: 16 }}>Загрузка...</div> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
